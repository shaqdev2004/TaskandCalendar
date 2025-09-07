"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarDays, Clock, MapPin, FileText, AlertCircle, Edit, Plus, Search, Loader2, Trash2 } from "lucide-react"
import type { Task } from "@/lib/task-types"
import { parseTasks } from "@/lib/ai-parser"

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

export function HomePage() {
  // Convex hooks
  const tasks = useQuery(api.tasks.getTasks) ?? []
  const createTasks = useMutation(api.tasks.createTasks)
  const createTask = useMutation(api.tasks.createTask)
  const updateTask = useMutation(api.tasks.updateTask)
  const deleteTask = useMutation(api.tasks.deleteTask)

  // Local state for task parsing
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [prompt, setPrompt] = useState("")

  // Task management state
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"date" | "priority" | "title">("date")
  const [filterByTag, setFilterByTag] = useState<string>("all")

  // Dialog states
  const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<EditingTask | null>(null)
  const [editingTaskIndex, setEditingTaskIndex] = useState<number | null>(null)
  const [taskToDelete, setTaskToDelete] = useState<{ index: number; task: Task } | null>(null)

  // New task form state
  const [newTask, setNewTask] = useState({
    title: "",
    date: new Date().toISOString().split('T')[0],
    startTime: "09:00",
    endTime: "",
    duration: "",
    location: "",
    description: "",
    notes: "",
    priority: "medium" as "low" | "medium" | "high",
    category: "",
    isAllDay: false
  })

  // Task parsing function
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

  // Task management functions
  const priorityOrder = { high: 3, medium: 2, low: 1 }

  const filteredAndSortedTasks = tasks
    .filter(task => {
      if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      if (filterByTag !== "all" && task.category !== filterByTag) {
        return false
      }
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(a.date).getTime() - new Date(b.date).getTime()
        case "priority":
          return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
                 (priorityOrder[a.priority as keyof typeof priorityOrder] || 0)
        case "title":
          return a.title.localeCompare(b.title)
        default:
          return 0
      }
    })

  const availableTags = Array.from(new Set(tasks.map(task => task.category).filter(Boolean))) as string[]

  const handleSelectTask = (taskId: string) => {
    const newSelected = new Set(selectedTasks)
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId)
    } else {
      newSelected.add(taskId)
    }
    setSelectedTasks(newSelected)
  }

  const handleSelectAllTasks = (checked: boolean) => {
    if (checked) {
      const allTaskIds = new Set(filteredAndSortedTasks.map(task => task._id).filter(Boolean) as string[])
      setSelectedTasks(allTaskIds)
    } else {
      setSelectedTasks(new Set())
    }
  }

  const handleBulkDelete = async () => {
    if (selectedTasks.size === 0) return

    const confirmed = window.confirm(`Are you sure you want to delete ${selectedTasks.size} selected task(s)? This action cannot be undone.`)
    if (!confirmed) return

    try {
      for (const taskId of selectedTasks) {
        await deleteTask({ id: taskId as any })
      }
      setSelectedTasks(new Set())
    } catch (err) {
      console.error("Error deleting tasks:", err)
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

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) return

    try {
      await createTask({
        title: newTask.title,
        date: newTask.date || new Date().toISOString().split('T')[0],
        startTime: newTask.startTime || "09:00",
        endTime: newTask.endTime,
        duration: newTask.duration,
        location: newTask.location,
        description: newTask.description,
        notes: newTask.notes,
        priority: newTask.priority || "medium",
        category: newTask.category,
        isAllDay: newTask.isAllDay || false
      })

      // Reset form and close dialog
      setNewTask({
        title: "",
        date: new Date().toISOString().split('T')[0],
        startTime: "09:00",
        endTime: "",
        duration: "",
        location: "",
        description: "",
        notes: "",
        priority: "medium",
        category: "",
        isAllDay: false
      })
      setIsNewTaskDialogOpen(false)
    } catch (err) {
      console.error("Error creating task:", err)
      setError(err instanceof Error ? err.message : "Failed to create task")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Home</h1>
        <p className="text-muted-foreground">
          Parse tasks from natural language and manage your task list
        </p>
      </div>

      {/* Task Parser Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            AI Task Parser
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">Describe your tasks in natural language</Label>
            <Textarea
              id="prompt"
              placeholder="Example: Meeting with John tomorrow at 2pm, grocery shopping on Friday, call mom this weekend..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[100px]"
            />
          </div>
          
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
          
          <Button 
            onClick={handleParsePrompt} 
            disabled={loading || !prompt.trim()}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Parsing Tasks...
              </>
            ) : (
              "Parse Tasks"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Task Management Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-semibold">Tasks</CardTitle>
            <Button onClick={() => setIsNewTaskDialogOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Task
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all"
                checked={selectedTasks.size === filteredAndSortedTasks.length && filteredAndSortedTasks.length > 0}
                onCheckedChange={handleSelectAllTasks}
              />
              <Label htmlFor="select-all" className="text-sm font-medium">
                Select all ({selectedTasks.size} selected)
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={(value: "date" | "priority" | "title") => setSortBy(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Due Date</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="title">Alphabetical</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterByTag} onValueChange={setFilterByTag}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tags</SelectItem>
                  {availableTags.map(tag => (
                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedTasks.size > 0 && (
                <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete ({selectedTasks.size})
                </Button>
              )}
            </div>
          </div>

          {/* Task List */}
          <div className="space-y-2">
            {filteredAndSortedTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery || filterByTag !== "all" ? "No tasks match your filters" : "No tasks yet. Create your first task!"}
              </div>
            ) : (
              filteredAndSortedTasks.map((task, index) => (
                <div
                  key={task._id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Checkbox
                    checked={selectedTasks.has(task._id || "")}
                    onCheckedChange={() => handleSelectTask(task._id || "")}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium truncate">{task.title}</h3>
                      {task.category && (
                        <Badge variant="secondary" className="text-xs">
                          {task.category}
                        </Badge>
                      )}
                      {task.priority && task.priority !== "medium" && (
                        <Badge 
                          variant={task.priority === "high" ? "destructive" : "outline"}
                          className="text-xs"
                        >
                          {task.priority}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {new Date(task.date).toLocaleDateString()}
                      </div>
                      {task.startTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {task.startTime}
                          {task.endTime && ` - ${task.endTime}`}
                        </div>
                      )}
                      {task.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {task.location}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(index)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* New Task Dialog */}
      <Dialog open={isNewTaskDialogOpen} onOpenChange={setIsNewTaskDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-title">Title *</Label>
              <Input
                id="new-title"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="Enter task title"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-date">Date</Label>
                <Input
                  id="new-date"
                  type="date"
                  value={newTask.date}
                  onChange={(e) => setNewTask({ ...newTask, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-time">Time</Label>
                <Input
                  id="new-time"
                  type="time"
                  value={newTask.startTime}
                  onChange={(e) => setNewTask({ ...newTask, startTime: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-category">Category</Label>
              <Input
                id="new-category"
                value={newTask.category}
                onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                placeholder="e.g., work, personal, meeting"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewTaskDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTask} disabled={!newTask.title.trim()}>
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
