"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Loader2, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react'
import { GoogleCalendarAPI, taskToGoogleEvent } from '@/lib/google-calendar'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Task } from '@/lib/task-types'

interface GoogleCalendarSyncProps {
  tasks: Task[]
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void
}

export function GoogleCalendarSync({ tasks, onTaskUpdate }: GoogleCalendarSyncProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle')
  const [syncMessage, setSyncMessage] = useState('')
  
  const updateTask = useMutation(api.tasks.updateTask)

  useEffect(() => {
    // Check if user has Google Calendar tokens
    const accessToken = localStorage.getItem('google_access_token')
    setIsConnected(!!accessToken)
  }, [])

  const connectToGoogleCalendar = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const redirectUri = `${window.location.origin}/google-calendar-callback`
    const scope = 'https://www.googleapis.com/auth/calendar'
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scope)}&` +
      `access_type=offline&` +
      `prompt=consent`
    
    window.location.href = authUrl
  }

  const syncTasksToGoogleCalendar = async () => {
    if (!isConnected) {
      connectToGoogleCalendar()
      return
    }

    setIsLoading(true)
    setSyncStatus('syncing')
    setSyncMessage('Syncing tasks to Google Calendar...')

    try {
      const accessToken = localStorage.getItem('google_access_token')
      if (!accessToken) {
        throw new Error('No access token found')
      }

      const googleCalendar = new GoogleCalendarAPI(accessToken)
      const unsyncedTasks = tasks.filter(task => !task.googleEventId && task.syncStatus !== 'synced')
      
      let syncedCount = 0
      let errorCount = 0

      for (const task of unsyncedTasks) {
        try {
          const googleEvent = taskToGoogleEvent(task)
          const createdEvent = await googleCalendar.createEvent(googleEvent)
          
          // Update task in Convex with Google Calendar event ID
          await updateTask({
            id: task._id as any,
            googleEventId: createdEvent.id,
            syncStatus: 'synced',
            lastSyncedAt: new Date().toISOString()
          })

          // Update local state if callback provided
          if (onTaskUpdate) {
            onTaskUpdate(task._id!, {
              googleEventId: createdEvent.id,
              syncStatus: 'synced',
              lastSyncedAt: new Date().toISOString()
            })
          }

          syncedCount++
        } catch (error) {
          console.error(`Failed to sync task ${task.title}:`, error)
          
          // Update task with error status
          await updateTask({
            id: task._id as any,
            syncStatus: 'error',
            lastSyncedAt: new Date().toISOString()
          })

          if (onTaskUpdate) {
            onTaskUpdate(task._id!, {
              syncStatus: 'error',
              lastSyncedAt: new Date().toISOString()
            })
          }

          errorCount++
        }
      }

      if (errorCount === 0) {
        setSyncStatus('success')
        setSyncMessage(`Successfully synced ${syncedCount} tasks to Google Calendar!`)
      } else {
        setSyncStatus('error')
        setSyncMessage(`Synced ${syncedCount} tasks, ${errorCount} failed. Check console for details.`)
      }

    } catch (error) {
      console.error('Sync error:', error)
      setSyncStatus('error')
      setSyncMessage(error instanceof Error ? error.message : 'Failed to sync tasks')
    } finally {
      setIsLoading(false)
      setTimeout(() => {
        setSyncStatus('idle')
        setSyncMessage('')
      }, 5000)
    }
  }

  const disconnectGoogleCalendar = () => {
    localStorage.removeItem('google_access_token')
    localStorage.removeItem('google_refresh_token')
    setIsConnected(false)
    setSyncStatus('idle')
    setSyncMessage('')
  }

  const unsyncedTasks = tasks.filter(task => !task.googleEventId && task.syncStatus !== 'synced')
  const syncedTasks = tasks.filter(task => task.googleEventId && task.syncStatus === 'synced')
  const errorTasks = tasks.filter(task => task.syncStatus === 'error')

  return (
    <Card className="posthog-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-brand-blue" />
            <CardTitle className="text-foreground">Google Calendar Sync</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Badge className="bg-green-500 text-white">Connected</Badge>
            ) : (
              <Badge variant="secondary">Not Connected</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="space-y-2">
          {!isConnected ? (
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">
                Connect your Google Calendar to automatically sync your tasks as events.
              </p>
              <Button 
                onClick={connectToGoogleCalendar}
                className="posthog-button-primary posthog-focus"
                disabled={isLoading}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Connect Google Calendar
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-sm">
                  Your Google Calendar is connected and ready to sync.
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={disconnectGoogleCalendar}
                  className="posthog-focus"
                >
                  Disconnect
                </Button>
              </div>

              {/* Sync Statistics */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-brand-blue">{syncedTasks.length}</div>
                  <div className="text-xs text-muted-foreground">Synced</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-brand-yellow">{unsyncedTasks.length}</div>
                  <div className="text-xs text-muted-foreground">Pending</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-brand-red">{errorTasks.length}</div>
                  <div className="text-xs text-muted-foreground">Errors</div>
                </div>
              </div>

              {/* Sync Button */}
              <Button 
                onClick={syncTasksToGoogleCalendar}
                disabled={isLoading || unsyncedTasks.length === 0}
                className="w-full posthog-button-secondary posthog-focus"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4 mr-2" />
                    Sync {unsyncedTasks.length} Tasks
                  </>
                )}
              </Button>

              {/* Status Message */}
              {syncStatus !== 'idle' && syncMessage && (
                <div className={`flex items-center gap-2 p-3 rounded-md ${
                  syncStatus === 'success' ? 'bg-green-500/10 border border-green-500/20' :
                  syncStatus === 'error' ? 'bg-brand-red/10 border border-brand-red/20' :
                  'bg-brand-blue/10 border border-brand-blue/20'
                }`}>
                  {syncStatus === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
                  {syncStatus === 'error' && <AlertCircle className="h-4 w-4 text-brand-red" />}
                  {syncStatus === 'syncing' && <Loader2 className="h-4 w-4 animate-spin text-brand-blue" />}
                  <span className={`text-sm font-medium ${
                    syncStatus === 'success' ? 'text-green-600' :
                    syncStatus === 'error' ? 'text-brand-red' :
                    'text-brand-blue'
                  }`}>
                    {syncMessage}
                  </span>
                </div>
              )}

              {/* Quick Link to Google Calendar */}
              <div className="pt-2 border-t border-divider">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => window.open('https://calendar.google.com', '_blank')}
                  className="w-full posthog-focus"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Google Calendar
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
