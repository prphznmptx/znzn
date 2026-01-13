# Private to Public B2 Bucket Migration Guide

## 1. FILES RESPONSIBLE FOR MASTERCLASS THUMBNAILS

### **Thumbnail Display Chain:**
```
Masterclass.tsx (line 1667)
  └─> Uses: course.thumbnail_url
      └─> Stored in: masterclass_page_content.thumbnail_url
          └─> Set by: VideoUploadWithMuxForMasterclass.tsx
```

### **File-by-File Breakdown:**

| File | Responsibility | Change Required |
|------|---|---|
| `src/pages/Masterclass.tsx` | Displays thumbnail from DB | ✅ No change (displays public URLs) |
| `src/components/VideoUploadWithMuxForMasterclass.tsx` | Calls edge functions to upload & process | ✅ No change needed |
| `supabase/functions/upload-to-b2/index.ts` | Returns public URL | ✅ Already correct for public bucket |
| `supabase/functions/process-masterclass-video/index.ts` | **Creates signed URL for Mux** | 🔴 **MUST CHANGE** |
| `supabase/functions/process-new-video/index.ts` | **Creates signed URL for Mux** | 🔴 **MUST CHANGE** |
| `supabase/functions/get-signed-upload-url/index.ts` | Generates signed upload URLs | ⚠️ **Can be deprecated** |
| `supabase/functions/mux-webhook-handler/index.ts` | Updates playback_id | ✅ No change |

---

## 2. PRIVATE BUCKET MECHANISMS TO REMOVE/ADJUST

### **Critical: Signed URL Generation (2 functions)**

#### **Problem:**
- **`process-masterclass-video/index.ts` (line 57-59)**
  ```typescript
  const signedReadUrl = await getSignedUrl(s3, command, {
    expiresIn: 900  // 15-minute expiration
  });
  ```
  This creates a temporary signed URL that **expires after 15 minutes**. Mux tries to download the video, but if processing takes longer than 15 minutes or Mux retries after expiration, it fails.

- **`process-new-video/index.ts` (line 48-50)** - Same issue

#### **Why This Fails with Private Buckets:**
- Private bucket files are **inaccessible without signed URLs**
- Signed URLs have **time limits** (15 minutes)
- Mux's retry logic might exceed this window
- Thumbnails also get "undefined" errors when displaying

#### **Solution for Public Bucket:**
Replace signed URL with **direct public URL** to the B2 file:
```typescript
// BEFORE (private bucket with signed URL):
const signedReadUrl = await getSignedUrl(s3, command, { expiresIn: 900 });
// URL: expires after 15 minutes, fails on retry

// AFTER (public bucket with direct URL):
const publicB2Url = `${B2_PUBLIC_URL}/${B2_BUCKET_NAME}/${filename}`;
// URL: permanent, no expiration, Mux can retry anytime
```

---

### **Secondary: Signed Upload URLs (can be removed)**

#### **`get-signed-upload-url/index.ts`:**
- Currently generates 15-minute signed upload URLs for client-side uploads
- **With public bucket:** Client can upload directly to B2 without needing signed URLs
- **Current flow is still valid** but no longer strictly necessary
- **Recommendation:** Keep this for now (provides auth layer), migrate later if needed

---

### **Tertiary: CORS Headers (keep as-is)**

#### **`upload-to-b2/index.ts` and both `process-*` functions:**
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
```
- **Status:** KEEP THESE
- **Reason:** CORS headers are still needed for edge function → browser communication
- These are NOT specific to private buckets

---

## 3. DETAILED IMPLEMENTATION CHANGES

### **Change 1: Update `process-masterclass-video/index.ts`**

**Remove:** Lines 57-59 (signed URL generation)
**Add:** Direct public URL construction

```typescript
// REMOVE THIS:
// const signedReadUrl = await getSignedUrl(s3, command, {
//   expiresIn: 900
// });

// ADD THIS INSTEAD:
const publicB2Url = `${B2_PUBLIC_URL}/${B2_BUCKET_NAME}/${filename}`;

