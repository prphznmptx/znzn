-- =============================================
-- ADD FEATURES AND LEVEL COLUMNS TO MASTERCLASS_PAGE_CONTENT
-- =============================================

-- Add level column to masterclass_page_content
ALTER TABLE public.masterclass_page_content 
ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'All Levels' 
CHECK (level IN ('Beginner', 'Intermediate', 'Advanced', 'All Levels', 'Beginner to Intermediate', 'Beginner to Advanced', 'Intermediate to Advanced'));

-- Add features column to masterclass_page_content (array of strings stored as JSONB)
ALTER TABLE public.masterclass_page_content 
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb;

-- Create index on level for faster filtering
CREATE INDEX IF NOT EXISTS idx_masterclass_page_content_level ON public.masterclass_page_content(level);

-- Update the RLS policies to ensure data is still protected
-- (existing policies should continue to work with new columns)

-- Grant permissions for the new columns
GRANT SELECT, INSERT, UPDATE ON TABLE public.masterclass_page_content TO authenticated;
