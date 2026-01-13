# Calendar & Reminders - Quick Start Guide

## 🎯 What Changed

### ✅ Before:
- ❌ Confusing `window.confirm()` dialog appearing
- ❌ "Added to calendar" and "Enable reminders" notifications overlapping
- ❌ Permanent toast notifications cluttering the UI

### ✅ After:
- ✅ Clean, single reminder modal after adding event
- ✅ Auto-dismissing notifications
- ✅ Easy reminder customization
- ✅ Calendar sync to Google, Apple, iCal

---

## 📱 User Workflow

### Step 1: Add Event to Calendar
```
Click the 📅 Calendar icon on any event card
↓
Event is added to your calendar
↓
Toast notification appears: "Added to calendar" (auto-dismisses)
↓
Reminder modal appears automatically
```

### Step 2: Customize Reminders
In the modal, you can:

**Choose Notification Method:**
- 🔔 In-App Notification
- 📧 Email Reminder  
- 📱 Push Notification
- 🔔 All Methods

**Choose Reminder Timing:**
- ⏰ 15 minutes before
- ⏰ 1 hour before
- ⏰ 24 hours before
- ⏰ 1 week before

### Step 3: Add to Calendar (Optional)
The modal includes quick buttons to sync with:
- 📅 Google Calendar
- 🍎 Apple Calendar
- ⬇️ Download as ICS file
- 📋 Copy Details

### Step 4: Enable Reminders
Click "Enable Reminders" or "Skip"
↓
Toast notification confirms: "Reminders set for [timing]" (auto-dismisses)

---

## 💾 What Gets Saved

### In Database:
```
✓ Event saved to your calendar
✓ Reminder type selected
✓ Reminder timing chosen
✓ Reminder scheduled time calculated
✓ Status tracked (pending → sent)
```

### Push Notifications:
```
✓ Browser permission stored
✓ Service worker registered
✓ Subscription endpoint saved
✓ Ready to receive browser notifications
```

---

## 🚀 Key Features

### 1. **No More Duplicate Notifications**
Before:
```
❌ "Enable reminders for this event?"
❌ "Added to calendar. Get reminders?"
❌ "Reminders enabled for this event"
(All appearing at same time = confusing!)
```

After:
```
✓ Single notification: "Added to calendar"
✓ Single modal: "Customize Reminders"
✓ Single confirmation: "Reminders set for 24h"
```

### 2. **Auto-Dismissing Toasts**
- Success messages: Disappear after 3 seconds
- Error messages: Disappear after 4 seconds
- Users still see them, but UI stays clean
- Manual close button available if needed

### 3. **Smart Reminders**
Database saves all reminder preferences:
- When to remind (15m, 1h, 24h, 1 week)
- How to remind (push, email, in-app, all)
- Timestamp when reminder should trigger
- Status of reminder (pending/sent/failed)

### 4. **Calendar Sync Options**
Users can export to:
- **Google Calendar**: Clicks button → Opens google.com/calendar with event pre-filled
- **Apple Calendar**: Clicks button → Downloads .ics file (works on iOS/macOS)
- **Any Calendar**: Download .ics and import manually
- **Copy Details**: Copies event info to clipboard

---

## 🔧 Technical Implementation

### Files Changed:
```
src/components/
  ├── JoinTab.tsx ..................... Removed confirm() dialog
  ├── ReminderModal.tsx ............... NEW: Reminder UI
  ├── CalendarSyncMenu.tsx ............ NEW: Sync options
  └── Toast.tsx ....................... Updated auto-dismiss

src/lib/
  ├── eventServices.ts ................ Added reminder functions
  ├── remindersService.ts ............. Enhanced push support
  └── calendarSyncService.ts .......... NEW: Calendar sync

src/hooks/
  └── usePushNotifications.ts ......... NEW: Push notifications hook

public/
  └── service-worker.js ............... NEW: Service worker
```

### Database:
```sql
-- user_calendar_events table now includes:
reminder_enabled BOOLEAN
reminder_type TEXT ('in_app'|'email'|'push'|'all')
reminder_time_before TEXT ('15m'|'1h'|'24h'|'week')

-- New event_reminders table:
user_id, event_id, reminder_scheduled_for, 
reminder_type, status, created_at, etc.

-- New push_subscriptions table:
user_id, endpoint, auth_key, p256dh_key, is_active
```

