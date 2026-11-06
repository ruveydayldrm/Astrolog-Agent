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
