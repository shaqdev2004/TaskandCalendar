import { Id } from "@/convex/_generated/dataModel";

export interface Task {
    _id?: Id<"tasks"> // Convex document ID
    title: string
    date: string // YYYY-MM-DD format
    startTime: string // HH:MM format
    endTime?: string // HH:MM format
    duration?: string
    location?: string
    description?: string
    category?: string
    priority?: "low" | "medium" | "high"
    notes?: string
    isAllDay?: boolean
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