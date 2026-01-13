# Mux + Backblaze B2 Video Upload Integration Guide

## ✅ What's Been Implemented

### Backend Components
1. **Supabase Edge Functions** (3 functions deployed):
   - `get-signed-upload-url` - Generates signed URLs for B2 uploads
   - `process-new-video` - Triggers Mux encoding and stores metadata
   - `mux-webhook-handler` - Listens for Mux webhook events

2. **Database**:
   - `video_uploads` table - Staging table for tracking video processing status
   - `media_page_content` table - Final destination for published videos

### Frontend Components
1. **`VideoUploadWithMux.tsx`** - Complete video upload UI component
2. **`useVideoUpload` hook** - Orchestrates upload workflow
3. **`useMediaPageContent` hook** - Manages media content queries

## 🚀 How to Use in Your App

### Step 1: Add the Video Upload Button to a Page

```typescript
// In your Media.tsx or any page where you want video uploads
import VideoUploadWithMux from '../components/VideoUploadWithMux';
import { useAuth } from '../context/AuthContext';

export default function Media() {
  const { user } = useAuth();

  const handleUploadSuccess = () => {
    // Refresh content list or show success message
    console.log('Video uploaded successfully!');
  };

  return (
    <div>
      {/* Your existing media content here */}
      
      {user && (
        <VideoUploadWithMux
          userId={user.id}
          userName={user.name}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
}
```

### Step 2: Display Uploaded Videos

```typescript
import { useEffect } from 'react';
import { useMediaPageContent } from '../hooks/useMediaPageContent';

export default function MediaGallery() {
  const { content, loading, fetchContent } = useMediaPageContent();

  useEffect(() => {
    fetchContent({ status: 'published' });
  }, []);

  if (loading) return <div>Loading videos...</div>;

  return (
    <div className="grid grid-cols-3 gap-4">
      {content.map(video => (
        <div key={video.id} className="rounded-lg overflow-hidden">
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="w-full h-40 object-cover"
          />
          <h3 className="mt-2 font-semibold">{video.title}</h3>
          <p className="text-sm text-gray-600">{video.creator}</p>
        </div>
      ))}
    </div>
  );
}
```

### Step 3: Play Videos

```typescript
// Using Mux Player component
<mux-player
  playback-id={video.content_url.split('/')[3]} // Extract from stream URL
  metadata-video-title={video.title}
  stream-type="on-demand"
  controls
/>
```

## 📋 Complete Upload Flow

### User Perspective:
1. Click **"Upload Video"** button
2. Drag or select a video file (max 500MB)
3. Enter title, description, and category
4. Click **"Upload & Process"**
5. Wait while:
   - File uploads to Backblaze B2
   - Mux encodes the video (~1-5 minutes depending on size)
6. Component shows **"Video Processing Complete"** when ready
7. Click **"Save & Publish"** to publish to media page

### Technical Flow:
```
User File → useVideoUpload Hook
  ↓
get-signed-upload-url Edge Function → Generates B2 signed URL
  ↓
Frontend uploads directly to B2
  ↓
process-new-video Edge Function
  - Creates Mux asset for encoding
  - Stores record in video_uploads table with 'processing' status
  ↓
Mux processes video (usually 1-5 minutes)
  ↓
Mux webhook fires (video.asset.ready event)
  ↓
mux-webhook-handler updates video_uploads to 'ready' + playback_id
  ↓
useVideoUpload hook polls and detects 'ready' status
  ↓
Component shows ready state
  ↓
User clicks "Save & Publish"
  ↓
Data inserted into media_page_content table
  ↓
Video appears in media gallery
```

## 🔑 Environment Variables (Already Set)

Your Supabase Edge Functions have access to:
- `B2_KEY_ID` - Backblaze B2 API Key ID
- `B2_APPLICATION_KEY` - Backblaze B2 Secret Key
- `B2_S3_ENDPOINT` - B2 S3-compatible endpoint
- `B2_BUCKET_NAME` - Your B2 bucket name
- `MUX_TOKEN_ID` - Mux API access token ID
- `MUX_TOKEN_SECRET` - Mux API secret token
- `MUX_WEBHOOK_SECRET` - Mux webhook signing secret
- `SUPABASE_URL` - Your Supabase project URL (auto-injected)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (auto-injected)

## 📝 Database Schema Reference

### `video_uploads` Table (Staging)
```sql
id, user_id, filename, b2_url, asset_id, 
playback_id, status, created_at, final_content_id
```
- **status**: 'pending' | 'processing' | 'ready' | 'failed'
- Automatically cleaned up when content is saved

### `media_page_content` Table (Final)
```sql
id, user_id, title, creator, description, type, 
category, thumbnail_url, content_url, duration, 
views_count, like_count, is_premium, status, created_at
```
- **status**: 'draft' | 'published' | 'archived'
- **type**: 'music-video', 'movie', 'audio-music', 'blog', 'image', 'document'

## 🐛 Troubleshooting

### Video uploads failing?
1. Check that Edge Functions are deployed: `supabase functions list`
2. Verify environment variables in Supabase Dashboard > Settings > Edge Functions
3. Check browser console for specific error messages

### Mux webhook not firing?
1. Go to Mux Dashboard > Settings > Webhooks
2. Verify webhook URL: `https://<project-ref>.supabase.co/functions/v1/mux-webhook-handler`
3. Check webhook logs in Mux Dashboard for any errors

### Video not appearing in gallery?
1. Verify video status is 'published' in `media_page_content` table
2. Check that `publication_destination` is 'media' or includes 'media'
3. Ensure `published_to` JSONB contains "media"

## 📚 API Reference

### useVideoUpload Hook

```typescript
const {
  isUploading,      // boolean - uploading to B2
  isProcessing,     // boolean - Mux is encoding
  isReady,          // boolean - ready to save
  progress,         // number 0-100 - overall progress
  error,            // string | null - error message
  playbackId,       // string | null - Mux playback ID
  assetId,          // string | null - Mux asset ID
  uploadId,         // string | null - video_uploads record ID
  uploadVideo,      // (file, userId) => Promise<void>
  resetState        // () => void
} = useVideoUpload();
```

### useMediaPageContent Hook

```typescript
const {
  content,          // MediaPageContent[]
  loading,          // boolean
  error,            // string | null
  fetchContent,     // (filters?) => Promise<void>
  updateContent,    // (id, updates) => Promise<void>
  deleteContent     // (id) => Promise<void>
} = useMediaPageContent();
```

## ✨ Features

✅ Direct-to-B2 uploads (no server overhead)
✅ Mux integration for professional video encoding
✅ Automatic status polling (no manual refresh needed)
✅ Real-time progress tracking
✅ Error handling and recovery
✅ Responsive mobile-friendly UI
✅ Drag-and-drop support
✅ File validation (type & size)
✅ Automatic thumbnail generation
✅ HLS/DASH streaming ready

## 📞 Next Steps

1. Add VideoUploadWithMux component to your Media/Content page
2. Test uploading a small video file
3. Monitor Mux processing in Mux Dashboard
4. Verify video appears in media_page_content table
5. Display videos in gallery using playback_id
6. Customize UI colors/styling to match your brand
