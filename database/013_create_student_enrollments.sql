-- Create student_enrollments table to track course enrollments
create table if not exists public.student_enrollments (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  course_id uuid not null,
  enrolled_at timestamp with time zone not null default now(),
  price_paid numeric not null default 0,
  payment_status text not null default 'pending'::text,
  payment_method text null,
  transaction_id text null,
  progress_percentage integer not null default 0,
  lessons_completed integer not null default 0,
  completed_at timestamp with time zone null,
  status text not null default 'active'::text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  
  constraint student_enrollments_pkey primary key (id),
  constraint student_enrollments_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade,
  constraint student_enrollments_course_id_fkey foreign key (course_id) references public.masterclass_page_content (id) on delete cascade,
  constraint student_enrollments_payment_status_check check (
    payment_status = any (array['pending'::text, 'completed'::text, 'failed'::text])
  ),
  constraint student_enrollments_status_check check (
    status = any (array['active'::text, 'completed'::text, 'dropped'::text])
  ),
  constraint student_enrollments_user_course_unique unique (user_id, course_id)
) tablespace pg_default;

-- Create indexes for common queries
create index if not exists idx_student_enrollments_user_id on public.student_enrollments using btree (user_id) tablespace pg_default;
create index if not exists idx_student_enrollments_course_id on public.student_enrollments using btree (course_id) tablespace pg_default;
create index if not exists idx_student_enrollments_user_course on public.student_enrollments using btree (user_id, course_id) tablespace pg_default;
create index if not exists idx_student_enrollments_status on public.student_enrollments using btree (status) tablespace pg_default;
create index if not exists idx_student_enrollments_payment_status on public.student_enrollments using btree (payment_status) tablespace pg_default;
create index if not exists idx_student_enrollments_enrolled_at on public.student_enrollments using btree (enrolled_at desc) tablespace pg_default;

-- Create trigger to update updated_at column
create or replace trigger trigger_student_enrollments_updated_at
before update on public.student_enrollments
for each row
execute function public.update_updated_at_column ();

-- Add RLS policies
alter table public.student_enrollments enable row level security;

-- Policy: Users can view their own enrollments
create policy "Users can view their own enrollments"
on public.student_enrollments
for select
using (auth.uid () = user_id);

-- Policy: Users can create enrollments for themselves
create policy "Users can create enrollments for themselves"
on public.student_enrollments
for insert
with check (auth.uid () = user_id);

-- Policy: Users can update their own enrollments
create policy "Users can update their own enrollments"
on public.student_enrollments
for update
using (auth.uid () = user_id)
with check (auth.uid () = user_id);

-- Policy: Admins/system can read all enrollments
create policy "Admins can view all enrollments"
on public.student_enrollments
for select
using (
  exists (
    select 1 from auth.users
    where id = auth.uid ()
    and raw_user_meta_data->>'role' = 'admin'
  )
);
