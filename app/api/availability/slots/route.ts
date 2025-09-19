import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { createGoogleCalendarService } from "@/lib/google-calendar"
import { format, addMinutes, isAfter, isBefore, startOfDay, endOfDay } from "date-fns"

export async function POST(request: NextRequest) {
  try {
    const { hostId, date, eventTypeId } = await request.json()

    if (!hostId || !date || !eventTypeId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Get event type details
    const { data: eventType, error: eventTypeError } = await supabase
      .from("event_types")
      .select("*")
      .eq("id", eventTypeId)
      .single()

    if (eventTypeError || !eventType) {
      return NextResponse.json({ error: "Event type not found" }, { status: 404 })
    }

    // Get host's availability for the day
    const selectedDate = new Date(date)
    const dayOfWeek = selectedDate.getDay()

    const { data: availability } = await supabase
      .from("availability")
      .select("*")
      .eq("user_id", hostId)
      .eq("day_of_week", dayOfWeek)
      .eq("is_available", true)

    if (!availability || availability.length === 0) {
      return NextResponse.json({ slots: [] })
    }

    // Generate potential time slots
    const potentialSlots: string[] = []
    const now = new Date()

    availability.forEach((avail) => {
      const startTime = new Date(`${format(selectedDate, "yyyy-MM-dd")}T${avail.start_time}`)
      const endTime = new Date(`${format(selectedDate, "yyyy-MM-dd")}T${avail.end_time}`)

      let currentSlot = startTime
      while (
        isBefore(addMinutes(currentSlot, eventType.duration), endTime) ||
        currentSlot.getTime() === endTime.getTime()
      ) {
        // Only show future time slots
        if (isAfter(currentSlot, now)) {
          potentialSlots.push(currentSlot.toISOString())
        }
        currentSlot = addMinutes(currentSlot, 30) // 30-minute intervals
      }
    })

    // Get host's profile for Google Calendar integration
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", hostId).single()

    // Check existing bookings in database
    const { data: existingBookings } = await supabase
      .from("bookings")
      .select("start_time, end_time")
      .eq("host_id", hostId)
      .gte("start_time", startOfDay(selectedDate).toISOString())
      .lte("end_time", endOfDay(selectedDate).toISOString())
      .eq("status", "confirmed")

    // Filter out slots that conflict with existing bookings
    let availableSlots = potentialSlots.filter((slotTime) => {
      const slotStart = new Date(slotTime)
      const slotEnd = addMinutes(slotStart, eventType.duration)

      return !existingBookings?.some((booking) => {
        const bookingStart = new Date(booking.start_time)
        const bookingEnd = new Date(booking.end_time)

        // Check for overlap
        return slotStart < bookingEnd && slotEnd > bookingStart
      })
    })

    // If Google Calendar is connected, check against Google Calendar
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
          }
        }

        googleCalendar.setCredentials({
          access_token: accessToken,
          refresh_token: profile.google_refresh_token,
        })

        const calendars = await googleCalendar.getCalendars()
        const primaryCalendar = calendars.find((cal) => cal.primary) || calendars[0]

        if (primaryCalendar) {
          // Check each slot against Google Calendar
          const googleAvailableSlots = []

          for (const slotTime of availableSlots) {
            const slotStart = new Date(slotTime)
            const slotEnd = addMinutes(slotStart, eventType.duration)

            try {
              const isAvailable = await googleCalendar.checkAvailability(
                primaryCalendar.id,
                slotStart.toISOString(),
                slotEnd.toISOString(),
              )

              if (isAvailable) {
                googleAvailableSlots.push(slotTime)
              }
            } catch (error) {
              // If individual slot check fails, include it (fail open)
              googleAvailableSlots.push(slotTime)
            }
          }

          availableSlots = googleAvailableSlots
        }
      } catch (error) {
        console.error("Error checking Google Calendar slots:", error)
        // Continue with database-only availability
      }
    }

    // Format slots for display
    const formattedSlots = availableSlots.map((slotTime) => ({
      time: format(new Date(slotTime), "HH:mm"),
      datetime: slotTime,
    }))

    return NextResponse.json({
      slots: formattedSlots,
      source: profile?.google_calendar_connected ? "google_calendar" : "database",
    })
  } catch (error) {
    console.error("Error getting available slots:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
