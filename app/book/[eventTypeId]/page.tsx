import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { BookingForm } from "@/components/booking/booking-form"
import { EventTypeInfo } from "@/components/booking/event-type-info"
import { GoogleCalendarStatus } from "@/components/booking/google-calendar-status"
import { Calendar, Clock, DollarSign } from "lucide-react"

interface BookingPageProps {
  params: Promise<{ eventTypeId: string }>
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { eventTypeId } = await params
  const supabase = await createClient()

  // Fetch event type with user profile
  const { data: eventType } = await supabase
    .from("event_types")
    .select(
      `
      *,
      profiles!event_types_user_id_fkey (
        full_name,
        company,
        avatar_url
      )
    `,
    )
    .eq("id", eventTypeId)
    .eq("is_active", true)
    .single()

  if (!eventType) {
    notFound()
  }

  // Fetch user availability
  const { data: availability } = await supabase
    .from("availability")
    .select("*")
    .eq("user_id", eventType.user_id)
    .eq("is_available", true)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Event Type Information */}
          <div className="space-y-6">
            <EventTypeInfo eventType={eventType} />

            <GoogleCalendarStatus hostId={eventType.user_id} hostName={eventType.profiles?.full_name || "The host"} />

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">What to expect</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-slate-600">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span>{eventType.duration} minute meeting</span>
                </div>
                <div className="flex items-center space-x-3 text-slate-600">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span>Video call via provided link</span>
                </div>
                {eventType.price > 0 && (
                  <div className="flex items-center space-x-3 text-slate-600">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                    <span>${eventType.price} per session</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Booking Form */}
          <div>
            <BookingForm eventType={eventType} availability={availability || []} />
          </div>
        </div>
      </div>
    </div>
  )
}