---

## 🎨 UI Components

### ReminderModal
```
┌─────────────────────────────────────┐
│ × Customize Reminders               │
│                                     │
│ Set up reminders for [Event Title]  │
│                                     │
│ Notification Method:                │
│ ○ 🔔 In-App Notification           │
│ ○ 📧 Email Reminder                │
│ ○ 📱 Push Notification             │
│ ● 🔔 All Methods                   │
│                                     │
│ When to Remind:                     │
│ [Dropdown: 24 hours before ▼]       │
│                                     │
│ Sync to Calendar:                   │
│ [📅 Google] [🍎 Apple] [⬇️ ICS]    │
│                                     │
│ [Skip] [Enable Reminders]           │
└─────────────────────────────────────┘
```

### Toast Notifications
```
// Auto-dismisses after 3 seconds
┌─────────────────────────────────┐
│ ✓ Added to calendar    [×]      │
└─────────────────────────────────┘
```

---

## ⚙️ Configuration

### Push Notifications:
1. Install & register service worker (automatic)
2. Request notification permission (on demand)
3. Create push subscription
4. Save endpoint to database

### Email Reminders:
1. Create edge function: `send-event-reminder-email`
2. Scheduled job processes pending reminders
3. Updates status in database

### Calendar Sync:
1. Client-side only - no backend needed
2. Generates proper iCal format
3. Creates Google Calendar links
4. Downloads .ics files

---

## 📊 Database Schema Changes

### user_calendar_events (updated):
```sql
CREATE TABLE user_calendar_events (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users,
    event_id UUID REFERENCES events,
    added_at TIMESTAMP DEFAULT NOW(),
    
    -- NEW FIELDS:
    reminder_enabled BOOLEAN DEFAULT FALSE,
    reminder_type TEXT DEFAULT 'in_app',
    reminder_time_before TEXT DEFAULT '24h'
);
```

### event_reminders (new):
```sql
CREATE TABLE event_reminders (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users,
    event_id UUID REFERENCES events,
    reminder_scheduled_for TIMESTAMP,
    reminder_sent_at TIMESTAMP NULL,
    reminder_type TEXT,
    status TEXT ('pending'|'sent'|'failed'|'cancelled'),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### push_subscriptions (new):
```sql
CREATE TABLE push_subscriptions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users,
    endpoint TEXT UNIQUE,
    auth_key TEXT,
    p256dh_key TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

---

## ✨ Best Practices Applied

✅ **UX/UI:**
- Single focus point (modal)
- Clear visual hierarchy
- Auto-dismissing notifications
- No dialog blocking

✅ **Data:**
- Proper timestamps for all events
- Status tracking for debugging
- Unique constraints on duplicates
- Soft deletes support

✅ **Performance:**
- Indexed queries
- Lazy loading options
- Efficient service worker
- No blocking operations

✅ **Security:**
- Row-level security on all tables
- User can only access own data
- Service role for backend operations
- No sensitive data in logs

---

## 🧪 Testing Tips

Test the complete flow:
```
1. Sign in
2. Click calendar icon on event
3. Verify "Added to calendar" toast
4. Verify modal appears
5. Select reminder type and timing
6. Click Google Calendar (should open new tab)
7. Click "Enable Reminders"
8. Verify "Reminders set" toast
9. Open calendar filter
10. Event should appear in calendar view
```

Test edge cases:
```
✓ Not signed in → Error toast "Please sign in"
✓ Already in calendar → "Event already in calendar" error
✓ Modal "Skip" button → Just closes modal
✓ Toasts → Auto-dismiss in 3-4 seconds
✓ Sync buttons → Open in new tabs without blocking
```

---

## 🎓 What Users Learn

1. **Consolidated Flow**: One process instead of multiple dialogs
2. **Customizable Reminders**: Choose method and timing
3. **Calendar Integration**: Multiple ways to add to calendar apps
4. **Non-Intrusive UI**: Notifications come and go automatically
5. **Data Persistence**: Choices are saved and remembered

---

## 📝 Summary

The Calendar and Reminders system is now:
- ✅ More intuitive
- ✅ Less cluttered
- ✅ Better organized
- ✅ Fully persistent
- ✅ Production-ready

All features are implemented and ready for testing!
