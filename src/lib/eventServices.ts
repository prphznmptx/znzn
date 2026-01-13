import { supabase } from './supabase';
import type { CreateEventFormData, Event, EventServiceBooking } from '../types/events';

/**
 * Create a new event in Supabase database
 */
export async function createEvent(
  userId: string,
  organizerName: string,
  formData: CreateEventFormData
): Promise<{ event: Event; error: null } | { event: null; error: string }> {
  try {
    const { data, error } = await supabase
      .from('events')
      .insert({
        title: formData.eventName,
        description: formData.description,
        event_date: formData.eventDate,
        event_time: formData.eventTime,
        location: formData.location,
        organizer_id: userId,
        organizer_name: organizerName,
        organizer_specification: formData.organizerSpecification,
        capacity: formData.estimatedGuests,
        price: 0,
        attractions: formData.attractions ? formData.attractions.split(',').map(a => a.trim()) : [],
        features: formData.features || [],
        is_livestream: formData.isLivestream,
        livestream_url: formData.livestreamLink || null,
        category: 'business',
        status: 'upcoming',
        is_published: false,
      })
      .select()
      .single();

    if (error) {
      return { event: null, error: error.message };
    }

    return { event: data as Event, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { event: null, error: errorMessage };
  }
}

/**
 * Fetch all events created by a specific user (for My Events tab)
 * Only returns events not deleted from My Events
 */
export async function getUserEvents(userId: string): Promise<Event[]> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('organizer_id', userId)
      .eq('is_visible_in_my_events', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user events:', error);
      return [];
    }

    return (data || []) as Event[];
  } catch (err) {
    console.error('Error in getUserEvents:', err);
    return [];
  }
}

/**
 * Fetch all published events (for Join tab) - visible to all users including non-logged-in
 */
export async function getPublishedEvents(): Promise<Event[]> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('is_visible_in_join_tab', true)
      .eq('is_published', true)
      .order('event_date', { ascending: true });

    if (error) {
      console.error('Error fetching published events:', error);
      return [];
    }

    return (data || []) as Event[];
  } catch (err) {
    console.error('Error in getPublishedEvents:', err);
    return [];
  }
}

/**
 * Publish an event (make it visible in Join tab to all users including non-logged-in)
 */
