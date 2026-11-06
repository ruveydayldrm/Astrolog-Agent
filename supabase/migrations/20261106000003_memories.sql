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
