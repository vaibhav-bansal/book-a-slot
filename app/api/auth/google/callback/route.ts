import { type NextRequest, NextResponse } from "next/server"
import { createGoogleCalendarService } from "@/lib/google-calendar"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error) {
    return NextResponse.redirect(`${request.nextUrl.origin}/dashboard?error=google_auth_failed`)
  }

  if (!code) {
    return NextResponse.redirect(`${request.nextUrl.origin}/dashboard?error=no_auth_code`)
  }

  try {
    const supabase = createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(`${request.nextUrl.origin}/auth/login`)
    }

    const googleCalendar = createGoogleCalendarService()
    const tokens = await googleCalendar.getTokens(code)

    // Calculate expiry date
    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + (tokens.expiry_date || 3600))

    // Save tokens to user profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token,
        google_token_expires_at: expiresAt.toISOString(),
        google_calendar_connected: true,
      })
      .eq("id", user.id)

    if (updateError) {
      console.error("Error saving Google tokens:", updateError)
      return NextResponse.redirect(`${request.nextUrl.origin}/dashboard?error=token_save_failed`)
    }

    return NextResponse.redirect(`${request.nextUrl.origin}/dashboard?success=google_connected`)
  } catch (error) {
    console.error("Error in Google OAuth callback:", error)
    return NextResponse.redirect(`${request.nextUrl.origin}/dashboard?error=auth_callback_failed`)
  }
}