export async function publishEvent(
  eventId: string,
  userId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('events')
      .update({
        is_published: true,
        is_visible_in_join_tab: true,
        is_visible_in_my_events: true,
        published_at: new Date().toISOString(),
      })
      .eq('id', eventId)
      .eq('organizer_id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Update an event
 */
export async function updateEvent(
  eventId: string,
  userId: string,
  updates: Partial<CreateEventFormData>
): Promise<{ success: boolean; error: string | null }> {
  try {
    const updateData: Record<string, any> = {};

    if (updates.eventName) updateData.title = updates.eventName;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.eventDate) updateData.event_date = updates.eventDate;
    if (updates.eventTime) updateData.event_time = updates.eventTime;
    if (updates.location) updateData.location = updates.location;
    if (updates.estimatedGuests) updateData.capacity = updates.estimatedGuests;
    if (updates.budget !== undefined) updateData.price = updates.budget;
    if (updates.organizerSpecification !== undefined) updateData.organizer_specification = updates.organizerSpecification;
    if (updates.attractions !== undefined) updateData.attractions = updates.attractions ? updates.attractions.split(',').map(a => a.trim()).filter(a => a) : [];
    if (updates.features) updateData.features = updates.features;
    if (updates.isLivestream !== undefined) updateData.is_livestream = updates.isLivestream;
    if (updates.livestreamLink) updateData.livestream_url = updates.livestreamLink;

    updateData.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', eventId)
      .eq('organizer_id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Hide event from My Events (soft delete - keeps in database)
 */
export async function hideEventFromMyEvents(
  eventId: string,
  userId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('events')
      .update({
        is_visible_in_my_events: false,
        deleted_from_my_events_at: new Date().toISOString(),
      })
      .eq('id', eventId)
      .eq('organizer_id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Hide event from Join tab (unpublish - keeps in database and in My Events)
 */
export async function hideEventFromJoinTab(
  eventId: string,
  userId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('events')
      .update({
        is_visible_in_join_tab: false,
        is_published: false,
        deleted_from_join_tab_at: new Date().toISOString(),
      })
      .eq('id', eventId)
      .eq('organizer_id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Restore event to My Events (undo soft delete)
 */
export async function restoreEventToMyEvents(
  eventId: string,
  userId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('events')
      .update({
        is_visible_in_my_events: true,
        deleted_from_my_events_at: null,
      })
      .eq('id', eventId)
      .eq('organizer_id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Book service providers for an event
 */
export async function bookEventServices(
  eventId: string,
  userId: string,
  bookings: Array<{
    providerId: string;
    providerName: string;
    providerCategory: string;
    quantity: number;
    basePrice: number;
  }>
): Promise<{ success: boolean; error: string | null }> {
  try {
    const bookingData = bookings.map(booking => ({
      event_id: eventId,
      user_id: userId,
      provider_id: booking.providerId,
      provider_name: booking.providerName,
      provider_category: booking.providerCategory,
      quantity: booking.quantity,
      base_price: booking.basePrice,
      total_price: booking.basePrice * booking.quantity,
      booking_status: 'pending',
    }));

    const { error } = await supabase
      .from('event_service_bookings')
      .insert(bookingData);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Get service bookings for a specific event
 */
export async function getEventServiceBookings(eventId: string): Promise<EventServiceBooking[]> {
  try {
    const { data, error } = await supabase
      .from('event_service_bookings')
      .select('*')
      .eq('event_id', eventId)
      .eq('booking_status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching event service bookings:', error);
      return [];
    }

    return (data || []) as EventServiceBooking[];
  } catch (err) {
    console.error('Error in getEventServiceBookings:', err);
    return [];
  }
}

/**
 * Update a service booking status
 */
export async function updateServiceBooking(
  bookingId: string,
  userId: string,
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('event_service_bookings')
      .update({ booking_status: status })
      .eq('id', bookingId)
      .eq('user_id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Cancel a service booking
 */
export async function cancelServiceBooking(
  bookingId: string,
  userId: string
): Promise<{ success: boolean; error: string | null }> {
  return updateServiceBooking(bookingId, userId, 'cancelled');
}

/**
 * Get total booking cost for an event
 */
export async function getEventBookingTotal(eventId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .rpc('calculate_event_booking_total_cost', { p_event_id: eventId });

    if (error) {
      console.error('Error calculating total cost:', error);
      return 0;
    }

    return data || 0;
  } catch (err) {
    console.error('Error in getEventBookingTotal:', err);
    return 0;
  }
}

/**
 * Upload event image to Backblaze B2
 */
export async function uploadEventImage(
  file: File,
  eventId: string
): Promise<{ url: string | null; error: string | null }> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    // Folder structure: events/[eventId]/[filename]
    const timestamp = Date.now();
    const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '-');
    const filename = `events/${eventId}/${timestamp}-${safeFilename}`;
    formData.append('filename', filename);
    formData.append('contentType', file.type || 'image/jpeg');

    // Call the edge function to upload to B2
    const { data, error } = await supabase.functions.invoke('upload-to-b2', {
      body: formData,
    });

    if (error) {
      console.error('Upload error:', error);
      return { url: null, error: typeof error === 'string' ? error : error?.message || 'Upload failed' };
    }

    if (!data || !data.publicUrl) {
      console.error('No URL in response:', data);
      return { url: null, error: 'No URL returned from B2' };
    }

    return { url: data.publicUrl, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Upload failed';
    console.error('Upload exception:', errorMessage);
    return { url: null, error: errorMessage };
  }
}

/**
 * Update event image URL in database
 */
export async function updateEventImage(
  eventId: string,
  userId: string,
  imageUrl: string,
  isThumbnail: boolean = false
): Promise<{ success: boolean; error: string | null }> {
  try {
    const updateData = isThumbnail
      ? { thumbnail_url: imageUrl }
      : { image_url: imageUrl };

    const { error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', eventId)
      .eq('organizer_id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Add an event to user's calendar
 */
export async function addEventToCalendar(
  userId: string,
  eventId: string,
  reminderEnabled: boolean = false
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('user_calendar_events')
      .insert({
        user_id: userId,
        event_id: eventId,
        reminder_enabled: reminderEnabled,
      });

    if (error) {
      // If error is due to duplicate (UNIQUE constraint), it means event is already in calendar
      if (error.code === '23505') {
        return { success: false, error: 'Event is already in your calendar' };
      }
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Remove an event from user's calendar
 */
export async function removeEventFromCalendar(
  userId: string,
  eventId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('user_calendar_events')
      .delete()
      .eq('user_id', userId)
      .eq('event_id', eventId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Get all events in user's calendar
 */
export async function getUserCalendarEvents(userId: string): Promise<Event[]> {
  try {
    const { data, error } = await supabase
      .from('user_calendar_events')
      .select(`
        event_id,
        events (*)
      `)
      .eq('user_id', userId)
      .order('added_at', { ascending: false });

    if (error) {
      console.error('Error fetching calendar events:', error);
      return [];
    }

    // Extract event objects from the joined data
    return (data || []).map((item: any) => item.events).filter(Boolean) as Event[];
  } catch (err) {
    console.error('Error in getUserCalendarEvents:', err);
    return [];
  }
}

/**
 * Check if an event is in user's calendar
 */
export async function isEventInUserCalendar(
  userId: string,
  eventId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_calendar_events')
      .select('id')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .maybeSingle();

    if (error) {
      console.error('Error checking calendar event:', error);
      return false;
    }

    return !!data;
  } catch (err) {
    console.error('Error in isEventInUserCalendar:', err);
    return false;
  }
}

/**
 * Enable reminders for a calendar event
 */
export async function enableEventReminder(
  userId: string,
  eventId: string,
  reminderType: 'in_app' | 'email' | 'push' | 'all' = 'in_app',
  reminderBefore: '15m' | '1h' | '24h' | 'week' = '24h'
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('user_calendar_events')
      .update({
        reminder_enabled: true,
        reminder_type: reminderType,
        reminder_time_before: reminderBefore,
      })
      .eq('user_id', userId)
      .eq('event_id', eventId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Disable reminders for a calendar event
 */
export async function disableEventReminder(
  userId: string,
  eventId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('user_calendar_events')
      .update({
        reminder_enabled: false,
      })
      .eq('user_id', userId)
      .eq('event_id', eventId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(
  userId: string,
  subscription: PushSubscription
): Promise<{ success: boolean; error: string | null }> {
  try {
    const subscriptionJson = subscription.toJSON();

    const { error } = await supabase
      .from('push_subscriptions')
      .insert({
        user_id: userId,
        endpoint: subscriptionJson.endpoint,
        auth_key: subscriptionJson.keys?.auth || '',
        p256dh_key: subscriptionJson.keys?.p256dh || '',
      })
      .onConflict('user_id,endpoint')
      .update({
        auth_key: subscriptionJson.keys?.auth || '',
        p256dh_key: subscriptionJson.keys?.p256dh || '',
        is_active: true,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(
  userId: string,
  endpoint: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('push_subscriptions')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('endpoint', endpoint);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Calculate reminder scheduled time
 */
function calculateReminderScheduledFor(
  eventDate: string,
  eventTime: string | null | undefined,
  reminderBefore: '15m' | '1h' | '24h' | 'week'
): Date {
  const eventDateTime = eventTime
    ? new Date(eventDate + 'T' + eventTime)
    : new Date(eventDate + 'T00:00:00');

  const reminderMap: Record<string, number> = {
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    'week': 7 * 24 * 60 * 60 * 1000,
  };

  const reminderMs = reminderMap[reminderBefore] || reminderMap['24h'];
  return new Date(eventDateTime.getTime() - reminderMs);
}

/**
 * Send email reminder to user (via edge function)
 */
export async function sendEmailReminder(
  userId: string,
  eventId: string,
  event: Event
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { data, error } = await supabase.functions.invoke('send-event-reminder-email', {
      body: {
        userId,
        eventId,
        eventTitle: event.title,
        eventDate: event.event_date,
        eventTime: event.event_time,
        eventLocation: event.location,
        organizerName: event.organizer_name || event.organizer_specification,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error sending email reminder:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Create reminders for an event
 */
export async function createEventReminders(
  userId: string,
  eventId: string,
  event: Event,
  reminderType: 'in_app' | 'email' | 'push' | 'all',
  reminderBefore: '15m' | '1h' | '24h' | 'week'
): Promise<{ success: boolean; error: string | null }> {
  try {
    // Update the user_calendar_events table with reminder settings
    const updateResult = await supabase
      .from('user_calendar_events')
      .update({
        reminder_enabled: true,
        reminder_type: reminderType,
        reminder_time_before: reminderBefore,
      })
      .eq('user_id', userId)
      .eq('event_id', eventId);

    if (updateResult.error) {
      return { success: false, error: updateResult.error.message };
    }

    // Create reminders for each type if applicable
    const reminderScheduledFor = calculateReminderScheduledFor(
      event.event_date,
      event.event_time,
      reminderBefore
    );

    // Determine which reminder types to create
    const remindersToCreate: Array<{
      user_id: string;
      event_id: string;
      reminder_scheduled_for: string;
      reminder_type: string;
      status: string;
    }> = [];

    if (reminderType === 'all' || reminderType === 'in_app') {
      remindersToCreate.push({
        user_id: userId,
        event_id: eventId,
        reminder_scheduled_for: reminderScheduledFor.toISOString(),
        reminder_type: 'in_app',
        status: 'pending',
      });
    }

    if (reminderType === 'all' || reminderType === 'email') {
      remindersToCreate.push({
        user_id: userId,
        event_id: eventId,
        reminder_scheduled_for: reminderScheduledFor.toISOString(),
        reminder_type: 'email',
        status: 'pending',
      });
    }

    if (reminderType === 'all' || reminderType === 'push') {
      remindersToCreate.push({
        user_id: userId,
        event_id: eventId,
        reminder_scheduled_for: reminderScheduledFor.toISOString(),
        reminder_type: 'push',
        status: 'pending',
      });
    }

    // Insert reminders, ignoring duplicates
    if (remindersToCreate.length > 0) {
      const { error: reminderError } = await supabase
        .from('event_reminders')
        .insert(remindersToCreate);

      // Ignore duplicate key errors (23505) as they're expected
      if (reminderError && reminderError.code !== '23505') {
        console.error('Error creating reminders:', reminderError);
      }
    }

    return { success: true, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}
