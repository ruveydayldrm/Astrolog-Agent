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
