import type { Event } from '../types/events';

/**
 * Generate iCal (ICS) format for an event
 */
export function generateICalEvent(event: Event, userEmail: string = ''): string {
  const eventDate = event.event_date.replace(/-/g, '');
  const eventTime = event.event_time ? event.event_time.replace(/:/g, '') : '000000';

  // Combine date and time
  const startDateTime = eventTime && eventTime !== '000000' ? `${eventDate}T${eventTime}` : `${eventDate}`;

  // Calculate end time (assume 2 hours for all-day events, or use event_time + 1 hour)
  let endDateTime: string;
  if (eventTime && eventTime !== '000000') {
    const startDate = new Date(event.event_date + 'T' + event.event_time);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours after start
    endDateTime =
      endDate.toISOString().split('.')[0].replace(/[-:]/g, '').replace('T', 'T') || `${eventDate}T020000`;
  } else {
    // For all-day events, end date is next day
    const nextDay = new Date(event.event_date);
    nextDay.setDate(nextDay.getDate() + 1);
    endDateTime = nextDay.toISOString().split('T')[0].replace(/-/g, '');
  }

  const uid = `${event.id}@eventapp.example.com`;
  const dtstamp = new Date().toISOString().replace(/[-:.]/g, '').split('Z')[0] + 'Z';

  // Escape special characters in text fields
  const escapeText = (text: string) => {
    return text.replace(/[\n,;\\]/g, (char) => {
      switch (char) {
        case '\n':
          return '\\n';
        case ',':
          return '\\,';
        case ';':
          return '\\;';
        case '\\':
          return '\\\\';
        default:
          return char;
      }
    });
  };

  const icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Event App//EventApp//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Event Calendar
X-WR-TIMEZONE:UTC
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${dtstamp}
DTSTART${eventTime && eventTime !== '000000' ? '' : ';VALUE=DATE'}:${startDateTime}
DTEND${eventTime && eventTime !== '000000' ? '' : ';VALUE=DATE'}:${endDateTime}
SUMMARY:${escapeText(event.title)}
DESCRIPTION:${escapeText(event.description || '')}
LOCATION:${escapeText(event.location || '')}
ORGANIZER;CN=${escapeText(event.organizer_name || event.organizer_specification || 'Organizer')}${userEmail ? `:mailto:${userEmail}` : ''}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;

  return icalContent;
}

/**
 * Download event as ICS file
 */
export function downloadEventAsIcs(event: Event, userEmail: string = ''): void {
  const icalContent = generateICalEvent(event, userEmail);
  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${event.title.replace(/[^\w\s-]/g, '_')}.ics`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Generate Google Calendar add URL
 */
export function generateGoogleCalendarUrl(event: Event): string {
  const startDateTime = event.event_time
    ? new Date(event.event_date + 'T' + event.event_time).toISOString().replace(/[-:.]/g, '').split('Z')[0] + 'Z'
    : new Date(event.event_date + 'T00:00:00').toISOString().replace(/[-:.]/g, '').split('Z')[0] + 'Z';

  const endDateTime = event.event_time
    ? new Date(new Date(event.event_date + 'T' + event.event_time).getTime() + 2 * 60 * 60 * 1000)
        .toISOString()
        .replace(/[-:.]/g, '')
        .split('Z')[0] + 'Z'
    : new Date(new Date(event.event_date).getTime() + 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]
        .replace(/-/g, '') + '';

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${startDateTime}/${endDateTime}`,
    details: `${event.description || ''}\n\nOrganizer: ${event.organizer_name || event.organizer_specification || ''}`,
    location: event.location || '',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Open event in Google Calendar
 */
export function openInGoogleCalendar(event: Event): void {
  const url = generateGoogleCalendarUrl(event);
  window.open(url, '_blank');
}

/**
 * Generate Apple Calendar URL
 */
export function generateAppleCalendarUrl(event: Event): string {
  const icalContent = generateICalEvent(event);
  const encoded = encodeURIComponent(icalContent);
  return `data:text/calendar;charset=utf8,${encoded}`;
}

/**
 * Open event in Apple Calendar (macOS/iOS)
 */
export function openInAppleCalendar(event: Event): void {
  const icalContent = generateICalEvent(event);
  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.click();

  URL.revokeObjectURL(url);
}

/**
 * Copy event details to clipboard in a formatted way
 */
export function copyEventToClipboard(event: Event): boolean {
  const eventDetails = `
${event.title}

Date: ${new Date(event.event_date).toLocaleDateString()}
${event.event_time ? `Time: ${event.event_time}` : ''}
Location: ${event.location || 'TBD'}
Organizer: ${event.organizer_name || event.organizer_specification}

Description:
${event.description || 'No description'}
`.trim();

  navigator.clipboard.writeText(eventDetails).catch(() => false);
  return true;
}

/**
 * Get calendar sync options for an event
 */
export function getCalendarSyncOptions(event: Event): Array<{
  id: string;
  label: string;
  icon: string;
  action: () => void;
}> {
  return [
    {
      id: 'google',
      label: 'Google Calendar',
      icon: '📅',
      action: () => openInGoogleCalendar(event),
    },
    {
      id: 'apple',
      label: 'Apple Calendar',
      icon: '🍎',
      action: () => openInAppleCalendar(event),
    },
    {
      id: 'ics',
      label: 'Download as ICS',
      icon: '⬇️',
      action: () => downloadEventAsIcs(event),
    },
    {
      id: 'copy',
      label: 'Copy Details',
      icon: '📋',
      action: () => copyEventToClipboard(event),
    },
  ];
}
