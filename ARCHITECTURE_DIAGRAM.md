# Complete Mux Integration Architecture

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLOURISHTALENTS APPLICATION                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │                       REACT FRONTEND (Browser)                     │   │
│  ├────────────────────────────────────────────────────────────────────┤   │
│  │                                                                    │   │
│  │  ┌─────────────────────────────────────────────────────────────┐  │   │
│  │  │              MEDIA PAGE (src/pages/Media.tsx)              │  │   │
│  │  │  ┌──────────────────────────────────────────────────────┐  │  │   │
│  │  │  │ • Gallery View (thumbnails + metadata)               │  │  │   │
│  │  │  │ • Filter/Search controls                             │  │  │   │
│  │  │  │ • Like/Follow buttons                                │  │  │   │
│  │  │  │ • Integrated VideoUploadWithMux                      │  │  │   │
│  │  │  │ • Integrated VideoPlaybackModal                      │  │  │   │
│  │  │  └──────────────────────────────────────────────────────┘  │  │   │
│  │  └─────────────────────────────────────────────────────────────┘  │   │
│  │                                                                    │   │
│  │  ┌─────────────────────────────────────────────────────────────┐  │   │
│  │  │       UPLOAD MODAL (VideoUploadWithMux.tsx)                 │  │   │
│  │  │  ┌──────────────────────────────────────────────────────┐  │  │   │
│  │  │  │ 1. File Selection                                    │  │  │   │
│  │  │  │    └─ Drag-drop + click to upload                   │  │  │   │
│  │  │  │                                                       │  │  │   │
│  │  │  │ 2. Metadata Entry                                    │  │  │   │
│  │  │  │    ├─ Title (required)                               │  │  │   │
│  │  │  │    ├─ Description (optional)                         │  │  │   │
│  │  │  │    └─ Category (optional)                            │  │  │   │
│  │  │  │                                                       │  │  │   │
│  │  │  │ 3. Upload & Process Button                           │  │  │   │
│  │  │  │    ├─ Calls useVideoUpload hook                      │  │  │   │
│  │  │  │    └─ Shows progress bar (0-100%)                    │  │  │   │
│  │  │  │                                                       │  │  │   │
│  │  │  │ 4. Status Display                                    │  │  │   │
│  │  │  │    ├─ "Uploading..." (0-50%)                        │  │  │   │
│  │  │  │    ├─ "Processing with Mux..." (50-99%)             │  │  │   │
│  │  │  │    └─ "Video Processing Complete" (100%)            │  │  │   │
│  │  │  │                                                       │  │  │   │
│  │  │  │ 5. Save & Publish Button                             │  │  │   │
│  │  │  │    └─ Inserts into media_page_content table          │  │  │   │
│  │  │  └──────────────────────────────────────────────────────┘  │  │   │
│  │  └─────────────────────────────────────────────────────────────┘  │   │
│  │                                                                    │   │
│  │  ┌─────────────────────────────────────────────────────────────┐  │   │
│  │  │     VIDEO PLAYER MODAL (VideoPlaybackModal.tsx)             │  │   │
│  │  │  ┌──────────────────────────────────────────────────────┐  │  │   │
│  │  │  │ MuxPlayer Component                                  │  │  │   │
│  │  │  │ ├─ Loads Mux Player web component                   │  │  │   │
│  │  │  │ ├─ Extracts playback_id from stream URL            │  │  │   │
│  │  │  │ ├─ Full player controls:                            │  │  │   │
│  │  │  │ │  ├─ Play/Pause                                    │  │  │   │
│  │  │  │ │  ├─ Progress bar (seeking)                        │  │  │   │
│  │  │  │ │  ├─ Volume control                                │  │  │   │
│  │  │  │ │  ├─ Fullscreen                                    │  │  │   │
│  │  │  │ │  ├─ Picture-in-Picture                            │  │  │   │
│  │  │  │ │  ├─ Captions (if available)                       │  │  │   │
│  │  │  │ │  └─ Settings (quality, speed)                     │  │  │   │
│  │  │  │ └─ Adaptive bitrate streaming (HLS/DASH)            │  │  │   │
│  │  │  │                                                       │  │  │   │
│  │  │  │ Video Metadata                                       │  │  │   │
│  │  │  │ ├─ Title, Creator, Description                      │  │  │   │
│  │  │  │ ├─ Views, Likes, Duration                           │  │  │   │
│  │  │  │ └─ Like & Follow buttons                            │  │  │   │
│  │  │  └──────────────────────────────────────────────────────┘  │  │   │
│  │  └─────────────────────────────────────────────────────────────┘  │   │
│  │                                                                    │   │
│  │  ┌─────────────────────────────────────────────────────────────┐  │   │
│  │  │                   HOOKS & UTILITIES                         │  │   │
│  │  ├─────────────────────────────────────────────────────────────┤  │   │
│  │  │ • useVideoUpload - Upload orchestration                    │  │   │
│  │  │ • useMediaPageContent - Content queries                    │  │   │
│  │  │ • useMediaPageLike - Like functionality                    │  │   │
│  │  │ • useMediaPageFollow - Follow functionality                │  │   │
│  │  │ • useAuth - Authentication context                         │  │   │
│  │  └─────────────────────────────────────────────────────────────┘  │   │
│  │                                                                    │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│                              ⬇️ API Calls ⬇️                              │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                          SUPABASE BACKEND                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │              SUPABASE CLIENT LIBRARY (@supabase/supabase-js)       │   │
│  │  ├─ Authentication (Sign in/up, sessions)                         │   │
│  │  ├─ Database queries (SELECT, INSERT, UPDATE, DELETE)             │   │
│  │  ├─ Real-time subscriptions (listen to changes)                   │   │
│  │  └─ Edge Functions invocation                                     │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │                    EDGE FUNCTIONS (Deno Runtime)                   │   │
│  ├────────────────────────────────────────────────────────────────────┤   │
│  │                                                                    │   │
│  │  ┌──────────────────────────────────────────────────────────────┐ │   │
│  │  │ Function: get-signed-upload-url                             │ │   │
│  │  │ ├─ Receives: filename, contentType                          │ │   │
│  │  │ ├─ Logic:                                                   │ │   │
│  │  │ │  1. Initialize S3 client (Backblaze B2)                 │ │   │
│  │  │ │  2. Create PutObjectCommand                             │ │   │
│  │  │ │  3. Generate signed URL (valid 15 min)                  │ │   │
│  │  │ ├─ Returns: { signedUrl }                                 │ │   │
│  │  │ └─ Usage: Frontend uses this URL to upload directly to B2  │ │   │
│  │  └──────────────────────────────────────────────────────────────┘ │   │
│  │                                                                    │   │
│  │  ┌──────────────────────────────────────────────────────────────┐ │   │
│  │  │ Function: process-new-video                                 │ │   │
│  │  │ ├─ Receives: filename, userId                              │ │   │
│  │  │ ├─ Logic:                                                   │ │   │
│  │  │ │  1. Create GET signed URL for B2 file                   │ │   │
│  │  │ │  2. Call Mux API to create asset                        │ │   │
│  │  │ │     └─ Returns asset_id for this video                  │ │   │
│  │  │ │  3. Insert record into video_uploads table              │ │   │
│  │  │ │     └─ Status: 'processing'                             │ │   │
│  │  │ ├─ Returns: Mux asset data (including asset_id)           │ │   │
│  │  │ └─ Usage: Frontend waits for playback_id update via webhook │ │   │
│  │  └──────────────────────────────────────────────────────────────┘ │   │
│  │                                                                    │   │
│  │  ┌──────────────────────────────────────────────────────────────┐ │   │
│  │  │ Function: mux-webhook-handler                               │ │   │
│  │  │ ├─ Triggered by: Mux webhook (when video.asset.ready)      │ │   │
│  │  │ ├─ Receives: { type, data: { id, playback_ids } }          │ │   │
│  │  │ ├─ Logic:                                                   │ │   │
│  │  │ │  1. Check event type                                     │ │   │
│  │  │ │  2. Extract playback_id from Mux response                │ │   │
│  │  │ │  3. Update video_uploads table:                          │ │   │
│  │  │ │     └─ SET playback_id, status='ready'                   │ │   │
│  │  │ ├─ Returns: { status: 'success' }                          │ │   │
│  │  │ └─ Impact: Frontend polling detects status change          │ │   │
│  │  └──────────────────────────────────────────────────────────────┘ │   │
│  │                                                                    │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │                         DATABASE TABLES                            │   │
│  ├────────────────────────────────────────────────────────────────────┤   │
│  │                                                                    │   │
│  │  ┌──────────────────────────────────────────────────────────────┐ │   │
│  │  │ TABLE: video_uploads (STAGING)                              │ │   │
│  │  │ ├─ Columns:                                                 │ │   │
│  │  │ │  ├─ id (UUID, primary key)                              │ │   │
│  │  │ │  ├─ user_id (UUID, foreign key)                         │ │   │
│  │  │ │  ├─ filename (text)                                     │ │   │
│  │  │ │  ├─ b2_url (text)                                       │ │   │
│  │  │ │  ├─ asset_id (text) ← From Mux                         │ │   │
│  │  │ │  ├─ playback_id (text) ← From Mux webhook               │ │   │
│  │  │ │  ├─ status (text) ← 'pending','processing','ready','failed'│ │   │
│  │  │ │  └─ created_at (timestamp)                              │ │   │
│  │  │ ├─ Purpose: Track upload/encoding progress                 │ │   │
│  │  │ └─ Cleanup: Auto-deleted after save to media_page_content  │ │   │
│  │  └──────────────────────────────────────────────────────────────┘ │   │
│  │                                                                    │   │
│  │  ┌──────────────────────────────────────────────────────────────┐ │   │
│  │  │ TABLE: media_page_content (FINAL)                           │ │   │
│  │  │ ├─ Columns:                                                 │ │   │
│  │  │ │  ├─ id (UUID)                                            │ │   │
│  │  │ │  ├─ user_id (UUID)                                       │ │   │
│  │  │ │  ├─ title (text)                                         │ │   │
│  │  │ │  ├─ creator (text)                                       │ │   │
│  │  │ │  ├─ description (text)                                   │ │   │
│  │  │ │  ├─ thumbnail_url (text)                                 │ │   │
│  │  │ │  ├─ content_url (text) ← Mux stream URL                  │ │   │
│  │  │ │  ├─ status (text) ← 'draft','published','archived'       │ │   │
│  │  │ │  ├─ type (text) ← 'music-video','movie',etc.             │ │   │
│  │  │ │  ├─ category (text)                                      │ │   │
│  │  │ │  ├─ views_count (int)                                    │ │   │
│  │  │ │  ├─ like_count (int)                                     │ │   │
│  │  │ │  └─ created_at, updated_at (timestamp)                   │ │   │
│  │  │ ├─ Purpose: Final published content                         │ │   │
│  │  │ └─ RLS: Authenticated can insert/update own content         │ │   │
│  │  └──────────────────────────────────────────────────────────────┘ │   │
│  │                                                                    │   │
│  │  ┌──────────────────────────────────────────────────────────────┐ │   │
│  │  │ Other Tables (for context):                                 │ │   │
│  │  │ ├─ media_page_likes (likes on videos)                       │ │   │
│  │  │ ├─ media_page_follows (creator followers)                   │ │   │
│  │  │ ├─ profiles (user info)                                     │ │   │
│  │  │ └─ auth.users (authentication)                              │ │   │
│  │  └──────────────────────────────────────────────────────────────┘ │   │
│  │                                                                    │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ⬇️ External APIs ⬇️
┌─────────────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL SERVICES                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │           BACKBLAZE B2 (Cloud Storage - S3 Compatible)             │   │
│  │                                                                    │   │
│  │  Flow:                                                             │   │
│  │  1. Frontend requests signed URL from Edge Function               │   │
│  │  2. Edge Function generates signed URL (valid 15 min)            │   │
│  │  3. Frontend uploads file directly to B2 (HTTPS PUT)             │   │
│  │  4. B2 stores file in secure bucket                              │   │
│  │  5. Mux later accesses file via this same URL                    │   │
│  │                                                                    │   │
│  │  URL Format:                                                       │   │
│  │  https://s3.us-west-000.backblazeb2.com/bucket-name/file         │   │
│  │                                                                    │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │            MUX (Video Encoding & Streaming Platform)               │   │
│  │                                                                    │   │
│  │  Flow:                                                             │   │
│  │  1. Edge Function calls Mux API with B2 file URL                 │   │
│  │  2. Mux creates asset and starts encoding                        │   │
│  │     └─ Returns asset_id immediately                              │   │
│  │  3. Mux encodes video into multiple bitrates (1-5 min)           │   │
│  │  4. When complete, Mux sends webhook to Edge Function            │   │
│  │  5. Edge Function updates database with playback_id              │   │
│  │  6. Frontend detects status change (polling/polling)             │   │
│  │  7. User can save & publish                                      │   │
│  │  8. Frontend plays video using Mux Player (HLS/DASH)             │   │
│  │                                                                    │   │
│  │  Streaming URLs:                                                   │   │
│  │  └─ https://stream.mux.com/{playback-id}.m3u8 (HLS)              │   │
│  │                                                                    │   │
│  │  Thumbnail URL:                                                    │   │
│  │  └─ https://image.mux.com/{playback-id}/thumbnail.jpg            │   │
│  │                                                                    │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Sequence Diagram

