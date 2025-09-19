import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { RecentBookings } from "@/components/dashboard/recent-bookings"
import { UpcomingBookings } from "@/components/dashboard/upcoming-bookings"
import { GoogleCalendarIntegration } from "@/components/dashboard/google-calendar-integration"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Fetch user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

  // Fetch dashboard stats
  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, event_types(title)")
    .eq("host_id", data.user.id)
    .order("created_at", { ascending: false })

  const { data: eventTypes } = await supabase.from("event_types").select("*").eq("user_id", data.user.id)

  const today = new Date()
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)

  const upcomingBookings = bookings?.filter((booking) => new Date(booking.start_time) >= today) || []
  const thisMonthBookings =
    bookings?.filter((booking) => {
      const bookingDate = new Date(booking.start_time)
      return bookingDate >= thisMonth && bookingDate < nextMonth
    }) || []

  const stats = {
    totalBookings: bookings?.length || 0,
    thisMonthBookings: thisMonthBookings.length,
    upcomingBookings: upcomingBookings.length,
    activeEventTypes: eventTypes?.filter((et) => et.is_active).length || 0,
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader user={data.user} profile={profile} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Welcome back, {profile?.full_name || data.user.email}
          </h1>
          <p className="text-slate-600">Here's what's happening with your bookings today.</p>
        </div>

        <DashboardStats stats={stats} />

        <div className="mt-8">
          <GoogleCalendarIntegration isConnected={profile?.google_calendar_connected || false} profile={profile} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <UpcomingBookings bookings={upcomingBookings.slice(0, 5)} />
          <RecentBookings bookings={bookings?.slice(0, 5) || []} />
        </div>
      </main>
    </div>
  )
}
