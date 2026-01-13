# Calendar Feature Implementation Guide

This document outlines the complete implementation of the Calendar feature for the Events application.

## Overview

The Calendar feature allows logged-in users to:
- Save events to their personal calendar
- Remove events from their calendar
- Receive reminders for saved events
- View only their saved events using the Calendar filter
- Enable/disable reminders for individual events

## Database Changes

### New Tables Created

#### 1. `user_calendar_events`
Stores user's saved events with reminder preferences.

```sql
Fields:
- id (UUID): Primary key
- user_id (UUID): Reference to auth.users
- event_id (UUID): Reference to events
- reminder_enabled (BOOLEAN): Whether reminders are enabled
- reminder_type (TEXT): Type of reminder (in_app, email, push, all)
- reminder_time_before (TEXT): When to remind (15m, 1h, 24h, week)
- added_at (TIMESTAMP): When event was added to calendar
- created_at (TIMESTAMP): Creation timestamp
- updated_at (TIMESTAMP): Last update timestamp

Unique Constraint: (user_id, event_id)
```

**RLS Policies:**
- Users can only view their own calendar events
- Users can only add/remove their own calendar events
- Users can only update their own reminder preferences

#### 2. `event_reminders`
Tracks scheduled reminders and their delivery status.

```sql
Fields:
- id (UUID): Primary key
- user_id (UUID): Reference to auth.users
- event_id (UUID): Reference to events
- reminder_scheduled_for (TIMESTAMP): When the reminder should be sent
- reminder_sent_at (TIMESTAMP): When it was actually sent
- reminder_type (TEXT): Type of reminder (in_app, email, push, all)
- status (TEXT): pending, sent, failed, cancelled
- created_at (TIMESTAMP): Creation timestamp
- updated_at (TIMESTAMP): Last update timestamp

Unique Constraint: (user_id, event_id, reminder_scheduled_for)
```

**RLS Policies:**
- Users can view and manage their own reminders
- Service role can update reminders for scheduled notifications

#### 3. `push_subscriptions`
Stores user's push notification subscriptions for web push.

```sql
Fields:
- id (UUID): Primary key
- user_id (UUID): Reference to auth.users
- endpoint (TEXT): Push notification endpoint
- auth_key (TEXT): Authentication key for push
- p256dh_key (TEXT): Encryption key for push
- is_active (BOOLEAN): Whether subscription is active
- created_at (TIMESTAMP): Creation timestamp
- updated_at (TIMESTAMP): Last update timestamp

Unique Constraint: (user_id, endpoint)
```

**RLS Policies:**
- Users can only manage their own push subscriptions

### Migration Files

- `database/008_user_calendar_events.sql` - User calendar events table and RLS policies
- `database/009_event_reminders.sql` - Reminders and push subscriptions tables

## Frontend Changes

### New/Updated Components

#### 1. `src/components/JoinTab.tsx`
**Major Updates:**
- Added "calendar" as a filter option (displayed in red)
- Implemented calendar event filtering
- Integrated with Supabase calendar functions
- Added toast notifications instead of alerts
- Added login requirement checks
- Removed duplicate notification messages

**Key Features:**
- When user selects "Calendar" filter, only their saved events are shown
- Unlogged users get a message to sign in
- Calendar button toggles add/remove from calendar
- After adding to calendar, users are asked to enable reminders
- All notifications use toast system instead of alerts

**State Management:**
```typescript
- calendarAdded: Record<string, boolean> - Tracks which events are in calendar
- calendarEvents: DBEvent[] - User's calendar events
- isAddingToCalendar: Record<string, boolean> - Loading states
```

#### 2. `src/components/LivestreamTab.tsx`
**Major Updates:**
- Removed hardcoded `mockLivestreams` array
- Now loads livestream events from Supabase
- Filters for `is_livestream: true` and `status: 'happening'`
- Added loading state
- Improved empty state messaging

**Features:**
- Dynamic livestream content from database
- Same filter capabilities as join tab
- Proper loading indicators

### New Service Files

#### 1. `src/lib/eventServices.ts`
**New Functions Added:**

```typescript
// Calendar event management
addEventToCalendar(userId, eventId, reminderEnabled)
removeEventFromCalendar(userId, eventId)
getUserCalendarEvents(userId)
isEventInUserCalendar(userId, eventId)

// Reminder management
enableEventReminder(userId, eventId, reminderType, reminderBefore)
disableEventReminder(userId, eventId)

// Push notifications
subscribeToPushNotifications(userId, subscription)
unsubscribeFromPushNotifications(userId, endpoint)
```

