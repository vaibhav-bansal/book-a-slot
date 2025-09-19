"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, User, X } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

interface RecentBookingsProps {
  bookings: any[]
}

export function RecentBookings({ bookings }: RecentBookingsProps) {
  const [cancellingBookings, setCancellingBookings] = useState<Set<string>>(new Set())

  const handleCancelBooking = async (bookingId: string) => {
    setCancellingBookings((prev) => new Set(prev).add(bookingId))

    try {
      const response = await fetch("/api/bookings/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookingId }),
      })

      if (response.ok) {
        toast.success("Booking cancelled successfully")
        window.location.reload()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to cancel booking")
      }
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setCancellingBookings((prev) => {
        const newSet = new Set(prev)
        newSet.delete(bookingId)
        return newSet
      })
    }
  }

  if (bookings.length === 0) {
    return (
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <p className="text-slate-500">No recent bookings</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-slate-100 text-slate-800"
    }
  }

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900">Recent Bookings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {bookings.map((booking) => (
          <div key={booking.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <User className="h-4 w-4 text-slate-500" />
                <span className="font-medium text-slate-900">{booking.client_name}</span>
                <Badge className={`text-xs ${getStatusColor(booking.status)}`}>{booking.status}</Badge>
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
              {booking.client_email && <p className="text-xs text-slate-400 mt-1">{booking.client_email}</p>}
            </div>
            {booking.status === "confirmed" && new Date(booking.start_time) > new Date() && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCancelBooking(booking.id)}
                disabled={cancellingBookings.has(booking.id)}
                className="text-red-600 border-red-200 hover:bg-red-50 ml-4"
              >
                {cancellingBookings.has(booking.id) ? (
                  "Cancelling..."
                ) : (
                  <>
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </>
                )}
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
