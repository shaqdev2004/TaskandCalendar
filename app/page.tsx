"use client"

import type React from "react"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { CalendarDays, Clock, MapPin, FileText, AlertCircle, Edit } from "lucide-react"
import { WeeklyCalendar } from "@/components/ui/taskCalendar"
import { ManualTaskForm } from "@/components/manual-task-form"
import { MonthlyCalendar } from "@/components/monthly-calendar"
import type { Task } from "@/lib/task-types"
import { parseTasks, formatDate, formatTime } from "./api/parse-event/route"

interface EditingTask {
  title: string
  startTime: string
  endTime: string
  date: string
  isAllDay: boolean
  category?: string
  priority?: "low" | "medium" | "high"
  location?: string
  description?: string
  notes?: string
}

export default function Home() {
  // Convex hooks
  const tasks = useQuery(api.tasks.getTasks) ?? []
  const createTasks = useMutation(api.tasks.createTasks)
  const createTask = useMutation(api.tasks.createTask)
  const updateTask = useMutation(api.tasks.updateTask)
  const deleteTask = useMutation(api.tasks.deleteTask)

  // Local state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [prompt, setPrompt] = useState("")
  const [weekStartDate, setWeekStartDate] = useState<Date>(new Date())

  const [editingTask, setEditingTask] = useState<EditingTask | null>(null)
  const [editingTaskIndex, setEditingTaskIndex] = useState<number | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<{ index: number; task: Task } | null>(null)

  const handleParsePrompt = async () => {
    if (!prompt.trim()) return

    try {
      setLoading(true)
      setError(null)

      const parsedTasks = await parseTasks(prompt)
      console.log("Parsed Tasks:", parsedTasks)

      // Save tasks to Convex database
      await createTasks({ tasks: parsedTasks })
      setPrompt("") // Clear the prompt after successful creation
    } catch (err) {
      console.error("Error parsing tasks:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleParsePrompt()
    }
  }

  const handleManualTaskAdd = async (newTask: Task) => {
    try {
      await createTask(newTask)
    } catch (err) {
      console.error("Error creating task:", err)
      setError(err instanceof Error ? err.message : "Failed to create task")
    }
  }

  const handleMonthlyCalendarDateClick = (date: Date) => {
    // Set the weekly calendar to show the week containing the clicked date
    const startOfWeek = new Date(date)
    const dayOfWeek = startOfWeek.getDay()
    startOfWeek.setDate(date.getDate() - dayOfWeek)
    setWeekStartDate(startOfWeek)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500 hover:bg-red-600"
      case "medium":
        return "bg-yellow-500 hover:bg-yellow-600"
      case "low":
        return "bg-green-500 hover:bg-green-600"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case "meeting":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "exercise":
      case "fitness":
        return "bg-green-100 text-green-800 border-green-200"
      case "personal":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "call":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "appointment":
        return "bg-pink-100 text-pink-800 border-pink-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    try {
      // Extract the actual task ID from the taskId string
      const taskIndex = Number.parseInt(taskId.split("-")[1])
      const task = tasks[taskIndex]
      if (task?._id) {
        await updateTask({ id: task._id, ...updates })
      }
    } catch (err) {
      console.error("Error updating task:", err)
      setError(err instanceof Error ? err.message : "Failed to update task")
    }
  }

  const openEditDialog = (taskIndex: number) => {
    const task = tasks[taskIndex]
    if (task) {
      setEditingTask({
        title: task.title,
        startTime: task.startTime,
        endTime: task.endTime || "",
        date: task.date,
        isAllDay: task.isAllDay || false,
        category: task.category,
        priority: task.priority,
        location: task.location,
        description: task.description,
        notes: task.notes,
      })
      setEditingTaskIndex(taskIndex)
      setIsEditDialogOpen(true)
    }
  }

  const openDeleteDialog = (taskIndex: number) => {
    const task = tasks[taskIndex]
    if (task) {
      setTaskToDelete({ index: taskIndex, task })
      setIsDeleteDialogOpen(true)
    }
  }

  const saveEditedTask = async () => {
    if (editingTask && editingTaskIndex !== null) {
      try {
        const task = tasks[editingTaskIndex]
        if (task?._id) {
          await updateTask({
            id: task._id,
            title: editingTask.title,
            startTime: editingTask.startTime,
            endTime: editingTask.endTime,
            date: editingTask.date,
            isAllDay: editingTask.isAllDay,
            category: editingTask.category,
            priority: editingTask.priority,
            location: editingTask.location,
            description: editingTask.description,
            notes: editingTask.notes,
          })
        }
        setIsEditDialogOpen(false)
        setEditingTask(null)
        setEditingTaskIndex(null)
      } catch (err) {
        console.error("Error updating task:", err)
        setError(err instanceof Error ? err.message : "Failed to update task")
      }
    }
  }

  const confirmDeleteTask = async () => {
    if (taskToDelete?.task._id) {
      try {
        await deleteTask({ id: taskToDelete.task._id })
        setIsDeleteDialogOpen(false)
        setTaskToDelete(null)
      } catch (err) {
        console.error("Error deleting task:", err)
        setError(err instanceof Error ? err.message : "Failed to delete task")
      }
    }
  }

  const handleEditChange = (field: keyof EditingTask, value: string | boolean) => {
    if (editingTask) {
      setEditingTask({ ...editingTask, [field]: value })
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="text-center">
        <div className="flex justify-between items-center mb-4">
          <div></div>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
        <h1 className="text-4xl font-bold mb-2">Task Parser & Calendar</h1>
        <p className="text-gray-600">Parse multiple tasks from natural language and view them in your calendar</p>
      </div>

      <SignedOut>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-semibold">Welcome to Task Parser & Calendar</h2>
              <p className="text-gray-600">Please sign in to start managing your tasks</p>
              <SignInButton mode="modal">
                <Button size="lg">Sign In</Button>
              </SignInButton>
            </div>
          </CardContent>
        </Card>
      </SignedOut>

      <SignedIn>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Enter Multiple Tasks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="task-input" className="text-sm font-medium">
              Describe your tasks in natural language
            </Label>
            <p className="text-sm text-gray-500 mt-1">
              Example: "Monday a meeting at 3pm, yoga classes at 5pm at the gym, call mom by 4pm next Monday"
            </p>
          </div>

          <Textarea
            id="task-input"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your tasks here... You can include multiple tasks, times, dates, and locations in any order."
            className="min-h-[120px] resize-none"
          />

          <Button
            onClick={handleParsePrompt}
            disabled={!prompt.trim() || loading}
            className="w-full sm:w-auto"
            size="lg"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Parsing Tasks...
              </>
            ) : (
              "Parse Tasks"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <span className="font-semibold">Error:</span>
              {error}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ManualTaskForm onTaskAdd={handleManualTaskAdd} />
        <MonthlyCalendar onDateClick={handleMonthlyCalendarDateClick} />
      </div>

      {/* Calendar View */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Weekly Calendar View</h2>
        <WeeklyCalendar
          tasks={tasks}
          onTaskUpdate={handleTaskUpdate}
          onTaskEdit={openEditDialog}
          onTaskDelete={openDeleteDialog}
          weekStartDate={weekStartDate}
        />
      </div>

      {/* Task List View */}
      {tasks.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Parsed Tasks</h2>
            <Badge variant="secondary" className="text-sm">
              {tasks.length} task{tasks.length !== 1 ? "s" : ""}
            </Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg leading-tight">{task.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      {task.priority && (
                        <Badge className={`${getPriorityColor(task.priority)} text-white text-xs`}>
                          {task.priority}
                        </Badge>
                      )}
                      <Edit
                        className="h-4 w-4 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-blue-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditDialog(index)
                        }}
                      />
                      <button
                        className="h-4 w-4 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-600 font-bold text-lg leading-none"
                        onClick={(e) => {
                          e.stopPropagation()
                          openDeleteDialog(index)
                        }}
                        title="Delete task"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  {task.category && (
                    <Badge variant="outline" className={`w-fit text-xs ${getCategoryColor(task.category)}`}>
                      {task.category}
                    </Badge>
                  )}
                </CardHeader>

                <CardContent className="space-y-3" onClick={() => openEditDialog(index)}>
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarDays className="h-4 w-4 text-gray-500" />
                    <span>{formatDate(task.date)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>
                      {formatTime(task.startTime)}
                      {task.endTime && ` - ${formatTime(task.endTime)}`}
                      {task.duration && !task.endTime && ` (${task.duration})`}
                    </span>
                  </div>

                  {task.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>{task.location}</span>
                    </div>
                  )}

                  {task.description && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-gray-600">{task.description}</p>
                    </div>
                  )}

                  {task.notes && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-gray-500 italic">{task.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Example prompts */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg">Example Prompts to Try</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div
              className="p-3 bg-white rounded border cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() =>
                setPrompt("Monday a meeting at 3pm, yoga classes at 5pm at the gym, call mom by 4pm next Monday")
              }
            >
              <code className="text-blue-600">
                "Monday a meeting at 3pm, yoga classes at 5pm at the gym, call mom by 4pm next Monday"
              </code>
            </div>
            <div
              className="p-3 bg-white rounded border cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() =>
                setPrompt("Doctor appointment tomorrow at 2pm, pick up groceries at 6pm, dinner with Sarah on Friday")
              }
            >
              <code className="text-blue-600">
                "Doctor appointment tomorrow at 2pm, pick up groceries at 6pm, dinner with Sarah on Friday"
              </code>
            </div>
            <div
              className="p-3 bg-white rounded border cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() =>
                setPrompt("Team standup every Monday at 9am for 30 minutes, lunch with client at 12:30pm downtown")
              }
            >
              <code className="text-blue-600">
                "Team standup every Monday at 9am for 30 minutes, lunch with client at 12:30pm downtown"
              </code>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">Click on any example to try it out!</p>
        </CardContent>
      </Card>

      {/* Edit Task Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editingTask?.title || ""}
                onChange={(e) => handleEditChange("title", e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-all-day"
                checked={editingTask?.isAllDay || false}
                onCheckedChange={(checked) => handleEditChange("isAllDay", checked as boolean)}
              />
              <Label htmlFor="edit-all-day">All day</Label>
            </div>

            {!editingTask?.isAllDay && (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-start-time">Start Time</Label>
                  <Input
                    id="edit-start-time"
                    type="time"
                    value={editingTask?.startTime || ""}
                    onChange={(e) => handleEditChange("startTime", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-end-time">End Time</Label>
                  <Input
                    id="edit-end-time"
                    type="time"
                    value={editingTask?.endTime || ""}
                    onChange={(e) => handleEditChange("endTime", e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-date">Date</Label>
              <Input
                id="edit-date"
                type="date"
                value={editingTask?.date || ""}
                onChange={(e) => handleEditChange("date", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Input
                id="edit-category"
                value={editingTask?.category || ""}
                onChange={(e) => handleEditChange("category", e.target.value)}
                placeholder="e.g., meeting, personal, fitness"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-priority">Priority</Label>
              <Input
                id="edit-priority"
                value={editingTask?.priority || ""}
                onChange={(e) => handleEditChange("priority", e.target.value)}
                placeholder="e.g., high, medium, low"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={editingTask?.location || ""}
                onChange={(e) => handleEditChange("location", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={editingTask?.description || ""}
                onChange={(e) => handleEditChange("description", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Input
                id="edit-notes"
                value={editingTask?.notes || ""}
                onChange={(e) => handleEditChange("notes", e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEditedTask}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete "{taskToDelete?.task.title}"? This action cannot be undone.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteTask}>
              Delete Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </SignedIn>
    </div>
  )
}
