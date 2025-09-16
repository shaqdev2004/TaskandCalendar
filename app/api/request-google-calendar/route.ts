import { NextRequest, NextResponse } from 'next/server'
import { ConvexHttpClient } from "convex/browser"
import { api } from "@/convex/_generated/api"

export async function POST(request: NextRequest) {
  try {
    const { email, message } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Initialize Convex client
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

    // Store the request in Convex database
    try {
      await convex.mutation(api.calendarRequests.createCalendarRequest, {
        email: email,
        message: message || undefined,
      })

      console.log('Google Calendar Access Request stored:', {
        userEmail: email,
        message: message || 'No additional message',
        timestamp: new Date().toISOString(),
      })
    } catch (convexError: any) {
      // Handle duplicate request error
      if (convexError.message?.includes('pending request already exists')) {
        return NextResponse.json(
          { error: 'A request for this email address is already pending. Please wait for approval.' },
          { status: 409 }
        )
      }
      throw convexError
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Your Google Calendar access request has been submitted successfully! We will review your request and get back to you soon.'
    })

  } catch (error) {
    console.error('Error processing Google Calendar request:', error)
    return NextResponse.json(
      { error: 'Failed to submit request. Please try again.' },
      { status: 500 }
    )
  }
}
