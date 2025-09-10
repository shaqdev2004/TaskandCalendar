// page.tsx
import { Suspense } from "react";
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import CallbackHandler from "@/app/google-calendar-callback/CallbackHandler";

// Loading component for Suspense fallback
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p>Loading...</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function GoogleCalendarCallback() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CallbackHandler />
    </Suspense>
  )
}