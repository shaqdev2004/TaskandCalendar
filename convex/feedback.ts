import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Mutation to create new feedback
export const createFeedback = mutation({
  args: {
    title: v.string(),
    message: v.string(),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate message length (500 character limit)
    if (args.message.length > 500) {
      throw new Error("Feedback message cannot exceed 500 characters");
    }

    // Validate title length
    if (args.title.length > 100) {
      throw new Error("Feedback title cannot exceed 100 characters");
    }

    if (args.title.trim().length === 0) {
      throw new Error("Feedback title is required");
    }

    if (args.message.trim().length === 0) {
      throw new Error("Feedback message is required");
    }

    // Get user identity if authenticated
    const identity = await ctx.auth.getUserIdentity();

    return await ctx.db.insert("feedback", {
      title: args.title.trim(),
      message: args.message.trim(),
      submittedAt: new Date().toISOString(),
      userId: identity?.subject,
      userEmail: args.userEmail?.trim(),
      status: "new",
    });
  },
});

// Query to get all feedback (admin only)
export const getAllFeedback = query({
  args: {
    status: v.optional(v.union(v.literal("new"), v.literal("reviewed"), v.literal("resolved"))),
  },
  handler: async (ctx, args) => {
    // In a real app, you'd want to check if the user is an admin
    if (args.status) {
      return await ctx.db
        .query("feedback")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    } else {
      return await ctx.db
        .query("feedback")
        .withIndex("by_submitted_at")
        .order("desc")
        .collect();
    }
  },
});

// Query to get feedback by user (for authenticated users to see their own feedback)
export const getUserFeedback = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    return await ctx.db
      .query("feedback")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();
  },
});

// Mutation to update feedback status (admin only)
export const updateFeedbackStatus = mutation({
  args: {
    feedbackId: v.id("feedback"),
    status: v.union(v.literal("reviewed"), v.literal("resolved")),
    adminNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // In a real app, you'd want to check if the user is an admin
    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) {
      throw new Error("Feedback not found");
    }

    return await ctx.db.patch(args.feedbackId, {
      status: args.status,
      adminNotes: args.adminNotes?.trim(),
      reviewedAt: new Date().toISOString(),
      reviewedBy: identity.subject,
    });
  },
});

// Query to get feedback counts by status
export const getFeedbackCounts = query({
  args: {},
  handler: async (ctx) => {
    const allFeedback = await ctx.db.query("feedback").collect();
    
    const counts = {
      total: allFeedback.length,
      new: 0,
      reviewed: 0,
      resolved: 0,
    };

    allFeedback.forEach((feedback) => {
      counts[feedback.status]++;
    });

    return counts;
  },
});

// Mutation to delete feedback (admin only)
export const deleteFeedback = mutation({
  args: {
    feedbackId: v.id("feedback"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // In a real app, you'd want to check if the user is an admin
    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) {
      throw new Error("Feedback not found");
    }

    return await ctx.db.delete(args.feedbackId);
  },
});
