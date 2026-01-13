# Portfolio Content Persistence and Deletion Tracking Implementation

## Overview

This guide explains the implementation of portfolio content persistence and deletion tracking features. The changes enable portfolio content to behave similarly to media content:

1. **Content Persistence**: Portfolio content now appears in the "Your Content" section and remains there even after being published
2. **Publication Tracking**: Users can see which destination (Media/Portfolio) their content is published to
3. **Deletion with Countdown**: Portfolio content includes a 3-day deletion countdown with the ability to save content from deletion
4. **Edit and Re-publish**: Users can edit portfolio content and change publication destinations

## Database Changes

### SQL Migration

Apply the migration file: `database/portfolio_content_persistence_migration.sql`

This migration:
- Adds deletion tracking columns to `portfolio_page_content` table
- Creates triggers for auto-updating `updated_at` column
- Creates functions for handling deletion tracking and cleanup
- Updates RLS policies for portfolio content
- Configures storage bucket policies
- Sets up pg_cron for automatic cleanup of expired content

### Key Columns Added

```sql
ALTER TABLE public.portfolio_page_content
ADD COLUMN IF NOT EXISTS publication_destination TEXT DEFAULT 'portfolio',
ADD COLUMN IF NOT EXISTS published_to JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS auto_delete_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS saved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_deleted_pending BOOLEAN DEFAULT FALSE;
```

## Frontend Changes

### 1. Updated Hooks

#### `useMyContent.ts`
- Now fetches content from BOTH `media_page_content` and `portfolio_page_content` tables
- Combines and sorts results by creation date
- Subscribes to changes on both tables in real-time
- Adds a `source` field to distinguish between media and portfolio content

**Usage:**
```typescript
const { contentItems } = useMyContent(userId);
// contentItems will have source: 'media' | 'portfolio'
```

#### `useContentPublication.ts`
- Extended to support portfolio destination
- Accepts optional `source` parameter to determine which table to update

**Usage:**
```typescript
await publishToDestination(contentId, 'portfolio', 'portfolio');
```

#### `useContentDeletion.ts`
- Extended to support portfolio destination
- Accepts optional `source` parameter to determine which table to update

**Usage:**
```typescript
await deleteFromDestination(contentId, 'portfolio', 'portfolio');
```

#### `useMediaPageEdit.ts`
- Extended to accept optional `source` parameter
- Determines table based on source (default: media_page_content)

**Usage:**
```typescript
await editContent(contentId, payload, 'portfolio');
```

### 2. Updated Pages

#### `Content.tsx`
- **Upload Section**: Users can select whether to publish to Media or Portfolio
- **Your Content Section**: Shows all content (both media and portfolio) with source badges
- **Content Sources**: Displayed with distinct colors:
  - Purple badge: Media content
  - Blue badge: Portfolio content
- **Publication Status**: Shows which destination(s) content is published to
- **Edit/Delete**: Full editing and deletion capabilities with 3-day countdown

#### `Portfolio.tsx`
- **Portfolio Content Section**: Now shows:
  - Edit button (hover to reveal)
  - Delete button (hover to reveal)
  - Deletion countdown timer when pending deletion
  - Option to save from deletion
- **Content Management**: Users can edit and delete portfolio content directly from the Portfolio page
- **Edit Modal**: Opens when user clicks edit button

### 3. Components

#### `PublicationStatusBadge.tsx`
Already distinguishes between publication destinations:
- "Published to Media" - for media content
- "Displayed in Portfolio" - for portfolio content

#### `EditContentModal.tsx`
- Works with both media and portfolio content
- Allows editing title, description, category, and premium status
- Shows delete option with confirmation

#### `ContentCountdownTimer.tsx`
- Shows countdown for content pending deletion
- Allows user to save content and prevent deletion

## Workflow

### Uploading Content

1. User goes to Content page
2. Fills in content details (title, description, type, category)
3. **Selects Publish To**: "Media" or "Portfolio"
4. Uploads file and thumbnail
5. Content is created with:
   - `status: 'published'`
   - `published_to: ['media']` or `['portfolio']`
   - `publication_destination: 'media'` or `'portfolio'`

### Managing Content in "Your Content"

1. User can see all their content (media and portfolio) with source badges
2. Content remains in "Your Content" section even after publishing
3. User can edit content (title, description, category, premium status)
4. User can unpublish content from destinations

### Deleting Content

1. User clicks edit button on content
2. User clicks "Delete Content" button
3. Content status changes to `pending_deletion`
4. **3-Day Countdown**: Shows how many days until permanent deletion
5. User can click "Save" to prevent deletion and restore to draft status
6. After 3 days, content is automatically deleted via pg_cron job

### Portfolio Content Management

1. Portfolio content appears in Portfolio > Portfolio Content section
2. On hover, users see Edit and Delete buttons
3. Users can edit content properties
4. Users can delete content (starts 3-day countdown)
5. Users can save content from deletion

## Data Flow Diagram

```
Upload Content (Content page)
    ↓
Select Destination (Media/Portfolio)
    ↓
Store in appropriate table (media_page_content/portfolio_page_content)
    ↓
Appears in "Your Content" with source badge
    ↓
Can be edited/deleted from either Content or Portfolio pages
    ↓
Delete starts countdown timer
    ↓
User can save or let auto-delete after 3 days
```

## Important Notes

1. **Separate Tables**: Media and portfolio content are stored in separate tables as per requirements
2. **Backward Compatibility**: Existing portfolio content is migrated with default values
3. **RLS Policies**: Properly configured to allow authenticated users full access to their content
4. **Storage Buckets**: Separate storage buckets for media and portfolio files
5. **Real-time Updates**: Supabase real-time subscriptions keep the UI in sync
6. **Auto-cleanup**: pg_cron job automatically cleans up expired content

## Testing Checklist

- [ ] Upload content to Media destination
- [ ] Upload content to Portfolio destination
- [ ] Verify content appears in "Your Content" section with correct source badge
- [ ] Edit content from Content page
- [ ] Edit content from Portfolio page
- [ ] Delete content and verify 3-day countdown appears
- [ ] Save content from deletion and verify countdown disappears
- [ ] Verify content persists in "Your Content" after publishing
- [ ] Verify publication status badges show correct destinations
- [ ] Verify portfolio content appears in Portfolio page with edit/delete options

## Troubleshooting

### Content not appearing in "Your Content"
- Check that user_id matches the logged-in user
- Verify status is not 'archived' or 'permanently_deleted'
- Check browser console for any errors

### Countdown timer not appearing
- Verify auto_delete_at is set correctly
- Check that status is 'pending_deletion'
- Verify saved is false

### Edit not working
- Check that the correct table is being updated (based on source)
- Verify user has update permission on the table

### Delete not working for Portfolio
- Ensure portfolio_page_content table has delete trigger
- Check RLS policies allow delete operations
- Verify storage bucket policies are configured

## Performance Considerations

1. **Indexes**: Created on frequently queried columns (user_id, status, auto_delete_at)
2. **Real-time**: Separate subscriptions for media and portfolio tables
3. **Cleanup**: pg_cron job runs hourly to clean up expired content
4. **Data Size**: Consider archiving old content if tables grow large

## Security Notes

- RLS policies ensure users can only see/modify their own content
- Storage policies restrict file access to appropriate users
- Triggers enforce automatic status updates
- No direct SQL queries should be used; always use Supabase client
