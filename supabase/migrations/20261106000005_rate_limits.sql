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
