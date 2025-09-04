import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Query to get all tasks for the current user
export const getTasks = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      // Return empty array if not authenticated instead of throwing error
      return [];
    }

    return await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
  },
});

// Query to get tasks for a specific date range
export const getTasksByDateRange = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    return await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .filter((q) => 
        q.and(
          q.gte(q.field("date"), args.startDate),
          q.lte(q.field("date"), args.endDate)
        )
      )
      .collect();
  },
});

// Mutation to create a new task
export const createTask = mutation({
  args: {
    title: v.string(),
    date: v.string(),
    startTime: v.string(),
    endTime: v.optional(v.string()),
    duration: v.optional(v.string()),
    location: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    notes: v.optional(v.string()),
    isAllDay: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    return await ctx.db.insert("tasks", {
      ...args,
      userId: identity.subject,
    });
  },
});

// Mutation to create multiple tasks at once
export const createTasks = mutation({
  args: {
    tasks: v.array(v.object({
      title: v.string(),
      date: v.string(),
      startTime: v.string(),
      endTime: v.optional(v.string()),
      duration: v.optional(v.string()),
      location: v.optional(v.string()),
      description: v.optional(v.string()),
      category: v.optional(v.string()),
      priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
      notes: v.optional(v.string()),
      isAllDay: v.optional(v.boolean()),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const taskIds = [];
    for (const task of args.tasks) {
      const taskId = await ctx.db.insert("tasks", {
        ...task,
        userId: identity.subject,
      });
      taskIds.push(taskId);
    }
    
    return taskIds;
  },
});

// Mutation to update a task
export const updateTask = mutation({
  args: {
    id: v.id("tasks"),
    title: v.optional(v.string()),
    date: v.optional(v.string()),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    duration: v.optional(v.string()),
    location: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    notes: v.optional(v.string()),
    isAllDay: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const { id, ...updates } = args;
    
    // Verify the task belongs to the current user
    const task = await ctx.db.get(id);
    if (!task || task.userId !== identity.subject) {
      throw new Error("Task not found or access denied");
    }
    
    return await ctx.db.patch(id, updates);
  },
});

// Mutation to delete a task
export const deleteTask = mutation({
  args: {
    id: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    // Verify the task belongs to the current user
    const task = await ctx.db.get(args.id);
    if (!task || task.userId !== identity.subject) {
      throw new Error("Task not found or access denied");
    }
    
    return await ctx.db.delete(args.id);
  },
});
