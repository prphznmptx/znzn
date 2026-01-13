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
