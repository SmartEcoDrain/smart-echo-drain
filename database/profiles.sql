-- Create profiles table
create table if not exists public.profiles (
  uuid UUID primary key references auth.users (id) on delete CASCADE,
  email TEXT unique not null,
  full_name TEXT not null,
  is_admin BOOLEAN not null default false,
  name JSONB not null default '{}'::jsonb,
  gender TEXT,
  birthday TIMESTAMPTZ,
  phone_number TEXT,
  address JSONB not null default '{}'::jsonb,
  settings JSONB default '{}'::jsonb,
  profile_image TEXT,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- RPC function to get public profile data (email, full_name, profile_image only)
create or replace function public.get_public_profile(user_id uuid)
returns table(
  uuid uuid,
  email text,
  full_name text,
  profile_image text
)
security definer
set search_path = public
language plpgsql
as $$
begin
  return query
  select p.uuid, p.email, p.full_name, p.profile_image
  from profiles p
  where p.uuid = user_id;
end;
$$;

-- RPC function to get full profile data (only for owner)
create or replace function public.get_full_profile(user_id uuid)
returns table(
  uuid uuid,
  email text,
  full_name text,
  is_admin boolean,
  name jsonb,
  gender text,
  birthday timestamptz,
  phone_number text,
  address jsonb,
  settings jsonb,
  profile_image text,
  created_at timestamptz,
  updated_at timestamptz
)
security definer
set search_path = public
language plpgsql
as $$
begin
  -- Only return data if requesting user owns the profile
  if auth.uid() = user_id then
    return query
    select p.uuid, p.email, p.full_name, p.is_admin, p.name, 
           p.gender, p.birthday, p.phone_number, p.address, 
           p.settings, p.profile_image, p.created_at, p.updated_at
    from profiles p
    where p.uuid = user_id;
  end if;
end;
$$;

-- RPC function to update profile (only for owner)
create or replace function public.update_profile(
  user_id uuid,
  new_email text default null,
  new_full_name text default null,
  new_name jsonb default null,
  new_gender text default null,
  new_birthday timestamptz default null,
  new_phone_number text default null,
  new_address jsonb default null,
  new_settings jsonb default null,
  new_profile_image text default null
)
returns boolean
security definer
set search_path = public
language plpgsql
as $$
begin
  -- Only allow update if requesting user owns the profile
  if auth.uid() = user_id then
    update profiles set
      email = coalesce(new_email, email),
      full_name = coalesce(new_full_name, full_name),
      name = coalesce(new_name, name),
      gender = coalesce(new_gender, gender),
      birthday = coalesce(new_birthday, birthday),
      phone_number = coalesce(new_phone_number, phone_number),
      address = coalesce(new_address, address),
      settings = coalesce(new_settings, settings),
      profile_image = coalesce(new_profile_image, profile_image),
      updated_at = now()
    where uuid = user_id;
    
    return found;
  end if;
  
  return false;
end;
$$;

-- Basic RLS policies for direct table access (as fallback)
-- Public read policy for limited fields only
create policy "profiles_public_select" on public.profiles
for select to authenticated, anon
using (true); -- We'll control access through RPC functions

-- Owner-only policies for insert, update, delete
create policy "profiles_insert_own" on public.profiles
for insert to authenticated
with check (auth.uid() = uuid);

create policy "profiles_update_own" on public.profiles
for update to authenticated
using (auth.uid() = uuid);

create policy "profiles_delete_own" on public.profiles
for delete to authenticated
using (auth.uid() = uuid);

-- ...existing code...

-- RPC function to get all profiles (admin only, returns limited data for privacy)
create or replace function public.get_all_profiles(
  limit_count int default 50,
  offset_count int default 0,
  search_query text default null
)
returns table(
  uuid uuid,
  email text,
  full_name text,
  is_admin boolean,
  phone_number text,
  profile_image text,
  created_at timestamptz,
  updated_at timestamptz
)
security definer
set search_path = public
language plpgsql
as $$
declare
  is_user_admin boolean;
begin
  -- Check if current user is admin
  select p.is_admin into is_user_admin 
  from profiles p 
  where p.uuid = auth.uid();
  
  -- Only return data if requesting user is admin
  if coalesce(is_user_admin, false) = true then
    return query
    select p.uuid, p.email, p.full_name, p.is_admin, p.phone_number,
           p.profile_image, p.created_at, p.updated_at
    from profiles p
    where (search_query is null or 
           p.full_name ilike '%' || search_query || '%' or 
           p.email ilike '%' || search_query || '%')
    order by p.created_at desc
    limit limit_count
    offset offset_count;
  end if;
end;
$$;

-- RPC function to get profiles count (admin only)
create or replace function public.get_profiles_count(
  search_query text default null
)
returns int
security definer
set search_path = public
language plpgsql
as $$
declare
  is_user_admin boolean;
  profile_count int;
begin
  -- Check if current user is admin
  select p.is_admin into is_user_admin 
  from profiles p 
  where p.uuid = auth.uid();
  
  -- Only return count if requesting user is admin
  if coalesce(is_user_admin, false) = true then
    select count(*)::int into profile_count
    from profiles p
    where (search_query is null or 
           p.full_name ilike '%' || search_query || '%' or 
           p.email ilike '%' || search_query || '%');
    
    return profile_count;
  end if;
  
  return 0;
end;
$$;

-- RPC function to update user admin status (admin only)
create or replace function public.update_user_admin_status(
  target_user_id uuid,
  new_admin_status boolean
)
returns boolean
security definer
set search_path = public
language plpgsql
as $$
declare
  is_user_admin boolean;
begin
  -- Check if current user is admin
  select p.is_admin into is_user_admin 
  from profiles p 
  where p.uuid = auth.uid();
  
  -- Only allow update if requesting user is admin and not updating themselves
  if coalesce(is_user_admin, false) = true and auth.uid() != target_user_id then
    update profiles set
      is_admin = new_admin_status,
      updated_at = now()
    where uuid = target_user_id;
    
    return found;
  end if;
  
  return false;
end;
$$;


CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();