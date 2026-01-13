# Masterclass Thumbnail File Chain & Bucket Migration Guide

## 📋 File Chain: From Page to Edge Functions

### 1. **Entry Point: `src/pages/Masterclass.tsx`**
- **Location**: Lines 104-110, 396-427, 466-520, 1528-1590, 1663-1670
- **What it does**:
  - Handles thumbnail file selection via input field (line 1533)
  - Preview handling (line 1577)
  - Calls `uploadToB2()` function with thumbnail file (line 477)
  - Stores returned `thumbnailUrl` in database (line 492)

**Key code snippet**:
```typescript
// Line 477-478: Upload thumbnail to B2
const { publicUrl: thumbnailUrl } = await uploadToB2(
  uploadThumbnail,
  `masterclass_page_content/${user.id}`
);

// Line 486-492: Insert into database with thumbnail_url
const { error: insertError } = await supabase.from('masterclass_page_content').insert([
  {
    user_id: user.id,
    title: uploadTitle,
    thumbnail_url: thumbnailUrl,
    // ... other fields
  }
]);
```

---

### 2. **Upload Function: `src/lib/b2Upload.ts`**
- **Location**: Full file
- **What it does**:
  - Takes a File and folderPath
  - Constructs filename with timestamp
  - Invokes the `upload-to-b2` edge function
  - Returns public URL from edge function response
  - Validates URL to prevent malformed data

**Key code snippet**:
```typescript
export async function uploadToB2(
  file: File,
  folderPath: string
): Promise<{ publicUrl: string; error: string | null }> {
  const filename = `${folderPath}/${Date.now()}-${file.name}`;
  const contentType = file.type || 'application/octet-stream';
  
  // ... FormData setup ...
  
  const { data: uploadData } = await supabase.functions.invoke(
    'upload-to-b2',  // ← Edge function
    { body: uploadFormData }
  );
  
  return { publicUrl: uploadData.publicUrl, error: null };
}
```

---

### 3. **Edge Function: `supabase/functions/upload-to-b2/index.ts`**
- **Location**: Full file
- **What it does**:
  - Receives file from client
  - Uploads to B2 using S3-compatible API (AWS SDK)
  - Constructs public URL using `B2_PUBLIC_URL` env var
  - Returns public URL to client

**Key code snippet**:
```typescript
const s3 = new S3Client({
  region: "eu-central-003",
  endpoint: B2_S3_ENDPOINT,  // ← Environment variable
  credentials: {
    accessKeyId: B2_KEY_ID,      // ← Environment variable
    secretAccessKey: B2_APPLICATION_KEY  // ← Environment variable
  }
});

// Construct URL
const publicBase = B2_PUBLIC_URL.replace(/\/$/, '');
const publicUrl = `${publicBase}/${B2_BUCKET_NAME}/${filename}`;

// Upload to B2
await s3.send(new PutObjectCommand({
  Bucket: B2_BUCKET_NAME,  // ← Environment variable
  Key: filename,
  Body: new Uint8Array(fileBuffer),
  ContentType: contentType
}));
```

---

### 4. **Database: `masterclass_page_content` table**
- **Where it's used**: Line 486-493 in Masterclass.tsx
- **What's stored**: Complete public URL in `thumbnail_url` column
- **Example**: `https://s3.eu-central-003.backblazeb2.com/prestablaze/masterclass_page_content/user-id/timestamp-filename.jpg`

---

### 5. **Display Components**
- **`src/pages/Masterclass.tsx` lines 1667**: Displays thumbnail in manage courses modal
  ```tsx
  <img src={course.thumbnail_url} alt={course.title} />
  ```

---

## 🔗 Complete Flow Diagram

```
User uploads thumbnail in Masterclass.tsx
    ↓
Masterclass.tsx calls uploadToB2()
    ↓
uploadToB2() (src/lib/b2Upload.ts)
    ↓
Invokes 'upload-to-b2' Edge Function
    ↓
Edge Function (supabase/functions/upload-to-b2/index.ts)
    ├─ Gets B2 credentials from environment variables
    ├─ Creates S3 client configured for B2
    ├─ Uploads file to B2 bucket
    └─ Returns public URL
    ↓
uploadToB2() receives URL and returns to Masterclass.tsx
    ↓
Masterclass.tsx stores URL in database (thumbnail_url column)
    ↓
When displaying: query database → get thumbnail_url → <img src={thumbnail_url} />
```

---

## 🔄 Switching to a New Public Bucket

To migrate from your current **private bucket** to a **new public bucket**, you need to change environment variables in THREE places:

### Step 1: Update Supabase Environment Variables

In **Supabase → Project Settings → Edge Functions → Environment Variables**, change:

**Old (Private Bucket)**:
```
B2_KEY_ID=your_old_key_id
B2_APPLICATION_KEY=your_old_app_key
B2_S3_ENDPOINT=https://s3.eu-central-003.backblazeb2.com
B2_BUCKET_NAME=prestablaze  ← OLD private bucket
B2_PUBLIC_URL=https://s3.eu-central-003.backblazeb2.com
```

