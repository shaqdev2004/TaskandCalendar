import { GoogleGenAI, Type } from "@google/genai";

// Initialize the AI client (you might want to pass API key as parameter)
const ai = new GoogleGenAI({ apiKey: "AIzaSyD-8b9oUsi8bsA5VujO_yFyg5a_TOb5IbQ" });

function createAIClient(apiKey?: string) {
  const key = "AIzaSyD-8b9oUsi8bsA5VujO_yFyg5a_TOb5IbQ";
  if (!key) {
    throw new Error('Google AI API key is required. Set GOOGLE_AI_API_KEY environment variable or pass it as parameter.');
  }
  return new GoogleGenAI({ apiKey: key });
}
//Define the Task interface
export interface Task {
  title: string;
  startTime: string;
  endTime?: string;
  duration?: string;
  date: string;
  location?: string;
  notes?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  category?: string;
  isAllDay: boolean;
}

// Task parsing function
export async function parseTasks(prompt: string, apiKey?: string): Promise<Task[]> {
  const ai = createAIClient(apiKey);
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: `Parse the following text and extract all tasks/events/appointments. For each task, determine:
      - title: what the task/event is about
      - startTime: when it starts (in HH:MM format, use 24-hour format)
      - endTime: when it ends if specified (in HH:MM format, use 24-hour format)  
      - duration: how long it takes if specified or can be inferred
      - date: what date this is for (use YYYY-MM-DD format, calculate dates carefully). default to today if not specified
      - location: where it takes place if mentioned
      - notes: any additional notes or context
      - description: more detailed description if needed
      - priority: estimate priority level (low, medium, high)
      - category: what type of task this is (meeting, exercise, personal, call, etc.)
      -isALLDay: if the task is all day long (true or false)

      IMPORTANT DATE CALCULATION RULES:
      - Today is: ${new Date().toLocaleDateString('en-CA')} (${new Date().toLocaleDateString('en-US', { weekday: 'long' })})
      - "today" = ${new Date().toLocaleDateString('en-CA')}
      - "tomorrow" = ${new Date(Date.now() + 86400000).toLocaleDateString('en-CA')}
      - "next Monday" = the upcoming Monday (not this week if today is Monday, but the following Monday)
      - "Monday" = the next occurring Monday (could be this week or next week)
      - Always use YYYY-MM-DD format for dates

      Text to parse: "${prompt}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              startTime: { type: Type.STRING },
              endTime: { type: Type.STRING },
              duration: { type: Type.STRING },
              date: { type: Type.STRING },
              location: { type: Type.STRING },
              notes: { type: Type.STRING },
              description: { type: Type.STRING },
              priority: { type: Type.STRING },
              category: { type: Type.STRING },
              isAllDay: { type: Type.BOOLEAN },
            },
            required: ["title", "startTime", "date"],
            propertyOrdering: ["title", "startTime", "endTime", "duration", "date", "location", "notes", "description", "priority", "category"],
          },
        },
      },
    });

    const tasks = JSON.parse(response.text ?? "[]");
    return tasks;
  } catch (error) {
    console.error("Error parsing tasks:", error);
    throw error;
  }
}

// General structured content function (for other use cases)
export async function generateStructuredContent<T>(
  prompt: string,
  schema: any,
  model: string = "gemini-2.0-flash-exp",
  apiKey?: string
): Promise<T> {
  const ai = createAIClient(apiKey);
  
  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    return JSON.parse(response.text ?? "[]");
  } catch (error) {
    console.error("Error generating structured content:", error);
    throw error;
  }
}

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
  } catch {
    return dateString;
  }
}

// Helper function to format time for display
export function formatTime(timeString: string): string {
  try {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  } catch {
    return timeString;
  }
}