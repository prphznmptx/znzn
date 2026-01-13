# B2 URL Format Fix - SSL Certificate Error Resolution

## 🔴 Problem

You were getting this SSL certificate error:
```
net::ERR_CERT_COMMON_NAME_INVALID
https://prestablaze.s3.s3.eu-central-003.backblazeb2.com/masterclass_page_content/...
```

Notice the **double "s3"**: `prestablaze.s3.s3.eu-central-003.backblazeb2.com`

This causes the browser to reject the connection because:
- The SSL certificate is issued for `prestablaze.s3.eu-central-003.backblazeb2.com` (single s3)
- But the URL tries to access `prestablaze.s3.s3.eu-central-003.backblazeb2.com` (double s3)
- Hostname mismatch = SSL certificate invalid

---

## ✅ Root Cause

The edge functions were using the **wrong URL construction method** for Backblaze B2's S3-compatible API.

### What Your B2 Bucket Provides

Backblaze B2 for bucket "prestablaze" in region "eu-central-003" provides:

**Option 1: S3 Virtual-Hosted Style (CORRECT)**
```
https://prestablaze.s3.eu-central-003.backblazeb2.com/path/to/file
```
Format: `https://{bucket-name}.{region-s3-endpoint}/{filename}`

**Option 2: Native B2 Friendly URL**
```
https://f003.backblazeb2.com/file/prestablaze/path/to/file
```

**Option 3: S3 Path Style (Path-Hosted Style)**
```
https://s3.eu-central-003.backblazeb2.com/prestablaze/path/to/file
```
Format: `https://{region-s3-endpoint}/{bucket-name}/{filename}`

---

## 🔧 What I Fixed

### 1. Edge Function URL Construction

**Before** (Wrong - causes double s3):
```typescript
const endpointDomain = B2_S3_ENDPOINT.replace(/^https?:\/\//, '').replace(/\/$/, '');
publicUrl = `https://${endpointDomain}/${B2_BUCKET_NAME}/${filename}`;