// THEN USE IT FOR MUX:
const muxResponse = await fetch("https://api.mux.com/video/v1/assets", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Basic " + btoa(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`)
  },
  body: JSON.stringify({
    input: { url: publicB2Url },  // Use public URL instead of signed URL
    playback_policy: ["public"]
  })
});
```

**Also remove:** Lines 1-2 (no longer need signed URL import)
```typescript
// REMOVE:
// import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner";
```

---

### **Change 2: Update `process-new-video/index.ts`**

**Identical change** as above:
- Remove `getSignedUrl` import (line 2)
- Replace signed URL generation with direct public URL (lines 48-50)
- Update Mux request to use public URL

---

### **Change 3: `get-signed-upload-url/index.ts`** (Optional)

**Current Status:** Can stay as-is OR be deprecated

**If keeping:**
- ✅ No changes needed
- ✅ Still provides auth layer for uploads
- ✅ Compatible with public bucket

**If deprecating:**
- Remove edge function entirely
- Update client code to upload directly to B2
- Handle CORS at bucket level instead

---

## 4. BUCKET CONFIGURATION REQUIREMENTS

### **Environment Variables (already configured):**
```
B2_KEY_ID=your-key-id
B2_APPLICATION_KEY=your-secret
B2_S3_ENDPOINT=https://s3.eu-central-003.backblazeb2.com
B2_BUCKET_NAME=your-new-public-bucket-name
B2_PUBLIC_URL=https://s3.eu-central-003.backblazeb2.com
```

### **B2 Console Settings:**
1. **Create new public bucket** in B2 console
2. **Bucket name:** e.g., `your-project-public`
3. **Type:** Public (not private)
4. **File Lock:** Off (optional)
5. **Update B2_BUCKET_NAME** environment variable

### **CORS Configuration (B2 Console):**
```json
{
  "corsRules": [
    {
      "allowedOperations": ["b2_get_file_info", "b2_read_file", "b2_list_file_versions"],
      "allowedHeaders": ["Range", "Authorization"],
      "allowedOrigins": ["*"],
      "maxAgeSeconds": 3600
    }
  ]
}
```

---

## 5. THUMBNAIL URL FIX IN DATABASE

Your SQL already handles this:
```sql
UPDATE masterclass_page_content
SET thumbnail_url = REGEXP_REPLACE(
    thumbnail_url,
    'https://prestablaze\.s3\.(s3\.)?eu-central-003\.backblazeb2\.com/',
    'https://s3.eu-central-003.backblazeb2.com/prestablaze/'
)
WHERE thumbnail_url LIKE 'https://prestablaze.s3.%eu-central-003.backblazeb2.com/%';
```

**This fixes malformed URLs** from the transition period.

---

## 6. WHAT STAYS THE SAME

✅ **Video display in Mux player** - No changes needed
✅ **Webhook handler** - No changes needed  
✅ **Database structure** - No changes needed
✅ **RLS policies** - No changes needed
✅ **Thumbnail storage in DB** - No changes needed
✅ **CORS headers in edge functions** - Keep as-is
✅ **Client code** - No changes needed

---

## 7. TESTING CHECKLIST

After implementation:

- [ ] New masterclass video uploads complete
- [ ] Mux processing completes successfully (no timeouts)
- [ ] Thumbnails display without 404 errors
- [ ] Playback works in VideoPlaybackModal
- [ ] No "undefined" in thumbnail URLs
- [ ] Video list loads thumbnails correctly
- [ ] Edit/Delete operations still work
- [ ] Old videos (if migrated) display properly

---

## 8. ROLLBACK PLAN

If issues occur:

1. Keep old private bucket for 30 days
2. Revert edge function code (restore signed URLs)
3. Update B2_BUCKET_NAME back to old bucket
4. Re-deploy edge functions

---

## Summary of Changes

| Component | Current (Private) | New (Public) | Effort |
|---|---|---|---|
| Bucket access | Signed URLs required | Direct public URLs | Low |
| Mux video input | Signed URL (expires in 15 min) | Public URL (permanent) | Low |
| File access | Restricted to signed URL holders | Public read access | Low |
| Thumbnail display | Fails on expired URLs | Always works | Low |
| Edge functions | 3 functions with signed URL logic | 2 functions (simplified) | Low |

**Total Implementation Time:** 30-45 minutes
**Risk Level:** Low (additive change, doesn't break existing system)
