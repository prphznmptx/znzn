-- =============================================
-- FIX BROKEN THUMBNAIL URLS IN MASTERCLASS_PAGE_CONTENT
-- Replaces 'undefined' URLs with proper B2 URLs
-- =============================================

-- Check for broken URLs first
SELECT id, title, thumbnail_url, video_upload_id 
FROM public.masterclass_page_content 
WHERE thumbnail_url LIKE 'undefined%' 
   OR thumbnail_url LIKE 'null%'
   OR thumbnail_url IS NULL
ORDER BY created_at DESC;

-- Fix thumbnail URLs that start with 'undefined'
-- Note: Replace 'https://prestablaze.s3.eu-central-003.backblazeb2.com' with your actual B2_PUBLIC_URL
UPDATE public.masterclass_page_content
SET thumbnail_url = REGEXP_REPLACE(
    thumbnail_url,
    '^undefined',
    'https://prestablaze.s3.eu-central-003.backblazeb2.com'
)
WHERE thumbnail_url LIKE 'undefined%';

-- Fix thumbnail URLs that start with 'null'
UPDATE public.masterclass_page_content
SET thumbnail_url = REGEXP_REPLACE(
    thumbnail_url,
    '^null',
    'https://prestablaze.s3.eu-central-003.backblazeb2.com'
)
WHERE thumbnail_url LIKE 'null%';

-- Verify the fixes
SELECT id, title, thumbnail_url, created_at
FROM public.masterclass_page_content 
WHERE status = 'published'
ORDER BY created_at DESC
LIMIT 10;
