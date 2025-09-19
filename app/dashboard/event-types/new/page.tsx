import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { EventTypeForm } from "@/components/event-types/event-type-form"

export default async function NewEventTypePage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader user={data.user} profile={profile} />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Create New Event Type</h1>
          <p className="text-slate-600">Set up a new bookable service for your clients.</p>
        </div>

        <EventTypeForm />
      </main>
    </div>
  )
}
