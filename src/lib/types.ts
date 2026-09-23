export type Opportunity = Record<string, string> & { id: string; company: string; role: string; location: string; status: string; start: string; duration: string; fit: string; first_seen: string; last_checked: string; };
export type Stage = "exploring" | "preparing" | "applied" | "interview" | "offer" | "archived";
export type StageEvent = { stage: Stage; at: number };
export type Progress = {
  sourceId: string;
  saved: boolean;
  stage: Stage;
  notes: string;
  updatedAt?: number;
  /** 0–3: how excited you are about the role. */
  priority?: number;
  /** Completed checklist item ids. */
  tasks?: string[];
  nextStep?: string;
  /** YYYY-MM-DD, or empty. */
  followUp?: string;
  /** Stage changes, appended by the server. */
  history?: StageEvent[];
};
export type Report = { date: string; summary: string };
export type Snapshot = { opportunities: Opportunity[]; progress: Progress[]; reports: Report[] };
export const stages: { value: Stage; label: string; hint: string }[] = [
  { value: "exploring", label: "Exploring", hint: "Saved and worth a closer look" },
  { value: "preparing", label: "Preparing", hint: "Tailoring your application" },
  { value: "applied", label: "Applied", hint: "Submitted, waiting to hear back" },
  { value: "interview", label: "Interview", hint: "Talking with the team" },
  { value: "offer", label: "Offer", hint: "You made it" },
  { value: "archived", label: "Archived", hint: "Closed or no longer a fit" },
];
export const stageValues = stages.map((s) => s.value);
export const checklist: { id: string; label: string }[] = [
  { id: "research", label: "Research the team and product" },
  { id: "cv", label: "Tailor your CV" },
  { id: "letter", label: "Write the cover letter" },
  { id: "portfolio", label: "Pick portfolio projects to show" },
  { id: "referral", label: "Look for a referral" },
  { id: "submit", label: "Submit the application" },
  { id: "thanks", label: "Send a follow-up or thank-you" },
];
export function defaultProgress(id: string): Progress { return { sourceId: id, saved: false, stage: "exploring", notes: "", priority: 0, tasks: [], nextStep: "", followUp: "", history: [] }; }
export function isClosed(o: Opportunity) { return /closed|expired/i.test(o.status); }
export function timingMatch(o: Opportunity) { return /confirmed timing|timing fit/i.test(o.status) && !isClosed(o); }
export function region(o: Opportunity) { if (/Tunisia|Tunis\b/i.test(o.location)) return "Tunisia"; if (/USA|United States|US\b|Canada/i.test(o.location)) return "North America"; if (/France|Germany|Ireland|UK|United Kingdom|Netherlands|Belgium|Switzerland|Europe|London|Paris/i.test(o.location)) return "Europe"; return "Elsewhere"; }
export const regions = ["Tunisia", "Europe", "North America", "Elsewhere"] as const;
export function hasRemote(o: Opportunity) {
 const text=o.remote || "";
 if (/not explicit|disagree|despite remote|remote not stated|remote not established|remote option not stated|no Tunisia remote evidence/i.test(text) && !/hybrid tag|partial remote/i.test(text)) return false;
 return /hybrid|remote-friendly|occasional remote|partial remote|\d+% remote|^remote[;, ]|one remote day|remote start may|later remote|home working allowed|worldwide applicants/i.test(text);
}
export function friendlyDate(date: string) { return new Date(date+"T12:00:00").toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}); }
const priority=["PFE-050","PFE-058","PFE-037","PFE-001","PFE-002","PFE-038","PFE-042","PFE-012","PFE-052","PFE-030","PFE-007"];
export function fitRank(o: Opportunity) { const n=priority.indexOf(o.id); return n>=0 ? n : isClosed(o) ? 1000 : /mismatch|restriction|incompatible/i.test(o.status) ? 500 : /High/i.test(o.fit) ? 50 : 100; }
