# Dashboard Connection to Supabase - Implementation Guide

This guide provides complete instructions for connecting your Dashboard page to Supabase for dynamic content display.

## Overview

The Dashboard page now includes:
- **Quick Stats**: Portfolio Views, Followers, Rating, Loyalty Points (real-time updates)
- **Recent Activity**: User activity feed with real-time notifications
- **Upcoming Events**: Dynamically fetched events from database
- **Active Challenges**: User's active challenges with progress tracking
- **Invite Friends**: Unique referral code generation and copy functionality

## What Was Created

### 1. Database Tables

#### New Columns Added to `profiles` Table
```sql
portfolio_views INT (default: 0)
followers INT (default: 0)
rating DECIMAL(3,1) (default: 0.0)
```

#### New Tables

**user_activities**
- Tracks user actions (portfolio updates, follower gains, approvals, etc.)
- Real-time feed displayed on Dashboard

**challenges**
- User challenges with progress tracking
- Supports multiple statuses: active, completed, expired
- Rewards for completion

**events**
- Upcoming events that users can join
- Includes livestream support
- Tracks attendance and ratings

**event_registrations**
- Many-to-many relationship between users and events
- Automatically updates event attendee count

### 2. Hooks Created/Updated

#### New Hooks
- `useUpcomingEvents.ts` - Fetches upcoming events with real-time subscriptions
- `useReferralCode.ts` - Generates and manages user referral codes

#### Updated Hooks (with Real-Time Subscriptions)
- `useUserStats.ts` - Now subscribes to profile changes
- `useUserActivity.ts` - Now subscribes to new activity entries
- `useChallenges.ts` - Now subscribes to challenge updates

### 3. Updated Components
- `Dashboard.tsx` - Now uses all new hooks and displays live data

## Step-by-Step Implementation

### Step 1: Run the SQL Migrations in Supabase

Go to your Supabase dashboard → SQL Editor and run the following SQL code:

```sql
-- Copy the entire content from database/005_dashboard_tables.sql
-- and paste it into the Supabase SQL Editor
```

The complete SQL is provided in `database/005_dashboard_tables.sql`. This will:
1. Add missing columns to the profiles table
2. Create user_activities table
3. Create challenges table
4. Create events table
5. Create event_registrations table
6. Create all necessary indexes for performance
7. Set up triggers for automatic timestamp updates and attendee counting
8. Enable Row Level Security (RLS) policies

### Step 2: Verify Migration Success

After running the SQL, verify everything was created correctly by running:

```sql
-- Check that new columns exist in profiles
SELECT column_name FROM information_schema.columns 
WHERE table_name='profiles' AND column_name IN ('portfolio_views', 'followers', 'rating');

-- Check new tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema='public' AND table_name IN ('user_activities', 'challenges', 'events', 'event_registrations');

-- Check indexes
SELECT indexname FROM pg_indexes WHERE schemaname='public' AND tablename IN ('user_activities', 'challenges', 'events', 'event_registrations');
```

### Step 3: Optional - Add Sample Data

To test the Dashboard with sample data, you can insert test records:

```sql
-- First, get your user ID (replace 'your-email@example.com' with actual email)
SELECT id FROM auth.users WHERE email = 'your-email@example.com';

-- Then use that ID in the following inserts (replace 'USER_ID_HERE'):

-- Add sample user activity
INSERT INTO public.user_activities (user_id, action_type, action) VALUES
('USER_ID_HERE', 'update', 'Updated portfolio profile'),
('USER_ID_HERE', 'follower', 'Gained a new follower'),
('USER_ID_HERE', 'approval', 'Portfolio was featured');

-- Add sample challenges
INSERT INTO public.challenges (user_id, title, description, progress, reward, target_count) VALUES
('USER_ID_HERE', 'Complete Your Profile', 'Fill out all profile sections', 75, '100 points', 5),
('USER_ID_HERE', 'Get 5 Followers', 'Gain 5 followers this month', 60, '200 points', 5),
('USER_ID_HERE', 'Upload Portfolio', 'Upload your first portfolio piece', 100, '150 points', 1);

-- Add sample events
INSERT INTO public.events (title, event_date, event_time, location, organizer_id, organizer_name, capacity) VALUES
('Digital Marketing Workshop', '2025-11-15', '10:00:00', 'Online', 'USER_ID_HERE', 'Your Name', 100),
('Talent Showcase Event', '2025-11-20', '14:00:00', 'Venue Name', 'USER_ID_HERE', 'Your Name', 200),
('Brand Ambassador Summit', '2025-11-25', '09:00:00', 'Conference Center', 'USER_ID_HERE', 'Your Name', 150);

-- Update profile stats
UPDATE public.profiles SET 
  portfolio_views = 150,
  followers = 42,
  rating = 4.8
WHERE id = 'USER_ID_HERE';
```

