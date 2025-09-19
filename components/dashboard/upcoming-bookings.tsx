import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, User } from "lucide-react"
import { format } from "date-fns"

interface UpcomingBookingsProps {
  bookings: any[]
}

export function UpcomingBookings({ bookings }: UpcomingBookingsProps) {
  if (bookings.length === 0) {
    return (
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">Upcoming Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <p className="text-slate-500">No upcoming bookings</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900">Upcoming Bookings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {bookings.map((booking) => (
          <div key={booking.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <User className="h-4 w-4 text-slate-500" />
                <span className="font-medium text-slate-900">{booking.client_name}</span>
                <Badge variant="outline" className="text-xs">
                  {booking.status}
                </Badge>
              </div>
              <div className="flex items-center space-x-4 text-sm text-slate-600">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>{format(new Date(booking.start_time), "MMM d, yyyy")}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{format(new Date(booking.start_time), "h:mm a")}</span>
                </div>
              </div>
              <p className="text-sm text-slate-500 mt-1">{booking.event_types?.title}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
