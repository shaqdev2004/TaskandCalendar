"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { WeeklyCalendar } from "@/components/ui/taskCalendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { Task } from "@/lib/task-types"

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

export function CalendarPage() {
  // Convex hooks
  const tasks = useQuery(api.tasks.getTasks) ?? []
  const updateTask = useMutation(api.tasks.updateTask)
  const deleteTask = useMutation(api.tasks.deleteTask)

  // Local state
  const [weekStartDate, setWeekStartDate] = useState<Date>(new Date())
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<EditingTask | null>(null)
  const [editingTaskIndex, setEditingTaskIndex] = useState<number | null>(null)
  const [taskToDelete, setTaskToDelete] = useState<{ index: number; task: Task } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Task update handler for drag and drop
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

  // Edit dialog handlers
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

  // Delete dialog handlers
  const openDeleteDialog = (taskIndex: number) => {
    const task = tasks[taskIndex]
    if (task) {
      setTaskToDelete({ index: taskIndex, task })
      setIsDeleteDialogOpen(true)
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground">
          View and manage your tasks in a weekly calendar format with drag-and-drop functionality
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Weekly Calendar */}
      <div className="bg-white rounded-lg border">
        <WeeklyCalendar
          tasks={tasks}
          onTaskUpdate={handleTaskUpdate}
          onTaskEdit={openEditDialog}
          onTaskDelete={openDeleteDialog}
          weekStartDate={weekStartDate}
          isMobile={isMobile}
        />
      </div>

      {/* Edit Task Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {editingTask && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-date">Date</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={editingTask.date}
                    onChange={(e) => setEditingTask({ ...editingTask, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-priority">Priority</Label>
                  <Select
                    value={editingTask.priority || "medium"}
                    onValueChange={(value: "low" | "medium" | "high") => 
                      setEditingTask({ ...editingTask, priority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-all-day"
                  checked={editingTask.isAllDay}
                  onCheckedChange={(checked) => 
                    setEditingTask({ ...editingTask, isAllDay: !!checked })
                  }
                />
                <Label htmlFor="edit-all-day">All day event</Label>
              </div>

              {!editingTask.isAllDay && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-start-time">Start Time</Label>
                    <Input
                      id="edit-start-time"
                      type="time"
                      value={editingTask.startTime}
                      onChange={(e) => setEditingTask({ ...editingTask, startTime: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-end-time">End Time</Label>
                    <Input
                      id="edit-end-time"
                      type="time"
                      value={editingTask.endTime}
                      onChange={(e) => setEditingTask({ ...editingTask, endTime: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Input
                  id="edit-category"
                  value={editingTask.category || ""}
                  onChange={(e) => setEditingTask({ ...editingTask, category: e.target.value })}
                  placeholder="e.g., meeting, personal, work"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={editingTask.location || ""}
                  onChange={(e) => setEditingTask({ ...editingTask, location: e.target.value })}
                  placeholder="Optional location"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingTask.description || ""}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  placeholder="Optional description"
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEditedTask}>
              Save Changes
            </Button>
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
    </div>
  )
}
