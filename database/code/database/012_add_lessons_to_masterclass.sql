-- =============================================
-- ADD LESSONS_COUNT COLUMN TO MASTERCLASS_PAGE_CONTENT
-- =============================================

ALTER TABLE public.masterclass_page_content 
ADD COLUMN IF NOT EXISTS lessons_count INT DEFAULT 0;

-- Create index on lessons_count for faster filtering
CREATE INDEX IF NOT EXISTS idx_masterclass_page_content_lessons_count ON public.masterclass_page_content(lessons_count);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON TABLE public.masterclass_page_content TO authenticated;
