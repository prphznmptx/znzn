# Next Steps - How to Deploy Portfolio Content Persistence

## Overview
You now have a complete implementation of portfolio content persistence and deletion tracking. Here's what you need to do to make it live.

## ⚠️ Critical: Apply Database Migration FIRST

### Step 1: Apply SQL Migration (MUST DO THIS FIRST)

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy the entire content from: `database/portfolio_content_persistence_migration.sql`
5. Paste it into the SQL editor
6. Click **Run** (or press Ctrl+Enter)
7. Wait for completion and verify no errors appear

**What this does:**
- Adds tracking columns to `portfolio_page_content` table
- Creates triggers for auto-updating timestamps
- Creates deletion tracking functions
- Updates Row Level Security (RLS) policies
- Configures storage bucket policies
- Sets up pg_cron for automatic cleanup

**⚠️ Do NOT skip this step - the code changes depend on these database changes**

### Step 2: Verify Migration Success

After running the SQL, verify in Supabase:
1. Go to **Table Editor**
2. Select `portfolio_page_content` table
3. Check that these columns exist:
   - `publication_destination`
   - `published_to`
   - `deleted_at`
   - `auto_delete_at`
   - `saved`
   - `is_deleted_pending`

If all columns are present, the migration was successful ✅

## ✅ Code Changes Are Already Applied

All frontend and hook code changes have been implemented:
- ✅ `src/hooks/useMyContent.ts` - Updated
- ✅ `src/hooks/useContentPublication.ts` - Updated
- ✅ `src/hooks/useContentDeletion.ts` - Updated
- ✅ `src/hooks/useMediaPageEdit.ts` - Updated
- ✅ `src/pages/Content.tsx` - Updated
- ✅ `src/pages/Portfolio.tsx` - Updated

**No additional code changes needed - everything is ready!**

## 🚀 Testing the Implementation

After applying the migration, test the following:

### Test 1: Upload Portfolio Content
1. Go to **Content** page
2. Fill in content details
3. Select **"Portfolio"** from "Publish To" dropdown
4. Upload file and thumbnail
5. Click **Upload Content**
6. ✅ Verify content appears in "Your Content" with **Portfolio badge** (blue)

### Test 2: Upload Media Content
1. Go to **Content** page
2. Fill in content details
3. Select **"Media"** from "Publish To" dropdown
4. Upload file and thumbnail
5. Click **Upload Content**
6. ✅ Verify content appears in "Your Content" with **Media badge** (purple)

### Test 3: Content Persistence
1. Upload content to Portfolio
2. Go to **Portfolio** page
3. ✅ Verify content appears in "Portfolio Content" section
4. Go back to **Content** page
5. ✅ Verify content STILL appears in "Your Content" (not removed)

### Test 4: Edit Content
1. In **"Your Content"**, click **Edit** on portfolio content
2. Change title/description/category
3. Click **Save**
4. ✅ Verify changes appear in both Content and Portfolio pages

### Test 5: Delete with Countdown
1. In **"Your Content"**, click **Edit** on portfolio content
2. Scroll down, click **Delete Content**
3. Confirm deletion
4. ✅ Verify content shows "Disappearing in 3 days" countdown
5. ✅ Verify **Save** button appears in countdown timer

### Test 6: Portfolio Page Edit/Delete
1. Go to **Portfolio** page
2. Hover over portfolio content thumbnail
3. ✅ Verify **Edit** and **Delete** buttons appear
4. Click **Edit**
5. ✅ Verify edit modal opens
6. Make changes and save
7. ✅ Verify changes reflected immediately

### Test 7: Save from Deletion
1. Delete a portfolio content item (see Test 5)
2. Click **Save** in the countdown timer
3. ✅ Verify countdown disappears
4. ✅ Verify content status returns to draft
5. ✅ Verify content still appears in "Your Content"

### Test 8: Automatic Cleanup
1. Delete content and note the time
2. ✅ Content should auto-delete after 3 days (verify via database if you need immediate testing)

## 📊 How to Verify Everything Works

### Quick Health Check

**In Browser Console** (F12 → Console tab):
```javascript
// Check if real-time subscriptions are working
// You should see updates when editing content in another tab
console.log('Check Network tab for PostgreSQL changes subscriptions')
```

**In Supabase Dashboard:**
1. Go to **Edge Functions > Logs** - should show no errors
2. Go to **Database > Audit Logs** - should show updates to portfolio_page_content
3. Go to **Realtime > Usage** - should show subscriptions

## 🐛 Troubleshooting

### Issue: "Portfolio content not appearing in Your Content"
**Solution:**
1. Check browser console for errors (F12 → Console)
2. Verify SQL migration was applied completely
3. Refresh the page
4. Check that `user_id` matches your logged-in user

### Issue: "3-day countdown not showing"
**Solution:**
1. Verify `auto_delete_at` column exists in portfolio_page_content
2. Check that `status = 'pending_deletion'` in database
3. Verify `saved = FALSE` in database
4. Clear browser cache and refresh

### Issue: "Edit not saving changes"
**Solution:**
1. Check browser console for errors
2. Verify RLS policies were applied (portfolio_page_content table)
3. Check user has UPDATE permission on the table
4. Try in an incognito/private window

### Issue: "Storage bucket errors when uploading"
**Solution:**
1. Verify `portfolio_page_content` storage bucket exists in Supabase
2. Check bucket policies were applied from SQL migration
3. Verify bucket is public (for read access)

## 📞 Need Help?

If you encounter issues:

1. **Check the implementation guide**: `database/PORTFOLIO_PERSISTENCE_GUIDE.md`
2. **Check browser console**: F12 → Console tab for error messages
3. **Check Supabase logs**: Dashboard → Logs for database errors
4. **Review the migration**: Ensure all statements executed without errors

## ✅ Deployment Checklist

- [ ] Read this document completely
- [ ] Applied `portfolio_content_persistence_migration.sql` to Supabase
- [ ] Verified new columns exist in `portfolio_page_content` table
- [ ] Tested uploading portfolio content
- [ ] Tested uploading media content  
- [ ] Tested content persistence in "Your Content"
- [ ] Tested edit functionality
- [ ] Tested delete with countdown
- [ ] Tested save from deletion
- [ ] Tested Portfolio page edit/delete buttons
- [ ] Verified real-time updates across tabs

## 🎉 Success Criteria

You'll know everything is working when:

✅ Portfolio content appears in "Your Content" with Portfolio badge
✅ Portfolio content remains in "Your Content" after publishing
✅ Both Media and Portfolio content can be edited
✅ Deleted content shows 3-day countdown timer
✅ Users can save content from deletion
✅ Portfolio page shows edit/delete buttons on hover
✅ Changes appear in real-time across all pages
✅ No console errors when performing operations

## 📚 Documentation Files

- **`IMPLEMENTATION_SUMMARY.md`** - Overview of what was implemented
- **`database/PORTFOLIO_PERSISTENCE_GUIDE.md`** - Detailed technical guide
- **`database/portfolio_content_persistence_migration.sql`** - The migration to apply
- **`NEXT_STEPS.md`** - This file (deployment instructions)

---

**Questions?** Review the documentation files above or check the browser console for specific error messages.

**Ready?** Start with Step 1 above! 🚀
