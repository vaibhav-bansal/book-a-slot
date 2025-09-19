"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Clock, CheckCircle, Wifi, WifiOff, CalendarIcon } from "lucide-react"
import { format, addDays, startOfDay, addMinutes } from "date-fns"

interface BookingFormProps {
  eventType: any
  availability: any[]
}

interface TimeSlot {
  time: string
  datetime: string
}

export function BookingForm({ eventType, availability }: BookingFormProps) {
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState<string>()
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [availabilitySource, setAvailabilitySource] = useState<string>("database")
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [formData, setFormData] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    notes: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isBooked, setIsBooked] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots(selectedDate)
    } else {
      setAvailableSlots([])
    }
  }, [selectedDate])

  const loadAvailableSlots = async (date: Date) => {
    setLoadingSlots(true)
    setSelectedTime(undefined)

    try {
      const response = await fetch("/api/availability/slots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hostId: eventType.user_id,
          date: date.toISOString(),
          eventTypeId: eventType.id,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setAvailableSlots(data.slots || [])
        setAvailabilitySource(data.source || "database")
      } else {
        setAvailableSlots([])
      }
    } catch (error) {
      console.error("Error loading available slots:", error)
      setAvailableSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDate || !selectedTime) return

    setIsLoading(true)
    setError(null)

    try {
      const selectedSlot = availableSlots.find((slot) => slot.time === selectedTime)
      if (!selectedSlot) {
        throw new Error("Selected time slot is no longer available")
      }

      const startDateTime = new Date(selectedSlot.datetime)
      const endDateTime = addMinutes(startDateTime, eventType.duration)

      const bookingData = {
        event_type_id: eventType.id,
        host_id: eventType.user_id,
        client_name: formData.clientName,
        client_email: formData.clientEmail,
        client_phone: formData.clientPhone || null,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        notes: formData.notes || null,
        status: "confirmed",
        payment_status: eventType.price > 0 ? "pending" : "paid",
      }

      const response = await fetch("/api/bookings/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create booking")
      }

      setIsBooked(true)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (isBooked) {
    return (
      <Card className="border-0 shadow-md">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle className="w-16 h-16 text-green-600 mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Booking Confirmed!</h3>
          <p className="text-slate-600 text-center mb-4">
            Your meeting has been scheduled for {selectedDate && format(selectedDate, "MMMM d, yyyy")} at {selectedTime}
            .
          </p>
          <div className="text-sm text-slate-500 text-center space-y-2">
            <p>You'll receive a confirmation email with the meeting details shortly.</p>
            {availabilitySource === "google_calendar" ? (
              <div className="flex items-center justify-center space-x-2 text-green-600">
                <CalendarIcon className="w-4 h-4" />
                <span>Calendar invite sent to your email</span>
              </div>
            ) : (
              <p className="text-amber-600">
                Note: No automatic calendar invite will be sent as the host hasn't connected their Google Calendar.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <CalendarDays className="w-5 h-5 text-blue-600" />
            <span>Select Date & Time</span>
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {availabilitySource === "google_calendar" ? (
              <>
                <Wifi className="w-3 h-3 mr-1" />
                Live Calendar
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 mr-1" />
                Set Schedule
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date Selection */}
        <div>
          <Label className="text-sm font-medium text-slate-700 mb-3 block">Choose a date</Label>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={(date) => date < startOfDay(new Date()) || date > addDays(new Date(), 60)}
            className="rounded-md border border-slate-200"
          />
        </div>

        {/* Time Selection */}
        {selectedDate && (
          <div>
            <Label className="text-sm font-medium text-slate-700 mb-3 block">Available times</Label>
            {loadingSlots ? (
              <div className="text-center py-8">
                <Clock className="mx-auto h-8 w-8 text-slate-400 mb-2 animate-spin" />
                <p className="text-slate-500">Checking availability...</p>
              </div>
            ) : availableSlots.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {availableSlots.map((slot) => (
                  <Button
                    key={slot.time}
                    variant={selectedTime === slot.time ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTime(slot.time)}
                    className={selectedTime === slot.time ? "bg-blue-600 hover:bg-blue-700" : ""}
                  >
                    {slot.time}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                <p className="text-slate-500">No available times for this date</p>
                <p className="text-xs text-slate-400 mt-1">Try selecting a different date</p>
              </div>
            )}
          </div>
        )}

        {/* Booking Form */}
        {selectedDate && selectedTime && (
          <form onSubmit={handleBooking} className="space-y-4 border-t border-slate-200 pt-6">
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <div className="flex items-center space-x-2 text-blue-800">
                <Clock className="w-4 h-4" />
                <span className="font-medium">
                  {format(selectedDate, "EEEE, MMMM d, yyyy")} at {selectedTime}
                </span>
              </div>
              <p className="text-sm text-blue-600 mt-1">{eventType.duration} minute meeting</p>
              {availabilitySource === "google_calendar" && (
                <p className="text-xs text-green-600 mt-1 flex items-center">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Calendar invite will be sent automatically
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Full Name *</Label>
                <Input
                  id="clientName"
                  placeholder="Your full name"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientEmail">Email *</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientPhone">Phone (Optional)</Label>
              <Input
                id="clientPhone"
                type="tel"
                placeholder="Your phone number"
                value={formData.clientPhone}
                onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Anything you'd like to share about this meeting..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}

            <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700">
              {isLoading ? "Booking..." : eventType.price > 0 ? `Book Meeting - $${eventType.price}` : "Book Meeting"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