```
USER                 FRONTEND           SUPABASE            B2             MUX
 │                     │                  │                 │              │
 │─ Click Upload Video─>│                  │                 │              │
 │                     │                  │                 │              │
 │                     │─ Invoke Edge Fn ─>│                 │              │
 │                     │ (get-signed-url) │                 │              │
 │                     │<─ Signed URL ────│                 │              │
 │                     │                  │                 │              │
 │                     │─ PUT (file) ────────────────────────>│             │
 │                     │                  │                 │              │
 │                     │<─ 200 OK ─────────────────────────────             │
 │                     │                  │                 │              │
 │                     │─ Invoke Edge Fn ─>│                 │              │
 │                     │ (process-new-video)               │              │
 │                     │                  │                 │              │
 │                     │                  │─ Get signed URL ─────────────>│
 │                     │                  │<─ B2 URL ─────────────────────│
 │                     │                  │                 │              │
 │                     │                  │                 │─ Create asset│
 │                     │                  │                 │  (start enc) │
 │                     │                  │                 │<─ asset_id ─│
 │                     │<─ asset_id ──────│<─ insert record             
 │                     │                  │  (status: processing)
 │                     │                  │                 │              │
 │ (Show Progress)    │                  │                 │    Encoding  │
 │                     │─ Poll status ───>│                 │      ...     │
 │                     │<─ processing ────│                 │              │
 │                     │                  │                 │              │
 │ (Wait 1-5 min)     │─ Poll status ───>│                 │              │
 │                     │<─ processing ────│                 │              │
 │                     │                  │                 │              │
 │                     │                  │                 │   Encoding   │
 │                     │                  │                 │    done!     │
 │                     │                  │<─────── Webhook (asset ready)─│
 │                     │                  │                 │              │
 │                     │                  │─ Update record ─│              │
 │                     │                  │  (status: ready,│              │
 │                     │                  │   playback_id)  │              │
 │                     │                  │                 │              │
 │ (Show ready)       │─ Poll status ───>│                 │              │
 │                     │<─ ready ────────│                 │              │
 │                     │                  │                 │              │
 │─ Click Save ───────>│                  │                 │              │
 │                     │─ INSERT video ──>│                 │              │
 │                     │ (media_page_content)              │              │
 │                     │<─ id ────────────│                 │              │
 │                     │                  │                 │              │
 │ (Video in gallery) │                  │                 │              │
 │                     │                  │                 │              │
 │─ Click Play ───────>│                  │                 │              │
 │                     │─ Fetch record ──>│                 │              │
 │                     │<─ content_url ──│                 │              │
 │                     │                  │                 │              │
 │                     │─ Load Mux Player with playback_id──────────────>│
 │                     │<─────────── HLS Stream ──────────────────────────│
 │ (Video plays) <────│<─ Video chunks from Mux CDN ──────────────────────│
 │                     │                  │                 │              │
```

