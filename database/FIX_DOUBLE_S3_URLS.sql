-- =============================================
-- FIX DOUBLE S3 URLS IN MASTERCLASS_PAGE_CONTENT
-- Fixes URLs with double "s3" (s3.s3.) to correct format
-- =============================================

-- Check for broken double-s3 URLs
SELECT id, title, thumbnail_url 
FROM public.masterclass_page_content 
WHERE thumbnail_url LIKE '%s3.s3.%'
ORDER BY created_at DESC;

-- Fix thumbnail URLs that have double "s3"
-- Replace: prestablaze.s3.s3.eu-central-003.backblazeb2.com
-- With:    prestablaze.s3.eu-central-003.backblazeb2.com
UPDATE public.masterclass_page_content
SET thumbnail_url = REGEXP_REPLACE(
    thumbnail_url,
    'https://prestablaze\.s3\.s3\.',
    'https://prestablaze.s3.'
)
WHERE thumbnail_url LIKE 'https://prestablaze.s3.s3.%';

-- Also fix any other double-s3 patterns
UPDATE public.masterclass_page_content
SET thumbnail_url = REGEXP_REPLACE(
    thumbnail_url,
    '\.s3\.s3\.',
    '.s3.'
)
WHERE thumbnail_url LIKE '%.s3.s3.%';

-- Fix video URLs in masterclass_video_uploads table
UPDATE public.masterclass_video_uploads
SET b2_url = REGEXP_REPLACE(
    b2_url,
    'https://prestablaze\.s3\.s3\.',
    'https://prestablaze.s3.'
)
WHERE b2_url LIKE 'https://prestablaze.s3.s3.%';

-- Also fix any other double-s3 patterns in video URLs
UPDATE public.masterclass_video_uploads
SET b2_url = REGEXP_REPLACE(
    b2_url,
    '\.s3\.s3\.',
    '.s3.'
)
WHERE b2_url LIKE '%.s3.s3.%';

-- Verify the fixes
SELECT 'masterclass_page_content' as table_name, COUNT(*) as broken_urls_remaining
FROM public.masterclass_page_content 
WHERE thumbnail_url LIKE '%.s3.s3.%'
UNION ALL
SELECT 'masterclass_video_uploads', COUNT(*)
FROM public.masterclass_video_uploads 
WHERE b2_url LIKE '%.s3.s3.%';

-- Show fixed URLs
SELECT id, title, thumbnail_url, created_at
FROM public.masterclass_page_content 
WHERE status = 'published'
  AND thumbnail_url LIKE '%prestablaze.s3.eu-central-003%'
ORDER BY created_at DESC
LIMIT 10;
