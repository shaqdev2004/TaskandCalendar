import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tasks: defineTable({
    title: v.string(),
    date: v.string(), // YYYY-MM-DD format
    startTime: v.string(), // HH:MM format
    endTime: v.optional(v.string()), // HH:MM format
    duration: v.optional(v.string()),
    location: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    notes: v.optional(v.string()),
    isAllDay: v.optional(v.boolean()),
    userId: v.string(), // To associate tasks with users
  })
    .index("by_user", ["userId"])
    .index("by_user_and_date", ["userId", "date"]),
});