// If B2_S3_ENDPOINT = "https://s3.eu-central-003.backblazeb2.com"
// Result: https://s3.eu-central-003.backblazeb2.com/prestablaze/filename ✓ OK
// BUT if B2_PUBLIC_URL already has bucket prepended, we get double s3 ✗
```

**After** (Correct - uses S3 virtual-hosted style):
```typescript
const endpointDomain = B2_S3_ENDPOINT.replace(/^https?:\/\//, '').replace(/\/$/, '');
publicUrl = `https://${B2_BUCKET_NAME}.${endpointDomain}/${filename}`;

// If B2_S3_ENDPOINT = "https://s3.eu-central-003.backblazeb2.com"
// Result: https://prestablaze.s3.eu-central-003.backblazeb2.com/filename ✓ CORRECT
```

Updated files:
- `supabase/functions/upload-to-b2/index.ts`
- `supabase/functions/process-masterclass-video/index.ts`

### 2. Database URL Fixes

Created SQL script to fix existing broken URLs:
- `database/FIX_DOUBLE_S3_URLS.sql`

---

## 🚀 Implementation Steps

### Step 1: Deploy Updated Edge Functions

1. Push the changes:
   ```bash
   git add supabase/functions/
   git commit -m "Fix B2 S3 virtual-hosted style URL construction"
   git push
   ```

2. Verify in Supabase Dashboard that edge functions deployed

### Step 2: Verify B2_PUBLIC_URL Environment Variable

In Supabase → Project Settings → Edge Functions → Environment Variables:

**Option A: Using S3 Virtual-Hosted Style (Recommended)**
```
B2_PUBLIC_URL=https://prestablaze.s3.eu-central-003.backblazeb2.com
```

**Option B: Using S3 Path Style**
```
B2_PUBLIC_URL=https://s3.eu-central-003.backblazeb2.com
B2_BUCKET_NAME=prestablaze
```
Note: If using path style, make sure filename doesn't already contain bucket name

**Option C: Using Native B2 URL**
```
B2_PUBLIC_URL=https://f003.backblazeb2.com/file/prestablaze
```

**Recommended Settings** (virtual-hosted style - least ambiguous):
```
B2_KEY_ID=your_key_id
B2_APPLICATION_KEY=your_app_key
B2_S3_ENDPOINT=https://s3.eu-central-003.backblazeb2.com
B2_BUCKET_NAME=prestablaze
B2_PUBLIC_URL=https://prestablaze.s3.eu-central-003.backblazeb2.com
```

### Step 3: Fix Existing Broken URLs

Execute this SQL in Supabase SQL Editor:

```sql
-- Fix thumbnail URLs with double s3
UPDATE public.masterclass_page_content
SET thumbnail_url = REGEXP_REPLACE(
    thumbnail_url,
    'https://prestablaze\.s3\.s3\.',
    'https://prestablaze.s3.'
)
WHERE thumbnail_url LIKE 'https://prestablaze.s3.s3.%';

-- Fix video URLs with double s3
UPDATE public.masterclass_video_uploads
SET b2_url = REGEXP_REPLACE(
    b2_url,
    'https://prestablaze\.s3\.s3\.',
    'https://prestablaze.s3.'
)
WHERE b2_url LIKE 'https://prestablaze.s3.s3.%';

-- Verify
SELECT COUNT(*) as remaining_broken_urls
FROM public.masterclass_page_content 
WHERE thumbnail_url LIKE '%.s3.s3.%';
```

### Step 4: Test Thumbnail Display

1. Go to Masterclass page
2. Scroll to courses section
3. Open browser DevTools (F12) → Network tab
4. Look for image requests:
   - ✅ Should load from `prestablaze.s3.eu-central-003.backblazeb2.com`
   - ✅ Status should be 200 (not 403/404)
   - ✅ No SSL certificate errors

---

## 🔍 Understanding S3 URL Formats

### Virtual-Hosted Style (What You Should Use)
```
https://bucket-name.s3.region.provider.com/path/to/file
```
- Bucket name is part of the **hostname**
- Used for: AWS S3, Backblaze B2 (S3-compatible), DigitalOcean Spaces
- **Advantage**: Only need one URL in `B2_PUBLIC_URL`
- **Disadvantage**: Bucket name must be DNS-valid (no underscores)

### Path-Hosted Style (Path Style)
```
https://s3.region.provider.com/bucket-name/path/to/file
```
- Bucket name is part of the **path**
- Less common for public access
- **Advantage**: Bucket name can have special characters
- **Disadvantage**: Endpoint changes based on bucket, harder to manage

### Native B2 Format
```
https://f003.backblazeb2.com/file/bucket-name/path/to/file
```
- Backblaze's native format
- **Advantage**: Always works, direct B2 API
- **Disadvantage**: Slower than S3 endpoints, different URL format

---

## ✨ Key Changes Summary

| Item | Before | After |
|------|--------|-------|
| **URL Format** | Ambiguous fallback | S3 virtual-hosted style |
| **Bucket Prepend** | `endpoint/bucket/file` | `bucket.endpoint/file` |
| **SSL Error** | ❌ Double s3 | ✅ Single s3 |
| **Validation** | Basic | Detects malformed URLs |
| **Thumbnail Display** | ❌ Fails with cert error | ✅ Works correctly |

---

## 🆘 Troubleshooting

### Images Still Not Loading?

1. **Check DevTools Network Tab**
   ```
   F12 → Network → Filter by "img"
   Look for image requests
   Check URL format
   Check response status
   ```

2. **Check Database URLs**
   ```sql
   SELECT thumbnail_url FROM public.masterclass_page_content 
   WHERE id = 'course_id';
   ```
   - Should be: `https://prestablaze.s3.eu-central-003.backblazeb2.com/...`
   - Should NOT be: `https://prestablaze.s3.s3.eu-central-003.backblazeb2.com/...`

3. **Test Direct URL Access**
   - Open image URL directly in browser
   - If 403: Check B2_KEY_ID and permissions
   - If 404: File doesn't exist in B2
   - If 200: Working correctly

4. **Check Edge Function Logs**
   - Supabase Dashboard → Edge Functions → upload-to-b2
   - Look for error messages or invalid URL constructions

---

## 📋 Quick Reference

### Correct URL Examples

✅ **Virtual-Hosted Style**
```
https://prestablaze.s3.eu-central-003.backblazeb2.com/masterclass_page_content/course-id/image.jpg
```

✅ **Native B2**
```
https://f003.backblazeb2.com/file/prestablaze/masterclass_page_content/course-id/image.jpg
```

❌ **Wrong (Double S3)**
```
https://prestablaze.s3.s3.eu-central-003.backblazeb2.com/masterclass_page_content/course-id/image.jpg
```

❌ **Wrong (Path Style with bucket)**
```
https://s3.eu-central-003.backblazeb2.com/prestablaze/prestablaze/masterclass_page_content/...
```

---

## ✅ Verification Checklist

After applying all fixes:

- [ ] Edge functions redeployed
- [ ] B2_PUBLIC_URL environment variable verified
- [ ] SQL migration executed to fix broken URLs
- [ ] New course upload tested
- [ ] Thumbnail displays without SSL error
- [ ] DevTools shows 200 status for image
- [ ] Database shows correct URL format (single s3)
- [ ] Old courses' thumbnails fixed in database
