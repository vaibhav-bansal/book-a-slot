import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Clear Google Calendar tokens from profile
    const { error } = await supabase
      .from("profiles")
      .update({
        google_access_token: null,
        google_refresh_token: null,
        google_token_expires_at: null,
        google_calendar_connected: false,
      })
      .eq("id", user.id)

    if (error) {
      console.error("Error disconnecting Google Calendar:", error)
      return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in Google Calendar disconnect:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
