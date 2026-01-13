# 🚀 Mux Integration - Quick Start Reference

## 1️⃣ Install Package
```bash
npm install @mux/mux-player
```

## 2️⃣ Start Dev Server
```bash
npm run dev
```

## 3️⃣ Test in Browser
1. Go to **Media page**
2. Click **"Upload Video"** button (purple, bottom-right)
3. Select video file (MP4, WebM, MOV, AVI - max 500MB)
4. Fill title (required) + description/category (optional)
5. Click **"Upload & Process"**
6. Wait for "Video Processing Complete" (1-5 min)
7. Click **"Save & Publish"**
8. Video appears in gallery - click play to test

## 4️⃣ Configure Mux Webhook (Important!)
1. Mux Dashboard → Settings → Webhooks → Create New
2. URL: `https://<project-ref>.supabase.co/functions/v1/mux-webhook-handler`
3. Select events: `video.asset.ready`, `video.asset.errored`
4. Copy Signing Secret
5. Supabase Dashboard → Settings → Edge Functions → Environment Variables
6. Add: `MUX_WEBHOOK_SECRET` = (paste secret)

## 📁 Key Files
- `src/pages/Media.tsx` - Main media page ✓ Updated
- `src/components/MuxPlayer.tsx` - Video player ✓ Created
- `src/components/VideoUploadWithMux.tsx` - Upload UI ✓ Created
- `src/hooks/useVideoUpload.ts` - Upload logic ✓ Created
- `src/components/VideoPlaybackModal.tsx` - Playback modal ✓ Updated
- `index.html` - Mux script ✓ Updated

## 🔧 Environment Variables (Already Set)
All B2 and Mux credentials are already configured in Supabase:
- `B2_KEY_ID`
- `B2_APPLICATION_KEY`
- `B2_S3_ENDPOINT`
- `B2_BUCKET_NAME`
- `MUX_TOKEN_ID`
- `MUX_TOKEN_SECRET`

Just add: `MUX_WEBHOOK_SECRET` (from webhook config)

## ✅ Checklist
- [ ] `npm install @mux/mux-player`
- [ ] `npm run dev`
- [ ] Test video upload (< 50MB recommended)
- [ ] Configure Mux webhook
- [ ] Verify video plays
- [ ] Test player controls

## 🆘 Quick Fixes

**Video upload button not showing?**
→ Make sure you're logged in

**Upload fails?**
→ Check browser console, verify file < 500MB

**Video stuck processing?**
→ Configure Mux webhook (Step 4 above)

**Mux Player blank?**
→ Check Mux Player script in index.html

**Video won't play?**
→ Verify playback_id in media_page_content table

## 📊 URL Formats
```
Stream: https://stream.mux.com/{playback-id}.m3u8
Image:  https://image.mux.com/{playback-id}/thumbnail.jpg
```

## 🎯 Core Flow
```
Upload → B2 → Mux Encode → Webhook Update → Publish → Play
```

## 📞 Need Help?
- Check `IMPLEMENTATION_COMPLETE.md` for detailed guide
- Check `MUX_SETUP_COMPLETE.md` for full setup
- Mux docs: https://docs.mux.com
- Supabase docs: https://supabase.com/docs

---

**That's it! You're ready to roll! 🎬**