#### 2. `src/lib/remindersService.ts`
**New Utility Module for Reminders:**

Provides functions for:
- Checking browser push notification support
- Requesting notification permissions
- Managing push subscriptions
- Calculating reminder times
- Creating notification payloads
- Showing in-app notifications

**Key Functions:**
```typescript
- isPushNotificationSupported()
- requestPushNotificationPermission()
- arePushNotificationsEnabled()
- getPushNotificationSubscription()
- subscribeToPushNotifications()
- calculateReminderTime()
- formatReminderTime()
- shouldSendReminder()
- createEventReminderPayload()
```

## How It Works

### Adding Events to Calendar

1. User clicks calendar icon on an event
2. System checks if user is logged in
3. If not logged in, shows error toast
4. If logged in, adds event to `user_calendar_events` table
5. User is asked if they want to enable reminders
6. If yes, reminder is enabled in the database
7. Success toast is shown

**Flow Diagram:**
```
User clicks calendar icon
    ↓
Check if logged in?
    ├→ NO → Show error toast → Exit
    └→ YES
        ↓
    Add to user_calendar_events table
        ↓
    Update UI (calendarAdded state)
        ↓
    Show success toast
        ↓
    Ask "Enable reminders?"
        ├→ NO → Exit
        └→ YES
            ↓
        Call enableEventReminder()
            ↓
        Show "Reminders enabled" toast
```

### Removing Events from Calendar

1. User clicks calendar icon on saved event
2. System removes event from `user_calendar_events` table
3. If viewing Calendar filter, reloads calendar events
4. UI updates immediately
5. Success toast is shown

### Viewing Calendar Events

1. User selects "Calendar" from filter dropdown (shows in red)
2. System checks if user is logged in
3. If not logged in, shows message to sign in
4. If logged in, fetches user's calendar events from database
5. Applies search filter
6. Displays only calendar events

### Reminders System

**In-App Reminders:**
- Triggered when user adds event to calendar
- User can opt-in to receive reminders
- Stored in `user_calendar_events.reminder_enabled`
- Can be configured with different timings (15m, 1h, 24h, 1 week)

**Push Notifications (For Future Implementation):**
- Stored in `push_subscriptions` table
- Requires service worker setup
- Uses Web Push API
- Can be triggered by scheduled tasks

**Email Reminders (For Future Implementation):**
- Can be configured when enabling reminders
- Requires email sending service integration
- Best handled via scheduled edge functions

## User Interface

### Calendar Filter Option

Location: Join Tab → Category Filter Dropdown