**New (Public Bucket)**:
```
B2_KEY_ID=your_new_key_id           ← New B2 API credentials
B2_APPLICATION_KEY=your_new_app_key ← New B2 API credentials
B2_S3_ENDPOINT=https://s3.eu-central-003.backblazeb2.com
B2_BUCKET_NAME=your_new_bucket_name ← NEW public bucket name
B2_PUBLIC_URL=https://s3.eu-central-003.backblazeb2.com
```

**Steps to get new B2 credentials**:
1. Create new public bucket in Backblaze B2 console
2. Create new API key with access to that bucket only
3. Copy the key ID and application key
4. Update environment variables in Supabase

---

### Step 2: Update Client Environment Variables (Optional)

In your `.env` file (if used for client-side reference, though not directly used):

**`src/lib/b2Upload.ts` doesn't need changes**, but you can keep environment variables for reference.

---

### Step 3: Migrate Existing URLs (Optional but Recommended)

If you want old thumbnails to still display from new bucket, you have two options:

**Option A: Re-upload thumbnails to new bucket**
- Keep old URLs pointing to old bucket (they'll stop working)
- Upload all new thumbnails to new bucket
- Old courses show broken images until re-uploaded

**Option B: Copy thumbnails to new bucket and update database**
```sql
-- This only works if you manually copy files from old to new bucket
-- Then update URLs in database:
UPDATE public.masterclass_page_content
SET thumbnail_url = REGEXP_REPLACE(
    thumbnail_url,
    'prestablaze',  -- old bucket name
    'new_bucket_name'  -- new bucket name
)
WHERE thumbnail_url LIKE '%prestablaze%';
```

**Option C: Delete old courses, start fresh**
- Remove old courses from `masterclass_page_content` table
- All new uploads go to new bucket automatically
- Cleanest approach

---

## 📋 Files That Reference B2 Configuration

### Files That Need NO Changes (Auto-configured):
1. ✅ `src/pages/Masterclass.tsx` - Uses `uploadToB2()` function, doesn't hardcode bucket
2. ✅ `src/lib/b2Upload.ts` - Uses environment variables via edge function
3. ✅ `supabase/functions/upload-to-b2/index.ts` - Reads from environment variables
4. ✅ `supabase/functions/process-masterclass-video/index.ts` - Reads from environment variables

### Files That DO Need Changes:
1. ❌ **Supabase Environment Variables** - MUST UPDATE (see Step 1 above)
2. ❌ **Database URLs** - May need migration (see Step 3 above)

---

## 🔒 Public vs Private Bucket Implications

### Private Bucket (Current)
```
B2_BUCKET_NAME=prestablaze (private)
├─ Files NOT accessible via public URL
├─ Requires signed/temporary URLs
└─ Causes SSL cert errors and 403 access denied
```

### Public Bucket (Recommended)
```
B2_BUCKET_NAME=new_public_bucket (public)
├─ Files accessible via public URL
├─ No signed URLs needed
├─ URLs work directly in <img> tags
└─ No SSL cert errors
```

---

## 🚀 Complete Migration Checklist

- [ ] Create new **public bucket** in Backblaze B2
- [ ] Create new **API credentials** for the bucket
- [ ] Copy `B2_KEY_ID` from new credentials
- [ ] Copy `B2_APPLICATION_KEY` from new credentials
- [ ] Update `B2_BUCKET_NAME` to new bucket name in Supabase
- [ ] Update all other environment variables in Supabase
- [ ] Wait for environment variables to take effect (may require edge function redeploy)
- [ ] Test by uploading new course with thumbnail
- [ ] Verify thumbnail displays without SSL error
- [ ] Handle old course thumbnails (delete/migrate/ignore)
- [ ] Verify all new uploads work

---

## 💡 Key Differences in the Code Flow

### What Changes When You Update Environment Variables:

1. **uploadToB2()** in `src/lib/b2Upload.ts`
   - No code changes needed
   - Still calls same edge function

2. **upload-to-b2** edge function
   - No code changes needed
   - Uses updated `B2_KEY_ID`, `B2_APPLICATION_KEY`, `B2_BUCKET_NAME`
   - Constructs URLs with new bucket name

3. **Masterclass.tsx**
   - No code changes needed
   - Still calls `uploadToB2()` same way
   - Receives URLs from edge function with new bucket

4. **Database**
   - No schema changes needed
   - Just new URLs stored in `thumbnail_url` column

---

## 📌 Summary

**To switch buckets, you ONLY need to:**
1. Update 4 environment variables in Supabase
2. Optionally migrate existing URLs in database

**You do NOT need to:**
- Change any source code files
- Modify any edge functions
- Change database schema
- Update client-side code

The architecture is already abstracted - all bucket configuration is external!
