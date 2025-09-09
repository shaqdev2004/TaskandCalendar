import { Id } from "@/convex/_generated/dataModel";

export interface Task {
  _id?: Id<"tasks">;
  title: string;
  date: string;
  startTime: string;
  endTime?: string;
  duration?: string;
  location?: string;
  description?: string;
  notes?: string;
  priority?: "low" | "medium" | "high";
  category?: string;
  isAllDay?: boolean;
  googleEventId?: string;
  lastSyncedAt?: string;
  syncStatus?: "pending" | "synced" | "error";
  }
  
  export interface ParsedEvent {
    title: string
    startTime: string
    endTime: string
    duration: number
    location: string
    description: string
    category: string
    isAllDay: boolean
  }
  