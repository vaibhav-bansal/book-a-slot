import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { createGoogleCalendarService } from "@/lib/google-calendar"

export async function POST(request: NextRequest) {
  try {
    const { hostId, startTime, endTime } = await request.json()

    if (!hostId || !startTime || !endTime) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Get host's profile with Google Calendar tokens
    const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", hostId).single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "Host not found" }, { status: 404 })
    }

    // Check if Google Calendar is connected
    if (!profile.google_calendar_connected || !profile.google_access_token) {
      // Fall back to database availability only
      return NextResponse.json({ available: true, source: "database" })
    }

    // Check if tokens need refresh
    const googleCalendar = createGoogleCalendarService()
    let accessToken = profile.google_access_token

    if (profile.google_token_expires_at && new Date() >= new Date(profile.google_token_expires_at)) {
      try {
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
            .eq("id", hostId)
        }
      } catch (error) {
        console.error("Error refreshing tokens:", error)
        return NextResponse.json({ available: true, source: "database" })
      }
    }

    // Set credentials and check availability
    googleCalendar.setCredentials({
      access_token: accessToken,
      refresh_token: profile.google_refresh_token,
    })

    try {
      // Get primary calendar ID
      const calendars = await googleCalendar.getCalendars()
      const primaryCalendar = calendars.find((cal) => cal.primary) || calendars[0]

      if (!primaryCalendar) {
        return NextResponse.json({ available: true, source: "database" })
      }

      // Check availability in Google Calendar
      const isAvailable = await googleCalendar.checkAvailability(primaryCalendar.id, startTime, endTime)

      return NextResponse.json({
        available: isAvailable,
        source: "google_calendar",
        calendarId: primaryCalendar.id,
      })
    } catch (error) {
      console.error("Error checking Google Calendar availability:", error)
      // Fall back to database availability
      return NextResponse.json({ available: true, source: "database" })
    }
  } catch (error) {
    console.error("Error in availability check:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
