# Feedback System Documentation

The feedback system allows users to submit feedback about their experience using the app, with all feedback stored in the Convex database for admin review and management.

## Features

### User Features
- **Submit Feedback**: Users can submit feedback with a title and message
- **Character Limits**: 
  - Title: 100 characters maximum
  - Message: 500 characters maximum with real-time counter
- **Optional Email**: Users can optionally provide their email for follow-up
- **Real-time Validation**: Form validation with immediate feedback
- **Success/Error Messages**: Clear feedback on submission status

### Admin Features
- **Comprehensive Dashboard**: View all feedback organized by status
- **Status Management**: Mark feedback as reviewed or resolved
- **Admin Notes**: Add notes when processing feedback
- **Filtering**: Filter feedback by status (New, Reviewed, Resolved)
- **Delete Functionality**: Remove feedback entries
- **Real-time Updates**: Automatic updates using Convex
- **Feedback Counts**: See counts for each status category

## Database Schema

### feedback Table
```typescript
{
  title: string,                    // Feedback title (max 100 chars)
  message: string,                  // Feedback message (max 500 chars)
  submittedAt: string,              // ISO timestamp when submitted
  userId?: string,                  // Optional user ID if authenticated
  userEmail?: string,               // Optional email provided by user
  status: "new" | "reviewed" | "resolved",  // Current status
  adminNotes?: string,              // Admin notes when processing
  reviewedAt?: string,              // ISO timestamp when reviewed
  reviewedBy?: string,              // Admin user ID who reviewed
}
```

### Indexes
- `by_status`: Index on status field for filtering
- `by_submitted_at`: Index on submittedAt field for chronological ordering
- `by_user`: Index on userId field for user-specific queries

## API Endpoints

### POST /api/feedback
Submit new feedback.

**Request Body:**
```json
{
  "title": "Feedback title (required, max 100 chars)",
  "message": "Feedback message (required, max 500 chars)",
  "userEmail": "user@example.com (optional)"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Thank you for your feedback! We appreciate your input and will review it soon."
}
```

**Response (Validation Error):**
```json
{
  "error": "Message cannot exceed 500 characters"
}
```

## Convex Functions

### Mutations
- `createFeedback`: Create new feedback with validation
- `updateFeedbackStatus`: Update feedback status (reviewed/resolved)
- `deleteFeedback`: Delete feedback entry

### Queries
- `getAllFeedback`: Get all feedback, optionally filtered by status
- `getUserFeedback`: Get feedback submitted by current user
- `getFeedbackCounts`: Get counts of feedback by status

## Components

### FeedbackForm (`/feedback`)
User-facing feedback submission form with:
- Title input (100 char limit)
- Message textarea (500 char limit with counter)
- Optional email input
- Real-time validation
- Success/error alerts
- Character count indicators

### FeedbackAdmin (Admin Dashboard)
Admin interface for managing feedback:
- Tabbed interface for status filtering
- Feedback cards with full details
- Status update dialogs with admin notes
- Delete functionality with confirmation
- Real-time updates
- Responsive design

## Navigation

### Sidebar Integration
- Added "Feedback" link to sidebar secondary navigation
- Uses MessageSquare icon from Lucide React
- Accessible at `/feedback` route

### Admin Dashboard
- Integrated into admin dashboard at `/admin`
- Tabbed interface alongside calendar requests
- Separate tab for feedback management

## Validation Rules

### Client-side Validation
- Title: Required, max 100 characters
- Message: Required, max 500 characters
- Email: Optional, valid email format if provided
- Real-time character counting
- Form submission disabled when invalid

### Server-side Validation
- Title: Required, trimmed, max 100 characters
- Message: Required, trimmed, max 500 characters
- Email: Optional, valid format if provided
- Duplicate validation not required (users can submit multiple feedback)

## Status Workflow

1. **New**: Initial status when feedback is submitted
2. **Reviewed**: Admin has reviewed the feedback (optional step)
3. **Resolved**: Feedback has been addressed/resolved

Admins can move feedback directly from "New" to "Resolved" or go through "Reviewed" first.

## Usage Examples

### Submit Feedback (User)
1. Navigate to `/feedback` from sidebar
2. Fill in title and message
3. Optionally provide email
4. Click "Submit Feedback"
5. Receive confirmation message

### Manage Feedback (Admin)
1. Navigate to `/admin`
2. Click "Feedback" tab
3. View feedback organized by status
4. Click "Mark as Reviewed" or "Mark as Resolved"
5. Add optional admin notes
6. Confirm status change

## Benefits

1. **User Engagement**: Easy way for users to provide feedback
2. **Centralized Management**: All feedback in one place
3. **Status Tracking**: Clear workflow for processing feedback
4. **Real-time Updates**: Immediate updates without page refresh
5. **Validation**: Prevents spam and ensures quality feedback
6. **Audit Trail**: Complete history of feedback processing
7. **Scalable**: Built on Convex's robust infrastructure

## Future Enhancements

- Email notifications when feedback is processed
- Feedback categories/tags
- User feedback history page
- Feedback analytics and reporting
- Integration with support ticket systems
- Bulk operations for admin efficiency
- Feedback voting/rating system