---

## Component Hierarchy

```
App
├── AuthProvider
│   └── Media Page
│       ├── Filter & Search Controls
│       ├── Content Gallery
│       │   └── ContentCard (repeated)
│       │       └── Thumbnail + Metadata
│       │
│       ├── VideoPlaybackModal (conditional)
│       │   ├── Close Button
│       │   ├── MuxPlayer Component
│       │   │   ├── Mux web component
│       │   │   ├── Duration tracking
│       │   │   └── View tracking
│       │   └── Metadata Display
│       │       ├── Title
│       │       ├── Creator Info
│       │       ├── Description
│       │       └── Action Buttons (Like, Follow, Share)
│       │
│       └── VideoUploadWithMux Component
│           ├── Upload Button
│           └── Upload Modal
│               ├── File Selection (Drag & Drop)
│               ├── Title Input
│               ├── Description Input
│               ├── Category Select
│               ├── Upload Progress Display
│               ├── Status Messages
│               ├── Error Display
│               └── Action Buttons (Upload & Process, Save & Publish)
```

---

## Database Schema Relationships

```
auth.users (Supabase Auth)
    │
    ├─ Foreign Key
    │
    └─> profiles (User info)
    │
    ├─ Foreign Key
    │
    └─> video_uploads (Staging - in progress uploads)
    │       │
    │       └─> (After save)
    │           media_page_content (Published videos)
    │               │
    │               ├─ media_page_likes
    │               │
    │               └─ media_page_follows
```

