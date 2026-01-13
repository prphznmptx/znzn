# Database Migrations

This folder contains all SQL migrations for the Supabase database. These files document the complete database schema and should be executed in order.

## Migration Files

### 001_create_tables.sql
Creates all database tables and indexes:
- **profiles** - User profile information
- **media_items** - User-uploaded media (images, articles, etc.)
- **media_likes** - Like junction table (user → media)
- **creator_follows** - Follow junction table (user → creator)
- **tips** - Tips/donations sent to creators

### 002_create_functions_and_triggers.sql
Creates database functions and triggers:
- **update_updated_at_column()** - Auto-updates `updated_at` timestamps on table changes
- **handle_new_user()** - Auto-creates profile entry when user signs up
- **update_media_item_like_count()** - Auto-increments/decrements `like_count` when likes are added/removed

**Important**: The `update_media_item_like_count()` function uses `SECURITY DEFINER` to bypass RLS policies, allowing the trigger to update media_items even though the normal RLS policy requires `auth.uid() = user_id`.

### 003_enable_rls_policies.sql
Enables Row Level Security (RLS) and creates security policies:
- Users can only view/modify their own data (except public reads)
- Media items, likes, and follows are managed per-user with appropriate policies

## Running Migrations

Execute the files in order in your Supabase SQL Editor:

```sql
-- Run 001_create_tables.sql first
-- Run 002_create_functions_and_triggers.sql second
-- Run 003_enable_rls_policies.sql third
```

## Key Implementation Notes

### Like Count Updates
The like count is automatically updated via the `update_media_item_like_count` trigger:
- When a user likes media: the trigger increments `media_items.like_count`
- When a user unlikes media: the trigger decrements `media_items.like_count`

This is done with a database trigger instead of application-side logic to ensure data consistency.

### SECURITY DEFINER Importance
The `update_media_item_like_count()` function has `SECURITY DEFINER` because:
- Normal RLS policies would prevent the trigger from updating `media_items` (since the trigger runs as the postgres role, not the authenticated user)
- `SECURITY DEFINER` allows the function to execute with its owner's privileges, bypassing RLS
- This is a secure pattern because the function is system-managed, not user-facing

### Optimistic Updates
The React application implements optimistic updates:
1. UI updates immediately when user clicks like/follow
2. Database request happens in the background
3. If the request fails, UI reverts to previous state
4. This provides instant user feedback without waiting for the server

## Verifying Migrations

To check if all migrations are applied, run:

```sql
-- Check tables exist
SELECT * FROM information_schema.tables WHERE table_schema = 'public';

-- Check triggers exist
SELECT * FROM information_schema.triggers WHERE trigger_schema = 'public';

-- Check functions exist
SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public';
```

Expected functions:
- handle_new_user
- update_media_item_like_count
- update_updated_at_column
