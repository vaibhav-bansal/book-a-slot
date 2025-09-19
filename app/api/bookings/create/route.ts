import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { createGoogleCalendarService } from "@/lib/google-calendar"

export async function POST(request: NextRequest) {
  try {
    const bookingData = await request.json()

    const supabase = createServerClient()

    // Create the booking in the database
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert([bookingData])
      .select("*, event_types(*)")
      .single()

    if (bookingError) {
      console.error("Error creating booking:", bookingError)
      return NextResponse.json({ error: "Failed to create booking" }, { status: 500 })
    }

    // Get host's profile for Google Calendar integration
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", booking.host_id).single()

    // If Google Calendar is connected, create calendar event
    if (profile?.google_calendar_connected && profile.google_access_token) {
      try {
        const googleCalendar = createGoogleCalendarService()

        // Handle token refresh if needed
        let accessToken = profile.google_access_token
        if (profile.google_token_expires_at && new Date() >= new Date(profile.google_token_expires_at)) {
          const newTokens = await googleCalendar.refreshTokensIfNeeded(
            profile.google_refresh_token,
            new Date(profile.google_token_expires_at),
          )
          if (newTokens) {
            accessToken = newTokens.access_token
            // Update tokens in database
            await supabase
              .from("profiles")
              .update({
                google_access_token: newTokens.access_token,
                google_refresh_token: newTokens.refresh_token || profile.google_refresh_token,
                google_token_expires_at: new Date(Date.now() + (newTokens.expiry_date || 3600) * 1000).toISOString(),
              })
              .eq("id", booking.host_id)
          }
        }

        googleCalendar.setCredentials({
          access_token: accessToken,
          refresh_token: profile.google_refresh_token,
        })

        // Get primary calendar
        const calendars = await googleCalendar.getCalendars()
        const primaryCalendar = calendars.find((cal) => cal.primary) || calendars[0]

        if (primaryCalendar) {
          // Create calendar event
          const eventDetails = {
            summary: `${booking.event_types.title} - ${booking.client_name}`,
            description: `Meeting with ${booking.client_name} (${booking.client_email})${
              booking.notes ? `\n\nNotes: ${booking.notes}` : ""
            }\n\nBooked via your booking platform`,
            start: {
              dateTime: booking.start_time,
              timeZone: profile.timezone || "UTC",
            },
            end: {
              dateTime: booking.end_time,
              timeZone: profile.timezone || "UTC",
            },
            attendees: [
              {
                email: booking.client_email,
              },
            ],
          }

          const calendarEvent = await googleCalendar.createEvent(primaryCalendar.id, eventDetails)

          // Store the Google Calendar event ID for future reference
          if (calendarEvent.id) {
            await supabase.from("google_calendar_events").insert([
              {
                user_id: booking.host_id,
                booking_id: booking.id,
                google_event_id: calendarEvent.id,
                calendar_id: primaryCalendar.id,
              },
            ])

            // Update booking with meeting link if provided by Google
            if (calendarEvent.hangoutLink) {
              await supabase.from("bookings").update({ meeting_link: calendarEvent.hangoutLink }).eq("id", booking.id)
            }
          }
        }
      } catch (error) {
        console.error("Error creating Google Calendar event:", error)
        // Don't fail the booking if calendar event creation fails
      }
    }

    return NextResponse.json({ booking, success: true })
  } catch (error) {
    console.error("Error in booking creation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
