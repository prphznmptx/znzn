# Media & Content Pages Setup Guide

This guide explains how to set up the Media and Content pages with backend connectivity to Supabase.

## Overview

The Media and Content pages use a separate set of tables from the FeedPage to:
- Allow creators to upload content via the Content page
- Display uploaded content in the Media page for all users
- Support likes and follows with optimistic UI updates
- Track views and engagement metrics

## Setup Steps

### 1. Create Storage Bucket in Supabase

1. Go to your Supabase project dashboard
2. Navigate to **Storage** > **Buckets**
3. Create a new bucket named `media_page_content`
4. Set it to **Public** (so content URLs are accessible)

### 2. Run SQL Migrations

1. Go to your Supabase project
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy the entire contents of `database/004_create_mediapage_tables.sql`
5. Paste into the SQL editor
6. Click **Run**

This creates:
- `media_page_content` table - stores uploaded content metadata
- `media_page_likes` table - tracks likes (user → content)
- `media_page_follows` table - tracks follows (user → creator)
- `media_page_tips` table - tracks tips/donations
- All necessary indexes, triggers, and RLS policies

### 3. Enable Storage RLS Policies (Manual)

After the SQL migration, you need to set storage policies:

1. Go to **Storage** > **Policies**
2. Click on the `media_page_content` bucket
3. Add these policies:

#### Policy 1: Enable Public Read
```
CREATE POLICY "Enable public read for media_page_content"
  ON storage.objects FOR SELECT USING (
    bucket_id = 'media_page_content'
  );
```

#### Policy 2: Enable Uploads
```
CREATE POLICY "Enable upload for media_page_content uploads"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'media_page_content'
  );
```

#### Policy 3: Enable Delete
```
CREATE POLICY "Enable delete for media_page_content uploads"
  ON storage.objects FOR DELETE USING (
    bucket_id = 'media_page_content' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

### 4. Verify Setup

Check that everything is working:

```sql
-- Check tables exist
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'media_page%';

-- Check triggers exist
SELECT * FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name LIKE '%media_page%';

-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename LIKE 'media_page%';
```

## File Structure

```
src/pages/
  ├── Content.tsx          # Creator content upload page
  ├── Media.tsx            # Public content display page
  └── ...

src/components/
  ├── VideoPlayer.tsx           # Plyr.io video player wrapper
  ├── VideoPlaybackModal.tsx    # Video modal with metadata
  ├── DeleteFromDestinationModal.tsx
  └── ...

src/hooks/
  ├── useMediaPageInteraction.ts     # Likes and follows hooks
  ├── useVideoDuration.ts            # Video duration detection
  ├── useVideoViewTracking.ts        # View count tracking
  └── ...

database/
  ├── 004_create_mediapage_tables.sql    # New migrations
  └── MEDIA_PAGE_SETUP.md               # This file
```

## How It Works

### Content Upload Flow (Content.tsx)

1. Creator fills out form (title, description, content type, category)
2. File uploaded to `media_page_content` storage bucket
3. Metadata saved to `media_page_content` table
4. Content appears in Media page after upload

### Content Display Flow (Media.tsx)

1. Fetch all published content from `media_page_content` table
2. Subscribe to real-time updates for like counts
3. Display with tabs, search, and category filtering
4. Users can click on videos to open professional video player modal
5. Video player shows duration, controls, and metadata
6. Views are tracked automatically when videos are played
7. Users can like and follow creators from the player modal
8. Optimistic UI updates - likes/follows update immediately on client
9. Database operations happen in background with rollback on failure

### Like/Follow Operations

Using hooks from `useMediaPageInteraction.ts`:

```typescript
// Toggle like
const { toggleLike } = useMediaPageLike();
await toggleLike(contentId, isCurrentlyLiked, userId);

