"use client"

import { useCallback } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { GoogleCalendarAPI, taskToGoogleEvent } from '@/lib/google-calendar'
import { Task } from '@/lib/task-types'

export function useGoogleCalendarSync() {
  const updateTask = useMutation(api.tasks.updateTask)

  const isConnected = useCallback(() => {
    return !!localStorage.getItem('google_access_token')
  }, [])

  const getGoogleCalendarAPI = useCallback(() => {
    const accessToken = localStorage.getItem('google_access_token')
    if (!accessToken) {
      throw new Error('Google Calendar not connected')
    }
    return new GoogleCalendarAPI(accessToken)
  }, [])

  // Sync a new task to Google Calendar
  const syncNewTask = useCallback(async (task: Task) => {
    if (!isConnected() || !task._id) return

    try {
      const googleCalendar = getGoogleCalendarAPI()
      const googleEvent = taskToGoogleEvent(task)
      const createdEvent = await googleCalendar.createEvent(googleEvent)

      // Update task with Google Calendar event ID
      await updateTask({
        id: task._id,
        googleEventId: createdEvent.id,
        syncStatus: 'synced',
        lastSyncedAt: new Date().toISOString()
      })

      console.log(`✅ Created Google Calendar event for task: ${task.title}`)
      return createdEvent.id
    } catch (error) {
      console.error(`❌ Failed to sync new task to Google Calendar:`, error)
      
      // Mark task as error
      if (task._id) {
        await updateTask({
          id: task._id,
          syncStatus: 'error',
          lastSyncedAt: new Date().toISOString()
        })
      }
      throw error
    }
  }, [isConnected, getGoogleCalendarAPI, updateTask])

  // Sync task updates to Google Calendar
  const syncTaskUpdate = useCallback(async (task: Task) => {
    if (!isConnected() || !task._id || !task.googleEventId) return

    try {
      const googleCalendar = getGoogleCalendarAPI()
      const googleEvent = taskToGoogleEvent(task)
      await googleCalendar.updateEvent(task.googleEventId, googleEvent)

      // Update sync status
      await updateTask({
        id: task._id,
        syncStatus: 'synced',
        lastSyncedAt: new Date().toISOString()
      })

      console.log(`✅ Updated Google Calendar event for task: ${task.title}`)
    } catch (error) {
      console.error(`❌ Failed to sync task update to Google Calendar:`, error)
      
      // Mark task as error
      if (task._id) {
        await updateTask({
          id: task._id,
          syncStatus: 'error',
          lastSyncedAt: new Date().toISOString()
        })
      }
      throw error
    }
  }, [isConnected, getGoogleCalendarAPI, updateTask])

  // Delete task from Google Calendar
  const syncTaskDeletion = useCallback(async (googleEventId: string) => {
    if (!isConnected() || !googleEventId) return

    try {
      const googleCalendar = getGoogleCalendarAPI()
      await googleCalendar.deleteEvent(googleEventId)
      console.log(`✅ Deleted Google Calendar event: ${googleEventId}`)
    } catch (error) {
      console.error(`❌ Failed to delete Google Calendar event:`, error)
      throw error
    }
  }, [isConnected, getGoogleCalendarAPI])

  // Mark task as pending sync (when task is modified)
  const markTaskForSync = useCallback(async (taskId: string) => {
    try {
      await updateTask({
        id: taskId as any,
        syncStatus: 'pending',
        lastSyncedAt: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to mark task for sync:', error)
    }
  }, [updateTask])

  return {
    isConnected,
    syncNewTask,
    syncTaskUpdate,
    syncTaskDeletion,
    markTaskForSync
  }
}
