-- ═══════════════════════════════════════════════════════════════════
-- BHAARAT WIKI — SUPABASE DATABASE SCHEMA
-- Run this entire file in: Supabase Dashboard > SQL Editor > New Query
-- ═══════════════════════════════════════════════════════════════════


-- ─── 1. PROFILES ────────────────────────────────────────────────────
-- Extends Supabase auth.users with role (reader | editor | admin)

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text not null,
  role        text not null default 'reader' check (role in ('reader', 'editor', 'admin')),
  avatar_url  text,
  created_at  timestamptz default now()
);

-- Auto-create a profile row whenever a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'reader')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ─── 2. CHARACTERS ──────────────────────────────────────────────────

create table if not exists public.characters (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  type        text not null default 'Character',
  intro       text default '',
  created_by  uuid references public.profiles(id),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists characters_updated_at on public.characters;
create trigger characters_updated_at
  before update on public.characters
  for each row execute procedure public.set_updated_at();


-- ─── 3. CHARACTER SECTIONS ──────────────────────────────────────────

create table if not exists public.character_sections (
  id            uuid primary key default gen_random_uuid(),
  character_id  uuid not null references public.characters(id) on delete cascade,
  section_key   text not null,  -- e.g. 'biography', 'personality'
  title         text not null,
  content       text default '',
  display_order integer default 0,
  updated_at    timestamptz default now(),
  unique(character_id, section_key)
);

drop trigger if exists sections_updated_at on public.character_sections;
create trigger sections_updated_at
  before update on public.character_sections
  for each row execute procedure public.set_updated_at();


-- ─── 4. CHARACTER INFOBOX ───────────────────────────────────────────

create table if not exists public.character_infobox (
  id            uuid primary key default gen_random_uuid(),
  character_id  uuid not null references public.characters(id) on delete cascade,
  field_key     text not null,  -- e.g. 'born', 'species', 'allegiance'
  field_value   text default '',
  unique(character_id, field_key)
);


-- ─── 5. ROW LEVEL SECURITY ──────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.characters enable row level security;
alter table public.character_sections enable row level security;
alter table public.character_infobox enable row level security;

-- Profiles: users can read all, update only their own
create policy "profiles_select_all" on public.profiles for select using (true);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Characters: everyone can read; editors/admins can insert/update/delete
create policy "characters_select_all" on public.characters for select using (true);
create policy "characters_insert_editors" on public.characters for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('editor', 'admin'))
  );
create policy "characters_update_editors" on public.characters for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('editor', 'admin'))
  );
create policy "characters_delete_admin" on public.characters for delete
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Sections: same pattern
create policy "sections_select_all" on public.character_sections for select using (true);
create policy "sections_insert_editors" on public.character_sections for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('editor', 'admin'))
  );
create policy "sections_update_editors" on public.character_sections for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('editor', 'admin'))
  );
create policy "sections_delete_editors" on public.character_sections for delete
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('editor', 'admin'))
  );

-- Infobox: same pattern
create policy "infobox_select_all" on public.character_infobox for select using (true);
create policy "infobox_insert_editors" on public.character_infobox for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('editor', 'admin'))
  );
create policy "infobox_update_editors" on public.character_infobox for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('editor', 'admin'))
  );
create policy "infobox_delete_editors" on public.character_infobox for delete
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('editor', 'admin'))
  );


-- ─── 6. MAKE YOURSELF ADMIN ─────────────────────────────────────────
-- After signing up, run this with your user's email to promote yourself:
--
-- update public.profiles
-- set role = 'admin'
-- where id = (select id from auth.users where email = 'your@email.com');
