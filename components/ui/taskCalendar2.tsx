"use client"

import type React from "react"

import { useState, useMemo, useRef, useCallback, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Task } from "@/lib/task-types"

interface CalendarEvent {
  id: string
  title: string
  startTime: string // HH:MM format
  endTime: string // HH:MM format
  date: string // YYYY-MM-DD format
  color: "purple" | "orange" | "green" | "blue" | "yellow" | "red"
  isAllDay?: boolean
  overlapOffset?: number
  overlapWidth?: number
}

interface WeeklyCalendarProps {
  tasks?: Task[]
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void
}

interface DragState {
  isDragging: boolean
  isResizing: boolean
  resizeHandle: "top" | "bottom" | null
  eventId: string | null
  startY: number
  startX: number
  originalTop: number
  originalHeight: number
  dayIndex: number
  startTime: number // in minutes
}

const timeSlots = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, "0")
  return `${hour}:00`
})

const colorClasses = {
  purple:
    "bg-purple-200 border-purple-300 text-purple-800 dark:bg-purple-900/50 dark:border-purple-700 dark:text-purple-200",
  orange:
    "bg-orange-200 border-orange-300 text-orange-800 dark:bg-orange-900/50 dark:border-orange-700 dark:text-orange-200",
  green: "bg-green-200 border-green-300 text-green-800 dark:bg-green-900/50 dark:border-green-700 dark:text-green-200",
  blue: "bg-blue-200 border-blue-300 text-blue-800 dark:bg-blue-900/50 dark:border-blue-700 dark:text-blue-200",
  yellow:
    "bg-yellow-200 border-yellow-300 text-yellow-800 dark:bg-yellow-900/50 dark:border-yellow-700 dark:text-yellow-200",
  red: "bg-red-200 border-red-300 text-red-800 dark:bg-red-900/50 dark:border-red-700 dark:text-red-200",
}

const taskToCalendarEvent = (task: Task, index: number): CalendarEvent => {
  const getCategoryColor = (category?: string): CalendarEvent["color"] => {
    switch (category?.toLowerCase()) {
      case "meeting":
        return "blue"
      case "fitness":
      case "exercise":
        return "green"
      case "personal":
        return "purple"
      case "appointment":
        return "orange"
      default:
        return "yellow"
    }
  }

  const getPriorityColor = (priority?: string): CalendarEvent["color"] => {
    switch (priority) {
      case "high":
        return "red"
      case "medium":
        return "orange"
      case "low":
        return "green"
      default:
        return "blue"
    }
  }

  // Use category color first, then priority color as fallback
  const color = task.category ? getCategoryColor(task.category) : getPriorityColor(task.priority)

  return {
    id: `task-${index}`,
    title: task.title,
    startTime: task.startTime,
    endTime: task.endTime || addMinutesToTime(task.startTime, 60), // Default 1 hour if no end time
    date: task.date,
    color,
    isAllDay: task.isAllDay,
  }
}

const snapToQuarterHour = (minutes: number): number => {
  return Math.round(minutes / 15) * 15
}

const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
}

const addMinutesToTime = (time: string, minutes: number): string => {
  const [hours, mins] = time.split(":").map(Number)
  const totalMinutes = hours * 60 + mins + minutes
  const newHours = Math.floor(totalMinutes / 60) % 24
  const newMins = totalMinutes % 60
  return `${newHours.toString().padStart(2, "0")}:${newMins.toString().padStart(2, "0")}`
}

