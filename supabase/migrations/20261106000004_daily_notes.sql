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
