import { checklist, fitRank, isClosed, stages, timingMatch, type Opportunity, type Progress } from "./types";

const titles: Record<string, string> = {
  "PFE-001": "AI Engineer",
  "PFE-002": "Applied AI Engineer",
  "PFE-037": "Product Data Science & AI Agents",
  "PFE-050": "Full-stack & Agent Development",
  "PFE-058": "AIOps & Cloud Engineer",
  "PFE-038": "Applied AI Engineer",
  "PFE-012": "AI Agents & RAG — PFE",
  "PFE-052": "IT & Agentic AI — PFE",
};
export const shortTitle = (o: Opportunity) => titles[o.id] || o.role;

export function initials(name: string) {
  if (name === "SAP") return "SAP";
  if (name === "VINCI Construction SI") return "V";
  return name.split(/[\s.]+/).filter(Boolean).slice(0, 2).map((s) => s[0]).join("").toUpperCase();
}
export function hue(name: string) {
  return ["sage", "clay", "blue", "ink", "ochre", "plum"][[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 6];
}

const skillPatterns: [RegExp, string][] = [
  [/\bagent|agentic/, "Agents"],
  [/\bmcp\b/, "MCP"],
  [/\brag\b|retrieval/, "RAG"],
  [/\bllm|generative|genai|copilot/, "LLMs"],
  [/python|pytorch/, "Python"],
  [/typescript|\bts\b/, "TypeScript"],
  [/react|next\.?js/, "React"],
  [/full.?stack/, "Full-stack"],
  [/cloud|azure|aws|gcp/, "Cloud"],
  [/\bdata\b|analytics|forecast/, "Data"],
  [/mobile|flutter|kotlin|swift/, "Mobile"],
  [/devops|aiops|telemetry|alert/, "Ops"],
];
export function skills(o: Opportunity) {
  const s = (o.role + " " + (o.work_and_requirements || "")).toLowerCase();
  return skillPatterns.filter(([re]) => re.test(s)).map(([, v]) => v);
}
export const allSkills = skillPatterns.map(([, v]) => v);

/** A 0–100 fit estimate from research fit, curated priority and timing. */
export function fitScore(o: Opportunity) {
  const rank = fitRank(o);
  let score = rank < 50 ? 96 - rank * 1.5 : rank === 50 ? 82 : rank === 100 ? 70 : rank === 500 ? 42 : 24;
  if (timingMatch(o)) score += 4;
  if (/low/i.test(o.fit)) score -= 12;
  return Math.max(5, Math.min(99, Math.round(score)));
}

export type Tone = "green" | "amber" | "closed";
export function statusTone(o: Opportunity): Tone {
  return isClosed(o) ? "closed" : timingMatch(o) ? "green" : "amber";
}
export function statusLabel(o: Opportunity) {
  return isClosed(o) ? "Closed" : timingMatch(o) ? "Timing match" : /restriction|mismatch|incompatible/i.test(o.status) ? "Eligibility risk" : "Check details";
}

const months = "january february march april may june july august september october november december".split(" ");
/** Best-effort parse of free-text deadlines such as "2026-10-15", "15 October 2026" or "Oct 15, 2026". */
export function parseDeadline(text?: string): Date | null {
  if (!text) return null;
  const iso = text.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3]);
  const dmy = text.match(/(\d{1,2})\s+([a-z]{3,9})\.?\s+(\d{4})/i);
  const mdy = text.match(/([a-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})/i);
  const pick = dmy ? { d: dmy[1], m: dmy[2], y: dmy[3] } : mdy ? { d: mdy[2], m: mdy[1], y: mdy[3] } : null;
  if (!pick) return null;
  const month = months.findIndex((m) => m.startsWith(pick.m.toLowerCase().slice(0, 3)));
  return month < 0 ? null : new Date(+pick.y, month, +pick.d);
}
export function dayDiff(date: Date, from = new Date()) {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const b = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}
export function relativeDay(date: Date) {
  const d = dayDiff(date);
  if (d === 0) return "Today";
  if (d === 1) return "Tomorrow";
  if (d === -1) return "Yesterday";
  if (d < 0) return `${-d} days ago`;
  if (d < 14) return `In ${d} days`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
export function relativeTime(at: number) {
  const minutes = Math.round((Date.now() - at) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "Yesterday" : days < 30 ? `${days} days ago` : new Date(at).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
export function localISO(date = new Date()) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
export function parseISODate(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}
export function taskProgress(p: Progress) {
  const done = (p.tasks ?? []).filter((t) => checklist.some((c) => c.id === t)).length;
  return { done, total: checklist.length, ratio: done / checklist.length };
}
export function stageLabel(stage: string) {
  return stages.find((s) => s.value === stage)?.label ?? stage;
}
export function stageSince(p: Progress) {
  const last = [...(p.history ?? [])].reverse().find((h) => h.stage === p.stage);
  return last?.at ?? p.updatedAt;
}

function csvCell(value: string) {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}
export function toCSV(rows: { o: Opportunity; p: Progress }[]) {
  const head = ["id", "company", "role", "location", "status", "start", "deadline", "fit_score", "saved", "stage", "priority", "checklist", "next_step", "follow_up", "notes", "url"];
  const lines = rows.map(({ o, p }) => [o.id, o.company, o.role, o.location, o.status, o.start, o.deadline || "", String(fitScore(o)), p.saved ? "yes" : "no", p.stage, String(p.priority ?? 0), `${taskProgress(p).done}/${checklist.length}`, p.nextStep ?? "", p.followUp ?? "", p.notes, o.url || ""].map(csvCell).join(","));
  return [head.join(","), ...lines].join("\n");
}
function icsText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/[,;]/g, (c) => "\\" + c).replace(/\n/g, "\\n");
}
export function toICS(events: { uid: string; date: Date; title: string; description: string }[]) {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const day = (d: Date) => localISO(d).replace(/-/g, "");
  const next = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Stage//Internship workspace//EN", "CALSCALE:GREGORIAN",
    ...events.flatMap((e) => ["BEGIN:VEVENT", `UID:${e.uid}@stage`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${day(e.date)}`, `DTEND;VALUE=DATE:${day(next(e.date))}`, `SUMMARY:${icsText(e.title)}`, `DESCRIPTION:${icsText(e.description)}`, "END:VEVENT"]),
    "END:VCALENDAR",
  ].join("\r\n");
}
export function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
