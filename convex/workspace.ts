import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

function authorize(token: string) {
  if (!process.env.WORKSPACE_SECRET || token !== process.env.WORKSPACE_SECRET) throw new Error("Unauthorized");
}
export const snapshot = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    authorize(token);
    const [opportunities, progress, reports] = await Promise.all([ctx.db.query("opportunities").collect(), ctx.db.query("progress").collect(), ctx.db.query("reports").collect()]);
    return { opportunities: opportunities.map(x => x.data), progress: progress.map(({ sourceId, saved, stage, notes, updatedAt }) => ({ sourceId, saved, stage, notes, updatedAt })), reports: reports.map(({ date, summary }) => ({ date, summary })).sort((a,b) => b.date.localeCompare(a.date)) };
  },
});
export const updateProgress = mutation({
  args: { token: v.string(), sourceId: v.string(), saved: v.boolean(), stage: v.union(v.literal("exploring"), v.literal("preparing"), v.literal("applied"), v.literal("interview"), v.literal("offer"), v.literal("archived")), notes: v.string() },
  handler: async (ctx, { token, ...data }) => {
    authorize(token);
    if (data.notes.length > 10000) throw new Error("Notes must be under 10,000 characters");
    const role = await ctx.db.query("opportunities").withIndex("by_source", q => q.eq("sourceId", data.sourceId)).unique();
    if (!role) throw new Error("Opportunity not found");
    const current = await ctx.db.query("progress").withIndex("by_source", q => q.eq("sourceId", data.sourceId)).unique();
    const update = { ...data, updatedAt: Date.now() };
    if (current) await ctx.db.patch(current._id, update); else await ctx.db.insert("progress", update);
    return update;
  },
});
export const reportUrl = query({
  args: { token: v.string(), date: v.string() }, handler: async (ctx, { token, date }) => {
    authorize(token);
    const report = await ctx.db.query("reports").withIndex("by_date", q => q.eq("date", date)).unique();
    return report ? await ctx.storage.getUrl(report.storageId) : null;
  },
});
// Imports are internal: only the authenticated Convex CLI can invoke them.
export const importOpportunities = internalMutation({
  args: { records: v.array(v.record(v.string(), v.string())) }, handler: async (ctx, { records }) => {
    for (const data of records) {
      if (!/^PFE-\d+$/.test(data.id) || !data.company || !data.role) throw new Error("Invalid opportunity");
      const existing = await ctx.db.query("opportunities").withIndex("by_source", q => q.eq("sourceId", data.id)).unique();
      if (existing) await ctx.db.patch(existing._id, { data, updatedAt: Date.now() });
      else await ctx.db.insert("opportunities", { sourceId: data.id, data, updatedAt: Date.now() });
    }
    return { imported: records.length };
  },
});
export const uploadUrl = internalMutation({ args: {}, handler: async ctx => ctx.storage.generateUploadUrl() });
export const importReport = internalMutation({
  args: { date: v.string(), summary: v.string(), hash: v.string(), storageId: v.id("_storage") }, handler: async (ctx, data) => {
    const old = await ctx.db.query("reports").withIndex("by_date", q => q.eq("date", data.date)).unique();
    if (old) { await ctx.db.patch(old._id, data); if (old.storageId !== data.storageId) await ctx.storage.delete(old.storageId); }
    else await ctx.db.insert("reports", data);
  },
});
