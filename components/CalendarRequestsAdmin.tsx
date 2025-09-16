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
import { CheckCircle, XCircle, Clock, Trash2 } from "lucide-react"

interface CalendarRequest {
  _id: Id<"calendarRequests">
  _creationTime: number
  email: string
  message?: string
  status: "pending" | "approved" | "rejected"
  requestedAt: string
  processedAt?: string
  processedBy?: string
  notes?: string
}

export default function CalendarRequestsAdmin() {
  const [selectedStatus, setSelectedStatus] = useState<"all" | "pending" | "approved" | "rejected">("all")
  const [processingRequest, setProcessingRequest] = useState<Id<"calendarRequests"> | null>(null)
  const [adminNotes, setAdminNotes] = useState("")

  // Queries
  const allRequests = useQuery(api.calendarRequests.getAllCalendarRequests, {})
  const pendingRequests = useQuery(api.calendarRequests.getAllCalendarRequests, { status: "pending" })
  const approvedRequests = useQuery(api.calendarRequests.getAllCalendarRequests, { status: "approved" })
  const rejectedRequests = useQuery(api.calendarRequests.getAllCalendarRequests, { status: "rejected" })
  const pendingCount = useQuery(api.calendarRequests.getPendingRequestsCount, {})

  // Mutations
  const updateStatus = useMutation(api.calendarRequests.updateCalendarRequestStatus)
  const deleteRequest = useMutation(api.calendarRequests.deleteCalendarRequest)

  const getRequestsForTab = () => {
    switch (selectedStatus) {
      case "pending":
        return pendingRequests || []
      case "approved":
        return approvedRequests || []
      case "rejected":
        return rejectedRequests || []
      default:
        return allRequests || []
    }
  }

  const handleStatusUpdate = async (requestId: Id<"calendarRequests">, status: "approved" | "rejected") => {
    try {
      await updateStatus({
        requestId,
        status,
        notes: adminNotes.trim() || undefined,
      })
      setProcessingRequest(null)
      setAdminNotes("")
    } catch (error) {
      console.error("Error updating request status:", error)
    }
  }

  const handleDeleteRequest = async (requestId: Id<"calendarRequests">) => {
    if (confirm("Are you sure you want to delete this request?")) {
      try {
        await deleteRequest({ requestId })
      } catch (error) {
        console.error("Error deleting request:", error)
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case "approved":
        return <Badge variant="outline" className="text-green-600"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>
      case "rejected":
        return <Badge variant="outline" className="text-red-600"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Calendar Access Requests</h1>
          <p className="text-muted-foreground">Manage Google Calendar access requests</p>
        </div>
        {pendingCount !== undefined && pendingCount > 0 && (
          <Badge variant="destructive" className="text-lg px-3 py-1">
            {pendingCount} Pending
          </Badge>
        )}
      </div>

      <Tabs value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({allRequests?.length || 0})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingRequests?.length || 0})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approvedRequests?.length || 0})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejectedRequests?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedStatus} className="mt-6">
          <div className="grid gap-4">
            {getRequestsForTab().map((request: CalendarRequest) => (
              <Card key={request._id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{request.email}</CardTitle>
                      <CardDescription>
                        Requested: {formatDate(request.requestedAt)}
                        {request.processedAt && (
                          <span className="ml-4">
                            Processed: {formatDate(request.processedAt)}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(request.status)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRequest(request._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {request.message && (
                    <div className="mb-4">
                      <Label className="text-sm font-medium">Message:</Label>
                      <p className="text-sm text-muted-foreground mt-1">{request.message}</p>
                    </div>
                  )}
                  {request.notes && (
                    <div className="mb-4">
                      <Label className="text-sm font-medium">Admin Notes:</Label>
                      <p className="text-sm text-muted-foreground mt-1">{request.notes}</p>
                    </div>
                  )}
                  {request.status === "pending" && (
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            className="text-green-600 border-green-600 hover:bg-green-50"
                            onClick={() => setProcessingRequest(request._id)}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Approve Calendar Request</DialogTitle>
                            <DialogDescription>
                              Approve calendar access for {request.email}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <Label htmlFor="notes">Admin Notes (Optional)</Label>
                              <Textarea
                                id="notes"
                                placeholder="Add any notes about this approval..."
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setProcessingRequest(null)
                                setAdminNotes("")
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={() => handleStatusUpdate(request._id, "approved")}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Approve Request
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            className="text-red-600 border-red-600 hover:bg-red-50"
                            onClick={() => setProcessingRequest(request._id)}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Reject Calendar Request</DialogTitle>
                            <DialogDescription>
                              Reject calendar access for {request.email}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <Label htmlFor="notes">Reason for Rejection (Optional)</Label>
                              <Textarea
                                id="notes"
                                placeholder="Add reason for rejection..."
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setProcessingRequest(null)
                                setAdminNotes("")
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={() => handleStatusUpdate(request._id, "rejected")}
                              variant="destructive"
                            >
                              Reject Request
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {getRequestsForTab().length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">No requests found for this status.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
