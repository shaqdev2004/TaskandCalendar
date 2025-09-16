"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MessageSquare, Send, CheckCircle, AlertCircle } from "lucide-react"

export default function FeedbackForm() {
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    userEmail: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null
    message: string
  }>({ type: null, message: "" })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear status when user starts typing
    if (submitStatus.type) {
      setSubmitStatus({ type: null, message: "" })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.message.trim()) {
      setSubmitStatus({
        type: "error",
        message: "Please fill in both title and message fields."
      })
      return
    }

    if (formData.message.length > 500) {
      setSubmitStatus({
        type: "error",
        message: "Message cannot exceed 500 characters."
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          message: formData.message.trim(),
          userEmail: formData.userEmail.trim() || undefined,
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSubmitStatus({
          type: "success",
          message: data.message || "Feedback submitted successfully!"
        })
        // Clear form on success
        setFormData({
          title: "",
          message: "",
          userEmail: "",
        })
      } else {
        setSubmitStatus({
          type: "error",
          message: data.error || "Failed to submit feedback"
        })
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
      setSubmitStatus({
        type: "error",
        message: "Network error. Please check your connection and try again."
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const remainingChars = 500 - formData.message.length
  const isOverLimit = remainingChars < 0

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MessageSquare className="w-8 h-8" />
          Share Your Feedback
        </h1>
        <p className="text-muted-foreground mt-2">
          Help us improve by sharing your thoughts and suggestions about the app.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submit Feedback</CardTitle>
          <CardDescription>
            Your feedback is valuable to us. Please be specific about what you liked or what could be improved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Brief summary of your feedback"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                maxLength={100}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                {formData.title.length}/100 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                placeholder="Please share your detailed feedback here..."
                value={formData.message}
                onChange={(e) => handleInputChange("message", e.target.value)}
                rows={6}
                disabled={isSubmitting}
                className={isOverLimit ? "border-red-500" : ""}
              />
              <p className={`text-xs ${isOverLimit ? "text-red-500" : "text-muted-foreground"}`}>
                {remainingChars} characters remaining
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="userEmail">Email (Optional)</Label>
              <Input
                id="userEmail"
                type="email"
                placeholder="your.email@example.com"
                value={formData.userEmail}
                onChange={(e) => handleInputChange("userEmail", e.target.value)}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                Provide your email if you'd like us to follow up with you.
              </p>
            </div>

            {submitStatus.type && (
              <Alert className={submitStatus.type === "success" ? "border-green-500" : "border-red-500"}>
                {submitStatus.type === "success" ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={submitStatus.type === "success" ? "text-green-700" : "text-red-700"}>
                  {submitStatus.message}
                </AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              disabled={isSubmitting || isOverLimit || !formData.title.trim() || !formData.message.trim()}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Feedback
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