export function WeeklyCalendar({ tasks = [], onTaskUpdate }: WeeklyCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [currentTime] = useState(() => {
    const now = new Date()
    return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`
  })

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    isResizing: false,
    resizeHandle: null,
    eventId: null,
    startY: 0,
    startX: 0,
    originalTop: 0,
    originalHeight: 0,
    dayIndex: 0,
    startTime: 0,
  })

  const calendarRef = useRef<HTMLDivElement>(null)
  const draggedEventRef = useRef<HTMLDivElement>(null)

  const calendarEvents = useMemo(() => {
    return tasks.map((task, index) => taskToCalendarEvent(task, index))
  }, [tasks])

  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentWeek)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day
    startOfWeek.setDate(diff)

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      return date
    })
  }, [currentWeek])

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0]
  }

  const formatDayHeader = (date: Date) => {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    return `${dayNames[date.getDay()]} ${date.getDate()}`
  }

  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number)
    return hours * 60 + minutes
  }

  const getEventPosition = (event: CalendarEvent) => {
    const startMinutes = timeToMinutes(event.startTime)
    const endMinutes = timeToMinutes(event.endTime)
    const duration = endMinutes - startMinutes

    // Each hour is 60px, so each minute is 1px
    const top = (startMinutes / 60) * 60
    const height = Math.max((duration / 60) * 60, 20) // Minimum height of 20px

    return { top, height }
  }

  const getEventsForDay = (date: Date) => {
    const dateStr = formatDate(date)
    return calendarEvents.filter((event) => event.date === dateStr && !event.isAllDay)
  }

  const getAllDayEventsForDay = (date: Date) => {
    const dateStr = formatDate(date)
    return calendarEvents.filter((event) => event.date === dateStr && event.isAllDay)
  }

  const getCurrentTimePosition = () => {
    const minutes = timeToMinutes(currentTime)
    return (minutes / 60) * 60
  }

  const navigateWeek = (direction: "prev" | "next") => {
    const newWeek = new Date(currentWeek)
    newWeek.setDate(currentWeek.getDate() + (direction === "next" ? 7 : -7))
    setCurrentWeek(newWeek)
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return formatDate(date) === formatDate(today)
  }

  // Helper function to get coordinates from either mouse or touch event
  const getEventCoordinates = (e: MouseEvent | TouchEvent) => {
    if ('touches' in e && e.touches.length > 0) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY }
    }
    return { clientX: (e as MouseEvent).clientX, clientY: (e as MouseEvent).clientY }
  }

  const handlePointerStart = useCallback((e: React.PointerEvent, event: CalendarEvent, dayIndex: number) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Capture the pointer for Safari compatibility
    ;(e.target as Element).setPointerCapture(e.pointerId)
    
    const rect = e.currentTarget.getBoundingClientRect()
    const { top, height } = getEventPosition(event)

    // Determine if this is a resize operation (near top or bottom edge)
    const relativeY = e.clientY - rect.top
    const isTopResize = relativeY <= 8
    const isBottomResize = relativeY >= rect.height - 8

    const taskIndex = Number.parseInt(event.id.split("-")[1])
    const task = tasks[taskIndex]
    const startTime = task ? timeToMinutes(task.startTime) : 0

    setDragState({
      isDragging: !isTopResize && !isBottomResize,
      isResizing: isTopResize || isBottomResize,
      resizeHandle: isTopResize ? "top" : isBottomResize ? "bottom" : null,
      eventId: event.id,
      startY: e.clientY,
      startX: e.clientX,
      originalTop: top,
      originalHeight: height,
      dayIndex,
      startTime,
    })
  }, [tasks])

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!dragState.isDragging && !dragState.isResizing) return
      if (!calendarRef.current || !onTaskUpdate) return

      e.preventDefault()
      
      const calendarRect = calendarRef.current.getBoundingClientRect()
      const deltaY = e.clientY - dragState.startY
      const deltaX = e.clientX - dragState.startX

      if (dragState.isDragging) {
        // Handle dragging (moving the entire event)
        const pixelsToMinutes = (pixels: number) => Math.round((pixels / 60) * 60)
        const newTopPixels = Math.max(0, Math.min(1440, dragState.originalTop + deltaY))
        const newStartMinutes = snapToQuarterHour(pixelsToMinutes(newTopPixels))

        // Determine which day column we're over
        const timeColumnWidth = calendarRect.width / 8
        const dayColumnWidth = (calendarRect.width - timeColumnWidth) / 7
        const relativeX = e.clientX - calendarRect.left - timeColumnWidth
        const newDayIndex = Math.max(0, Math.min(6, Math.floor(relativeX / dayColumnWidth)))

        if (dragState.eventId) {
          const taskIndex = Number.parseInt(dragState.eventId.split("-")[1])
          const task = tasks[taskIndex]
          if (task) {
            const duration = timeToMinutes(task.endTime || addMinutesToTime(task.startTime, 60)) - timeToMinutes(task.startTime)
            const newStartTime = minutesToTime(Math.max(0, Math.min(1440 - duration, newStartMinutes)))
            const newEndTime = minutesToTime(Math.max(0, Math.min(1440, newStartMinutes + duration)))
            const newDate = formatDate(weekDays[newDayIndex])

            onTaskUpdate(dragState.eventId, {
              startTime: newStartTime,
              endTime: newEndTime,
              date: newDate,
            })
          }
        }
      } else if (dragState.isResizing) {
        // Handle resizing
        if (dragState.eventId) {
          const taskIndex = Number.parseInt(dragState.eventId.split("-")[1])
          const task = tasks[taskIndex]
          if (task) {
            const startMinutes = timeToMinutes(task.startTime)
            const pixelsToMinutes = (pixels: number) => Math.round((pixels / 60) * 60)

            if (dragState.resizeHandle === "top") {
              // Resize from top (change start time)
              const newStartMinutes = snapToQuarterHour(dragState.startTime + pixelsToMinutes(deltaY))
              const endMinutes = timeToMinutes(task.endTime || addMinutesToTime(task.startTime, 60))

              if (newStartMinutes < endMinutes && newStartMinutes >= 0) {
                onTaskUpdate(dragState.eventId, {
                  startTime: minutesToTime(newStartMinutes),
                })
              }
            } else if (dragState.resizeHandle === "bottom") {
              // Resize from bottom (change end time)
              const currentEndMinutes = timeToMinutes(task.endTime || addMinutesToTime(task.startTime, 60))
              const newEndMinutes = snapToQuarterHour(currentEndMinutes + pixelsToMinutes(deltaY))

              if (newEndMinutes > startMinutes && newEndMinutes <= 1440) {
                onTaskUpdate(dragState.eventId, {
                  endTime: minutesToTime(newEndMinutes),
                })
              }
            }
          }
        }
      }
    },
    [dragState, weekDays, tasks, onTaskUpdate]
  )

  const handlePointerEnd = useCallback(() => {
    setDragState({
      isDragging: false,
      isResizing: false,
      resizeHandle: null,
      eventId: null,
      startY: 0,
      startX: 0,
      originalTop: 0,
      originalHeight: 0,
      dayIndex: 0,
      startTime: 0,
    })
  }, [])

  const getEventsForDayWithOverlap = (date: Date) => {
    const dateStr = formatDate(date)
    const dayEvents = calendarEvents.filter((event) => event.date === dateStr && !event.isAllDay)

    // Sort events by start time
    dayEvents.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))

    // Calculate overlap positions
    return dayEvents.map((event, index) => {
      let overlapOffset = 0
      let overlapWidth = 100

      // Check for overlaps with previous events
      for (let i = 0; i < index; i++) {
        const prevEvent = dayEvents[i]
        const prevStart = timeToMinutes(prevEvent.startTime)
        const prevEnd = timeToMinutes(prevEvent.endTime)
        const currentStart = timeToMinutes(event.startTime)
        const currentEnd = timeToMinutes(event.endTime)

        // Check if events overlap
        if (currentStart < prevEnd && currentEnd > prevStart) {
          overlapOffset += 25 // Offset by 25% for each overlapping event
          overlapWidth = Math.max(50, 100 - overlapOffset) // Minimum 50% width
        }
      }

      return {
        ...event,
        overlapOffset: Math.min(overlapOffset, 50), // Max 50% offset
        overlapWidth: Math.max(overlapWidth, 50), // Min 50% width
      }
    })
  }

  useEffect(() => {
    const handleGlobalPointerMove = (e: PointerEvent) => handlePointerMove(e)
    const handleGlobalPointerUp = () => handlePointerEnd()

    if (dragState.isDragging || dragState.isResizing) {
      // Use pointer events for better Safari compatibility
      document.addEventListener("pointermove", handleGlobalPointerMove, { passive: false })
      document.addEventListener("pointerup", handleGlobalPointerUp)
      document.addEventListener("pointercancel", handleGlobalPointerUp)
      
      // Prevent scrolling and text selection during drag
      document.body.style.touchAction = "none"
      document.body.style.userSelect = "none"
      document.body.style.webkitUserSelect = "none"
      document.body.style.cursor = dragState.isResizing ? "ns-resize" : "grabbing"
    }

    return () => {
      document.removeEventListener("pointermove", handleGlobalPointerMove)
      document.removeEventListener("pointerup", handleGlobalPointerUp)
      document.removeEventListener("pointercancel", handleGlobalPointerUp)
      
      document.body.style.touchAction = ""
      document.body.style.userSelect = ""
      document.body.style.webkitUserSelect = ""
      document.body.style.cursor = ""
    }
  }, [dragState.isDragging, dragState.isResizing, handlePointerMove, handlePointerEnd])

  return (
    <Card className="w-full overflow-hidden">
      {/* Header with navigation */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigateWeek("prev")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigateWeek("next")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold">
            {weekDays[0].toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </h2>
        </div>
        <div className="text-sm text-muted-foreground">
          {tasks.length} task{tasks.length !== 1 ? "s" : ""}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[800px]" ref={calendarRef}>
          {/* Day headers */}
          <div className="grid grid-cols-8 border-b">
            <div className="p-2 text-sm font-medium text-muted-foreground">{/* Empty cell for time column */}</div>
            {weekDays.map((day, index) => (
              <div
                key={index}
                className={cn(
                  "p-2 text-center text-sm font-medium border-l",
                  isToday(day) && "bg-red-50 dark:bg-red-950/20",
                )}
              >
                <div
                  className={cn(
                    "inline-flex items-center justify-center rounded-full w-8 h-8",
                    isToday(day) && "bg-red-500 text-white",
                  )}
                >
                  {formatDayHeader(day)}
                </div>
              </div>
            ))}
          </div>

          {/* All-day events row */}
          <div className="grid grid-cols-8 border-b bg-muted/30">
            <div className="p-2 text-xs text-muted-foreground font-medium">all-day</div>
            {weekDays.map((day, dayIndex) => (
              <div key={dayIndex} className="border-l p-1 min-h-[40px] relative">
                {getAllDayEventsForDay(day).map((event, eventIndex) => (
                  <div
                    key={event.id}
                    className={cn("text-xs p-1 rounded border mb-1 truncate", colorClasses[event.color])}
                  >
                    {event.title}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Time grid */}
          <div className="relative">
            {/* Current time indicator */}
            <div
              className="absolute left-0 right-0 z-20 flex items-center"
              style={{ top: `${getCurrentTimePosition()}px` }}
            >
              <div className="bg-red-500 text-white text-xs px-1 rounded text-nowrap">{currentTime}</div>
              <div className="flex-1 h-0.5 bg-red-500"></div>
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            </div>

            <div className="grid grid-cols-8">
              {/* Time column */}
              <div className="relative">
                {timeSlots.map((time, index) => (
                  <div key={time} className="h-[60px] border-b text-xs text-muted-foreground p-2 flex items-start">
                    {time}
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {weekDays.map((day, dayIndex) => (
                <div key={dayIndex} className="relative border-l">
                  {/* Hour grid lines */}
                  {timeSlots.map((time, timeIndex) => (
                    <div key={time} className="h-[60px] border-b border-border/50" />
                  ))}

                  {/* Events */}
                  <div className="absolute inset-0 p-1">
                    {getEventsForDayWithOverlap(day).map((event, eventIndex) => {
                      const { top, height } = getEventPosition(event)
                      const isDragging = dragState.eventId === event.id

                      return (
                        <div
                          key={event.id}
                          ref={isDragging ? draggedEventRef : null}
                          className={cn(
                            "absolute p-1 rounded text-xs overflow-hidden z-10 border rounded-sm px-1 select-none touch-none",
                            colorClasses[event.color],
                            isDragging && "opacity-75 z-30",
                            !isDragging && "cursor-grab hover:cursor-grab",
                            dragState.isResizing && dragState.eventId === event.id && "cursor-ns-resize",
                          )}
                          style={{
                            top: `${top}px`,
                            height: `${height}px`,
                            left: `${4 + (event.overlapOffset || 0)}%`,
                            width: `${(event.overlapWidth || 100) - 8}%`,
                          }}
                          onPointerDown={(e) => handlePointerStart(e, event, dayIndex)}
                        >
                          {/* Resize handles - only visible on hover or during resize */}
                          <div 
                            className={cn(
                              "absolute top-0 left-0 right-0 h-2 bg-transparent",
                              "hover:bg-black/10 cursor-ns-resize transition-colors",
                              dragState.resizeHandle === "top" && dragState.eventId === event.id && "bg-black/20"
                            )}
                            style={{ borderRadius: "4px 4px 0 0" }}
                          />
                          <div 
                            className={cn(
                              "absolute bottom-0 left-0 right-0 h-2 bg-transparent",
                              "hover:bg-black/10 cursor-ns-resize transition-colors",
                              dragState.resizeHandle === "bottom" && dragState.eventId === event.id && "bg-black/20"
                            )}
                            style={{ borderRadius: "0 0 4px 4px" }}
                          />

                          <div className="font-medium truncate pointer-events-none">{event.title}</div>
                          <div className="text-xs opacity-75 pointer-events-none">
                            {event.startTime}–{event.endTime}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}