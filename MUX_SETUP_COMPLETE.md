# Mux + Backblaze B2 Integration - Complete Setup Guide

## ✅ What's Been Implemented

### Frontend Components
1. **`MuxPlayer.tsx`** - Replaces Plyr with native Mux Player
2. **`VideoUploadWithMux.tsx`** - Complete video upload UI
3. **`VideoPlaybackModal.tsx`** - Updated to use Mux Player
4. **`Media.tsx`** - Integrated VideoUploadWithMux component

### Backend (Already Deployed)
1. **Supabase Edge Functions** (3 functions):
   - `get-signed-upload-url` - B2 upload signing
   - `process-new-video` - Mux encoding trigger
   - `mux-webhook-handler` - Webhook listener

2. **Database**:
   - `video_uploads` - Staging table
   - `media_page_content` - Published videos table

3. **Hooks**:
   - `useVideoUpload` - Upload orchestration
   - `useMediaPageContent` - Content management

---

## 🚀 What You Need to Do Now

### Step 1: Update package.json (Install Mux Player)

```bash
npm install @mux/mux-player
# or
yarn add @mux/mux-player
```

### Step 2: Add Mux Player Script to HTML Head

Edit `index.html` and add this in the `<head>` section:

```html
<script async src="https://cdn.jsdelivr.net/npm/@mux/mux-player"></script>
```

Complete example:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>FlourishTalents</title>
    <!-- Mux Player Script -->
    <script async src="https://cdn.jsdelivr.net/npm/@mux/mux-player"></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### Step 3: Verify Supabase Functions Are Deployed

Run these commands to verify:
```bash
supabase functions list
```

You should see:
- ✅ get-signed-upload-url
- ✅ process-new-video
- ✅ mux-webhook-handler

### Step 4: Verify Database Table Exists

In Supabase Dashboard → SQL Editor, run:
```sql
SELECT * FROM public.video_uploads LIMIT 1;
```

Should return a table with columns: id, user_id, filename, b2_url, asset_id, playback_id, status, created_at, final_content_id

### Step 5: Configure Mux Webhook (One-time setup)

1. Go to **Mux Dashboard** → **Settings** → **Webhooks**
2. Click **Create Webhook**
3. **URL**: `https://<your-project-ref>.supabase.co/functions/v1/mux-webhook-handler`
4. **Select events**: `video.asset.ready`, `video.asset.errored`
5. Copy the **Signing Secret**
6. In Supabase Dashboard → **Settings** → **Edge Functions** → **Environment Variables**
7. Add: `MUX_WEBHOOK_SECRET` = (paste the signing secret)

---

## 🎯 How the Media Page Works Now

### User Flow:

1. **User clicks "Upload Video"** button (bottom-right)
   - Purple button with film icon
   - Appears when logged in

2. **Select & Upload Video**
   - Drag-and-drop or click to select
   - Max 500MB
   - Formats: MP4, WebM, MOV, AVI

3. **Fill Details**
   - Title (required)
   - Description (optional)
   - Category (optional)

4. **Click "Upload & Process"**
   - Uploads to Backblaze B2
   - Triggers Mux encoding
   - Shows progress bar (0-100%)

5. **Wait for Processing**
   - Mux encodes video (1-5 minutes)
   - Component auto-polls every 5 seconds
   - Shows "Video Processing Complete" when ready

6. **Click "Save & Publish"**
   - Saves metadata to media_page_content
   - Video appears in Media gallery immediately
   - Playable via Mux Player

### Playback Flow:

1. **User clicks play on a video**
   - Opens VideoPlaybackModal
   - Extracts playback ID from Mux stream URL
   - Loads Mux Player with HLS/DASH support

2. **Full Mux Player Features**
   - Play/Pause
   - Progress bar seeking
   - Volume control
   - Fullscreen
   - Picture-in-Picture
   - Adaptive bitrate streaming
   - Captions support (if available)

---

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERFACE (React)                   │
│                   (Media.tsx Page)                          │
├──────────────┬──────────────────────┬──────────────────────┤
│ Gallery View │ Video Player (Mux)   │ Upload Modal (Mux)  │
│ (thumbnails) │ (VideoPlaybackModal) │ (VideoUploadWithMux)│
└──────────────┴──────────────────────┴──────────────────────┘
                          ↓
        ┌─────────────────────────────────┐
        │  Supabase Client (SDK)          │
        │  - Auth                         │
        │  - Database queries             │
        │  - Edge Function invocation     │
        └─────────────────────────────────┘
                          ↓
     ┌────────────────────────────────────────────────┐
     │         SUPABASE EDGE FUNCTIONS                │
     ├────────────────────────────────────────────────┤
     │ 1. get-signed-upload-url                       │
     │    └─→ Returns signed B2 URL (15 min)          │
     │                                                │
     │ 2. process-new-video                           │
     │    ├─→ Creates Mux asset (starts encoding)     │
     │    └─→ Inserts record in video_uploads         │
     │                                                │
     │ 3. mux-webhook-handler                         │
     │    └─→ Updates video_uploads with playback_id  │
     └────────────────────────────────────────────────┘
                          ↓
     ┌────────────────────────────────────────────────┐
     │            EXTERNAL SERVICES                   │
     ├────────────────────────────────────────────────┤
     │ • Backblaze B2 (file storage)                  │
     │ • Mux (video encoding & streaming)             │
     │ • Supabase PostgreSQL (metadata)               │
     └────────────────────────────────────────────────┘
