-- =============================================
-- FIX B2 URLS TO USE CORRECT S3 PATH-HOSTED STYLE
-- Converts from virtual-hosted style to path-hosted style
-- =============================================

-- FROM (virtual-hosted - WRONG):
--   https://prestablaze.s3.eu-central-003.backblazeb2.com/masterclass_page_content/...
--   https://prestablaze.s3.s3.eu-central-003.backblazeb2.com/masterclass_page_content/...
--
-- TO (path-hosted - CORRECT):
--   https://s3.eu-central-003.backblazeb2.com/prestablaze/masterclass_page_content/...

-- =============================================
-- FIX MASTERCLASS_PAGE_CONTENT THUMBNAIL URLS
-- =============================================

-- Check for URLs that need fixing (virtual-hosted style)
SELECT id, title, thumbnail_url 
FROM public.masterclass_page_content 
WHERE thumbnail_url LIKE 'https://prestablaze.s3.%'
   OR thumbnail_url LIKE 'https://prestablaze.s3.s3.%'
ORDER BY created_at DESC;

-- Fix: Convert prestablaze.s3.s3.eu-central-003.backblazeb2.com to s3.eu-central-003.backblazeb2.com/prestablaze
UPDATE public.masterclass_page_content
SET thumbnail_url = REGEXP_REPLACE(
    thumbnail_url,
    'https://prestablaze\.s3\.s3\.eu-central-003\.backblazeb2\.com/',
    'https://s3.eu-central-003.backblazeb2.com/prestablaze/'
)
WHERE thumbnail_url LIKE 'https://prestablaze.s3.s3.eu-central-003.backblazeb2.com/%';

-- Fix: Convert prestablaze.s3.eu-central-003.backblazeb2.com to s3.eu-central-003.backblazeb2.com/prestablaze
UPDATE public.masterclass_page_content
SET thumbnail_url = REGEXP_REPLACE(
    thumbnail_url,
    'https://prestablaze\.s3\.eu-central-003\.backblazeb2\.com/',
    'https://s3.eu-central-003.backblazeb2.com/prestablaze/'
)
WHERE thumbnail_url LIKE 'https://prestablaze.s3.eu-central-003.backblazeb2.com/%';

-- =============================================
-- FIX MASTERCLASS_VIDEO_UPLOADS B2_URLS
-- =============================================

-- Check for URLs that need fixing
SELECT id, filename, b2_url 
FROM public.masterclass_video_uploads 
WHERE b2_url LIKE 'https://prestablaze.s3.%'
   OR b2_url LIKE 'https://prestablaze.s3.s3.%'
ORDER BY created_at DESC;

-- Fix: Convert prestablaze.s3.s3.eu-central-003.backblazeb2.com to s3.eu-central-003.backblazeb2.com/prestablaze
UPDATE public.masterclass_video_uploads
SET b2_url = REGEXP_REPLACE(
    b2_url,
    'https://prestablaze\.s3\.s3\.eu-central-003\.backblazeb2\.com/',
    'https://s3.eu-central-003.backblazeb2.com/prestablaze/'
)
WHERE b2_url LIKE 'https://prestablaze.s3.s3.eu-central-003.backblazeb2.com/%';

-- Fix: Convert prestablaze.s3.eu-central-003.backblazeb2.com to s3.eu-central-003.backblazeb2.com/prestablaze
UPDATE public.masterclass_video_uploads
SET b2_url = REGEXP_REPLACE(
    b2_url,
    'https://prestablaze\.s3\.eu-central-003\.backblazeb2\.com/',
    'https://s3.eu-central-003.backblazeb2.com/prestablaze/'
)
WHERE b2_url LIKE 'https://prestablaze.s3.eu-central-003.backblazeb2.com/%';

-- =============================================
-- VERIFICATION
-- =============================================

-- Check remaining incorrect URLs
SELECT 'masterclass_page_content' as table_name, COUNT(*) as incorrect_urls
FROM public.masterclass_page_content 
WHERE thumbnail_url LIKE 'https://prestablaze.s3.%'
UNION ALL
SELECT 'masterclass_video_uploads', COUNT(*)
FROM public.masterclass_video_uploads 
WHERE b2_url LIKE 'https://prestablaze.s3.%';

-- Show correctly formatted URLs
SELECT id, title, thumbnail_url, created_at
FROM public.masterclass_page_content 
WHERE status = 'published'
  AND thumbnail_url LIKE 'https://s3.eu-central-003.backblazeb2.com/%'
ORDER BY created_at DESC
LIMIT 10;
