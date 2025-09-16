"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, MicOff } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface FloatingVoiceButtonProps {
  onTranscript?: (text: string) => void
}

export function FloatingVoiceButton({ onTranscript }: FloatingVoiceButtonProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const recognitionRef = useRef<any>(null)
  const router = useRouter()

  // Hide button on desktop, show only on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsVisible(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const startRecording = () => {
    if (!window.webkitSpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please try Chrome or Edge.')
      return
    }

    setIsRecording(true)
    
    recognitionRef.current = new window.webkitSpeechRecognition()
    recognitionRef.current.continuous = true
    recognitionRef.current.interimResults = true

    let finalTranscript = ''

    recognitionRef.current.onresult = (event: any) => {
      let interimTranscript = ''
      
      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      // If we have final transcript, handle it
      if (finalTranscript) {
        if (onTranscript) {
          onTranscript(finalTranscript)
        } else {
          // Navigate to home page with the transcript
          const encodedText = encodeURIComponent(finalTranscript)
          router.push(`/?voice=${encodedText}`)
        }
        stopRecording()
      }
    }

    recognitionRef.current.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      setIsRecording(false)
    }

    recognitionRef.current.onend = () => {
      setIsRecording(false)
    }

    try {
      recognitionRef.current.start()
    } catch (err) {
      console.error('Error starting speech recognition:', err)
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsRecording(false)
  }

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  if (!isVisible) return null

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        onClick={handleToggleRecording}
        size="lg"
        variant={isRecording ? "destructive" : "default"}
        className={`
          h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200
          ${isRecording ? 'animate-pulse bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}
        `}
      >
        {isRecording ? (
          <MicOff className="h-6 w-6 text-white" />
        ) : (
          <Mic className="h-6 w-6 text-white" />
        )}
      </Button>
      
      {/* Recording indicator */}
      {isRecording && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          🎤 Listening...
        </div>
      )}
    </div>
  )
}
