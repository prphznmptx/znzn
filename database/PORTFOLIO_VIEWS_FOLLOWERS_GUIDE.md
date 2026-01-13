# Portfolio Views & Followers Connection Guide

This guide explains how to connect the Portfolio page view tracking and Followers count to Supabase.

## Overview

### What Was Created

1. **Portfolio Page** (`src/pages/Portfolio.tsx`)
   - Full-featured portfolio page for creators
   - Displays skills, experience, education, awards, certifications, testimonials
   - Sends work to Media section
   - Connected to routing (protected route for authenticated users)

2. **Portfolio View Tracking** (`src/hooks/usePortfolioViewTracking.ts`)
   - Tracks each time a portfolio is viewed
   - Automatically increments `portfolio_views` counter in profiles table
   - Records view details in `portfolio_views` table

3. **Followers System** (Database tables and triggers)
   - Tracks follower/following relationships
   - Automatically updates `followers` count in profiles table
   - Real-time synchronization

4. **Dashboard Integration**
   - Portfolio Views stat now pulls live data from `profiles.portfolio_views`
   - Followers stat now pulls live data from `profiles.followers`
   - Both update in real-time via subscriptions

## Step-by-Step Implementation

### Step 1: Run the SQL Migrations

Copy and paste the entire content of `database/006_portfolio_views_tracking.sql` into your Supabase SQL Editor and run it.

This creates:
- `portfolio_views` table - Records every portfolio view
- `followers` table - Tracks follower relationships
- Automatic triggers to update profile counters
- RLS policies for security
- Helper view for statistics

### Step 2: Enable Realtime for New Tables

In your Supabase Dashboard:
1. Go to **Database → Replication**
2. Enable Realtime for these new tables:
   - `portfolio_views`
   - `followers`

Or run this SQL:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.portfolio_views;
ALTER PUBLICATION supabase_realtime ADD TABLE public.followers;
```

### Step 3: Verify Dashboard Statistics

1. Login to your app and navigate to the **Dashboard**
2. Check the Quick Stats section:
   - "Portfolio Views" - Should show live count (increments when portfolio is viewed)
   - "Followers" - Should show live follower count

### Step 4: Test Portfolio View Tracking

1. Have one user login and navigate to another user's Portfolio page
2. Each visit to the Portfolio page increments the `portfolio_views` counter
3. Check the Dashboard to see the count increase in real-time

## How It Works

### Portfolio Views Flow

```
User visits Portfolio page
         ↓
usePortfolioViewTracking hook fires
         ↓
Insert record into portfolio_views table
         ↓
Trigger: update_portfolio_views_count() fires
         ↓
Increments profiles.portfolio_views counter
         ↓
Real-time subscription updates Dashboard
         ↓
"Portfolio Views" stat shows new count
```

### Followers Flow

```
User follows another creator
         ↓
Insert record into followers table
         ↓
Trigger: update_followers_count() fires
         ↓
Increments profiles.followers counter for followed creator
         ↓
Real-time subscription updates Dashboard
         ↓
