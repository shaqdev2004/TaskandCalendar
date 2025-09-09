import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { code } = await req.json()
    
    // Add validation for required fields
    if (!code) {
      return NextResponse.json({ error: 'Authorization code is required' }, { status: 400 })
    }

    // Validate environment variables
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.NEXT_PUBLIC_SITE_URL) {
      console.error('Missing required environment variables:', {
        GOOGLE_CLIENT_ID: !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
        NEXT_PUBLIC_SITE_URL: !!process.env.NEXT_PUBLIC_SITE_URL
      });
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Log the client ID (first few characters only for security)
    console.log('Using Google Client ID:', process.env.GOOGLE_CLIENT_ID?.substring(0, 10) + '...');

    const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/google-calendar-callback`;
    
    console.log('OAuth request details:', {
      clientId: process.env.GOOGLE_CLIENT_ID,
      redirectUri,
      codeLength: code.length,
      // Don't log the actual code or secret for security
    });

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    })

    const tokens = await tokenResponse.json()
    
    // Enhanced error logging
    if (!tokenResponse.ok) {
      console.error('Google OAuth token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: tokens.error,
        errorDescription: tokens.error_description,
        errorUri: tokens.error_uri
      });
      
      // Return more specific error messages based on Google's error codes
      let errorMessage = 'Failed to authenticate with Google';
      
      switch (tokens.error) {
        case 'invalid_grant':
          errorMessage = 'Authorization code is invalid or expired. Please try again.';
          break;
        case 'invalid_client':
          errorMessage = 'Invalid client credentials. Check your Google OAuth configuration.';
          break;
        case 'invalid_request':
          errorMessage = 'Invalid request parameters. Check your OAuth implementation.';
          break;
        case 'unauthorized_client':
          errorMessage = 'Client not authorized for this grant type.';
          break;
        default:
          if (tokens.error_description) {
            errorMessage = tokens.error_description;
          }
      }
      
      return NextResponse.json({ 
        error: errorMessage,
        details: tokens.error 
      }, { status: 400 })
    }

    // Validate that we received the expected tokens
    if (!tokens.access_token) {
      console.error('No access token received:', tokens);
      return NextResponse.json({ error: 'No access token received from Google' }, { status: 500 })
    }

    console.log('OAuth success - tokens received');

    // Store tokens securely (you might want to encrypt these)
    // For now, we'll return them to be handled on the client side
    return NextResponse.json({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in,
      token_type: tokens.token_type,
      scope: tokens.scope
    })

  } catch (error) {
    console.error('Google OAuth error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error
    })
    
    return NextResponse.json(
      { error: 'Failed to authenticate with Google' },
      { status: 500 }
    )
  }
}