### Step 4: Update Supabase Realtime Configuration

For real-time updates to work, you need to enable Realtime for the tables:

1. Go to Supabase Dashboard → Replication
2. Enable Realtime for these tables:
   - user_activities
   - challenges
   - events
   - event_registrations
   - profiles

Alternatively, enable via SQL:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_activities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenges;
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_registrations;
```

## API Endpoints Reference

### useUserStats Hook
Fetches and subscribes to profile statistics.

**Data returned:**
```typescript
{
  portfolio_views: number;
  followers: number;
  rating: number;
  loyalty_points: number;
}
```

**Updates:** Real-time when profile is updated

### useUserActivity Hook
Fetches and subscribes to user activities.

**Data returned:**
```typescript
{
  id: string;
  action_type: 'update' | 'follower' | 'approval' | 'other';
  action: string;
  created_at: string;
}[]
```

**Updates:** Real-time when new activities are added

### useChallenges Hook
Fetches and subscribes to active user challenges.

**Data returned:**
```typescript
{
  id: string;
  title: string;
  description: string;
  progress: number; // 0-100
  reward: string;
  status: 'active' | 'completed' | 'expired';
}[]
```

**Updates:** Real-time when challenges change

### useUpcomingEvents Hook
Fetches and subscribes to upcoming events.

**Data returned:**
```typescript
{
  id: string;
  title: string;
  event_date: string; // ISO format
  event_time: string;
  attendees_count: number;
  location: string;
  organizer_name: string;
}[]
```

**Updates:** Real-time when events are created or modified

### useReferralCode Hook
Generates and manages referral code.

**Data returned:**
```typescript
{
  referralCode: string | null; // Format: REF-TT2025-XXXXXXXX
  loading: boolean;
  copyToClipboard: (code: string) => Promise<boolean>;
}
```

## Database Schema Details

### profiles (Modified)
```sql
-- New columns added:
portfolio_views INT DEFAULT 0
followers INT DEFAULT 0
rating DECIMAL(3, 1) DEFAULT 0.0
```

### user_activities
```sql
id UUID PRIMARY KEY
user_id UUID NOT NULL (references auth.users)
action_type TEXT ('update', 'follower', 'approval', 'other')
action TEXT
related_entity_id UUID (optional)
related_entity_type TEXT (optional)
created_at TIMESTAMP
updated_at TIMESTAMP
```

### challenges
```sql
id UUID PRIMARY KEY
user_id UUID NOT NULL (references auth.users)
title TEXT
description TEXT
progress INT (0-100)
reward TEXT
status TEXT ('active', 'completed', 'expired')
target_count INT (optional)
current_count INT
start_date TIMESTAMP
end_date TIMESTAMP (optional)
created_at TIMESTAMP
updated_at TIMESTAMP
```

### events
```sql
id UUID PRIMARY KEY
title TEXT
description TEXT
category TEXT ('social', 'networking', 'business', 'workshop', 'conference', 'masterclass')
event_date DATE
event_time TIME
location TEXT
organizer_id UUID NOT NULL (references auth.users)
organizer_name TEXT
image_url TEXT (optional)
price DECIMAL(10, 2)
capacity INT
attendees_count INT
rating DECIMAL(3, 1)
reviews_count INT
features TEXT[] (array)
speakers TEXT[] (array)
is_livestream BOOLEAN
livestream_url TEXT (optional)
status TEXT ('upcoming', 'ongoing', 'completed', 'cancelled')
created_at TIMESTAMP
updated_at TIMESTAMP
```

### event_registrations
```sql
id UUID PRIMARY KEY
user_id UUID NOT NULL (references auth.users)
event_id UUID NOT NULL (references public.events)
status TEXT ('registered', 'attended', 'cancelled')
registered_at TIMESTAMP
UNIQUE(user_id, event_id)
```

## Security & Row Level Security (RLS)

All tables have RLS enabled with the following policies:

### user_activities
- ✅ Users can view their own activities
- ✅ Users can insert their own activities

### challenges
- ✅ Users can view their own challenges
- ✅ Users can insert their own challenges
- ✅ Users can update their own challenges

### events
- ✅ All authenticated users can view all events
- ✅ Users can only insert/update/delete their own events (organizers)

### event_registrations
- ✅ All authenticated users can view registrations
- ✅ Users can only insert/update/delete their own registrations

## Testing the Implementation

### Test 1: Dashboard Loads with Data
1. Login to your application
2. Navigate to Dashboard
3. Verify all sections display (Quick Stats, Recent Activity, Challenges, Events)
4. Check that data is loaded (not showing "No data" messages)

### Test 2: Real-Time Updates
1. In one browser tab, go to Dashboard
2. In another tab/window, use Supabase console to update data:
   ```sql
   UPDATE public.profiles SET portfolio_views = portfolio_views + 1 WHERE id = 'USER_ID';
   ```
3. Observe the Quick Stats section update in real-time

### Test 3: Referral Code
1. Click the "Copy" button in the Invite Friends section
2. Verify the button changes to "Copied" with a green background
3. Paste the code somewhere to verify it was copied

### Test 4: Activity Feed
1. Insert a new activity in Supabase:
   ```sql
   INSERT INTO user_activities (user_id, action_type, action) 
   VALUES ('USER_ID', 'follower', 'Gained a new follower');
   ```
2. Observe the activity appears in the Recent Activity section within seconds

## Troubleshooting

### Dashboard shows "No recent activity yet"
**Cause**: No user_activities records exist for the user
**Solution**: Insert sample data using the SQL provided in Step 3

### Real-time updates not working
**Cause**: Realtime not enabled for the tables
**Solution**: Enable Realtime in Supabase Dashboard → Replication for the tables (see Step 4)

### Events showing as blank
**Cause**: No events exist in the database or event_date is in the past
**Solution**: Insert events with future dates using Step 3 SQL

### Referral code shows "Loading..."
**Cause**: useReferralCode hook is still initializing
**Solution**: This is normal and should resolve within 1 second

### RLS policy errors
**Cause**: User doesn't have permission to access the table
**Solution**: Verify RLS policies are created correctly by running:
```sql
SELECT * FROM pg_policies WHERE tablename IN ('user_activities', 'challenges', 'events', 'event_registrations');
```

## Files Modified/Created

### New Files
- `src/hooks/useUpcomingEvents.ts` - Upcoming events hook with real-time
- `src/hooks/useReferralCode.ts` - Referral code hook
- `database/005_dashboard_tables.sql` - SQL migrations
- `database/DASHBOARD_CONNECTION_GUIDE.md` - This file

### Modified Files
- `src/hooks/useUserStats.ts` - Added real-time subscriptions
- `src/hooks/useUserActivity.ts` - Added real-time subscriptions
- `src/hooks/useChallenges.ts` - Added real-time subscriptions
- `src/pages/Dashboard.tsx` - Updated to use new hooks and display dynamic data

## Future Enhancements

1. **Activity Actions**: Add ability to create activities programmatically
2. **Challenge Completion**: Add challenge completion tracking and reward system
3. **Event Registration**: Add ability to register for events from Dashboard
4. **Statistics Dashboard**: Create admin dashboard to manage user stats
5. **Analytics**: Track which sections are most viewed/used
6. **Notifications**: Email/push notifications for activity and events

## Next Steps

1. **Run the SQL migrations** from `database/005_dashboard_tables.sql` in your Supabase console
2. **Enable Realtime** for the new tables in Supabase settings
3. **Test the Dashboard** with sample data
4. **Monitor console** for any errors and check browser DevTools if issues arise
5. **Deploy** the updated Dashboard to production

## Support & Questions

If you encounter any issues:
1. Check the troubleshooting section above
2. Verify all SQL migrations ran successfully
3. Enable Realtime for the tables
4. Check browser console for error messages
5. Verify user is authenticated before accessing protected data

---

**Last Updated**: 2025
**Version**: 1.0
