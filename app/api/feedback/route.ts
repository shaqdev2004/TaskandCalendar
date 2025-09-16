import { NextRequest, NextResponse } from 'next/server'
import { ConvexHttpClient } from "convex/browser"
import { api } from "@/convex/_generated/api"

export async function POST(request: NextRequest) {
  try {
    const { title, message, userEmail } = await request.json()

    // Validate required fields
    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      )
    }

    // Validate title length
    if (title.length > 100) {
      return NextResponse.json(
        { error: 'Title cannot exceed 100 characters' },
        { status: 400 }
      )
    }

    // Validate message length (500 character limit)
    if (message.length > 500) {
      return NextResponse.json(
        { error: 'Message cannot exceed 500 characters' },
        { status: 400 }
      )
    }

    // Email validation if provided
    if (userEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(userEmail)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        )
      }
    }

    // Initialize Convex client
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

    // Store the feedback in Convex database
    try {
      await convex.mutation(api.feedback.createFeedback, {
        title: title.trim(),
        message: message.trim(),
        userEmail: userEmail?.trim() || undefined,
      })

      console.log('Feedback submitted:', {
        title: title.trim(),
        messageLength: message.trim().length,
        userEmail: userEmail?.trim() || 'anonymous',
        timestamp: new Date().toISOString(),
      })
    } catch (convexError: any) {
      console.error('Convex error:', convexError)
      return NextResponse.json(
        { error: convexError.message || 'Failed to submit feedback' },
        { status: 500 }
      )
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Thank you for your feedback! We appreciate your input and will review it soon.'
    })

  } catch (error) {
    console.error('Error processing feedback:', error)
    return NextResponse.json(
      { error: 'Failed to submit feedback. Please try again.' },
      { status: 500 }
    )
  }
}
