alter table public.users
add column if not exists is_blocked boolean not null default false,
add column if not exists blocked_at timestamptz null;

update public.users
set is_blocked = false
where is_blocked is null;
