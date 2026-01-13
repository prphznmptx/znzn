# Event Soft Delete & Visibility Management System

## 🎯 Overview

This system allows independent management of event visibility in two interfaces:
- **My Events** (user's private dashboard)
- **Join Tab** (public event directory)

Events remain in the Supabase database at all times. Users can hide/show events independently in each interface without deleting them from the database.

## 🗄️ Database Schema

### New Columns in `events` Table

```sql
-- Visibility tracking
is_visible_in_my_events BOOLEAN NOT NULL DEFAULT TRUE
deleted_from_my_events_at TIMESTAMP WITH TIME ZONE

is_visible_in_join_tab BOOLEAN NOT NULL DEFAULT FALSE
deleted_from_join_tab_at TIMESTAMP WITH TIME ZONE

-- Media columns
image_url TEXT
thumbnail_url TEXT
```

### What This Means

| Column | Purpose | Default |
|--------|---------|---------|
| `is_visible_in_my_events` | Shows in user's My Events section | TRUE |
| `deleted_from_my_events_at` | Timestamp when user hid from My Events | NULL |
| `is_visible_in_join_tab` | Shows in public Join tab | FALSE |
| `deleted_from_join_tab_at` | Timestamp when user removed from Join tab | NULL |

## 🔄 Event Lifecycle

### Creating an Event

```
User clicks "Create Event"
  ↓
Fills form and submits
  ↓
Event saved to database with:
  - is_visible_in_my_events = TRUE ✓
  - is_visible_in_join_tab = FALSE (draft)
  ↓
Event appears in "My Events" section
```

### Publishing an Event

```
User clicks "Publish" in My Events
  ↓
RPC function `publish_event_to_join_tab()` called
  ↓
Event updated:
  - is_visible_in_join_tab = TRUE
  - is_published = TRUE
  - published_at = NOW()
  - deleted_from_join_tab_at = NULL
  ↓
Event now visible in Join tab for everyone
```

### Removing from My Events

```
User clicks delete in "My Events"
  ↓
RPC function `hide_event_from_my_events()` called
  ↓
Event updated:
  - is_visible_in_my_events = FALSE
  - deleted_from_my_events_at = NOW()
  ↓
Event hidden from My Events BUT:
  - Stays in database ✓
  - Still visible in Join tab (if published)
```

### Removing from Join Tab

```
User clicks menu → Remove from Join
  ↓
RPC function `hide_event_from_join_tab()` called
  ↓
Event updated:
  - is_visible_in_join_tab = FALSE
  - is_published = FALSE
  - deleted_from_join_tab_at = NOW()
  ↓
Event hidden from Join tab BUT:
  - Stays in database ✓
  - Still visible in My Events (if not hidden there)
```

## 🎯 User Flows

### Scenario 1: Create & Publish Event

```
1. User goes to Organize tab
2. Clicks "Create Event"
3. Fills form: title, date, location, etc.
4. Clicks "Create Event"
   → Event appears in My Events (is_visible_in_my_events = TRUE)
5. Clicks "Publish" on event card
   → Event appears in Join tab (is_visible_in_join_tab = TRUE)
6. Other users see event in Join tab
7. Creator still sees in My Events
```

### Scenario 2: Creator Removes from Join Tab

```
While viewing Join tab:
1. Creator sees three-dot menu on their own event
2. Clicks menu → "Remove from Join"
3. Confirmation dialog appears
4. Confirms removal
   → Event disappears from Join tab
   → Event still in My Events
   → Database record unchanged
5. Event still shows in creator's My Events
6. Creator can republish anytime
```

### Scenario 3: Creator Removes from My Events

```
In My Events section:
1. Creator clicks delete icon
2. Confirmation dialog: "Remove from My Events? (keeps in database)"
3. Confirms
   → Event disappears from My Events
   → Event may still be in Join tab
   → Database record unchanged
4. Later, user can restore via admin function if needed
```

### Scenario 4: Event Published, Then Removed from My Events

```
Event state progression:
- Created → is_visible_in_my_events=TRUE, is_visible_in_join_tab=FALSE
- Published → is_visible_in_my_events=TRUE, is_visible_in_join_tab=TRUE
- User hides from My Events → is_visible_in_my_events=FALSE, is_visible_in_join_tab=TRUE
- Result: Event only visible in Join tab to public, not in creator's My Events
```

## 🔐 RLS Policies

### For My Events
```sql
-- Users see only their own events that are visible in My Events
WHERE auth.uid() = organizer_id AND is_visible_in_my_events = TRUE
```

### For Join Tab
```sql
-- Public sees only published events visible in Join tab
WHERE is_visible_in_join_tab = TRUE AND is_published = TRUE
```

## 🖼️ Image Uploads

### Backblaze B2 Folder Structure

Events use this folder hierarchy:
```
events/[event-id]/[filename]
├── events/
│   ├── 550e8400-e29b-41d4-a716-446655440000/
│   │   ├── 1672531200000-event-image.jpg
│   │   ├── 1672531205000-thumbnail.jpg
│   │   └── 1672531210000-banner.png
│   └── 550e8400-e29b-41d4-a716-446655440001/
│       ├── 1672531300000-event-image.jpg
│       └── ...
```

### Upload Function

```typescript
// Upload image to B2
const { url, error } = await uploadEventImage(file, eventId);

// Save URL to event record
if (url) {
  const { success } = await updateEventImage(eventId, userId, url, false);
}
```

### Folder Naming Convention

| Folder | Purpose | Example |
|--------|---------|---------|
| `events/[id]/` | Event images | `events/550e8400-e29b-41d4-a716-446655440000/` |

## 📝 Component Changes

### EventCard.tsx
- Added `onEventUpdated` callback prop
- Imported and integrated `EventCreatorMenu` component
- Shows creator menu only to event creator

### EventCreatorMenu.tsx (NEW)
- Displays options menu (three dots) to creator only
- Options:
  - Edit Event (future)
  - Remove from Join Tab
- Uses soft delete RPC functions
- Triggers refresh on successful deletion

### JoinTab.tsx
- Loads events from `getPublishedEvents()`
- Filters show only `is_visible_in_join_tab = TRUE` events
- Passes `onEventUpdated` to EventCard for refresh

### OrganizeTab.tsx
- Updated delete to use `hideEventFromMyEvents()`
- Shows soft delete (not permanent delete)
- Loads My Events from `getUserEvents()` with `is_visible_in_my_events = TRUE`

## 🔧 SQL Setup

Run this migration:
```sql
-- From supabase/014_event_visibility_management.sql
```

This creates:
- New visibility columns
- RPC functions for soft deletes
- Updated RLS policies
- Proper indexes for queries

## 📊 Query Examples

### Get all events for user's My Events
```sql
SELECT * FROM events
WHERE organizer_id = $1
AND is_visible_in_my_events = TRUE
ORDER BY created_at DESC;
```

### Get published events for Join tab
```sql
SELECT * FROM events
WHERE is_visible_in_join_tab = TRUE
AND is_published = TRUE
ORDER BY event_date ASC;
```

### Check if event is visible in Join tab
```sql
SELECT * FROM events
WHERE id = $1
AND is_visible_in_join_tab = TRUE;
```

## 🎨 User Interface

### My Events
```
[Event Card]
├── Title, Date, Location
├── Actions:
│   ├── Publish (if not published)
│   ├── Add Services
│   └── Delete (hides from My Events)
└── Status: Draft | Published
```

### Join Tab
```
[Event Card]
├── Image
├── Title, Speaker, Details
├── Creator menu (visible to creator only):
│   ├── Edit Event
│   └── Remove from Join
└── User actions: Register, Share, Calendar
```

## ✅ Testing Checklist

- [ ] Create event → appears in My Events ✓
- [ ] Publish event → appears in Join tab ✓
- [ ] Delete from My Events → hides from My Events but stays in database
- [ ] View Join tab → don't see own delete option if not creator
- [ ] Creator in Join tab → sees three-dot menu
- [ ] Click remove from Join → event disappears from Join tab
- [ ] Check database → record still exists after deletions
- [ ] Restore event → can re-publish if was published before
- [ ] Multiple users → only creator sees their own menu options
- [ ] Upload image → saved to events/[id]/ folder in B2

## 🔄 API Functions

### In `eventServices.ts`

```typescript
// Hide from My Events (soft delete)
hideEventFromMyEvents(eventId: string, userId: string)

// Hide from Join Tab (unpublish)
hideEventFromJoinTab(eventId: string, userId: string)

// Restore to My Events
restoreEventToMyEvents(eventId: string, userId: string)

// Upload image
uploadEventImage(file: File, eventId: string)

// Update image URL
updateEventImage(eventId: string, userId: string, imageUrl: string, isThumbnail?: boolean)
```

## 📱 Mobile Considerations

- Menu icon (three dots) scales properly on mobile
- Touch-friendly button sizes
- Confirmation dialogs on destructive actions
- Loading states prevent accidental double-clicks

## 🚀 Future Enhancements

1. **Restore Function** - Admin ability to restore deleted events
2. **Archive Events** - Separate archiving from deletion
3. **Event Drafts** - Save drafts without publishing
4. **Bulk Operations** - Publish/delete multiple events
5. **Audit Log** - Track all visibility changes
6. **Scheduled Publishing** - Publish events at specific time

## 🐛 Troubleshooting

### Event not showing in My Events after creation
- Check: `is_visible_in_my_events = TRUE` in database
- Check: User is logged in and is the organizer
- Check: RLS policy allows SELECT

### Event not showing in Join tab after publish
- Check: `is_visible_in_join_tab = TRUE` in database
- Check: `is_published = TRUE` in database
- Check: Browser cache/reload page

### Can't remove event from Join tab
- Check: User is the event creator
- Check: Event has `organizer_id` matching user ID
- Check: Network request successful

### Images not uploading
- Check: B2 credentials configured
- Check: Folder path is `events/[id]/`
- Check: File size under limit
- Check: Supported file type

## 📖 Documentation References

- SQL Migration: `supabase/014_event_visibility_management.sql`
- Event Services: `src/lib/eventServices.ts`
- Components: `src/components/EventCard.tsx`, `EventCreatorMenu.tsx`
- Types: `src/types/events.ts`
