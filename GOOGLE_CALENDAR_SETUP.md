# Google Calendar Integration Setup Guide

This guide will help you set up Google Calendar integration for your task management application.

## Prerequisites

1. A Google Cloud Platform (GCP) account
2. Your application running locally or deployed
3. Environment variables properly configured

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID for later use

## Step 2: Enable Google Calendar API

1. In the Google Cloud Console, navigate to **APIs & Services** > **Library**
2. Search for "Google Calendar API"
3. Click on it and press **Enable**

## Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. If prompted, configure the OAuth consent screen first:
   - Choose **External** user type
   - Fill in the required fields (App name, User support email, Developer contact)
   - Add your domain to authorized domains if deployed
   - Add the following scopes:
     - `https://www.googleapis.com/auth/calendar`
4. For the OAuth client ID:
   - Choose **Web application**
   - Add authorized redirect URIs:
     - For local development: `http://localhost:3000/google-calendar-callback`
     - For production: `https://yourdomain.com/google-calendar-callback`
5. Download the credentials JSON file

## Step 4: Configure Environment Variables

Add the following to your `.env.local` file:

```env
# Google Calendar Integration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_from_credentials_json
GOOGLE_CLIENT_SECRET=your_client_secret_from_credentials_json
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # or your production URL
```

## Step 5: Test the Integration

1. Start your development server: `npm run dev`
2. Navigate to your application
3. Go to the Home page where the Google Calendar sync component is displayed
4. Click "Connect Google Calendar"
5. Complete the OAuth flow
6. Try syncing some tasks

## Features

### Automatic Task Syncing
- Tasks are automatically synced to your primary Google Calendar
- Each task becomes a calendar event with proper start/end times
- All-day events are supported for tasks without specific times

### Sync Status Tracking
- **Synced**: Task has been successfully synced to Google Calendar
- **Pending**: Task is waiting to be synced
- **Error**: Task failed to sync (check console for details)

### Real-time Updates
- Tasks are updated in real-time using Convex mutations
- Sync status is persisted in the database
- Google Calendar event IDs are stored for future updates

## API Endpoints

### `/api/parse-event/auth/google-calendar` (POST)
Handles the OAuth callback and exchanges authorization code for access tokens.

**Request Body:**
```json
{
  "code": "authorization_code_from_google"
}
```

**Response:**
```json
{
  "access_token": "access_token",
  "refresh_token": "refresh_token",
  "expires_in": 3600
}
```

## Database Schema

The following fields are added to the tasks table:

```typescript
{
  googleEventId?: string,        // Google Calendar event ID
  lastSyncedAt?: string,         // ISO timestamp of last sync
  syncStatus?: "pending" | "synced" | "error"  // Current sync status
}
```

## Security Considerations

### Token Storage
- Access tokens are currently stored in localStorage for simplicity
- For production, consider storing tokens securely on the server
- Implement token refresh logic for long-term usage

### Scopes
- The integration only requests calendar read/write permissions
- No access to other Google services or personal data

### Error Handling
- Failed syncs are logged and marked with error status
- Users can retry failed syncs manually
- Network errors are handled gracefully

## Troubleshooting

### Common Issues

1. **"Unauthorized" errors**
   - Check that your OAuth credentials are correct
   - Verify redirect URIs match exactly
   - Ensure the Google Calendar API is enabled

2. **"Invalid redirect URI" errors**
   - Make sure redirect URIs in Google Cloud Console match your application URLs
   - Include both HTTP and HTTPS versions if needed

3. **Token expiration**
   - Implement refresh token logic for production use
   - Current implementation requires re-authentication after token expires

4. **Sync failures**
   - Check browser console for detailed error messages
   - Verify task data is complete (title, date, time)
   - Ensure Google Calendar API quotas aren't exceeded

### Debug Mode

Enable debug logging by adding to your environment:

```env
NODE_ENV=development
```

This will log detailed information about API calls and responses.

## Production Deployment

### Environment Variables
Update your production environment with:
- Correct `NEXT_PUBLIC_SITE_URL`
- Production OAuth credentials
- Secure token storage implementation

### OAuth Consent Screen
- Submit your app for verification if needed
- Add privacy policy and terms of service URLs
- Configure proper branding and descriptions

### Rate Limits
- Google Calendar API has rate limits
- Implement proper error handling and retry logic
- Consider batching operations for large numbers of tasks

## Support

For issues with this integration:
1. Check the browser console for error messages
2. Verify all environment variables are set correctly
3. Test the OAuth flow in an incognito window
4. Check Google Cloud Console for API usage and errors
