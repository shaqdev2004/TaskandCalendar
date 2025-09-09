'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export default function GoogleCalendarCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams?.get('code')
      const error = searchParams?.get('error')

      if (error) {
        setStatus('error')
        setMessage('Authorization was denied or failed')
        setTimeout(() => router.push('/'), 3000)
        return
      }

      if (!code) {
        setStatus('error')
        setMessage('No authorization code received')
        setTimeout(() => router.push('/'), 3000)
        return
      }

      try {
        const response = await fetch('/api/parse-event/auth/google-calendar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to authenticate')
        }

        // Store tokens in localStorage (in production, consider more secure storage)
        localStorage.setItem('google_access_token', data.access_token)
        if (data.refresh_token) {
          localStorage.setItem('google_refresh_token', data.refresh_token)
        }

        setStatus('success')
        setMessage('Successfully connected to Google Calendar!')
        setTimeout(() => router.push('/'), 2000)

      } catch (err) {
        console.error('Callback error:', err)
        setStatus('error')
        setMessage(err instanceof Error ? err.message : 'Authentication failed')
        setTimeout(() => router.push('/'), 3000)
      }
    }

    handleCallback()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 text-center space-y-4">
          {status === 'loading' && (
            <>
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p>Connecting to Google Calendar...</p>
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
              <p className="text-green-600">{message}</p>
              <p className="text-sm text-muted-foreground">Redirecting...</p>
            </>
          )}
          {status === 'error' && (
            <>
              <AlertCircle className="h-8 w-8 text-red-600 mx-auto" />
              <p className="text-red-600">{message}</p>
              <p className="text-sm text-muted-foreground">Redirecting...</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
