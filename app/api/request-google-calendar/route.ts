import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend';

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

    // For now, we'll just log the request
    // In production, you would integrate with an email service like SendGrid, Resend, or Nodemailer
    console.log('Google Calendar Access Request:', {
      userEmail: email,
      message: message || 'No additional message',
      timestamp: new Date().toISOString(),
      targetEmail: 'shaqdev2004@gmail.com'
    })

    // Simulate sending email (replace with actual email service)
    const emailData = {
      from: 'shaqdev2004@gmail.com', // You'll need to replace this with your verified domain
      to: 'shaqdev2004@gmail.com',
      subject: 'Google Calendar Access Request',
      text: `Google Calendar Access Request

User Email: ${email}
Request Time: ${new Date().toLocaleString()}
${message ? `Message: ${message}` : ''}

This user is requesting access to Google Calendar sync functionality.`,
      html: `
        <h2>Google Calendar Access Request</h2>
        <p><strong>User Email:</strong> ${email}</p>
        <p><strong>Request Time:</strong> ${new Date().toLocaleString()}</p>
        ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
        <p>This user is requesting access to Google Calendar sync functionality.</p>
      `
    }

    // TODO: Replace this with actual email sending service
    // Example with Resend:
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send(emailData)

    // For development, we'll return success
    return NextResponse.json({
      success: true,
      message: 'Request submitted successfully. You will be contacted soon!'
    })

  } catch (error) {
    console.error('Error processing Google Calendar request:', error)
    return NextResponse.json(
      { error: 'Failed to submit request. Please try again.' },
      { status: 500 }
    )
  }
}
