# Database Migration Quick Reference
## Copy & Paste into Supabase SQL Editor

---

## ⚠️ IMPORTANT
Execute **IN ORDER** (1, 2, 3):
1. First: `015_add_certificates_and_invoices.sql`
2. Second: `016_add_course_metadata.sql`
3. Third: `017_add_promo_code_functions.sql`

---

## Migration 1: Certificates & Invoices
**File:** `database/015_add_certificates_and_invoices.sql`

```sql
-- Add certificate tracking to student_enrollments
ALTER TABLE public.student_enrollments
ADD COLUMN IF NOT EXISTS certificate_id uuid,
ADD COLUMN IF NOT EXISTS certificate_generated_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS last_accessed_at timestamp with time zone;

-- Create certificates table
CREATE TABLE IF NOT EXISTS public.student_certificates (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  enrollment_id uuid NOT NULL,
  user_id uuid NOT NULL,
  course_id uuid NOT NULL,
  course_title text NOT NULL,
  generated_at timestamp with time zone NOT NULL DEFAULT now(),
  download_url text,
  certificate_number text UNIQUE,
  
  CONSTRAINT student_certificates_pkey PRIMARY KEY (id),
  CONSTRAINT student_certificates_enrollment_fkey FOREIGN KEY (enrollment_id) REFERENCES public.student_enrollments (id) ON DELETE CASCADE,
  CONSTRAINT student_certificates_user_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT student_certificates_course_fkey FOREIGN KEY (course_id) REFERENCES public.masterclass_page_content (id) ON DELETE CASCADE
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS public.enrollment_invoices (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  enrollment_id uuid NOT NULL,
  user_id uuid NOT NULL,
  course_id uuid NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'UGX',
  payment_method text,
  transaction_id text,
  invoice_number text UNIQUE,
  invoice_date timestamp with time zone NOT NULL DEFAULT now(),
  due_date timestamp with time zone,
  status text NOT NULL DEFAULT 'paid' CHECK (status IN ('pending', 'paid', 'cancelled')),
  pdf_url text,
  email_sent boolean DEFAULT false,
  email_sent_at timestamp with time zone,
  
  CONSTRAINT enrollment_invoices_pkey PRIMARY KEY (id),
  CONSTRAINT enrollment_invoices_enrollment_fkey FOREIGN KEY (enrollment_id) REFERENCES public.student_enrollments (id) ON DELETE CASCADE,
  CONSTRAINT enrollment_invoices_user_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT enrollment_invoices_course_fkey FOREIGN KEY (course_id) REFERENCES public.masterclass_page_content (id) ON DELETE CASCADE
);

-- Create indexes for certificates
CREATE INDEX IF NOT EXISTS idx_student_certificates_user_id ON public.student_certificates USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_student_certificates_enrollment_id ON public.student_certificates USING btree (enrollment_id);
CREATE INDEX IF NOT EXISTS idx_student_certificates_course_id ON public.student_certificates USING btree (course_id);

-- Create indexes for invoices
CREATE INDEX IF NOT EXISTS idx_enrollment_invoices_user_id ON public.enrollment_invoices USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_invoices_enrollment_id ON public.enrollment_invoices USING btree (enrollment_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_invoices_course_id ON public.enrollment_invoices USING btree (course_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_invoices_status ON public.enrollment_invoices USING btree (status);

-- Add RLS policies for certificates
ALTER TABLE public.student_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own certificates"
ON public.student_certificates
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own certificates"
ON public.student_certificates
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add RLS policies for invoices
ALTER TABLE public.enrollment_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own invoices"
ON public.enrollment_invoices
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own invoices"
ON public.enrollment_invoices
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create trigger to update last_accessed_at
CREATE OR REPLACE FUNCTION update_last_accessed_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_accessed_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_last_accessed_at
BEFORE UPDATE ON public.student_enrollments
FOR EACH ROW
EXECUTE FUNCTION update_last_accessed_at();
```

✅ **Expected Result:** 2 new tables created, 8 indexes created, 4 policies added, 1 trigger added

---

## Migration 2: Course Metadata & Promo Codes
**File:** `database/016_add_course_metadata.sql`

```sql
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

-- Create enrollment_promo_codes junction table
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
```

✅ **Expected Result:** 8 new columns added, 2 new tables created, 7 indexes created, 1 policy added, 1 function created

---

## Migration 3: Promo Code Functions
**File:** `database/017_add_promo_code_functions.sql`

