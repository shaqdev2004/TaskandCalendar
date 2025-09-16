"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, CheckCircle, Trash2, MessageSquare, User, Mail, Calendar } from "lucide-react"

interface Feedback {
  _id: Id<"feedback">
  _creationTime: number
  title: string
  message: string
  submittedAt: string
  userId?: string
  userEmail?: string
  status: "new" | "reviewed" | "resolved"
  adminNotes?: string
  reviewedAt?: string
  reviewedBy?: string
}

export default function FeedbackAdmin() {
  const [selectedStatus, setSelectedStatus] = useState<"all" | "new" | "reviewed" | "resolved">("all")
  const [processingFeedback, setProcessingFeedback] = useState<Id<"feedback"> | null>(null)
  const [adminNotes, setAdminNotes] = useState("")

  // Queries
  const allFeedback = useQuery(api.feedback.getAllFeedback, {})
  const newFeedback = useQuery(api.feedback.getAllFeedback, { status: "new" })
  const reviewedFeedback = useQuery(api.feedback.getAllFeedback, { status: "reviewed" })
  const resolvedFeedback = useQuery(api.feedback.getAllFeedback, { status: "resolved" })
  const feedbackCounts = useQuery(api.feedback.getFeedbackCounts, {})

  // Mutations
  const updateStatus = useMutation(api.feedback.updateFeedbackStatus)
  const deleteFeedback = useMutation(api.feedback.deleteFeedback)

  const getFeedbackForTab = () => {
    switch (selectedStatus) {
      case "new":
        return newFeedback || []
      case "reviewed":
        return reviewedFeedback || []
      case "resolved":
        return resolvedFeedback || []
      default:
        return allFeedback || []
    }
  }

  const handleStatusUpdate = async (feedbackId: Id<"feedback">, status: "reviewed" | "resolved") => {
    try {
      await updateStatus({
        feedbackId,
        status,
        adminNotes: adminNotes.trim() || undefined,
      })
      setProcessingFeedback(null)
      setAdminNotes("")
    } catch (error) {
      console.error("Error updating feedback status:", error)
    }
  }

  const handleDeleteFeedback = async (feedbackId: Id<"feedback">) => {
    if (confirm("Are you sure you want to delete this feedback?")) {
      try {
        await deleteFeedback({ feedbackId })
      } catch (error) {
        console.error("Error deleting feedback:", error)
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <Badge variant="outline" className="text-blue-600"><MessageSquare className="w-3 h-3 mr-1" />New</Badge>
      case "reviewed":
        return <Badge variant="outline" className="text-yellow-600"><Eye className="w-3 h-3 mr-1" />Reviewed</Badge>
      case "resolved":
        return <Badge variant="outline" className="text-green-600"><CheckCircle className="w-3 h-3 mr-1" />Resolved</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const truncateMessage = (message: string, maxLength: number = 150) => {
    if (message.length <= maxLength) return message
    return message.substring(0, maxLength) + "..."
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="w-8 h-8" />
            Feedback Management
          </h1>
          <p className="text-muted-foreground">Review and manage user feedback</p>
        </div>
        {feedbackCounts && feedbackCounts.new > 0 && (
          <Badge variant="destructive" className="text-lg px-3 py-1">
            {feedbackCounts.new} New
          </Badge>
        )}
      </div>

      <Tabs value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({feedbackCounts?.total || 0})</TabsTrigger>
          <TabsTrigger value="new">New ({feedbackCounts?.new || 0})</TabsTrigger>
          <TabsTrigger value="reviewed">Reviewed ({feedbackCounts?.reviewed || 0})</TabsTrigger>
          <TabsTrigger value="resolved">Resolved ({feedbackCounts?.resolved || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedStatus} className="mt-6">
          <div className="grid gap-4">
            {getFeedbackForTab().map((feedback: Feedback) => (
              <Card key={feedback._id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{feedback.title}</CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(feedback.submittedAt)}
                        </span>
                        {feedback.userEmail && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {feedback.userEmail}
                          </span>
                        )}
                        {feedback.userId && (
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            User ID: {feedback.userId.substring(0, 8)}...
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(feedback.status)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteFeedback(feedback._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <Label className="text-sm font-medium">Message:</Label>
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                      {truncateMessage(feedback.message)}
                    </p>
                    {feedback.message.length > 150 && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="link" className="p-0 h-auto text-xs">
                            Read more...
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>{feedback.title}</DialogTitle>
                          </DialogHeader>
                          <div className="py-4">
                            <p className="whitespace-pre-wrap">{feedback.message}</p>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>

                  {feedback.adminNotes && (
                    <div className="mb-4">
                      <Label className="text-sm font-medium">Admin Notes:</Label>
                      <p className="text-sm text-muted-foreground mt-1">{feedback.adminNotes}</p>
                    </div>
                  )}

                  {feedback.reviewedAt && (
                    <div className="mb-4">
                      <Label className="text-sm font-medium">Reviewed:</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatDate(feedback.reviewedAt)}
                        {feedback.reviewedBy && ` by ${feedback.reviewedBy.substring(0, 8)}...`}
                      </p>
                    </div>
                  )}

                  {feedback.status === "new" && (
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                            onClick={() => setProcessingFeedback(feedback._id)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Mark as Reviewed
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Mark as Reviewed</DialogTitle>
                            <DialogDescription>
                              Mark this feedback as reviewed: "{feedback.title}"
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <Label htmlFor="notes">Admin Notes (Optional)</Label>
                              <Textarea
                                id="notes"
                                placeholder="Add any notes about this feedback..."
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setProcessingFeedback(null)
                                setAdminNotes("")
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={() => handleStatusUpdate(feedback._id, "reviewed")}
                              className="bg-yellow-600 hover:bg-yellow-700"
                            >
                              Mark as Reviewed
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            className="text-green-600 border-green-600 hover:bg-green-50"
                            onClick={() => setProcessingFeedback(feedback._id)}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Mark as Resolved
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Mark as Resolved</DialogTitle>
                            <DialogDescription>
                              Mark this feedback as resolved: "{feedback.title}"
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <Label htmlFor="notes">Resolution Notes (Optional)</Label>
                              <Textarea
                                id="notes"
                                placeholder="Describe how this feedback was addressed..."
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setProcessingFeedback(null)
                                setAdminNotes("")
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={() => handleStatusUpdate(feedback._id, "resolved")}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Mark as Resolved
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}

                  {feedback.status === "reviewed" && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="text-green-600 border-green-600 hover:bg-green-50"
                          onClick={() => setProcessingFeedback(feedback._id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark as Resolved
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Mark as Resolved</DialogTitle>
                          <DialogDescription>
                            Mark this feedback as resolved: "{feedback.title}"
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="notes">Resolution Notes (Optional)</Label>
                            <Textarea
                              id="notes"
                              placeholder="Describe how this feedback was addressed..."
                              value={adminNotes}
                              onChange={(e) => setAdminNotes(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setProcessingFeedback(null)
                              setAdminNotes("")
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => handleStatusUpdate(feedback._id, "resolved")}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Mark as Resolved
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardContent>
              </Card>
            ))}
            {getFeedbackForTab().length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">No feedback found for this status.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
