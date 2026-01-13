-- Add course pricing support to masterclass_page_content
alter table if exists public.masterclass_page_content
add column if not exists course_price numeric not null default 0;

-- Create index for efficient queries on pricing
create index if not exists idx_masterclass_page_content_course_price on public.masterclass_page_content using btree (course_price) tablespace pg_default;
