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
    date: task.date || new Date().toISOString().split('T')[0],
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
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: `Parse the following text and extract tasks/events. Return a JSON array of tasks with the following structure:
      
      {
        "title": "string (required)",
        "date": "YYYY-MM-DD format (required, if no date mentioned use today's date)",
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
      
      Rules:
      - If no date is specified, use today's date
      - If no time is specified, set isAllDay to true
      - If a duration is mentioned, calculate endTime from startTime + duration
      - Extract location if mentioned (e.g., "at the gym", "downtown", "office")
      - Infer category from context (meeting, personal, work, fitness, etc.)
      - Set priority based on urgency words (urgent=high, important=medium, default=low)
      - Parse relative dates like "tomorrow", "next Monday", "this Friday"
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
