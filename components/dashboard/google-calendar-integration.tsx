"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, CheckCircle, AlertCircle, ExternalLink } from "lucide-react"
import { toast } from "sonner"

interface GoogleCalendarIntegrationProps {
  isConnected: boolean
  profile: any
}

export function GoogleCalendarIntegration({ isConnected, profile }: GoogleCalendarIntegrationProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      // Redirect to Google OAuth
      window.location.href = "/api/auth/google"
    } catch (error) {
      console.error("Error connecting to Google Calendar:", error)
      toast.error("Failed to connect to Google Calendar")
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    setIsDisconnecting(true)
    try {
      const response = await fetch("/api/google-calendar/disconnect", {
        method: "POST",
      })

      if (response.ok) {
        toast.success("Google Calendar disconnected successfully")
        window.location.reload()
      } else {
        throw new Error("Failed to disconnect")
      }
    } catch (error) {
      console.error("Error disconnecting Google Calendar:", error)
      toast.error("Failed to disconnect Google Calendar")
    } finally {
      setIsDisconnecting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-lg">Google Calendar Integration</CardTitle>
            <CardDescription>
              Sync your availability and automatically create calendar events for bookings
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            {isConnected ? (
              <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
                <AlertCircle className="h-3 w-3 mr-1" />
                Not Connected
              </Badge>
            )}
          </div>
        </div>

        {isConnected && profile?.google_token_expires_at && (
          <div className="text-sm text-slate-600">
            <span className="font-medium">Connected:</span>{" "}
            {new Date(profile.google_token_expires_at).toLocaleDateString()}
          </div>
        )}

        <div className="space-y-3">
          <div className="text-sm text-slate-600">
            <strong>Benefits of connecting:</strong>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>Automatic availability checking from your Google Calendar</li>
              <li>Prevent double-bookings across all your calendars</li>
              <li>Auto-create calendar events for confirmed bookings</li>
              <li>Send calendar invites to your clients</li>
            </ul>
          </div>

          <div className="flex gap-2">
            {isConnected ? (
              <Button
                variant="outline"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
              >
                {isDisconnecting ? "Disconnecting..." : "Disconnect"}
              </Button>
            ) : (
              <Button onClick={handleConnect} disabled={isConnecting} className="bg-blue-600 hover:bg-blue-700">
                <ExternalLink className="h-4 w-4 mr-2" />
                {isConnecting ? "Connecting..." : "Connect Google Calendar"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
