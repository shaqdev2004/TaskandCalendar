"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface MonthlyCalendarProps {
  onDateClick: (date: Date) => void
}

export function MonthlyCalendar({ onDateClick }: MonthlyCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const today = new Date()
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  // Get days from previous month to fill the grid
  const prevMonth = new Date(year, month - 1, 0)
  const daysFromPrevMonth = startingDayOfWeek
  const prevMonthDays = Array.from(
    { length: daysFromPrevMonth },
    (_, i) => prevMonth.getDate() - daysFromPrevMonth + i + 1,
  )

  // Get days for current month
  const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  // Get days from next month to fill remaining slots
  const totalCells = 42 // 6 rows × 7 days
  const remainingCells = totalCells - daysFromPrevMonth - daysInMonth
  const nextMonthDays = Array.from({ length: remainingCells }, (_, i) => i + 1)

  const navigateMonth = (direction: "prev" | "next") => {
    const newMonth = new Date(currentMonth)
    newMonth.setMonth(currentMonth.getMonth() + (direction === "next" ? 1 : -1))
    setCurrentMonth(newMonth)
  }

  const handleDateClick = (day: number, type: "prev" | "current" | "next") => {
    let clickedDate: Date

    if (type === "prev") {
      clickedDate = new Date(year, month - 1, day)
    } else if (type === "next") {
      clickedDate = new Date(year, month + 1, day)
    } else {
      clickedDate = new Date(year, month, day)
    }

    onDateClick(clickedDate)
  }

  const isToday = (day: number, type: "prev" | "current" | "next") => {
    if (type === "current") {
      return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year
    }
    return false
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {monthNames[month]} {year}
          </CardTitle>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((day) => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {/* Previous month days */}
          {prevMonthDays.map((day) => (
            <button
              key={`prev-${day}`}
              onClick={() => handleDateClick(day, "prev")}
              className="p-2 text-sm text-gray-400 hover:bg-gray-100 rounded transition-colors"
            >
              {day}
            </button>
          ))}

          {/* Current month days */}
          {currentMonthDays.map((day) => (
            <button
              key={`current-${day}`}
              onClick={() => handleDateClick(day, "current")}
              className={`p-2 text-sm rounded transition-colors ${
                isToday(day, "current") ? "bg-blue-500 text-white font-semibold" : "hover:bg-gray-100 text-gray-900"
              }`}
            >
              {day}
            </button>
          ))}

          {/* Next month days */}
          {nextMonthDays.map((day) => (
            <button
              key={`next-${day}`}
              onClick={() => handleDateClick(day, "next")}
              className="p-2 text-sm text-gray-400 hover:bg-gray-100 rounded transition-colors"
            >
              {day}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
