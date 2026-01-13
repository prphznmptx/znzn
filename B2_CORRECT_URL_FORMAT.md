# Correct B2 URL Format - Path-Hosted Style

## 🔴 Problem Identified

You were right to question the format. The **correct S3-compatible endpoint for Backblaze B2 uses the path-hosted style**, NOT virtual-hosted style.

### Wrong (What Was Causing Issues)
```
❌ https://prestablaze.s3.eu-central-003.backblazeb2.com/masterclass_page_content/...
❌ https://prestablaze.s3.s3.eu-central-003.backblazeb2.com/masterclass_page_content/... (double s3)
```
- Tries to use bucket name as subdomain
- SSL certificate doesn't cover this format
- Causes `net::ERR_CERT_COMMON_NAME_INVALID`

### Correct (Path-Hosted Style)
```
✅ https://s3.eu-central-003.backblazeb2.com/prestablaze/masterclass_page_content/...
```
- Bucket name is a **path segment**, not a subdomain
- SSL certificate covers the regional endpoint
- This is what Backblaze B2 officially recommends

---

## 🔧 What I Fixed

### 1. Edge Functions Updated
Both edge functions now use the **correct path-hosted style**:

**Before (Wrong)**:
```typescript
// Virtual-hosted style (wrong for B2)
publicUrl = `https://${B2_BUCKET_NAME}.${endpointDomain}/${filename}`;
// Results in: https://prestablaze.s3.eu-central-003.backblazeb2.com/...
```

**After (Correct)**:
```typescript
// Path-hosted style (correct for B2)
publicUrl = `https://${endpointDomain}/${B2_BUCKET_NAME}/${filename}`;
// Results in: https://s3.eu-central-003.backblazeb2.com/prestablaze/...
```

Updated files:
- `supabase/functions/upload-to-b2/index.ts`
- `supabase/functions/process-masterclass-video/index.ts`

### 2. Database Migration
- `database/FIX_B2_URL_FORMAT.sql` - Converts existing URLs from wrong to correct format

---

## 🚀 Implementation Steps

### Step 1: Deploy Updated Edge Functions

```bash
git add supabase/functions/
git commit -m "Use correct B2 S3 path-hosted style URLs"
git push
```

### Step 2: Update B2_PUBLIC_URL Environment Variable

In **Supabase → Project Settings → Edge Functions → Environment Variables**:

**Change FROM:**
```
B2_PUBLIC_URL=https://prestablaze.s3.eu-central-003.backblazeb2.com
```

**Change TO:**
```
B2_PUBLIC_URL=https://s3.eu-central-003.backblazeb2.com
```

**Complete recommended configuration:**
```
B2_KEY_ID=your_key_id
B2_APPLICATION_KEY=your_app_key
B2_S3_ENDPOINT=https://s3.eu-central-003.backblazeb2.com
B2_BUCKET_NAME=prestablaze
B2_PUBLIC_URL=https://s3.eu-central-003.backblazeb2.com
```

### Step 3: Fix Existing URLs in Database

Run this SQL in **Supabase SQL Editor**:

```sql
-- Fix thumbnail URLs
UPDATE public.masterclass_page_content
SET thumbnail_url = REGEXP_REPLACE(
    thumbnail_url,
    'https://prestablaze\.s3\.eu-central-003\.backblazeb2\.com/',
    'https://s3.eu-central-003.backblazeb2.com/prestablaze/'
)
WHERE thumbnail_url LIKE 'https://prestablaze.s3.eu-central-003.backblazeb2.com/%'
   OR thumbnail_url LIKE 'https://prestablaze.s3.s3.eu-central-003.backblazeb2.com/%';

-- Fix video URLs
UPDATE public.masterclass_video_uploads
SET b2_url = REGEXP_REPLACE(
    b2_url,
    'https://prestablaze\.s3\.eu-central-003\.backblazeb2\.com/',
    'https://s3.eu-central-003.backblazeb2.com/prestablaze/'
)
WHERE b2_url LIKE 'https://prestablaze.s3.eu-central-003.backblazeb2.com/%'
   OR b2_url LIKE 'https://prestablaze.s3.s3.eu-central-003.backblazeb2.com/%';