**Display:**
- Shows as "📅 Calendar" in the dropdown
- Text color is red (#f87171 or rose-400)
- When selected, the dropdown text turns red

**Behavior:**
- When selected, shows only user's saved events
- If not logged in, shows prompt to sign in
- Empty state message guides users to add events

### Notifications

**Toast Notifications (replacing alerts):**
- "Added to calendar. Get reminders?" (success, 4 seconds)
- "Reminders enabled for this event" (success)
- "Removed from calendar" (success)
- "Please sign in to add events to calendar" (error)
- "Failed to add event to calendar" (error)

**Dialog Confirmation:**
- "Enable reminders for this event?" (window.confirm)
- Still uses browser confirm for simplicity

## Data Flow

### State Management

```
JoinTab Component State:
├── publishedEvents (DBEvent[]) - All published events from DB
├── calendarEvents (DBEvent[]) - User's calendar events from DB
├── calendarAdded (Record<string, boolean>) - UI state for button styling
└── isAddingToCalendar (Record<string, boolean>) - Loading states

When user changes:
- Load calendar events from getUserCalendarEvents()
- Update calendarAdded state
- Re-render filtered events
```

### Database Queries

**Load Published Events:**
```sql
SELECT * FROM events 
WHERE is_visible_in_join_tab = true 
  AND is_published = true 
  AND status = 'upcoming'
ORDER BY event_date ASC
```

**Load User's Calendar Events:**
```sql
SELECT events.* FROM events
INNER JOIN user_calendar_events ON events.id = user_calendar_events.event_id
WHERE user_calendar_events.user_id = $1
ORDER BY user_calendar_events.added_at DESC
```

**Add Event to Calendar:**
```sql
INSERT INTO user_calendar_events (user_id, event_id, reminder_enabled)
VALUES ($1, $2, $3)
```

**Remove Event from Calendar:**
```sql
DELETE FROM user_calendar_events
WHERE user_id = $1 AND event_id = $2
```

**Enable Reminders:**
```sql
UPDATE user_calendar_events
SET reminder_enabled = true, reminder_type = $3, reminder_time_before = $4
WHERE user_id = $1 AND event_id = $2
```

## Error Handling

### User-Facing Error Messages

- **"Please sign in to add events to calendar"** - When non-logged-in user tries to add event
- **"Event is already in your calendar"** - When trying to add duplicate (RLS constraint)
- **"Failed to add event to calendar"** - Generic Supabase error
- **"Failed to remove event from calendar"** - Generic Supabase error

### Development Error Logging

- All errors are logged to console with context
- Supabase errors include error codes and messages
- Service functions return `{ success: boolean; error: string | null }`

## Testing Checklist

### Functional Tests
- [ ] Non-logged-in user sees error when trying to add event
- [ ] Non-logged-in user sees login prompt on Calendar filter
- [ ] Logged-in user can add event to calendar
- [ ] Logged-in user sees confirmation toast
- [ ] Logged-in user can enable reminders
- [ ] Logged-in user can see saved events in Calendar filter
- [ ] Logged-in user can remove event from calendar
- [ ] Removing updates both UI and database
- [ ] Calendar filter shows only user's events
- [ ] Search works within Calendar filter

### UI Tests
- [ ] Calendar option shows in red
- [ ] Calendar icon changes color when event is added
- [ ] Toast notifications appear and disappear
- [ ] Loading states work correctly
- [ ] Empty states show appropriate messages

### Database Tests
- [ ] Events saved to `user_calendar_events` table
- [ ] RLS policies prevent unauthorized access
- [ ] Reminders stored correctly
- [ ] Duplicate prevention works

## Future Enhancements

### Short Term
1. **Email Reminders**
   - Integrate email service (SendGrid, Mailgun, etc.)
   - Send reminder emails 24h before event

2. **Push Notifications**
   - Implement service worker
   - Request notification permissions
   - Send browser push notifications

3. **Reminder Customization**
   - Allow users to choose reminder timing (15m, 1h, 24h, 1 week)
   - Allow users to choose reminder type (in-app, email, push)
   - Store multiple reminders per event

4. **Calendar Export**
   - Export calendar to iCal format
   - Sync with Google Calendar
   - Sync with Apple Calendar

### Medium Term
1. **Calendar Views**
   - Month view calendar
   - Week view calendar
   - Agenda view

2. **Smart Reminders**
   - AI-based reminder timing optimization
   - Predictive reminders based on user behavior

3. **Calendar Sharing**
   - Share calendar with friends
   - Invite friends to events from calendar

## Deployment Notes

### Required Actions

1. **Run Database Migrations**
   ```bash
   # Execute these in order:
   database/008_user_calendar_events.sql
   database/009_event_reminders.sql
   ```

2. **No Environment Variables Needed**
   - Uses existing Supabase configuration
   - No new API keys required

3. **Service Worker (Optional, for Push Notifications)**
   - Create `public/service-worker.js`
   - Register in main app component
   - Required for browser push notifications

### Backward Compatibility

- No breaking changes to existing code
- All new functionality is additive
- Existing event system unchanged
- Removed hardcoded livestream data but replaced with database queries

## Performance Considerations

### Database Indexes

Created indexes on:
- `user_calendar_events(user_id)` - Fast calendar lookups
- `user_calendar_events(event_id)` - Fast event checks
- `event_reminders(reminder_scheduled_for)` - Fast reminder queries
- `push_subscriptions(user_id)` - Fast subscription lookups

### Query Optimization

- Used single JOIN query for loading calendar events
- Filters applied client-side after fetching (small dataset)
- Supabase handles pagination automatically

### Caching Opportunities

Future improvements:
- Cache user's calendar events (1 hour TTL)
- Cache published events (5 minutes TTL)
- Use Supabase Realtime for live updates

## Security

### Row Level Security (RLS)

- All tables enforce RLS
- Users can only view their own data
- Service role can update reminders for email/push

### Authentication

- All calendar operations require authentication
- Supabase handles JWT validation
- Anonymous users can view published events but cannot save

### Data Privacy

- Calendar events are private to user
- Push subscriptions stored securely
- No data shared between users
