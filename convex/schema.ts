// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tasks: defineTable({
    userId: v.string(),
    title: v.string(),
    date: v.string(),
    startTime: v.string(),
    endTime: v.optional(v.string()),
    duration: v.optional(v.string()),
    location: v.optional(v.string()),
    description: v.optional(v.string()),
    notes: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    category: v.optional(v.string()),
    isAllDay: v.optional(v.boolean()),
    // New Google Calendar fields
    googleEventId: v.optional(v.string()),
    lastSyncedAt: v.optional(v.string()),
    syncStatus: v.optional(v.union(v.literal("pending"), v.literal("synced"), v.literal("error"))),
  }).index("by_user", ["userId"]),

  // Optional: Store user Google tokens (consider encryption in production)
  userTokens: defineTable({
    userId: v.string(),
    provider: v.string(),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  }).index("by_user_provider", ["userId", "provider"]),

  // Google Calendar access requests
  calendarRequests: defineTable({
    email: v.string(),
    message: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    requestedAt: v.string(),
    processedAt: v.optional(v.string()),
    processedBy: v.optional(v.string()), // Admin user ID who processed the request
    notes: v.optional(v.string()), // Admin notes
  }).index("by_email", ["email"])
    .index("by_status", ["status"])
    .index("by_requested_at", ["requestedAt"]),

  // User feedback
  feedback: defineTable({
    title: v.string(),
    message: v.string(),
    submittedAt: v.string(),
    userId: v.optional(v.string()), // Optional user ID if authenticated
    userEmail: v.optional(v.string()), // Optional email if provided
    status: v.union(v.literal("new"), v.literal("reviewed"), v.literal("resolved")),
    adminNotes: v.optional(v.string()),
    reviewedAt: v.optional(v.string()),
    reviewedBy: v.optional(v.string()),
  }).index("by_status", ["status"])
    .index("by_submitted_at", ["submittedAt"])
    .index("by_user", ["userId"]),
});