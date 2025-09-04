"use client"

import * as React from "react"

import { Calendar } from "@/components/ui/calendar"

export function Calendar18() {
  const [date, setDate] = React.useState<Date | undefined>(
    new Date(2025, 5, 11)
  )

  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      className="w-full rounded-lg border"
      buttonVariant="ghost"
    />
  )
}
