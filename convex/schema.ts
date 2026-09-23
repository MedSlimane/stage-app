import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const stage = v.union(v.literal("exploring"), v.literal("preparing"), v.literal("applied"), v.literal("interview"), v.literal("offer"), v.literal("archived"));

export default defineSchema({
  opportunities: defineTable({ sourceId: v.string(), data: v.record(v.string(), v.string()), updatedAt: v.number() }).index("by_source", ["sourceId"]),
  progress: defineTable({
    sourceId: v.string(),
    saved: v.boolean(),
    stage,
    notes: v.string(),
    updatedAt: v.number(),
    // Added with the application tracker. Optional so existing rows stay valid.
    priority: v.optional(v.number()),
    tasks: v.optional(v.array(v.string())),
    nextStep: v.optional(v.string()),
    followUp: v.optional(v.string()),
    history: v.optional(v.array(v.object({ stage, at: v.number() }))),
  }).index("by_source", ["sourceId"]),
  reports: defineTable({ date: v.string(), summary: v.string(), storageId: v.id("_storage"), hash: v.string() }).index("by_date", ["date"]),
});
