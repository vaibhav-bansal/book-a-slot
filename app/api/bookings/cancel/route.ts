import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { createGoogleCalendarService } from "@/lib/google-calendar"

export async function POST(request: NextRequest) {
  try {
    const { bookingId } = await request.json()

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .eq("host_id", user.id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    // Update booking status to cancelled
    const { error: updateError } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", bookingId)

    if (updateError) {
      return NextResponse.json({ error: "Failed to cancel booking" }, { status: 500 })
    }

    // Get associated Google Calendar event
    const { data: calendarEvent } = await supabase
      .from("google_calendar_events")
      .select("*")
      .eq("booking_id", bookingId)
      .single()

    // If there's a Google Calendar event, delete it
    if (calendarEvent) {
      try {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (profile?.google_calendar_connected && profile.google_access_token) {
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
            }
          }

          googleCalendar.setCredentials({
            access_token: accessToken,
            refresh_token: profile.google_refresh_token,
          })

          // Delete the calendar event
          await googleCalendar.deleteEvent(calendarEvent.calendar_id, calendarEvent.google_event_id)

          // Remove the calendar event record
          await supabase.from("google_calendar_events").delete().eq("id", calendarEvent.id)
        }
      } catch (error) {
        console.error("Error deleting Google Calendar event:", error)
        // Don't fail the cancellation if calendar event deletion fails
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error cancelling booking:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
