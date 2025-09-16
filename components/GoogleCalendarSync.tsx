"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Loader2, CheckCircle, AlertCircle, ExternalLink, Mail } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { GoogleCalendarAPI, taskToGoogleEvent } from '@/lib/google-calendar'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Task } from '@/lib/task-types'

interface GoogleCalendarSyncProps {
  tasks: Task[]
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void
  onTaskDelete?: (taskId: string, googleEventId?: string) => void
}

export function GoogleCalendarSync({ tasks, onTaskUpdate, onTaskDelete }: GoogleCalendarSyncProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle')
  const [syncMessage, setSyncMessage] = useState('')

  // Google Calendar request dialog state
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)
  const [requestEmail, setRequestEmail] = useState('')
  const [requestMessage, setRequestMessage] = useState('')
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false)
  
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

  const syncChangesToGoogleCalendar = async () => {
    if (!isConnected) {
      connectToGoogleCalendar()
      return
    }

    setIsLoading(true)
    setSyncStatus('syncing')
    setSyncMessage('Syncing changes to Google Calendar...')

    try {
      const accessToken = localStorage.getItem('google_access_token')
      if (!accessToken) {
        throw new Error('No access token found')
      }

      const googleCalendar = new GoogleCalendarAPI(accessToken)

      // Get tasks that need different types of syncing
      const newTasks = tasks.filter(task =>
        !task.googleEventId &&
        (task.syncStatus === 'pending' || task.syncStatus === 'error' || !task.syncStatus)
      )
      const updatedTasks = tasks.filter(task =>
        task.googleEventId &&
        task.syncStatus === 'pending'
      )
      const errorTasks = tasks.filter(task =>
        task.syncStatus === 'error' &&
        task.googleEventId
      )

      console.log('Starting sync changes process...')
      console.log('Total tasks:', tasks.length)
      console.log('New tasks to create:', newTasks.length)
      console.log('Updated tasks to sync:', updatedTasks.length)
      console.log('Error tasks to retry:', errorTasks.length)

      let createdCount = 0
      let updatedCount = 0
      let errorCount = 0

      // Handle new tasks (create events)
      for (const task of newTasks) {
        try {
          const googleEvent = taskToGoogleEvent(task)
          const createdEvent = await googleCalendar.createEvent(googleEvent)

          if (task._id) {
            await updateTask({
              id: task._id,
              googleEventId: createdEvent.id,
              syncStatus: 'synced',
              lastSyncedAt: new Date().toISOString()
            })
          }

          if (onTaskUpdate && task._id) {
            onTaskUpdate(task._id, {
              googleEventId: createdEvent.id,
              syncStatus: 'synced',
              lastSyncedAt: new Date().toISOString()
            })
          }

          createdCount++
        } catch (error) {
          console.error(`Failed to create event for task ${task.title}:`, error)
          await handleSyncError(task, error)
          errorCount++
        }
      }

      // Handle updated tasks (update existing events)
      for (const task of updatedTasks) {
        try {
          if (task.googleEventId) {
            const googleEvent = taskToGoogleEvent(task)
            await googleCalendar.updateEvent(task.googleEventId, googleEvent)

            if (task._id) {
              await updateTask({
                id: task._id,
                syncStatus: 'synced',
                lastSyncedAt: new Date().toISOString()
              })
            }

            if (onTaskUpdate && task._id) {
              onTaskUpdate(task._id, {
                syncStatus: 'synced',
                lastSyncedAt: new Date().toISOString()
              })
            }

            updatedCount++
          }
        } catch (error) {
          console.error(`Failed to update event for task ${task.title}:`, error)
          await handleSyncError(task, error)
          errorCount++
        }
      }

      // Handle error tasks (retry)
      for (const task of errorTasks) {
        try {
          if (task.googleEventId) {
            // Try to update existing event
            const googleEvent = taskToGoogleEvent(task)
            await googleCalendar.updateEvent(task.googleEventId, googleEvent)
            updatedCount++
          } else {
            // Try to create new event
            const googleEvent = taskToGoogleEvent(task)
            const createdEvent = await googleCalendar.createEvent(googleEvent)

            if (task._id) {
              await updateTask({
                id: task._id,
                googleEventId: createdEvent.id,
                syncStatus: 'synced',
                lastSyncedAt: new Date().toISOString()
              })
            }
            createdCount++
          }

          if (task._id) {
            await updateTask({
              id: task._id,
              syncStatus: 'synced',
              lastSyncedAt: new Date().toISOString()
            })
          }

          if (onTaskUpdate && task._id) {
            onTaskUpdate(task._id, {
              syncStatus: 'synced',
              lastSyncedAt: new Date().toISOString()
            })
          }
        } catch (error) {
          console.error(`Failed to retry sync for task ${task.title}:`, error)
          await handleSyncError(task, error)
          errorCount++
        }
      }

      // Generate success message
      const totalProcessed = createdCount + updatedCount
      if (errorCount === 0 && totalProcessed > 0) {
        setSyncStatus('success')
        setSyncMessage(`Successfully synced ${totalProcessed} changes (${createdCount} created, ${updatedCount} updated)`)
      } else if (totalProcessed > 0) {
        setSyncStatus('error')
        setSyncMessage(`Synced ${totalProcessed} changes, ${errorCount} failed. Check console for details.`)
      } else {
        setSyncStatus('success')
        setSyncMessage('All tasks are already up to date!')
      }

    } catch (error) {
      console.error('Sync error:', error)
      setSyncStatus('error')
      setSyncMessage(error instanceof Error ? error.message : 'Failed to sync changes')
    } finally {
      setIsLoading(false)
      setTimeout(() => {
        setSyncStatus('idle')
        setSyncMessage('')
      }, 5000)
    }
  }

  const handleSyncError = async (task: Task, error: any) => {
    console.error('Task data:', task)

    try {
      if (task._id) {
        await updateTask({
          id: task._id,
          syncStatus: 'error',
          lastSyncedAt: new Date().toISOString()
        })
      }
    } catch (updateError) {
      console.error('Failed to update task with error status:', updateError)
    }

    if (onTaskUpdate && task._id) {
      onTaskUpdate(task._id, {
        syncStatus: 'error',
        lastSyncedAt: new Date().toISOString()
      })
    }
  }

  const deleteTaskFromGoogleCalendar = async (googleEventId: string) => {
    if (!isConnected) {
      throw new Error('Google Calendar not connected')
    }

    const accessToken = localStorage.getItem('google_access_token')
    if (!accessToken) {
      throw new Error('No access token found')
    }

    const googleCalendar = new GoogleCalendarAPI(accessToken)
    await googleCalendar.deleteEvent(googleEventId)
  }

  const disconnectGoogleCalendar = () => {
    localStorage.removeItem('google_access_token')
    localStorage.removeItem('google_refresh_token')
    setIsConnected(false)
    setSyncStatus('idle')
    setSyncMessage('')
  }

  const handleRequestGoogleCalendar = async () => {
    if (!requestEmail.trim()) {
      setSyncMessage('Please enter your email address')
      setSyncStatus('error')
      return
    }

    setIsSubmittingRequest(true)

    try {
      const response = await fetch('/api/request-google-calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: requestEmail.trim(),
          message: requestMessage.trim()
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSyncStatus('success')
        setSyncMessage(data.message || 'Request submitted successfully!')
        setIsRequestDialogOpen(false)
        setRequestEmail('')
        setRequestMessage('')
      } else {
        setSyncStatus('error')
        setSyncMessage(data.error || 'Failed to submit request')
      }
    } catch (error) {
      console.error('Error submitting request:', error)
      setSyncStatus('error')
      setSyncMessage('Failed to submit request. Please try again.')
    } finally {
      setIsSubmittingRequest(false)
      setTimeout(() => {
        setSyncStatus('idle')
        setSyncMessage('')
      }, 5000)
    }
  }

  const newTasks = tasks.filter(task =>
    !task.googleEventId &&
    (task.syncStatus === 'pending' || task.syncStatus === 'error' || !task.syncStatus)
  )
  const updatedTasks = tasks.filter(task =>
    task.googleEventId &&
    task.syncStatus === 'pending'
  )
  const syncedTasks = tasks.filter(task => task.syncStatus === 'synced')
  const errorTasks = tasks.filter(task => task.syncStatus === 'error')
  const totalChanges = newTasks.length + updatedTasks.length + errorTasks.length

  return (
    <>
      <Card className="posthog-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-brand-blue" />
              <CardTitle className="text-foreground">Google Calendar Changes</CardTitle>
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
            <div className="space-y-3">
              <p className="text-muted-foreground text-sm">
                Connect your Google Calendar to sync task changes automatically.
              </p>

              {/* Request Google Calendar Access Button */}
              <Button
                onClick={() => setIsRequestDialogOpen(true)}
                variant="outline"
                className="w-full posthog-focus"
              >
                <Mail className="h-4 w-4 mr-2" />
                Request Google Calendar Access
              </Button>

              <Button
                onClick={connectToGoogleCalendar}
                className="w-full posthog-button-primary posthog-focus"
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
                  Your Google Calendar is connected. Task changes can be synced on demand.
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
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-brand-blue">{syncedTasks.length}</div>
                  <div className="text-xs text-muted-foreground">Synced</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-green-600">{newTasks.length}</div>
                  <div className="text-xs text-muted-foreground">New</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-brand-yellow">{updatedTasks.length}</div>
                  <div className="text-xs text-muted-foreground">Updated</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-brand-red">{errorTasks.length}</div>
                  <div className="text-xs text-muted-foreground">Errors</div>
                </div>
              </div>

              {/* Sync Changes Button */}
              <Button
                onClick={syncChangesToGoogleCalendar}
                disabled={isLoading || totalChanges === 0}
                className="w-full posthog-button-secondary posthog-focus"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Syncing Changes...
                  </>
                ) : totalChanges > 0 ? (
                  <>
                    <Calendar className="h-4 w-4 mr-2" />
                    Sync {totalChanges} Changes
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4 mr-2" />
                    All Changes Synced
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

    {/* Google Calendar Request Dialog */}
    <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Google Calendar Access</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="request-email">Your Email Address</Label>
            <Input
              id="request-email"
              type="email"
              placeholder="your.email@example.com"
              value={requestEmail}
              onChange={(e) => setRequestEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="request-message">Additional Message (Optional)</Label>
            <Textarea
              id="request-message"
              placeholder="Tell us why you'd like Google Calendar access..."
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              rows={3}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            We'll review your request and contact you with Google Calendar access instructions.
          </p>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsRequestDialogOpen(false)}
            disabled={isSubmittingRequest}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRequestGoogleCalendar}
            disabled={isSubmittingRequest || !requestEmail.trim()}
          >
            {isSubmittingRequest ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Submit Request
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
