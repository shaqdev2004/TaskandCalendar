import { GoogleGenAI } from "@google/genai";

function createAIClient() {
  const key = "AIzaSyD-8b9oUsi8bsA5VujO_yFyg5a_TOb5IbQ";
  if (!key) {
    throw new Error('Google AI API key is required. Set GOOGLE_AI_API_KEY environment variable or pass it as parameter.');
  }
  return new GoogleGenAI({ apiKey: key });
}

interface Task {
  title: string;
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:MM format
  endTime?: string; // HH:MM format
  duration?: string;
  location?: string;
  description?: string;
  notes?: string;
  priority?: 'low' | 'medium' | 'high';
  category?: string;
  isAllDay?: boolean;
}

// Helper function to parse and validate dates
function parseAndValidateDate(dateStr: string): string {
  console.log('Parsing date:', dateStr); // Debug logging

  if (!dateStr) {
    const fallbackDate = new Date().toISOString().split('T')[0];
    console.log('No date provided, using today:', fallbackDate);
    return fallbackDate;
  }

  // Handle relative dates
  const today = new Date();
  const dateString = dateStr.toLowerCase().trim();

  if (dateString === 'today') {
    return today.toISOString().split('T')[0];
  }

  if (dateString === 'tomorrow') {
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  if (dateString === 'yesterday') {
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  }

  // Handle "next [day]" format
  if (dateString.startsWith('next ')) {
    const dayName = dateString.replace('next ', '');
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetDay = daysOfWeek.indexOf(dayName);

    if (targetDay !== -1) {
      const currentDay = today.getDay();
      const daysUntilTarget = (targetDay + 7 - currentDay) % 7 || 7;
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + daysUntilTarget);
      return targetDate.toISOString().split('T')[0];
    }
  }

  // Handle "this [day]" format
  if (dateString.startsWith('this ')) {
    const dayName = dateString.replace('this ', '');
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetDay = daysOfWeek.indexOf(dayName);

    if (targetDay !== -1) {
      const currentDay = today.getDay();
      const daysUntilTarget = (targetDay - currentDay + 7) % 7;
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + daysUntilTarget);
      return targetDate.toISOString().split('T')[0];
    }
  }

  // Handle "in X days" format
  if (dateString.includes('in ') && dateString.includes('day')) {
    const match = dateString.match(/in (\d+) days?/);
    if (match) {
      const daysToAdd = parseInt(match[1]);
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + daysToAdd);
      return targetDate.toISOString().split('T')[0];
    }
  }

  // Handle common date formats that might come from AI
  // Check if it's already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const testDate = new Date(dateString);
    if (!isNaN(testDate.getTime())) {
      console.log('Valid YYYY-MM-DD format:', dateString);
      return dateString;
    }
  }

  // Try to parse as a regular date
  try {
    const parsedDate = new Date(dateStr);
    if (!isNaN(parsedDate.getTime())) {
      // If the parsed date is in the past and seems like it should be in the future,
      // adjust the year to current year
      if (parsedDate.getFullYear() < today.getFullYear()) {
        console.log('Adjusting year from', parsedDate.getFullYear(), 'to', today.getFullYear());
        parsedDate.setFullYear(today.getFullYear());
      }

      // If the date is more than 6 months in the past, assume it's meant for next year
      const sixMonthsAgo = new Date(today);
      sixMonthsAgo.setMonth(today.getMonth() - 6);
      if (parsedDate < sixMonthsAgo) {
        console.log('Date is too far in past, moving to next year');
        parsedDate.setFullYear(today.getFullYear() + 1);
      }

      const result = parsedDate.toISOString().split('T')[0];
      console.log('Parsed date result:', result);
      return result;
    }
  } catch (error) {
    console.warn('Failed to parse date:', dateStr, error);
  }

  // Fallback to today
  const fallbackDate = today.toISOString().split('T')[0];
  console.log('Date parsing failed, using today as fallback:', fallbackDate);
  return fallbackDate;
}

