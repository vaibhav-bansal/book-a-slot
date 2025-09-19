import { google } from "googleapis"

export interface GoogleCalendarConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
}

export class GoogleCalendarService {
  private oauth2Client: any

  constructor(config: GoogleCalendarConfig) {
    this.oauth2Client = new google.auth.OAuth2(config.clientId, config.clientSecret, config.redirectUri)
  }

  // Generate OAuth URL for user consent
  getAuthUrl(): string {
    const scopes = [
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/calendar.events",
    ]

    return this.oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "consent",
    })
  }

  // Exchange authorization code for tokens
  async getTokens(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code)
    return tokens
  }

  // Set credentials for API calls
  setCredentials(tokens: any) {
    this.oauth2Client.setCredentials(tokens)
  }

  // Check if tokens need refresh
  async refreshTokensIfNeeded(refreshToken: string, expiresAt: Date) {
    if (new Date() >= expiresAt) {
      this.oauth2Client.setCredentials({
        refresh_token: refreshToken,
      })

      const { credentials } = await this.oauth2Client.refreshAccessToken()
      return credentials
    }
    return null
  }

  // Get user's calendar list
  async getCalendars() {
    const calendar = google.calendar({ version: "v3", auth: this.oauth2Client })
    const response = await calendar.calendarList.list()
    return response.data.items || []
  }

  // Check availability for a specific time range
  async checkAvailability(calendarId: string, startTime: string, endTime: string) {
    const calendar = google.calendar({ version: "v3", auth: this.oauth2Client })

    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: startTime,
        timeMax: endTime,
        items: [{ id: calendarId }],
      },
    })

    const busyTimes = response.data.calendars?.[calendarId]?.busy || []
    return busyTimes.length === 0 // true if available, false if busy
  }

  // Create a calendar event
  async createEvent(
    calendarId: string,
    eventDetails: {
      summary: string
      description?: string
      start: { dateTime: string; timeZone: string }
      end: { dateTime: string; timeZone: string }
      attendees?: { email: string }[]
    },
  ) {
    const calendar = google.calendar({ version: "v3", auth: this.oauth2Client })

    const response = await calendar.events.insert({
      calendarId,
      requestBody: eventDetails,
    })

    return response.data
  }

  // Delete a calendar event
  async deleteEvent(calendarId: string, eventId: string) {
    const calendar = google.calendar({ version: "v3", auth: this.oauth2Client })

    await calendar.events.delete({
      calendarId,
      eventId,
    })
  }
}

// Utility function to create service instance
export function createGoogleCalendarService(): GoogleCalendarService {
  return new GoogleCalendarService({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/auth/google/callback`,
  })
}
