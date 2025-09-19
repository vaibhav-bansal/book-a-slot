"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Clock, DollarSign, Edit, MoreHorizontal, Trash2, Copy, ExternalLink } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface EventTypesListProps {
  eventTypes: any[]
}

export function EventTypesList({ eventTypes }: EventTypesListProps) {
  const [localEventTypes, setLocalEventTypes] = useState(eventTypes)
  const supabase = createClient()
  const router = useRouter()

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from("event_types").update({ is_active: !currentStatus }).eq("id", id)

    if (!error) {
      setLocalEventTypes((prev) => prev.map((et) => (et.id === id ? { ...et, is_active: !currentStatus } : et)))
    }
  }

  const deleteEventType = async (id: string) => {
    if (confirm("Are you sure you want to delete this event type?")) {
      const { error } = await supabase.from("event_types").delete().eq("id", id)

      if (!error) {
        setLocalEventTypes((prev) => prev.filter((et) => et.id !== id))
      }
    }
  }

  const copyBookingLink = (id: string) => {
    const bookingUrl = `${window.location.origin}/book/${id}`
    navigator.clipboard.writeText(bookingUrl)
    // You could add a toast notification here
  }

  if (localEventTypes.length === 0) {
    return (
      <Card className="border-0 shadow-md">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No event types yet</h3>
          <p className="text-slate-600 text-center mb-6 max-w-md">
            Create your first event type to start accepting bookings from clients.
          </p>
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href="/dashboard/event-types/new">Create Event Type</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {localEventTypes.map((eventType) => (
        <Card key={eventType.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg font-semibold text-slate-900 mb-1">{eventType.title}</CardTitle>
                <p className="text-sm text-slate-600 line-clamp-2">{eventType.description}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/event-types/${eventType.id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => copyBookingLink(eventType.id)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Link
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/book/${eventType.id}`} target="_blank">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Preview
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => deleteEventType(eventType.id)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4 text-sm text-slate-600">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{eventType.duration}min</span>
                </div>
                {eventType.price > 0 && (
                  <div className="flex items-center space-x-1">
                    <DollarSign className="h-4 w-4" />
                    <span>${eventType.price}</span>
                  </div>
                )}
              </div>
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: eventType.color }} title="Event color" />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={eventType.is_active}
                  onCheckedChange={() => toggleActive(eventType.id, eventType.is_active)}
                />
                <span className="text-sm text-slate-600">{eventType.is_active ? "Active" : "Inactive"}</span>
              </div>
              <Badge variant={eventType.is_active ? "default" : "secondary"} className="text-xs">
                {eventType.is_active ? "Live" : "Draft"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
