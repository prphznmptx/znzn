import type { Event } from '../types/events';

/**
 * Check if an event should be visible in the Join tab
 * Events should be hidden 1 hour after their event date
 * This only affects UI visibility, database records remain intact
 */
export function isEventVisibleInJoinTab(event: Event): boolean {
  // First check the visibility flag
  if (!event.is_visible_in_join_tab || !event.is_published) {
    return false;
  }

  // Parse event date
  const eventDateTime = new Date(event.event_date);
  
  // If no event time is specified, use end of day (23:59)
  if (event.event_time) {
    const [hours, minutes] = event.event_time.split(':');
    eventDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  } else {
    eventDateTime.setHours(23, 59, 59, 999);
  }

  // Calculate cutoff time (1 hour after event time)
  const cutoffTime = new Date(eventDateTime.getTime() + 60 * 60 * 1000); // Add 1 hour

  // Get current time
  const now = new Date();

  // If current time is past the cutoff, hide from UI
  if (now > cutoffTime) {
    return false;
  }

  return true;
}

/**
 * Filter events to only show those visible in Join tab
 */
export function filterJoinTabEvents(events: Event[]): Event[] {
  return events.filter(event => isEventVisibleInJoinTab(event));
}
