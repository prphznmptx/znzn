# Media Page Publication & Soft Delete Migration

This migration adds support for:
- Publication destination tracking (Media, Masterclass, etc.)
- Soft delete with 3-day retention and auto-cleanup
- Save functionality to prevent auto-deletion
- Multiple publication destination support

## SQL Migration

Run this in your Supabase SQL Editor:

```sql
-- Add new columns to media_page_content table for publication tracking
ALTER TABLE public.media_page_content
ADD COLUMN IF NOT EXISTS publication_destination TEXT DEFAULT 'media' CHECK (publication_destination IN ('media', 'masterclass')),
ADD COLUMN IF NOT EXISTS published_to JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS auto_delete_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS saved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_deleted_pending BOOLEAN DEFAULT FALSE;

-- Create index for auto_delete_at to improve cleanup query performance
CREATE INDEX IF NOT EXISTS idx_media_page_content_auto_delete_at ON public.media_page_content(auto_delete_at)
WHERE auto_delete_at IS NOT NULL;

-- Create index for user_id to improve filtering performance
CREATE INDEX IF NOT EXISTS idx_media_page_content_user_id_status ON public.media_page_content(user_id, status);

-- Create function to handle automatic deletion of expired content
CREATE OR REPLACE FUNCTION public.cleanup_expired_deleted_content()
RETURNS void AS $$
BEGIN
  -- Mark content for deletion if auto_delete_at has passed and it hasn't been saved
  UPDATE public.media_page_content
  SET status = 'permanently_deleted'
  WHERE 
    auto_delete_at IS NOT NULL 
    AND auto_delete_at < NOW() 
    AND saved = FALSE
    AND status = 'pending_deletion';
END;
$$ LANGUAGE plpgsql;

-- Create a trigger function to set auto_delete_at when content is deleted from all places
CREATE OR REPLACE FUNCTION public.on_content_deleted_from_all_places()
RETURNS TRIGGER AS $$
BEGIN
  -- If content is being marked as deleted and was not previously deleted
  IF NEW.status = 'pending_deletion' AND OLD.status != 'pending_deletion' THEN
    NEW.deleted_at = NOW();
    NEW.auto_delete_at = NOW() + INTERVAL '3 days';
    NEW.is_deleted_pending = TRUE;
  END IF;
  
  -- If content is being saved
  IF NEW.saved = TRUE AND OLD.saved = FALSE THEN
    NEW.deleted_at = NULL;
    NEW.auto_delete_at = NULL;
    NEW.is_deleted_pending = FALSE;
    NEW.status = 'draft';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF NOT EXISTS trigger_content_deleted_from_all_places ON public.media_page_content;

-- Create trigger for soft delete logic
CREATE TRIGGER trigger_content_deleted_from_all_places
BEFORE UPDATE ON public.media_page_content
FOR EACH ROW
EXECUTE FUNCTION public.on_content_deleted_from_all_places();
```

## Key Changes

### New Columns

1. **publication_destination** (TEXT)
   - Specifies where the content should be published (media, masterclass)
   - Used during upload to determine the primary destination
   - CHECK constraint ensures only valid values

2. **published_to** (JSONB)
   - Array of destinations where content is currently published
   - Example: `["media"]`, `["masterclass"]`, `["media", "masterclass"]`
   - Tracks multiple publication locations

3. **deleted_at** (TIMESTAMP WITH TIME ZONE)
   - Records when content was deleted from all places
   - NULL if content is not pending deletion

4. **auto_delete_at** (TIMESTAMP WITH TIME ZONE)
   - Calculated as deleted_at + 3 days
   - Used to determine when content should be permanently deleted
   - Indexed for efficient cleanup queries

5. **saved** (BOOLEAN)
   - Default: FALSE
   - When TRUE, prevents auto-deletion even if pending
   - Reset to FALSE on publication

6. **is_deleted_pending** (BOOLEAN)
   - Helper flag to track if content is pending deletion
   - Simplifies queries for display logic

### Indexes Created

- `idx_media_page_content_auto_delete_at` - For efficient cleanup of expired content
- `idx_media_page_content_user_id_status` - For efficient user content filtering

### Functions Created

1. **cleanup_expired_deleted_content()** - Periodic cleanup job
   - Marks content as 'permanently_deleted' after 3 days
   - Only affects content where saved=FALSE
   - Should be called periodically via pg_cron or application task scheduler

2. **on_content_deleted_from_all_places()** - Auto-update trigger
   - Automatically sets deleted_at and auto_delete_at when status changes to 'pending_deletion'
   - Handles save logic by resetting deletion timestamps and status

## Implementation Notes

### Backend Cleanup (Choose One)

#### Option 1: Using pg_cron (Recommended)
```sql
-- Create extension if not exists
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule cleanup to run every hour
SELECT cron.schedule('cleanup-expired-content', '0 * * * *', 'SELECT public.cleanup_expired_deleted_content()');
```

#### Option 2: Application-Side Cleanup
Call `cleanup_expired_deleted_content()` periodically from your application (e.g., on app startup or via scheduled task).

### Status Values

The enhanced status field now supports:
- `draft` - Content uploaded but not published anywhere
- `published` - Content published to at least one destination
- `pending_deletion` - Content deleted from all places, in 3-day grace period
- `permanently_deleted` - Content permanently deleted (hidden from user's Your Content)
- `archived` - (Legacy) Content archived by creator (kept for backward compatibility)

### Migration Safety

This migration is backward compatible:
- All new columns have defaults
- Existing content will have empty published_to arrays
- Existing published content will need status updated to 'published' (see recovery section below)

### Data Recovery (if needed)

If migration encounters issues:
```sql
-- Rollback all changes
ALTER TABLE public.media_page_content DROP COLUMN IF EXISTS publication_destination;
ALTER TABLE public.media_page_content DROP COLUMN IF EXISTS published_to;
ALTER TABLE public.media_page_content DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE public.media_page_content DROP COLUMN IF EXISTS auto_delete_at;
ALTER TABLE public.media_page_content DROP COLUMN IF EXISTS saved;
ALTER TABLE public.media_page_content DROP COLUMN IF EXISTS is_deleted_pending;

DROP TRIGGER IF EXISTS trigger_content_deleted_from_all_places ON public.media_page_content;
DROP FUNCTION IF EXISTS on_content_deleted_from_all_places();
DROP FUNCTION IF EXISTS cleanup_expired_deleted_content();
DROP INDEX IF EXISTS idx_media_page_content_auto_delete_at;
DROP INDEX IF EXISTS idx_media_page_content_user_id_status;
```

## Next Steps

1. Run the SQL migration in Supabase SQL Editor
2. Deploy the application code changes
3. (Optional) Set up pg_cron for automatic cleanup, or implement application-side cleanup
4. Test the publication, deletion, and restoration workflows
