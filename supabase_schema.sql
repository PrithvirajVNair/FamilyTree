-- ==============================================================================
-- FAMILY TREE BUILDER - SUPABASE DATABASE SCHEMA & RLS POLICIES
-- ==============================================================================
-- Run this script in the Supabase SQL Editor to set up tables, constraints,
-- security functions, row-level security (RLS), triggers, and storage buckets.

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- ==============================================================================
-- 2. PROFILES TABLE
-- Stores public profile data linked to auth.users
-- ==============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

-- Auto-create profile trigger on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, user_id, display_name, avatar_url)
  values (
    new.id,
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', null)
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Profiles RLS
create policy "Users can view any profile"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ==============================================================================
-- 3. FAMILIES TABLE
-- Stores family tree containers
-- ==============================================================================
create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_families_owner on public.families(owner_id);

alter table public.families enable row level security;

-- ==============================================================================
-- 4. FAMILY COLLABORATORS (SHARING & PERMISSIONS)
-- Defines roles: 'owner', 'editor', 'viewer'
-- ==============================================================================
create table if not exists public.family_collaborators (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'editor', 'viewer')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_family_collaborator unique (family_id, user_id)
);

create index if not exists idx_collaborators_family on public.family_collaborators(family_id);
create index if not exists idx_collaborators_user on public.family_collaborators(user_id);

alter table public.family_collaborators enable row level security;

-- Security helper functions
create or replace function public.is_family_member(p_family_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.families f
    where f.id = p_family_id and f.owner_id = auth.uid()
    union
    select 1 from public.family_collaborators fc
    where fc.family_id = p_family_id and fc.user_id = auth.uid()
  );
$$;

create or replace function public.is_family_editor(p_family_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.families f
    where f.id = p_family_id and f.owner_id = auth.uid()
    union
    select 1 from public.family_collaborators fc
    where fc.family_id = p_family_id and fc.user_id = auth.uid() and fc.role in ('owner', 'editor')
  );
$$;

create or replace function public.is_family_owner(p_family_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.families f
    where f.id = p_family_id and f.owner_id = auth.uid()
  );
$$;

-- Families RLS Policies
create policy "Users can view families they own or are shared with"
  on public.families for select
  to authenticated
  using (public.is_family_member(id));

create policy "Users can create their own families"
  on public.families for insert
  to authenticated
  with check (auth.uid() = owner_id);

create policy "Owners and editors can update families"
  on public.families for update
  to authenticated
  using (public.is_family_editor(id))
  with check (public.is_family_editor(id));

create policy "Only owners can delete families"
  on public.families for delete
  to authenticated
  using (auth.uid() = owner_id);

-- Family Collaborators RLS Policies
create policy "Members can view family collaborators"
  on public.family_collaborators for select
  to authenticated
  using (public.is_family_member(family_id));

create policy "Owners can manage collaborators"
  on public.family_collaborators for insert
  to authenticated
  with check (public.is_family_owner(family_id));

create policy "Owners can update collaborator roles"
  on public.family_collaborators for update
  to authenticated
  using (public.is_family_owner(family_id))
  with check (public.is_family_owner(family_id));

create policy "Owners can remove collaborators"
  on public.family_collaborators for delete
  to authenticated
  using (public.is_family_owner(family_id));

-- ==============================================================================
-- 5. PEOPLE TABLE
-- Person details belonging to a family tree
-- ==============================================================================
create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  first_name text not null,
  middle_name text,
  last_name text,
  gender text not null default 'Unknown' check (gender in ('Male', 'Female', 'Other', 'Unknown')),
  birth_date date,
  death_date date,
  birth_place text,
  notes text,
  photo_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint valid_dates check (birth_date is null or death_date is null or death_date >= birth_date)
);

create index if not exists idx_people_family on public.people(family_id);
create index if not exists idx_people_names on public.people(family_id, last_name, first_name);

alter table public.people enable row level security;

create policy "Members can view people in authorized families"
  on public.people for select
  to authenticated
  using (public.is_family_member(family_id));

create policy "Editors can insert people into families"
  on public.people for insert
  to authenticated
  with check (public.is_family_editor(family_id));

create policy "Editors can update people in families"
  on public.people for update
  to authenticated
  using (public.is_family_editor(family_id))
  with check (public.is_family_editor(family_id));

create policy "Editors can delete people from families"
  on public.people for delete
  to authenticated
  using (public.is_family_editor(family_id));

-- ==============================================================================
-- 6. FAMILY MEMBERS JUNCTION TABLE
-- Explicitly tracks person membership within a family
-- ==============================================================================
create table if not exists public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  person_id uuid not null references public.people(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_family_member unique (family_id, person_id)
);

create index if not exists idx_family_members_family on public.family_members(family_id);
create index if not exists idx_family_members_person on public.family_members(person_id);

alter table public.family_members enable row level security;

create policy "Members can view family members junction"
  on public.family_members for select
  to authenticated
  using (public.is_family_member(family_id));

create policy "Editors can insert family members junction"
  on public.family_members for insert
  to authenticated
  with check (public.is_family_editor(family_id));

create policy "Editors can delete family members junction"
  on public.family_members for delete
  to authenticated
  using (public.is_family_editor(family_id));

-- Trigger to auto-sync family_members when a person is inserted
create or replace function public.sync_family_member()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.family_members (family_id, person_id)
  values (new.family_id, new.id)
  on conflict (family_id, person_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_person_inserted on public.people;
create trigger on_person_inserted
  after insert on public.people
  for each row execute function public.sync_family_member();

-- ==============================================================================
-- 7. RELATIONSHIPS TABLE
-- Direct parent-child (person_1 = parent, person_2 = child) and spouse relationships
-- ==============================================================================
create table if not exists public.relationships (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  person_1_id uuid not null references public.people(id) on delete cascade,
  person_2_id uuid not null references public.people(id) on delete cascade,
  relationship_type text not null check (relationship_type in ('parent', 'spouse')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint no_self_relation check (person_1_id <> person_2_id),
  constraint unique_relationship unique (family_id, person_1_id, person_2_id, relationship_type)
);

create index if not exists idx_rel_family on public.relationships(family_id);
create index if not exists idx_rel_p1 on public.relationships(person_1_id);
create index if not exists idx_rel_p2 on public.relationships(person_2_id);

alter table public.relationships enable row level security;

create policy "Members can view relationships"
  on public.relationships for select
  to authenticated
  using (public.is_family_member(family_id));

create policy "Editors can insert relationships"
  on public.relationships for insert
  to authenticated
  with check (public.is_family_editor(family_id));

create policy "Editors can update relationships"
  on public.relationships for update
  to authenticated
  using (public.is_family_editor(family_id))
  with check (public.is_family_editor(family_id));

create policy "Editors can delete relationships"
  on public.relationships for delete
  to authenticated
  using (public.is_family_editor(family_id));

-- ==============================================================================
-- 8. STORAGE BUCKET FOR PHOTOS
-- ==============================================================================
insert into storage.buckets (id, name, public)
values ('family-photos', 'family-photos', true)
on conflict (id) do nothing;

create policy "Anyone authenticated can upload photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'family-photos');

create policy "Anyone authenticated can update photos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'family-photos');

create policy "Anyone authenticated can delete photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'family-photos');

create policy "Public can view family photos"
  on storage.objects for select
  to public
  using (bucket_id = 'family-photos');
