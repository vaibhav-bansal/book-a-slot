"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, CheckCircle, AlertCircle } from "lucide-react"

interface GoogleCalendarStatusProps {
  hostId: string
  hostName: string
}

export function GoogleCalendarStatus({ hostId, hostName }: GoogleCalendarStatusProps) {
  const [calendarStatus, setCalendarStatus] = useState<{
    connected: boolean
    loading: boolean
  }>({
    connected: false,
    loading: true,
  })

  useEffect(() => {
    checkCalendarStatus()
  }, [hostId])

  const checkCalendarStatus = async () => {
    try {
      const response = await fetch(`/api/calendar/status?hostId=${hostId}`)
      if (response.ok) {
        const data = await response.json()
        setCalendarStatus({
          connected: data.connected,
          loading: false,
        })
      }
    } catch (error) {
      console.error("Error checking calendar status:", error)
      setCalendarStatus({
        connected: false,
        loading: false,
      })
    }
  }

  if (calendarStatus.loading) {
    return null
  }

  return (
    <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-slate-900">Calendar Integration</span>
            </div>
            {calendarStatus.connected ? (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                <AlertCircle className="w-3 h-3 mr-1" />
                Not Connected
              </Badge>
            )}
          </div>
        </div>
        <p className="text-sm text-slate-600 mt-2">
          {calendarStatus.connected ? (
            <>
              {hostName} has connected their Google Calendar. Your meeting will be automatically added to both calendars
              with a calendar invite sent to your email.
            </>
          ) : (
            <>
              {hostName} hasn't connected their Google Calendar yet. You'll still receive booking confirmation, but no
              automatic calendar invite will be sent.
            </>
          )}
        </p>
      </CardContent>
    </Card>
  )
}
