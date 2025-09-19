import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const hostId = searchParams.get("hostId")

    if (!hostId) {
      return NextResponse.json({ error: "Host ID is required" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Get host's profile to check Google Calendar connection
    const { data: profile } = await supabase
      .from("profiles")
      .select("google_calendar_connected, google_access_token")
      .eq("id", hostId)
      .single()

    const connected = !!(profile?.google_calendar_connected && profile.google_access_token)

    return NextResponse.json({ connected })
  } catch (error) {
    console.error("Error checking calendar status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
