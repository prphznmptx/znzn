-- Add instructor and course metadata fields to masterclass_page_content
ALTER TABLE IF EXISTS public.masterclass_page_content
ADD COLUMN IF NOT EXISTS instructor_bio text,
ADD COLUMN IF NOT EXISTS instructor_credentials text,
ADD COLUMN IF NOT EXISTS instructor_image_url text,
ADD COLUMN IF NOT EXISTS prerequisites text,
ADD COLUMN IF NOT EXISTS target_audience text,
ADD COLUMN IF NOT EXISTS discount_percentage numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_valid_until timestamp with time zone,
ADD COLUMN IF NOT EXISTS promo_code_enabled boolean DEFAULT false;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_masterclass_page_content_instructor ON public.masterclass_page_content USING btree (creator);
CREATE INDEX IF NOT EXISTS idx_masterclass_page_content_discount ON public.masterclass_page_content USING btree (discount_percentage);

-- Create promo codes table for flexible discount management
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  code text UNIQUE NOT NULL,
  discount_percentage numeric NOT NULL,
  discount_amount numeric,
  max_uses integer,
  current_uses integer DEFAULT 0,
  valid_from timestamp with time zone NOT NULL DEFAULT now(),
  valid_until timestamp with time zone NOT NULL,
  course_id uuid, -- NULL means applies to all courses
  is_active boolean DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT promo_codes_pkey PRIMARY KEY (id),
  CONSTRAINT promo_codes_course_fkey FOREIGN KEY (course_id) REFERENCES public.masterclass_page_content (id) ON DELETE CASCADE,
  CONSTRAINT promo_codes_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT promo_codes_valid_dates CHECK (valid_from < valid_until)
);

-- Create enrollment_promo_codes junction table (track which enrollments used which promo)
CREATE TABLE IF NOT EXISTS public.enrollment_promo_codes (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  enrollment_id uuid NOT NULL,
  promo_code_id uuid NOT NULL,
  discount_amount numeric NOT NULL,
  
  CONSTRAINT enrollment_promo_codes_pkey PRIMARY KEY (id),
  CONSTRAINT enrollment_promo_codes_enrollment_fkey FOREIGN KEY (enrollment_id) REFERENCES public.student_enrollments (id) ON DELETE CASCADE,
  CONSTRAINT enrollment_promo_codes_promo_fkey FOREIGN KEY (promo_code_id) REFERENCES public.promo_codes (id) ON DELETE CASCADE,
  CONSTRAINT enrollment_promo_codes_unique UNIQUE (enrollment_id, promo_code_id)
);

-- Create indexes for promo codes
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON public.promo_codes USING btree (code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_valid_until ON public.promo_codes USING btree (valid_until);
CREATE INDEX IF NOT EXISTS idx_promo_codes_course_id ON public.promo_codes USING btree (course_id);
CREATE INDEX IF NOT EXISTS idx_promo_codes_is_active ON public.promo_codes USING btree (is_active);

-- Add RLS policies for promo codes
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active promo codes"
ON public.promo_codes
FOR SELECT
USING (is_active = true);

-- Create function to validate and apply promo code
CREATE OR REPLACE FUNCTION validate_promo_code(p_code text, p_course_id uuid)
RETURNS TABLE(valid boolean, discount_percentage numeric, discount_amount numeric, promo_id uuid) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (pc.is_active AND pc.valid_from <= now() AND pc.valid_until > now() AND (pc.current_uses < pc.max_uses OR pc.max_uses IS NULL) AND (pc.course_id IS NULL OR pc.course_id = p_course_id))::boolean,
    pc.discount_percentage,
    pc.discount_amount,
    pc.id
  FROM public.promo_codes pc
  WHERE pc.code = p_code
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;
