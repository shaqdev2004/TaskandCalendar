# Google Calendar Access Requests System

This system allows users to request Google Calendar access and provides an admin interface to manage these requests using Convex as the database.

## Features

### User Features
- Submit Google Calendar access requests with email and optional message
- Automatic duplicate request prevention
- User-friendly success/error messages

### Admin Features
- View all calendar requests with filtering by status (All, Pending, Approved, Rejected)
- Approve or reject requests with optional admin notes
- Delete requests
- Real-time updates using Convex
- Pending requests counter

## Database Schema

### calendarRequests Table
```typescript
{
  email: string,                    // User's email address
  message?: string,                 // Optional message from user
  status: "pending" | "approved" | "rejected",  // Request status
  requestedAt: string,              // ISO timestamp when request was made
  processedAt?: string,             // ISO timestamp when request was processed
  processedBy?: string,             // Admin user ID who processed the request
  notes?: string,                   // Admin notes about the request
}
```

### Indexes
- `by_email`: Index on email field for finding requests by email
- `by_status`: Index on status field for filtering by status
- `by_requested_at`: Index on requestedAt field for chronological ordering

## API Endpoints

### POST /api/request-google-calendar
Submit a new Google Calendar access request.

**Request Body:**
```json
{
  "email": "user@example.com",
  "message": "Optional message explaining why access is needed"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Your Google Calendar access request has been submitted successfully! We will review your request and get back to you soon."
}
```

**Response (Duplicate Request):**
```json
{
  "error": "A request for this email address is already pending. Please wait for approval.",
  "status": 409
}
```

## Convex Functions

### Mutations
- `createCalendarRequest`: Create a new calendar request
- `updateCalendarRequestStatus`: Update request status (approve/reject)
- `deleteCalendarRequest`: Delete a calendar request

### Queries
- `getAllCalendarRequests`: Get all requests, optionally filtered by status
- `getCalendarRequestsByEmail`: Get requests for a specific email
- `getPendingRequestsCount`: Get count of pending requests

## Components

### CalendarRequestsAdmin
A comprehensive admin interface component that provides:
- Tabbed interface for filtering requests by status
- Request cards showing all relevant information
- Approve/Reject dialogs with admin notes
- Delete functionality
- Real-time updates

## Usage

### For Users
Users can submit requests through the existing Google Calendar sync interface. When they click to request access, the system now stores the request in Convex instead of sending an email.

### For Admins
1. Navigate to `/admin` to access the admin interface
2. View all requests organized by status tabs
3. Click "Approve" or "Reject" on pending requests
4. Add optional admin notes when processing requests
5. Delete requests if needed

## Setup

1. The Convex schema has been updated with the `calendarRequests` table
2. New Convex functions have been added in `convex/calendarRequests.ts`
3. The API route has been updated to use Convex instead of email
4. Admin interface is available at `/admin`

## Benefits

1. **No Email Dependencies**: No need for email service configuration
2. **Real-time Updates**: Admin interface updates in real-time
3. **Better Tracking**: Full audit trail of requests and processing
4. **Scalable**: Uses Convex's scalable database infrastructure
5. **User-friendly**: Better user experience with immediate feedback
6. **Admin Efficiency**: Centralized interface for managing all requests

## Future Enhancements

- Role-based access control for admin functions
- Email notifications when requests are processed
- Bulk operations for processing multiple requests
- Request analytics and reporting
- Integration with actual Google Calendar API for automatic access provisioning