```sql
-- Create function to increment promo code usage
CREATE OR REPLACE FUNCTION increment_promo_usage(p_promo_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.promo_codes
  SET current_uses = current_uses + 1
  WHERE id = p_promo_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to get promo code details
CREATE OR REPLACE FUNCTION get_promo_code_details(p_code text)
RETURNS TABLE(
  id uuid,
  code text,
  discount_percentage numeric,
  discount_amount numeric,
  is_valid boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pc.id,
    pc.code,
    pc.discount_percentage,
    pc.discount_amount,
    (pc.is_active AND pc.valid_from <= now() AND pc.valid_until > now() AND (pc.current_uses < pc.max_uses OR pc.max_uses IS NULL))::boolean as is_valid
  FROM public.promo_codes pc
  WHERE UPPER(pc.code) = UPPER(p_code);
END;
$$ LANGUAGE plpgsql;

-- Create function to apply multiple discount types
CREATE OR REPLACE FUNCTION calculate_enrollment_price(
  p_course_id uuid,
  p_promo_code text DEFAULT NULL
)
RETURNS TABLE(
  base_price numeric,
  course_discount numeric,
  promo_discount numeric,
  final_price numeric
) AS $$
DECLARE
  v_base_price numeric;
  v_course_discount_pct numeric;
  v_promo_discount numeric := 0;
BEGIN
  -- Get base course price
  SELECT course_price INTO v_base_price
  FROM public.masterclass_page_content
  WHERE id = p_course_id;
  
  v_base_price := COALESCE(v_base_price, 0);
  
  -- Get course discount if active
  SELECT discount_percentage INTO v_course_discount_pct
  FROM public.masterclass_page_content
  WHERE id = p_course_id 
  AND discount_percentage > 0 
  AND (discount_valid_until IS NULL OR discount_valid_until > now());
  
  v_course_discount_pct := COALESCE(v_course_discount_pct, 0);
  
  -- Get promo code discount if provided
  IF p_promo_code IS NOT NULL THEN
    SELECT COALESCE(discount_percentage, 0) INTO v_promo_discount
    FROM public.promo_codes pc
    WHERE UPPER(pc.code) = UPPER(p_promo_code)
    AND pc.is_active
    AND pc.valid_from <= now()
    AND pc.valid_until > now()
    AND (pc.current_uses < pc.max_uses OR pc.max_uses IS NULL);
    
    v_promo_discount := COALESCE(v_promo_discount, 0);
  END IF;
  
  -- Return price breakdown
  RETURN QUERY
  SELECT
    v_base_price as base_price,
    v_base_price * (v_course_discount_pct / 100) as course_discount,
    v_base_price * (v_promo_discount / 100) as promo_discount,
    v_base_price - (v_base_price * (GREATEST(v_course_discount_pct, v_promo_discount) / 100)) as final_price;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION increment_promo_usage(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_promo_code_details(text) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_promo_code(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_enrollment_price(uuid, text) TO authenticated;
```

✅ **Expected Result:** 4 new functions created, permissions granted

---

## Verification Checklist

After running all 3 migrations, verify:

```sql
-- Check tables exist
SELECT tablename FROM pg_tables 
WHERE tablename IN ('student_certificates', 'enrollment_invoices', 'promo_codes', 'enrollment_promo_codes');
-- Should return 4 rows

-- Check new columns on masterclass_page_content
SELECT column_name FROM information_schema.columns 
WHERE table_name='masterclass_page_content' 
AND column_name IN ('instructor_bio', 'instructor_credentials', 'prerequisites');
-- Should return 3+ rows

-- Check indexes
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('student_certificates', 'enrollment_invoices', 'promo_codes');
-- Should return 10+ rows

-- Check functions
SELECT proname FROM pg_proc 
WHERE proname IN ('increment_promo_usage', 'validate_promo_code', 'calculate_enrollment_price');
-- Should return 3+ rows

-- Check RLS enabled
SELECT tablename FROM pg_tables 
WHERE tablename IN ('student_certificates', 'enrollment_invoices', 'promo_codes')
AND rowsecurity = true;
-- Should return 3 rows
```

---

## Example: Creating a Test Promo Code

After migrations complete:

```sql
-- Create 10% discount promo code valid for 30 days
INSERT INTO public.promo_codes (
  code,
  discount_percentage,
  max_uses,
  valid_from,
  valid_until,
  is_active,
  created_by
) VALUES (
  'SAVE10',
  10,
  100,
  now(),
  now() + interval '30 days',
  true,
  '00000000-0000-0000-0000-000000000000'  -- Replace with actual user_id
);

-- Test validation
SELECT * FROM validate_promo_code('SAVE10', '00000000-0000-0000-0000-000000000000');
```

---

## Troubleshooting

### "Column already exists"
- This is fine if you're running migrations that add the same columns
- The `IF NOT EXISTS` clause prevents errors

### "Foreign key constraint fails"
- Ensure student_enrollments table exists first
- Ensure auth.users table exists (Supabase default)
- Ensure masterclass_page_content table exists

### "Function already exists"
- Safe to ignore, the functions are being replaced/recreated

### "Permission denied"
- Use Supabase admin role (automatically used in SQL Editor)
- Or grant necessary permissions to your app role

---

## Next Steps

1. ✅ Run all 3 migrations
2. ✅ Verify tables & functions created
3. Create test promo code
4. Update course data with new fields
5. Test all features in app

---

*Last Updated: January 12, 2026*
