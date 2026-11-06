-- Lyra · Tek seferlik kurulum betiği
-- Supabase Dashboard → SQL Editor → New query → bu dosyanın tamamını yapıştır → Run.
-- (supabase/migrations altındaki dosyaların sıralı birleşimidir; npm run db:bundle ile yeniden üretilir.)

-- ============ 20261106000001_profiles.sql ============
-- Lyra · 0001 · Profiller ve doğum bilgileri
-- Her auth.users kaydı için bir profil; doğum haritası hesaplanıp jsonb olarak önbelleğe alınır.

create table public.profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  display_name     text,
  birth_date       date,
  birth_time       time,                 -- null = saat bilinmiyor
  birth_place      text,
  latitude         double precision,
  longitude        double precision,
  timezone         text,                 -- IANA, örn. Europe/Istanbul
  natal_chart      jsonb,                -- lib/astro NatalChart çıktısı
  onboarded_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint latitude_range  check (latitude  between -90  and 90),
  constraint longitude_range check (longitude between -180 and 180)
);

alter table public.profiles enable row level security;

create policy "profiles: kendi profilini okur"
  on public.profiles for select using (auth.uid() = id);
create policy "profiles: kendi profilini günceller"
  on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles: kendi profilini oluşturur"
  on public.profiles for insert with check (auth.uid() = id);

-- updated_at otomatik güncelleme (diğer tablolar da kullanır)
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Yeni kullanıcı kaydında boş profil oluştur
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'));
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ 20261106000002_conversations.sql ============
-- Lyra · 0002 · Sohbetler ve mesajlar

create table public.conversations (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users (id) on delete cascade,
  title                  text not null default 'Yeni sohbet',
  -- Hafızaya işlenmiş son mesajın zamanı; sonraki çıkarım bu noktadan devam eder
  memory_processed_until timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index conversations_user_updated_idx on public.conversations (user_id, updated_at desc);

create trigger conversations_touch before update on public.conversations
  for each row execute function public.touch_updated_at();

create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id         uuid not null references auth.users (id) on delete cascade,
  role            text not null check (role in ('user', 'assistant')),
  content         text not null check (char_length(content) between 1 and 20000),
  created_at      timestamptz not null default now()
);

create index messages_conversation_created_idx on public.messages (conversation_id, created_at);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create policy "conversations: sahibi her şeyi yapar"
  on public.conversations for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "messages: sahibi okur"
  on public.messages for select using (auth.uid() = user_id);

-- Mesaj eklerken sohbetin de aynı kullanıcıya ait olduğunu doğrula
create policy "messages: sahibi kendi sohbetine ekler"
  on public.messages for insert
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.conversations c where c.id = conversation_id and c.user_id = auth.uid())
  );

create policy "messages: sahibi siler"
  on public.messages for delete using (auth.uid() = user_id);

-- ============ 20261106000003_memories.sql ============
-- Lyra · 0003 · Kullanıcı hafızası
-- kind = 'fact'      → kullanıcı hakkında kalıcı bilgi (ör. "Yazılım mühendisi, İzmir'de yaşıyor")
-- kind = 'follow_up' → takip edilecek konu (ör. "Kasım sonunda iş görüşmesi var")
-- kind = 'reading'   → Lyra'nın önemli bir önceki yorumu (tutarlılık için, ör. "Satürn kare Güneş'i sabır dönemi olarak yorumladı")

create table public.memories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  kind       text not null check (kind in ('fact', 'follow_up', 'reading')),
  content    text not null check (char_length(content) between 1 and 500),
  created_at timestamptz not null default now()
);

create index memories_user_idx on public.memories (user_id, created_at);

alter table public.memories enable row level security;

create policy "memories: sahibi her şeyi yapar"
  on public.memories for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============ 20261106000004_daily_notes.sql ============
-- Lyra · 0004 · Günlük not önbelleği (kullanıcı başına günde bir kayıt)

create table public.daily_notes (
  user_id    uuid not null references auth.users (id) on delete cascade,
  note_date  date not null,                 -- kullanıcının saat dilimindeki gün
  transits   jsonb not null,                -- o günün öne çıkan transit açıları
  note       text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, note_date)
);

alter table public.daily_notes enable row level security;

create policy "daily_notes: sahibi okur"
  on public.daily_notes for select using (auth.uid() = user_id);
create policy "daily_notes: sahibi ekler"
  on public.daily_notes for insert with check (auth.uid() = user_id);
create policy "daily_notes: sahibi siler"
  on public.daily_notes for delete using (auth.uid() = user_id);

-- ============ 20261106000005_rate_limits.sql ============
-- Lyra · 0005 · Kullanıcı başına sabit pencereli hız sınırı
-- Tabloya doğrudan erişim yok; yalnızca consume_rate_limit() üzerinden atomik artış yapılır.

create table public.rate_limits (
  user_id      uuid not null references auth.users (id) on delete cascade,
  bucket       text not null,
  window_start timestamptz not null,
  count        integer not null default 0,
  primary key (user_id, bucket, window_start)
);

alter table public.rate_limits enable row level security;
-- Bilinçli olarak politika yok: istemci tabloyu okuyamaz/yazamaz.

/**
 * Bir istek hakkı tüketir. Pencere dolmuşsa false döner.
 * security definer: RLS'yi aşar ama yalnızca auth.uid() için çalışır.
 */
create or replace function public.consume_rate_limit(p_bucket text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_window timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_count  integer;
begin
  if v_uid is null then
    return false;
  end if;

  insert into public.rate_limits (user_id, bucket, window_start, count)
  values (v_uid, p_bucket, v_window, 1)
  on conflict (user_id, bucket, window_start)
  do update set count = public.rate_limits.count + 1
  returning count into v_count;

  -- Eski pencereleri ara sıra temizle
  if random() < 0.02 then
    delete from public.rate_limits where user_id = v_uid and window_start < now() - interval '2 days';
  end if;

  return v_count <= p_limit;
end $$;

revoke all on function public.consume_rate_limit(text, integer, integer) from public, anon;
grant execute on function public.consume_rate_limit(text, integer, integer) to authenticated;