-- Verify
SELECT COUNT(*) as fixed_urls
FROM public.masterclass_page_content 
WHERE thumbnail_url LIKE 'https://s3.eu-central-003.backblazeb2.com/prestablaze/%';
```

### Step 4: Test

1. Go to Masterclass page
2. Open DevTools (F12) → Network tab
3. Check image requests:
   - ✅ Should be: `https://s3.eu-central-003.backblazeb2.com/prestablaze/masterclass_page_content/...`
   - ✅ Status: 200 (not 403 or 404)
   - ✅ No SSL certificate errors

---

## 📊 S3 URL Style Comparison

### Virtual-Hosted Style (AWS S3 Standard)
```
https://bucket-name.s3.region.amazonaws.com/path/to/file
```
- Bucket name in subdomain
- **Works for**: AWS S3
- **Does NOT work for**: Backblaze B2 (SSL cert mismatch)

### Path-Hosted Style (Backblaze B2 Standard)
```
https://s3.region.backblazeb2.com/bucket-name/path/to/file
```
- Bucket name in path
- **Works for**: Backblaze B2, AWS S3 (legacy)
- **Backblaze Recommended**: YES ✅

### Native B2 Format (Alternative)
```
https://f003.backblazeb2.com/file/bucket-name/path/to/file
```
- Backblaze's native format
- Always works but slower

---

## 🎯 Why Path-Hosted Works for B2

The SSL certificate for `s3.eu-central-003.backblazeb2.com` is issued to cover:
- `*.s3.eu-central-003.backblazeb2.com` (wildcard for subdomains)
- OR explicitly listed domains

When you try to use `prestablaze.s3.eu-central-003.backblazeb2.com`, the browser sees:
- Certificate issued for: `s3.eu-central-003.backblazeb2.com`
- URL is trying to access: `prestablaze.s3.eu-central-003.backblazeb2.com`
- Mismatch! → SSL error

But with path-hosted style `https://s3.eu-central-003.backblazeb2.com/prestablaze/...`:
- Certificate issued for: `s3.eu-central-003.backblazeb2.com`
- URL is trying to access: `s3.eu-central-003.backblazeb2.com`
- Perfect match! ✅

---

## ✅ URL Format Examples

### CORRECT Examples (Path-Hosted)
```
✅ https://s3.eu-central-003.backblazeb2.com/prestablaze/masterclass_page_content/12a44762-df97-499a-91d9-11ddd8b6d6a0/1765100246510-image.jpg

✅ https://s3.eu-central-003.backblazeb2.com/prestablaze/masterclass_videos/user-id/1765111543319-video.mp4
```

### WRONG Examples
```
❌ https://prestablaze.s3.eu-central-003.backblazeb2.com/masterclass_page_content/... (virtual-hosted)

❌ https://prestablaze.s3.s3.eu-central-003.backblazeb2.com/masterclass_page_content/... (double s3)

❌ https://s3.eu-central-003.backblazeb2.com/masterclass_page_content/... (missing bucket name)
```

---

## 🔍 Verification Checklist

After applying all changes:

- [ ] Edge functions redeployed
- [ ] B2_PUBLIC_URL changed to `https://s3.eu-central-003.backblazeb2.com`
- [ ] SQL migration executed to convert existing URLs
- [ ] New course uploaded and thumbnail displays correctly
- [ ] DevTools shows `https://s3.eu-central-003.backblazeb2.com/prestablaze/...` URL
- [ ] Image loads with 200 status (no 403/404)
- [ ] No SSL certificate errors in console
- [ ] Old course thumbnails are now displaying

---

## 🚨 Important Note

The Backblaze B2 console shows the S3 URL in virtual-hosted format (`https://prestablaze.s3.eu-central-003.backblazeb2.com/...`), but this is **NOT** the recommended format for use in your application. 

The **path-hosted style** (`https://s3.eu-central-003.backblazeb2.com/prestablaze/...`) is the correct format to avoid SSL certificate errors.

This is a known quirk where Backblaze's console display doesn't match the officially recommended S3-compatible endpoint format.