```

---

## 📁 File Structure

```
src/
├── pages/
│   └── Media.tsx                    ← Integrated VideoUploadWithMux
├── components/
│   ├── MuxPlayer.tsx                ← NEW: Mux video player
│   ├── VideoUploadWithMux.tsx        ← NEW: Upload interface
│   ├── VideoPlaybackModal.tsx        ← UPDATED: Uses Mux Player
│   └── VideoPlayer.tsx              ← OLD: Can be removed (using plyr)
├── hooks/
│   ├── useVideoUpload.ts            ← NEW: Upload orchestration
│   └── useMediaPageContent.ts       ← NEW: Content queries
└── lib/
    └── supabase.ts                  ← UPDATED: Added VideoUpload interface
```

---

## 🔧 Configuration Summary

### Environment Variables (Supabase Edge Functions)
All already configured. Just verify they exist:
- `B2_KEY_ID`
- `B2_APPLICATION_KEY`
- `B2_S3_ENDPOINT`
- `B2_BUCKET_NAME`
- `MUX_TOKEN_ID`
- `MUX_TOKEN_SECRET`
- `MUX_WEBHOOK_SECRET` (add if missing)
- `SUPABASE_URL` (auto-injected)
- `SUPABASE_SERVICE_ROLE_KEY` (auto-injected)

### Mux Stream URL Format
```
https://stream.mux.com/{PLAYBACK_ID}.m3u8
```

### Mux Thumbnail URL
```
https://image.mux.com/{PLAYBACK_ID}/thumbnail.jpg
```

---

## ✨ Features

✅ **Upload**
- Direct-to-B2 uploads (no server overhead)
- Drag-and-drop support
- File validation (type & size)
- Real-time progress tracking

✅ **Encoding**
- Automatic Mux encoding
- HLS/DASH streaming ready
- Adaptive bitrate

✅ **Playback**
- Native Mux Player
- Fullscreen support
- PiP (Picture-in-Picture)
- Captions ready
- Progress seeking
- Volume control

✅ **Database**
- Staging table for processing status
- Final published content table
- Real-time updates
- Like/follow tracking

---

## 🐛 Troubleshooting

### Video upload fails immediately
**Solution**: 
1. Check browser console for error message
2. Verify Edge Functions are deployed: `supabase functions list`
3. Verify B2 credentials in Supabase Dashboard

### "Processing..." status never completes
**Solution**:
1. Check Mux Dashboard for asset encoding status
2. Verify webhook is properly configured
3. Check Supabase logs for webhook errors

### Mux Player shows as blank
**Solution**:
1. Verify Mux Player script loaded: Check `<script>` tag in index.html
2. Verify playback_id is correct format (alphanumeric, no slashes)
3. Check browser console for script loading errors

### Video appears in media_page_content but won't play
**Solution**:
1. Verify content_url has correct format: `https://stream.mux.com/{playback_id}.m3u8`
2. Check that playback_id is not null in database
3. Verify Mux Player is loaded in VideoPlaybackModal

### Webhook not updating status
**Solution**:
1. Go to Mux Dashboard → Settings → Webhooks → View logs
2. Verify webhook URL is correct: `https://<project-ref>.supabase.co/functions/v1/mux-webhook-handler`
3. Check that MUX_WEBHOOK_SECRET matches in Supabase
4. Verify video_uploads table exists in Supabase

---

## 📱 Browser Compatibility

Mux Player supports:
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers

---

## 📚 Useful Links

- **Mux Player Docs**: https://docs.mux.com/guides/web/mux-player
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions
- **Backblaze B2**: https://www.backblaze.com/b2/cloud-storage.html

---

## 🎬 Quick Start Checklist

- [ ] Install @mux/mux-player: `npm install @mux/mux-player`
- [ ] Add Mux script to `index.html` head
- [ ] Run `supabase functions list` to verify deployment
- [ ] Configure Mux webhook (if not already done)
- [ ] Test upload in Media page
- [ ] Check video in media_page_content table
- [ ] Verify video plays in gallery

---

## 🚀 You're Ready!

The Media page now has:
1. ✅ Video upload with progress tracking
2. ✅ Automatic Mux encoding
3. ✅ Mux Player for playback
4. ✅ Full Supabase integration
5. ✅ Webhook status updates

**To test:**
1. Go to Media page
2. Click "Upload Video" button
3. Select a test video (under 500MB)
4. Wait for processing
5. Video should appear in gallery

Enjoy! 🎉
