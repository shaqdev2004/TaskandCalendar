import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Mutation to create a new calendar request
export const createCalendarRequest = mutation({
  args: {
    email: v.string(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if there's already a pending request for this email
    const existingRequest = await ctx.db
      .query("calendarRequests")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();

    if (existingRequest) {
      throw new Error("A pending request already exists for this email address");
    }

    return await ctx.db.insert("calendarRequests", {
      email: args.email,
      message: args.message,
      status: "pending",
      requestedAt: new Date().toISOString(),
    });
  },
});

// Query to get all calendar requests (admin only)
export const getAllCalendarRequests = query({
  args: {
    status: v.optional(v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"))),
  },
  handler: async (ctx, args) => {
    // In a real app, you'd want to check if the user is an admin
    // For now, we'll return all requests
    if (args.status) {
      return await ctx.db
        .query("calendarRequests")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    } else {
      return await ctx.db
        .query("calendarRequests")
        .withIndex("by_requested_at")
        .order("desc")
        .collect();
    }
  },
});

// Query to get calendar requests by email
export const getCalendarRequestsByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("calendarRequests")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .order("desc")
      .collect();
  },
});

// Mutation to update calendar request status (admin only)
export const updateCalendarRequestStatus = mutation({
  args: {
    requestId: v.id("calendarRequests"),
    status: v.union(v.literal("approved"), v.literal("rejected")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // In a real app, you'd want to check if the user is an admin
    // For now, we'll allow any authenticated user to update status

    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Calendar request not found");
    }

    return await ctx.db.patch(args.requestId, {
      status: args.status,
      processedAt: new Date().toISOString(),
      processedBy: identity.subject,
      notes: args.notes,
    });
  },
});

// Query to get pending requests count
export const getPendingRequestsCount = query({
  args: {},
  handler: async (ctx) => {
    const pendingRequests = await ctx.db
      .query("calendarRequests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
    
    return pendingRequests.length;
  },
});

// Mutation to delete a calendar request (admin only)
export const deleteCalendarRequest = mutation({
  args: {
    requestId: v.id("calendarRequests"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // In a real app, you'd want to check if the user is an admin
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Calendar request not found");
    }

    return await ctx.db.delete(args.requestId);
  },
});