// Helper function to validate and clean task data for Convex
function validateTaskForConvex(task: any): any {
  const cleanOptionalString = (value: any): string | undefined => {
    if (value === null || value === undefined || value === '' || value === 'null') {
      return undefined;
    }
    return String(value).trim();
  };

  const validatedTask: any = {
    title: task.title || 'Untitled Task',
    date: parseAndValidateDate(task.date),
    startTime: task.startTime || '09:00',
  };

  // Only add optional fields if they have valid values
  const endTime = cleanOptionalString(task.endTime);
  if (endTime) validatedTask.endTime = endTime;

  const duration = cleanOptionalString(task.duration);
  if (duration) validatedTask.duration = duration;

  const location = cleanOptionalString(task.location);
  if (location) validatedTask.location = location;

  const description = cleanOptionalString(task.description);
  if (description) validatedTask.description = description;

  const notes = cleanOptionalString(task.notes);
  if (notes) validatedTask.notes = notes;

  const category = cleanOptionalString(task.category);
  if (category) validatedTask.category = category;

  // Validate priority
  if (task.priority && ['low', 'medium', 'high'].includes(task.priority)) {
    validatedTask.priority = task.priority;
  }

  // Handle boolean
  if (task.isAllDay !== undefined && task.isAllDay !== null) {
    validatedTask.isAllDay = Boolean(task.isAllDay);
  }

  return validatedTask;
}

// Task parsing function
export async function parseTasks(prompt: string): Promise<Task[]> {
  const ai = createAIClient();

  // Get current date context
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const currentTime = now.toTimeString().slice(0, 5);
  const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
  const monthDay = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: `Parse the following text and extract tasks/events. Return a JSON array of tasks with the following structure:

      CURRENT DATE CONTEXT:
      - Today is ${dayOfWeek}, ${monthDay}
      - Today's date in YYYY-MM-DD format: ${today}
      - Current time: ${currentTime}

      {
        "title": "string (required)",
        "date": "YYYY-MM-DD format (required, use context above for relative dates)",
        "startTime": "HH:MM format (required, if no time mentioned use 09:00)",
        "endTime": "HH:MM format (optional, if duration is mentioned calculate end time)",
        "duration": "string like '1 hour', '30 minutes' (optional)",
        "location": "string (optional)",
        "description": "string (optional)",
        "notes": "string (optional)",
        "priority": "low|medium|high (optional, default medium)",
        "category": "string like 'meeting', 'personal', 'work' (optional)",
        "isAllDay": "boolean (true if no specific time mentioned or if it's an all-day event)"
      }

      IMPORTANT DATE RULES:
      - "today" = ${today}
      - "tomorrow" = ${new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
      - "next Monday", "this Friday" etc. = calculate from today (${today})
      - If no date specified, use today (${today})
      - Always use YYYY-MM-DD format for dates
      - For dates like "March 24", assume current year (${now.getFullYear()}) unless context suggests otherwise
      - If a date seems to be in the past, assume it's meant for the current or next year

      OTHER RULES:
      - If no time is specified, set isAllDay to true
      - If a duration is mentioned, calculate endTime from startTime + duration
      - Extract location if mentioned (e.g., "at the gym", "downtown", "office")
      - Infer category from context (meeting, personal, work, fitness, etc.)
      - Set priority based on urgency words (urgent=high, important=medium, default=low)
      - Handle recurring events by creating separate entries

      Text to parse: "${prompt}"

      Return only the JSON array, no other text.`,
      config: {
        responseMimeType: "application/json"
      }
    });

    const result = response?.text || "[]";
    console.log('AI Response:', result); // Debug logging
    const tasks = JSON.parse(result);

    // Validate and clean up the tasks using the validation function
    const cleanedTasks = tasks.map((task: any, index: number) => {
      console.log(`Raw task ${index}:`, task); // Debug logging
      const validatedTask = validateTaskForConvex(task);
      console.log(`Validated task ${index}:`, validatedTask); // Debug logging
      return validatedTask;
    });

    return cleanedTasks;
    
  } catch (error) {
    console.error('Error parsing tasks:', error);
    throw new Error('Failed to parse tasks. Please try again.');
  }
}

// General structured content function (for other use cases)
export async function generateStructuredContent<T>(
  prompt: string,
  model: string = "gemini-2.0-flash-exp"
): Promise<T> {
  const ai = createAIClient();
  
  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const result = response?.text || "{}";
    return JSON.parse(result);
    
  } catch (error) {
    console.error('Error generating structured content:', error);
    throw new Error('Failed to generate structured content. Please try again.');
  }
}
