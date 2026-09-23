import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { stage } from "./schema";

function authorize(token: string) {
  if (!process.env.WORKSPACE_SECRET || token !== process.env.WORKSPACE_SECRET) throw new Error("Unauthorized");
}
export const snapshot = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    authorize(token);
    const [opportunities, progress, reports] = await Promise.all([ctx.db.query("opportunities").collect(), ctx.db.query("progress").collect(), ctx.db.query("reports").collect()]);
    return { opportunities: opportunities.map(x => x.data), progress: progress.map(({ sourceId, saved, stage, notes, updatedAt, priority, tasks, nextStep, followUp, history }) => ({ sourceId, saved, stage, notes, updatedAt, priority, tasks, nextStep, followUp, history })), reports: reports.map(({ date, summary }) => ({ date, summary })).sort((a,b) => b.date.localeCompare(a.date)) };
  },
});
export const updateProgress = mutation({
  args: {
    token: v.string(), sourceId: v.string(), saved: v.boolean(), stage, notes: v.string(),
    priority: v.optional(v.number()), tasks: v.optional(v.array(v.string())), nextStep: v.optional(v.string()), followUp: v.optional(v.string()),
  },
  handler: async (ctx, { token, ...data }) => {
    authorize(token);
    if (data.notes.length > 10000) throw new Error("Notes must be under 10,000 characters");
    if (data.priority !== undefined && (!Number.isInteger(data.priority) || data.priority < 0 || data.priority > 3)) throw new Error("Invalid priority");
    if (data.tasks !== undefined && data.tasks.length > 20) throw new Error("Too many checklist items");
    if (data.nextStep !== undefined && data.nextStep.length > 280) throw new Error("Next step must be under 280 characters");
    if (data.followUp && !/^\d{4}-\d{2}-\d{2}$/.test(data.followUp)) throw new Error("Invalid follow-up date");
    const role = await ctx.db.query("opportunities").withIndex("by_source", q => q.eq("sourceId", data.sourceId)).unique();
    if (!role) throw new Error("Opportunity not found");
    const current = await ctx.db.query("progress").withIndex("by_source", q => q.eq("sourceId", data.sourceId)).unique();
    const now = Date.now();
    // Stage changes are recorded here so the activity timeline cannot be forged by the client.
    const history = [...(current?.history ?? [])];
    if ((current?.stage ?? "exploring") !== data.stage) history.push({ stage: data.stage, at: now });
    const update = {
      sourceId: data.sourceId, saved: data.saved, stage: data.stage, notes: data.notes,
      priority: data.priority ?? current?.priority ?? 0,
      tasks: data.tasks ?? current?.tasks ?? [],
      nextStep: data.nextStep ?? current?.nextStep ?? "",
      followUp: data.followUp ?? current?.followUp ?? "",
      history: history.slice(-30),
      updatedAt: now,
    };
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