"Followers" stat shows new count
```

## Database Schema

### portfolio_views Table
```sql
id UUID PRIMARY KEY
portfolio_owner_id UUID (who owns the portfolio)
viewed_by_id UUID (who viewed it, nullable for anonymous)
ip_address TEXT (optional)
user_agent TEXT (optional)
viewed_at TIMESTAMP
```

### followers Table
```sql
id UUID PRIMARY KEY
follower_id UUID (user who follows)
following_id UUID (user being followed)
created_at TIMESTAMP
UNIQUE(follower_id, following_id)
CHECK (follower_id != following_id)
```

### profiles Table Updates
```
portfolio_views INT (total views of user's portfolio)
followers INT (total followers of user)
```

## File Changes Summary

### New Files Created
- `src/pages/Portfolio.tsx` - Full portfolio page component
- `src/hooks/usePortfolioViewTracking.ts` - Hook for tracking views
- `database/006_portfolio_views_tracking.sql` - SQL migrations
- `database/PORTFOLIO_VIEWS_FOLLOWERS_GUIDE.md` - This guide

### Modified Files
- `src/App.tsx` - Added Portfolio route and import
- `src/pages/Dashboard.tsx` - Already connected to show live stats

## How Stats Display on Dashboard

### Portfolio Views
```
Dashboard → Quick Stats → "Portfolio Views"
    ↓
useUserStats hook fetches from profiles.portfolio_views
    ↓
Real-time subscription watches for changes
    ↓
Updates instantly when profile is viewed
```

### Followers
```
Dashboard → Quick Stats → "Followers"
    ↓
useUserStats hook fetches from profiles.followers
    ↓
Real-time subscription watches for changes
    ↓
Updates instantly when user gains/loses followers
```

## API/Hooks Reference

### usePortfolioViewTracking Hook
```typescript
const { trackView } = usePortfolioViewTracking();

// Call this when portfolio is viewed
trackView(); // Records the view and increments counter
```

**Location**: `src/hooks/usePortfolioViewTracking.ts`

**How it's used**:
- Called in `Portfolio.tsx` on component mount
- Automatically tracks each portfolio visit
- Updates database and triggers real-time updates

### useUserStats Hook (Updated)
Already fetches portfolio_views and followers from database.

```typescript
const { stats, loading, error } = useUserStats();

// stats contains:
// - portfolio_views: number
// - followers: number
// - rating: number
// - loyalty_points: number

// Real-time subscription active - updates automatically
```

## Testing the Implementation

### Test 1: Portfolio View Counting
1. User A logs in and views User B's portfolio
2. Check User B's Dashboard
3. "Portfolio Views" should increment by 1
4. Expected: Count increases in real-time

### Test 2: Followers Counting
1. In database, insert a follow relationship:
```sql
INSERT INTO followers (follower_id, following_id) 
VALUES ('FOLLOWER_USER_ID', 'FOLLOWED_USER_ID');
```
2. Check the followed user's Dashboard
3. "Followers" count should increase by 1
4. Expected: Count updates in real-time

### Test 3: Real-Time Updates
1. Open Dashboard in two browser windows
2. In one window, visit another user's portfolio
3. In the other window, observe "Portfolio Views" increment
4. Expected: Updates without page refresh

## Creating a Follow System Hook (Optional)

To enable following from the UI, create this hook:

```typescript
// src/hooks/useFollowUser.ts
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function useFollowUser() {
  const { user } = useAuth();

  const followUser = async (userIdToFollow: string) => {
    if (!user || user.id === userIdToFollow) return;

    try {
      const { error } = await supabase
        .from('followers')
        .insert({
          follower_id: user.id,
          following_id: userIdToFollow,
        });

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      return true;
    } catch (err) {
      console.error('Error following user:', err);
      return false;
    }
  };

  const unfollowUser = async (userIdToUnfollow: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('followers')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', userIdToUnfollow);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error unfollowing user:', err);
      return false;
    }
  };

  return { followUser, unfollowUser };
}
```

## Troubleshooting

### Portfolio Views Not Incrementing
**Check**:
1. Is the portfolio page being visited by different users?
2. Is the `portfolio_views` table created and accessible?
3. Are triggers enabled in Supabase?
4. Check browser console for errors

**Solution**:
- Verify SQL migrations ran successfully
- Check Supabase logs for trigger errors
- Verify RLS policies allow inserts

### Followers Count Not Updating
**Check**:
1. Is the `followers` table created?
2. Are you trying to follow a user?
3. Are triggers enabled?

**Solution**:
- Run SQL migrations if not already done
- Test by manually inserting into followers table:
```sql
INSERT INTO followers (follower_id, following_id) 
VALUES ('user-uuid-1', 'user-uuid-2');
```
- Check if profiles.followers increments

### Dashboard Stats Still Showing 0
**Check**:
1. Are you using the updated hooks?
2. Is the database returning data?
3. Are real-time subscriptions enabled?

**Solution**:
```sql
SELECT portfolio_views, followers FROM profiles WHERE id = 'your-user-id';
```
Verify the data exists in the database. If it does but Dashboard doesn't show it, clear browser cache and reload.

### Real-Time Updates Not Working
**Check**:
1. Is Realtime enabled for the tables?
2. Is the user authenticated?
3. Are subscriptions active?

**Solution**:
1. Go to Supabase Dashboard → Replication
2. Enable Realtime for:
   - `profiles` (for portfolio_views and followers)
   - `portfolio_views` (for tracking details)
   - `followers` (for follow relationships)
3. Restart the dev server

## Production Checklist

- [x] Portfolio.tsx created and routed
- [x] usePortfolioViewTracking hook created
- [x] SQL migrations provided (006_portfolio_views_tracking.sql)
- [x] Dashboard connected to live stats
- [x] RLS policies configured
- [x] Triggers set up for auto-increment
- [ ] Run SQL migrations in Supabase
- [ ] Enable Realtime for new tables
- [ ] Test portfolio view tracking
- [ ] Test followers counting
- [ ] Verify real-time updates on Dashboard
- [ ] Deploy to production

## Future Enhancements

1. **Follow Button on Portfolio**
   - Add follow button to Portfolio page
   - Use useFollowUser hook to handle follows

2. **Follower List**
   - Display list of followers on portfolio
   - Show who is following you

3. **Portfolio Analytics**
   - Show view trends over time
   - Show top-performing portfolio pieces

4. **Social Sharing**
   - Share portfolio link on social media
   - Track views from referral sources

5. **Activity Feed**
   - Show when someone views your portfolio
   - Show follower activity

## Support

If issues occur:
1. Check the troubleshooting section above
2. Verify all SQL migrations ran successfully
3. Enable Realtime for all required tables
4. Check browser console for JavaScript errors
5. Review Supabase logs for database errors

---

**Last Updated**: 2025
**Version**: 1.0