// Toggle follow
const { toggleFollow } = useMediaPageFollow();
await toggleFollow(creatorName, isCurrentlyFollowing, userId);
```

**Optimistic Updates:**
- UI updates immediately when user clicks
- Database request happens in background
- If request fails, UI automatically reverts
- Provides instant feedback to users

### Real-Time Updates

The Media page subscribes to:
- `media_page_content` table changes (like count updates)
- `media_page_likes` table changes (user interaction updates)

This means when another user likes content, your like counts update in real-time without refreshing.

### Video Playback & Player

The Media page includes a professional video player powered by **Plyr.io** with the following features:

**VideoPlayer Component (`src/components/VideoPlayer.tsx`):**
- Full-featured HTML5 video player
- Controls: play, pause, volume, fullscreen, speed adjustment
- Progress bar with seek capability
- Keyboard shortcuts support
- Mobile-optimized responsive design
- Local storage for playback preferences

**VideoPlaybackModal Component (`src/components/VideoPlaybackModal.tsx`):**
- Full-screen modal for video viewing
- Displays video metadata (title, creator, description)
- Shows view count, like count, and creator info
- Action buttons: Like, Follow, Share
- Duration formatting and display
- Responsive layout for all screen sizes

**Features:**
- Click on any video thumbnail to open the player modal
- Hover overlay shows play icon
- Duration auto-detection (from video metadata)
- View count tracking when video is played
- Like/follow functionality integrated with player

### View Tracking

View counts are automatically tracked when users press play on a video:

**useVideoViewTracking Hook (`src/hooks/useVideoViewTracking.ts`):**
- `useSimpleVideoViewTracking(contentId)` - Simple approach that increments view count when video is played
- Tracks views only once per video session
- Updates `views_count` column in `media_page_content` table

**How it works:**
1. User clicks play button on video
2. View tracking hook increments `views_count` in database
3. View count updates immediately in player UI
4. Each play session counts as one view

### Video Duration Detection

Video duration is automatically detected from uploaded video files:

**useVideoDuration Hook (`src/hooks/useVideoDuration.ts`):**
- Loads video metadata to get duration
- Formats duration as MM:SS or HH:MM:SS
- Handles errors and timeouts gracefully
- Used in VideoPlayer component

**How it works:**
1. When video loads in player, metadata is read
2. Duration is formatted (e.g., "4:32" for 4 minutes 32 seconds)
3. Duration displays in player progress bar
4. Duration shown in video metadata section

### Implementation Notes

**Playing Videos:**
```typescript
// Click handler in Media.tsx
const handlePlayClick = (item: ContentItem) => {
  setPlayingContent(item);
  setIsPlayerOpen(true);
  trackView(); // Increment view count
};
```

**View Tracking:**
```typescript
// In Media.tsx
const { trackView } = useSimpleVideoViewTracking(playingContent?.id || '');

// Called when user clicks play
handlePlayClick(item) => {
  trackView(); // Increments views_count for this content
};
```

**Duration Detection:**
```typescript
// VideoPlayer.tsx
const handleLoadedMetadata = () => {
  if (video.duration && onDurationChange) {
    onDurationChange(video.duration);
  }
};
```

## Database Schema

### media_page_content
```sql
- id (UUID, PK)
- user_id (UUID, FK to auth.users)
- title (TEXT)
- creator (TEXT)
- description (TEXT)
- type (TEXT: music-video, movie, audio-music, blog, image)
- category (TEXT)
- thumbnail_url (TEXT)
- content_url (TEXT)
- duration (TEXT)
- read_time (TEXT)
- views_count (INT)
- like_count (INT)
- is_premium (BOOLEAN)
- status (TEXT: draft, published, archived)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### media_page_likes
```sql
- id (UUID, PK)
- user_id (UUID, FK to auth.users)
- content_id (UUID, FK to media_page_content)
- created_at (TIMESTAMP)
- UNIQUE (user_id, content_id)
```

### media_page_follows
```sql
- id (UUID, PK)
- follower_id (UUID, FK to auth.users)
- creator_name (TEXT)
- created_at (TIMESTAMP)
- UNIQUE (follower_id, creator_name)
```

### media_page_tips (Optional)
```sql
- id (UUID, PK)
- from_user_id (UUID, FK to auth.users)
- creator_name (TEXT)
- amount (NUMERIC)
- currency (TEXT)
- message (TEXT)
- created_at (TIMESTAMP)
```

## Key Differences from FeedPage

| Feature | FeedPage | Media Page |
|---------|----------|-----------|
| Tables | media_items | media_page_content |
| Likes Table | media_likes | media_page_likes |
| Follows Table | creator_follows | media_page_follows |
| Storage Bucket | media | media_page_content |
| Purpose | Creator feed | Public content hub |

This separation allows FeedPage and Media/Content pages to operate independently with their own like counts, follows, and content.

## Troubleshooting

### Content uploads fail
- Verify `media_page_content` storage bucket exists and is public
- Check storage policies are correctly set

### Likes don't update
- Verify `media_page_likes` table exists
- Check RLS policies allow authenticated users to insert/delete
- Check triggers are firing (query `pg_stat_user_tables`)

### Real-time updates not working
- Verify Supabase realtime is enabled
- Check browser console for errors
- Restart the app

### "User doesn't have permission"
- This usually means RLS policies aren't set correctly
- Re-run the SQL migration `004_create_mediapage_tables.sql`

## Testing

### Create test content
```sql
INSERT INTO public.media_page_content (
  user_id, title, creator, description, type, category,
  thumbnail_url, like_count
) VALUES (
  'your-user-id-here',
  'Test Video',
  'Test Creator',
  'A test video',
  'music-video',
  'music',
  'https://via.placeholder.com/400x300',
  0
);
```

### Test like functionality
```sql
-- Like content
INSERT INTO public.media_page_likes (user_id, content_id)
VALUES ('your-user-id', 'content-id');

-- Verify like_count updated
SELECT like_count FROM public.media_page_content 
WHERE id = 'content-id';
```

## Production Checklist

- [ ] Storage bucket created and public
- [ ] SQL migrations applied
- [ ] Storage RLS policies configured
- [ ] Test content uploaded via Content page
- [ ] Like/follow functionality working
- [ ] Real-time updates working
- [ ] Search and filtering working
- [ ] Mobile responsive design tested