---

## Technology Stack

```
Frontend
├── React 18.3.1
├── TypeScript
├── React Router
├── Lucide React (icons)
├── Tailwind CSS
└── Mux Player (web component)

Backend
├── Supabase (BaaS)
│   ├── PostgreSQL Database
│   ├── Edge Functions (Deno)
│   ├── Real-time Subscriptions
│   ├── Row Level Security (RLS)
│   └── Authentication
│
├── External APIs
│   ├── Backblaze B2 (S3-compatible storage)
│   └── Mux (video encoding & streaming)
```

---

## Complete Upload Lifecycle

```
1. USER UPLOADS VIDEO
   ├─ Selects file
   ├─ Fills metadata
   └─ Clicks "Upload & Process"

2. FRONTEND UPLOADS TO B2
   ├─ Calls get-signed-upload-url
   ├─ Gets signed URL (15 min validity)
   ├─ PUT request directly to B2
   └─ Shows upload progress

3. FRONTEND TRIGGERS MUX ENCODING
   ├─ Calls process-new-video
   ├─ Edge Function creates Mux asset
   ├─ Mux starts encoding
   ├─ Record inserted into video_uploads (status: processing)
   └─ Mux returns asset_id

4. MUX ENCODES VIDEO
   ├─ Creates multiple bitrate versions
   ├─ Generates thumbnail
   ├─ Generates manifest files (HLS/DASH)
   └─ Takes 1-5 minutes (depending on size)

5. MUX SENDS WEBHOOK
   ├─ Fires video.asset.ready event
   ├─ Includes playback_id
   └─ Sends to mux-webhook-handler

6. EDGE FUNCTION UPDATES DATABASE
   ├─ Receives webhook from Mux
   ├─ Extracts playback_id
   ├─ Updates video_uploads table
   │   ├─ SET playback_id = {value}
   │   └─ SET status = 'ready'
   └─ Logs success

7. FRONTEND DETECTS STATUS CHANGE
   ├─ Polling detects status = 'ready'
   ├─ Stops polling
   └─ Shows "Video Processing Complete"

8. USER SAVES & PUBLISHES
   ├─ Clicks "Save & Publish"
   ├─ Frontend inserts into media_page_content
   │   ├─ title
   │   ├─ description
   │   ├─ category
   │   ├─ thumbnail_url (from Mux)
   │   ├─ content_url (Mux stream URL)
   │   └─ status = 'published'
   └─ Record created with id

9. VIDEO APPEARS IN GALLERY
   ├─ Thumbnail visible
   ├─ Play button appears
   ├─ Real-time subscription updates UI
   └─ Ready for viewing

10. USER PLAYS VIDEO
    ├─ Clicks play
    ├─ Opens VideoPlaybackModal
    ├─ Extracts playback_id from content_url
    ├─ Loads Mux Player
    ├─ Mux Player requests stream from Mux CDN
    ├─ Gets adaptive bitrate HLS/DASH stream
    └─ User watches with full controls
```

---

This architecture ensures:
- **Fast uploads** (direct to B2, no server bottleneck)
- **Professional encoding** (Mux handles all video processing)
- **Scalable streaming** (CDN-backed HLS/DASH)
- **Real-time updates** (webhooks + polling)
- **Security** (signed URLs, RLS policies)
- **User experience** (smooth UI, progress tracking)
