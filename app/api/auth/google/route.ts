import { type NextRequest, NextResponse } from "next/server"
import { createGoogleCalendarService } from "@/lib/google-calendar"

export async function GET(request: NextRequest) {
  try {
    const googleCalendar = createGoogleCalendarService()
    const authUrl = googleCalendar.getAuthUrl()

    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error("Error generating Google auth URL:", error)
    return NextResponse.json({ error: "Failed to generate authorization URL" }, { status: 500 })
  }
}
