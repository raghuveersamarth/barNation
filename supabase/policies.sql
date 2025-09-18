-- Enable RLS
alter table if exists public.users enable row level security;

-- Insert: allow authenticated users to insert their own row
create policy if not exists "users_insert_own"
on public.users for insert
to authenticated
with check (auth.uid() = id);

-- Select: allow users to read their own row
create policy if not exists "users_select_own"
on public.users for select
to authenticated
using (auth.uid() = id);

-- Update: allow users to update their own row
create policy if not exists "users_update_own"
on public.users for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);


