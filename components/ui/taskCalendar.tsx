"use client"

import type React from "react"

import { useState, useMemo, useRef, useCallback, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
// Removed unused imports - Input, Label, Checkbox no longer needed
// Removed Popover imports - using parent component's dialog-based editing
import { ChevronLeft, ChevronRight, Calendar, Edit } from "lucide-react"
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
  onTaskEdit?: (taskIndex: number) => void
  onTaskDelete?: (taskIndex: number) => void
  weekStartDate?: Date // Added weekStartDate prop to control which week to display
  isMobile?: boolean // Add mobile prop to control view
}

interface DragState {
  isDragging: boolean
  isResizing: boolean
  resizeHandle: "top" | "bottom" | null
  eventId: string | null
  startY: number
  originalTop: number
  originalHeight: number
  dayIndex: number
  // Add visual preview state for smooth dragging
  previewTop?: number
  previewHeight?: number
  previewDayIndex?: number
  // Cache original values to avoid recalculation
  originalTask?: Task
  calendarRect?: DOMRect
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

// Removed EditingTask interface - no longer needed since editing moved to parent

export function WeeklyCalendar({ tasks = [], onTaskUpdate, onTaskEdit, onTaskDelete, weekStartDate, isMobile }: WeeklyCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [mobileStartDay, setMobileStartDay] = useState(0) // Track which day to start showing on mobile

  useEffect(() => {
    if (weekStartDate) {
      setCurrentWeek(weekStartDate)
    }
  }, [weekStartDate])

  const [currentTime] = useState(() => {
    const now = new Date()
    return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`
  })

  // Detect mobile if not explicitly passed
  const [isActuallyMobile, setIsActuallyMobile] = useState(isMobile ?? false)

  useEffect(() => {
    if (isMobile === undefined) {
      const checkMobile = () => {
        setIsActuallyMobile(window.innerWidth < 768)
      }
      checkMobile()
      window.addEventListener('resize', checkMobile)
      return () => window.removeEventListener('resize', checkMobile)
    }
  }, [isMobile])

  // Removed internal editing state - using parent component's dialog-based editing

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    isResizing: false,
    resizeHandle: null,
    eventId: null,
    startY: 0,
    originalTop: 0,
    originalHeight: 0,
    dayIndex: 0,
  })

  // Add throttled update mechanism
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastUpdateRef = useRef<number>(0)
  const UPDATE_THROTTLE_MS = 16 // ~60fps for smooth visual updates
  const DB_UPDATE_THROTTLE_MS = 100 // Less frequent database updates

  const calendarRef = useRef<HTMLDivElement>(null)

  const calendarEvents = useMemo(() => {
    return tasks.map((task, index) => taskToCalendarEvent(task, index))
  }, [tasks])

  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentWeek)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day
    startOfWeek.setDate(diff)

    const allDays = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      return date
    })

    // Return only 2 days for mobile, starting from mobileStartDay
    if (isActuallyMobile) {
      return allDays.slice(mobileStartDay, mobileStartDay + 2)
    }

    return allDays
  }, [currentWeek, isActuallyMobile, mobileStartDay])

  // Mobile navigation functions
  const navigateMobileDays = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (mobileStartDay > 0) {
        setMobileStartDay(mobileStartDay - 1)
      } else {
        // Go to previous week, show last 2 days
        navigateWeek('prev')
        setMobileStartDay(5) // Show Fri-Sat
      }
    } else {
      if (mobileStartDay < 5) {
        setMobileStartDay(mobileStartDay + 1)
      } else {
        // Go to next week, show first 2 days
        navigateWeek('next')
        setMobileStartDay(0) // Show Sun-Mon
      }
    }
  }

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
    newWeek.setDate(currentWeek.getDate() + (direction === "next" ? 1 : -1))
    setCurrentWeek(newWeek)
  }

  const navigateToToday = () => {
    setCurrentWeek(new Date())
  }

  const handleTaskClick = (event: CalendarEvent, taskIndex: number) => {
    if (onTaskEdit) {
      onTaskEdit(taskIndex)
    }
  }

  const handleTaskDelete = (taskIndex: number) => {
    if (onTaskDelete) {
      onTaskDelete(taskIndex)
    }
  }

  const handleMouseDown = useCallback((e: React.MouseEvent, event: CalendarEvent, dayIndex: number) => {
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    const { top, height } = getEventPosition(event)

    // Cache calendar rect and task data to avoid repeated calculations
    const calendarRect = calendarRef.current?.getBoundingClientRect()
    const taskIndex = Number.parseInt(event.id.split("-")[1])
    const originalTask = tasks[taskIndex]

    // Determine if this is a resize operation (near top or bottom edge)
    const relativeY = e.clientY - rect.top
    const isTopResize = relativeY <= 8
    const isBottomResize = relativeY >= rect.height - 8

    setDragState({
      isDragging: !isTopResize && !isBottomResize,
      isResizing: isTopResize || isBottomResize,
      resizeHandle: isTopResize ? "top" : isBottomResize ? "bottom" : null,
      eventId: event.id,
      startY: e.clientY,
      originalTop: top,
      originalHeight: height,
      dayIndex,
      // Cache values for performance
      originalTask,
      calendarRect,
      previewTop: top,
      previewHeight: height,
      previewDayIndex: dayIndex,
    })
  }, [tasks])

  // Throttled database update function
  const throttledUpdate = useCallback((taskId: string, updates: Partial<Task>) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }

    updateTimeoutRef.current = setTimeout(() => {
      if (onTaskUpdate) {
        onTaskUpdate(taskId, updates)
      }
    }, DB_UPDATE_THROTTLE_MS)
  }, [onTaskUpdate, DB_UPDATE_THROTTLE_MS])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragState.isDragging && !dragState.isResizing) return
      if (!dragState.calendarRect || !dragState.originalTask) return

      // Throttle visual updates for performance
      const now = Date.now()
      if (now - lastUpdateRef.current < UPDATE_THROTTLE_MS) return
      lastUpdateRef.current = now

      const deltaY = e.clientY - dragState.startY

      if (dragState.isDragging) {
        // Handle dragging with immediate visual feedback
        const newTop = Math.max(0, dragState.originalTop + deltaY)
        const newStartMinutes = snapToQuarterHour((newTop / 60) * 60)

        // Determine which day column we're over
        const relativeX = e.clientX - dragState.calendarRect.left
        const dayColumnWidth = dragState.calendarRect.width / 8
        const newDayIndex = Math.max(0, Math.min(6, Math.floor((relativeX - dayColumnWidth) / dayColumnWidth)))

        // Update visual preview immediately for smooth dragging
        setDragState(prev => ({
          ...prev,
          previewTop: newTop,
          previewDayIndex: newDayIndex,
        }))

        // Throttled database update
        if (dragState.eventId) {
          const duration = timeToMinutes(dragState.originalTask.endTime || addMinutesToTime(dragState.originalTask.startTime, 60)) - timeToMinutes(dragState.originalTask.startTime)
          const newStartTime = minutesToTime(Math.max(0, Math.min(1440 - duration, newStartMinutes)))
          const newEndTime = minutesToTime(Math.min(1440, newStartMinutes + duration))
          const newDate = formatDate(weekDays[newDayIndex])

          throttledUpdate(`task-${Number.parseInt(dragState.eventId.split("-")[1])}`, {
            startTime: newStartTime,
            endTime: newEndTime,
            date: newDate,
          })
        }
      } else if (dragState.isResizing) {
        // Handle resizing with immediate visual feedback
        const startMinutes = timeToMinutes(dragState.originalTask.startTime)

        if (dragState.resizeHandle === "top") {
          const newStartMinutes = snapToQuarterHour(startMinutes + (deltaY / 60) * 60)
          const endMinutes = timeToMinutes(dragState.originalTask.endTime || addMinutesToTime(dragState.originalTask.startTime, 60))

          if (newStartMinutes < endMinutes) {
            const newHeight = (endMinutes - newStartMinutes) * (60 / 60)
            const newTop = (newStartMinutes / 60) * 60

            // Update visual preview immediately
            setDragState(prev => ({
              ...prev,
              previewTop: newTop,
              previewHeight: newHeight,
            }))

            // Throttled database update
            if (dragState.eventId) {
              throttledUpdate(`task-${Number.parseInt(dragState.eventId.split("-")[1])}`, {
                startTime: minutesToTime(Math.max(0, newStartMinutes)),
              })
            }
          }
        } else if (dragState.resizeHandle === "bottom") {
          const currentEndMinutes = timeToMinutes(dragState.originalTask.endTime || addMinutesToTime(dragState.originalTask.startTime, 60))
          const newEndMinutes = snapToQuarterHour(currentEndMinutes + (deltaY / 60) * 60)

          if (newEndMinutes > startMinutes) {
            const newHeight = (newEndMinutes - startMinutes) * (60 / 60)

            // Update visual preview immediately
            setDragState(prev => ({
              ...prev,
              previewHeight: newHeight,
            }))

            // Throttled database update
            if (dragState.eventId) {
              throttledUpdate(`task-${Number.parseInt(dragState.eventId.split("-")[1])}`, {
                endTime: minutesToTime(Math.min(1440, newEndMinutes)),
              })
            }
          }
        }
      }
    },
    [dragState, weekDays, throttledUpdate, UPDATE_THROTTLE_MS],
  )

  const handleMouseUp = useCallback(() => {
    setDragState({
      isDragging: false,
      isResizing: false,
      resizeHandle: null,
      eventId: null,
      startY: 0,
      originalTop: 0,
      originalHeight: 0,
      dayIndex: 0,
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
    const handleGlobalMouseMove = (e: MouseEvent) => handleMouseMove(e)
    const handleGlobalMouseUp = () => handleMouseUp()

    if (dragState.isDragging || dragState.isResizing) {
      document.addEventListener("mousemove", handleGlobalMouseMove)
      document.addEventListener("mouseup", handleGlobalMouseUp)
      document.body.style.cursor = dragState.isResizing ? "ns-resize" : "move"
      document.body.style.userSelect = "none"
    }

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove)
      document.removeEventListener("mouseup", handleGlobalMouseUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
  }, [dragState.isDragging, dragState.isResizing, handleMouseMove, handleMouseUp])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
    }
  }, [])

  const isToday = (date: Date) => {
    const today = new Date()
    return formatDate(date) === formatDate(today)
  }

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
          <Button variant="outline" size="sm" onClick={navigateToToday}>
            <Calendar className="h-4 w-4 mr-1" />
            Today
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
        <div className={cn("min-w-[800px]", isActuallyMobile && "min-w-[400px]")} ref={calendarRef}>
          {/* Mobile navigation */}
          {isActuallyMobile && (
            <div className="flex items-center justify-between mb-2 px-2">
              <Button variant="outline" size="sm" onClick={() => navigateMobileDays('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">
                {weekDays[0].toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} - {weekDays[1].toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </span>
              <Button variant="outline" size="sm" onClick={() => navigateMobileDays('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Day headers */}
          <div className={cn("grid border-b", isActuallyMobile ? "grid-cols-3" : "grid-cols-8")}>
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
          <div className={cn("grid border-b bg-muted/30", isActuallyMobile ? "grid-cols-3" : "grid-cols-8")}>
            <div className="p-2 text-xs text-muted-foreground font-medium">all-day</div>
            {weekDays.map((day, dayIndex) => (
              <div key={dayIndex} className="border-l p-1 min-h-[40px] relative">
                {getAllDayEventsForDay(day).map((event, eventIndex) => {
                  const taskIndex = Number.parseInt(event.id.split("-")[1])
                  return (
                    <div
                      key={event.id}
                      className={cn(
                        "text-xs p-1 rounded border mb-1 truncate cursor-pointer hover:opacity-80 group",
                        colorClasses[event.color],
                      )}
                      onClick={() => handleTaskClick(event, taskIndex)}
                    >
                      <div className="flex items-center justify-between">
                        <span>{event.title}</span>
                        <Edit className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                      </div>
                    </div>
                  )
                })}
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

            <div className={cn("grid", isActuallyMobile ? "grid-cols-3" : "grid-cols-8")}>
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
                      const taskIndex = Number.parseInt(event.id.split("-")[1])

                      // Use preview values during dragging for smooth visual feedback
                      const displayTop = isDragging && dragState.previewTop !== undefined ? dragState.previewTop : top
                      const displayHeight = isDragging && dragState.previewHeight !== undefined ? dragState.previewHeight : height

                      // Hide event if it's being dragged to a different day
                      const shouldHide = isDragging && dragState.previewDayIndex !== undefined && dragState.previewDayIndex !== dayIndex

                      return (
                        <div
                          key={event.id}
                          className={cn(
                            "absolute p-1 rounded text-xs overflow-hidden z-10 border rounded-sm px-1 cursor-move select-none group transition-opacity",
                            colorClasses[event.color],
                            isDragging && "opacity-75 z-30",
                            dragState.isResizing && dragState.eventId === event.id && "cursor-ns-resize",
                            shouldHide && "opacity-0",
                          )}
                          style={{
                            top: `${displayTop}px`,
                            height: `${displayHeight}px`,
                            left: `${4 + (event.overlapOffset || 0)}%`,
                            width: `${(event.overlapWidth || 100) - 8}%`,
                          }}
                          onMouseDown={(e) => {
                            // Only handle drag if not clicking the edit button
                            if (!(e.target as HTMLElement).closest(".edit-button")) {
                              handleMouseDown(e, event, dayIndex)
                            }
                          }}
                          onClick={() => handleTaskClick(event, taskIndex)}
                        >
                          {/* Resize handles */}
                          <div className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 hover:opacity-100 bg-black/20 rounded-t" />
                          <div className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 hover:opacity-100 bg-black/20 rounded-b" />

                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{event.title}</div>
                              <div className="text-xs opacity-75">
                                {event.startTime}–{event.endTime}
                              </div>
                            </div>
                            <Edit className="h-3 w-3 opacity-0 group-hover:opacity-100 edit-button ml-1" />
                          </div>
                        </div>
                      )
                    })}

                    {/* Preview event for cross-day dragging */}
                    {dragState.isDragging &&
                     dragState.previewDayIndex === dayIndex &&
                     dragState.previewDayIndex !== dragState.dayIndex &&
                     dragState.originalTask && (
                      <div
                        className={cn(
                          "absolute p-1 rounded text-xs overflow-hidden z-20 border-2 border-dashed border-blue-400 bg-blue-100/50 px-1 select-none",
                        )}
                        style={{
                          top: `${dragState.previewTop || 0}px`,
                          height: `${dragState.previewHeight || dragState.originalHeight}px`,
                          left: "4%",
                          width: "92%",
                        }}
                      >
                        <div className="font-medium truncate text-blue-700">
                          {dragState.originalTask.title}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Edit functionality moved to parent component's dialog */}
    </Card>
  )
}
