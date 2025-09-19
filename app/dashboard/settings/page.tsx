import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { GoogleCalendarIntegration } from "@/components/dashboard/google-calendar-integration"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Fetch user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader user={data.user} profile={profile} />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Settings</h1>
          <p className="text-slate-600">Manage your account settings and integrations.</p>
        </div>

        <div className="space-y-8">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Email</label>
                  <p className="text-slate-900">{data.user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Full Name</label>
                  <p className="text-slate-900">{profile?.full_name || "Not set"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Company</label>
                  <p className="text-slate-900">{profile?.company || "Not set"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Timezone</label>
                  <p className="text-slate-900">{profile?.timezone || "UTC"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Integrations */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Integrations</h2>
            <GoogleCalendarIntegration isConnected={profile?.google_calendar_connected || false} profile={profile} />
          </div>
        </div>
      </main>
    </div>
  )
}
