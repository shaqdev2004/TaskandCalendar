// Helper function to format date for display
export function formatDate(dateString: string): string {
  try {
    // This avoids timezone issues:
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // Creates in local timezone

    
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString; // Return original string if formatting fails
  }
}

// Helper function to format time for display
export function formatTime(timeString: string): string {
  try {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return timeString; // Return original string if formatting fails
  }
}

// Helper function to get the start of the week (Sunday)
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

// Helper function to get all days in a week
export function getWeekDays(startDate: Date): Date[] {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(startDate);
    day.setDate(startDate.getDate() + i);
    days.push(day);
  }
  return days;
}

// Helper function to check if two dates are the same day
export function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

// Helper function to format date as YYYY-MM-DD
export function formatDateForStorage(date: Date): string {
  return date.toISOString().split('T')[0];
}
