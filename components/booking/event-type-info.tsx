import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Clock, DollarSign } from "lucide-react"

interface EventTypeInfoProps {
  eventType: any
}

export function EventTypeInfo({ eventType }: EventTypeInfoProps) {
  const getInitials = (name: string) => {
    return name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-start space-x-4 mb-6">
        <Avatar className="w-16 h-16">
          <AvatarImage src={eventType.profiles?.avatar_url || "/placeholder.svg"} alt={eventType.profiles?.full_name} />
          <AvatarFallback className="bg-blue-100 text-blue-600 text-lg">
            {eventType.profiles?.full_name ? getInitials(eventType.profiles.full_name) : "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">{eventType.profiles?.full_name || "Professional"}</h1>
          {eventType.profiles?.company && <p className="text-slate-600 mb-2">{eventType.profiles.company}</p>}
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: eventType.color }} />
            <span className="text-sm text-slate-600">Available for booking</span>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-3">{eventType.title}</h2>
        {eventType.description && <p className="text-slate-600 mb-4">{eventType.description}</p>}

        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <span className="text-slate-600">{eventType.duration}min</span>
          </div>
          {eventType.price > 0 && (
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-slate-500" />
              <span className="text-slate-600">${eventType.price}</span>
            </div>
          )}
          <Badge variant="outline" className="text-xs">
            Online Meeting
          </Badge>
        </div>
      </div>
    </div>
  )
}
