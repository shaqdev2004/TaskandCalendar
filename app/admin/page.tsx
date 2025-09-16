"use client"

import { useState } from "react"
import CalendarRequestsAdmin from "@/components/CalendarRequestsAdmin"
import FeedbackAdmin from "@/components/FeedbackAdmin"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, MessageSquare } from "lucide-react"

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("calendar")

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage calendar requests and user feedback</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Calendar Requests
            </TabsTrigger>
            <TabsTrigger value="feedback" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Feedback
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar">
            <CalendarRequestsAdmin />
          </TabsContent>

          <TabsContent value="feedback">
            <FeedbackAdmin />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
