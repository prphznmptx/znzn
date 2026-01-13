# Course Enrollment System - Quick Start Guide

Get up and running with the course enrollment system in 5 minutes.

## Prerequisites
- Node.js 16+ installed
- Supabase project set up
- Eversend and/or Flutterwave accounts

## Step 1: Add Environment Variables (2 minutes)

Add to your `.env.local` file:

```bash
# Eversend (Primary)
VITE_EVERSEND_API_KEY=your_key_here
VITE_EVERSEND_BUSINESS_ID=your_id_here

# Flutterwave (Fallback)
VITE_FLUTTERWAVE_PUBLIC_KEY=your_public_key_here
VITE_FLUTTERWAVE_SECRET_KEY=your_secret_key_here
```

## Step 2: Run Database Migrations (2 minutes)

```bash
# Connect to your Supabase database
psql -h db.supabase.co -U postgres -d your_database

# Run these migrations in order:
\i database/013_create_student_enrollments.sql
\i database/014_add_course_price_to_masterclass.sql
```

Or use Supabase SQL Editor:
1. Go to Supabase Dashboard → SQL Editor
2. Open each .sql file
3. Run the SQL

## Step 3: Set Course Prices (1 minute)

For each course, set a price in `masterclass_page_content`:

```sql
UPDATE masterclass_page_content 
SET course_price = 50000  -- UGX amount
WHERE id = 'course_id_here';
```

- `0` or `NULL` = Free course (no payment required)
- `> 0` = Paid course (shows payment modal)

## Step 4: Test the System (5 minutes)

### Test Free Course
1. Go to `/masterclass` → Courses tab
2. Click "Read More" on a free course
3. Click "Enroll Now"
4. Fill in details
5. Submit
6. ✅ Should be enrolled immediately

### Test Paid Course (Eversend)
1. Go to `/masterclass` → Courses tab
2. Click "Read More" on a paid course
3. Click "Enroll Now"
4. Select "Eversend" as payment method
5. Proceed to payment
6. You'll be redirected to Eversend (test mode)
7. Complete payment
8. ✅ Should return and activate enrollment

### Test Paid Course (Flutterwave)
1. Same steps as above
2. Select "Flutterwave" as payment method
3. Use test card: `4242 4242 4242 4242`
4. Expiry: `09/32`, CVV: `242`, PIN: `1111`
5. ✅ Should verify and activate

## Step 5: View Learning Tab (1 minute)

1. Go to `/masterclass`
2. Click on "Learning" tab
3. ✅ Should see all enrolled courses
4. Click on a course card
5. ✅ Should view lesson list and progress

## Key Features to Check

- [ ] Course detail page displays correctly
- [ ] "Read More" link works on catalog
- [ ] Enrollment modal appears on "Enroll Now"
- [ ] Payment gateway redirects work
- [ ] Payment verification succeeds
- [ ] Enrolled courses show in Learning tab
- [ ] Progress tracking works
- [ ] Can mark lessons as complete

## Common Issues

### "API Key Error" in Payment
- ✅ Check `.env.local` has correct keys
- ✅ Restart dev server after adding keys
- ✅ Verify keys in payment provider dashboard

### "Enrollment not found"
- ✅ Check user is logged in
- ✅ Verify database migration ran
- ✅ Check enrollment record in database

### "Video won't play"
- ✅ Verify Mux player script loaded
- ✅ Check video URL in course
- ✅ Ensure user is enrolled

## Next Steps

1. **Customize Styling**
   - Colors in component files use `from-rose-500 to-purple-600`
   - Update Tailwind config as needed

2. **Configure Email Notifications**
   - Add email service (SendGrid, etc.)
   - Send enrollment confirmation emails

3. **Set Up Webhooks** (Optional)
   - Payment provider webhooks for additional security
   - See `PAYMENT_INTEGRATION_SETUP.md`

4. **Enable Analytics**
   - Track enrollment conversion rates
   - Monitor payment failures
   - Track course completion rates

## File Structure

```
src/
├── pages/
│   ├── CourseDetailPage.tsx      ← Course details & enrollment
│   ├── EnrollmentCallback.tsx    ← Payment verification
│   └── Masterclass.tsx           ← Updated with Learning tab
├── components/
│   ├── EnrollmentModal.tsx       ← Enrollment workflow
│   ├── CourseLessonViewer.tsx    ← Lesson viewer
│   └── VideoPlaybackModal.tsx    ← Video player (existing)
├── hooks/
│   └── useEnrollment.ts          ← Enrollment logic
├── lib/
│   └── enrollmentService.ts      ← Payment APIs & DB operations
database/
├── 013_create_student_enrollments.sql
└── 014_add_course_price_to_masterclass.sql
```

## Support Documentation

- **Full Implementation Guide:** `COURSE_ENROLLMENT_IMPLEMENTATION.md`
- **Payment Setup:** `PAYMENT_INTEGRATION_SETUP.md`
- **API Reference:** See functions in `src/lib/enrollmentService.ts`

## Success Checklist

- [ ] Environment variables added
- [ ] Database migrations completed
- [ ] Course prices set
- [ ] Free course enrollment tested
- [ ] Eversend payment tested
- [ ] Flutterwave payment tested
- [ ] Learning tab displays enrolled courses
- [ ] Progress tracking works
- [ ] All features documented and understood

You're ready to go! 🚀
