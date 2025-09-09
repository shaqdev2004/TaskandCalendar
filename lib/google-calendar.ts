export class GoogleCalendarAPI {
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  async createEvent(event: {
    summary: string
    description?: string
    start: { dateTime: string; timeZone: string } | { date: string }
    end: { dateTime: string; timeZone: string } | { date: string }
    location?: string
  }) {
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Google Calendar API error: ${error.error?.message || 'Unknown error'}`)
    }

    return response.json()
  }

  async updateEvent(eventId: string, event: any) {
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Google Calendar API error: ${error.error?.message || 'Unknown error'}`)
    }

    return response.json()
  }

  async deleteEvent(eventId: string) {
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Google Calendar API error: ${error.error?.message || 'Unknown error'}`)
    }

    return true
  }

  static async refreshToken(refreshToken: string): Promise<string> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })

    const tokens = await response.json()

    if (!response.ok) {
      throw new Error(tokens.error_description || 'Failed to refresh token')
    }

    return tokens.access_token
  }
}

// Helper function to convert task to Google Calendar event format
export function taskToGoogleEvent(task: {
  title: string
  date: string
  startTime: string
  endTime?: string
  description?: string
  location?: string
  isAllDay?: boolean
}) {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

  if (task.isAllDay) {
    return {
      summary: task.title,
      description: task.description,
      location: task.location,
      start: { date: task.date },
      end: { date: task.date },
    }
  }

  const startDateTime = `${task.date}T${task.startTime}:00`
  const endDateTime = task.endTime
    ? `${task.date}T${task.endTime}:00`
    : `${task.date}T${addHour(task.startTime)}:00`

  return {
    summary: task.title,
    description: task.description,
    location: task.location,
    start: { dateTime: startDateTime, timeZone },
    end: { dateTime: endDateTime, timeZone },
  }
}

// Helper function to add an hour to a time string
function addHour(timeString: string): string {
  const [hours, minutes] = timeString.split(':').map(Number)
  const newHours = (hours + 1) % 24
  return `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}