export type Opportunity = Record<string, string> & { id: string; company: string; role: string; location: string; status: string; start: string; duration: string; fit: string; first_seen: string; last_checked: string; };
export type Stage = "exploring" | "preparing" | "applied" | "interview" | "offer" | "archived";
export type Progress = { sourceId: string; saved: boolean; stage: Stage; notes: string; updatedAt?: number };
export type Report = { date: string; summary: string };
export type Snapshot = { opportunities: Opportunity[]; progress: Progress[]; reports: Report[] };
export const stages: { value: Stage; label: string }[] = [{value:"exploring",label:"Exploring"},{value:"preparing",label:"Preparing"},{value:"applied",label:"Applied"},{value:"interview",label:"Interview"},{value:"offer",label:"Offer"},{value:"archived",label:"Archived"}];
export function defaultProgress(id: string): Progress { return { sourceId: id, saved: false, stage: "exploring", notes: "" }; }
export function isClosed(o: Opportunity) { return /closed|expired/i.test(o.status); }
export function timingMatch(o: Opportunity) { return /confirmed timing|timing fit/i.test(o.status) && !isClosed(o); }
export function region(o: Opportunity) { if (/Tunisia|Tunis\b/i.test(o.location)) return "Tunisia"; if (/USA|United States|US\b|Canada/i.test(o.location)) return "North America"; if (/France|Germany|Ireland|UK|United Kingdom|Netherlands|Belgium|Switzerland|Europe|London|Paris/i.test(o.location)) return "Europe"; return "Elsewhere"; }
export function hasRemote(o: Opportunity) {
 const text=o.remote || "";
 if (/not explicit|disagree|despite remote|remote not stated|remote not established|remote option not stated|no Tunisia remote evidence/i.test(text) && !/hybrid tag|partial remote/i.test(text)) return false;
 return /hybrid|remote-friendly|occasional remote|partial remote|\d+% remote|^remote[;, ]|one remote day|remote start may|later remote|home working allowed|worldwide applicants/i.test(text);
}
export function friendlyDate(date: string) { return new Date(date+"T12:00:00").toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}); }
const priority=["PFE-050","PFE-058","PFE-037","PFE-001","PFE-002","PFE-038","PFE-042","PFE-012","PFE-052","PFE-030","PFE-007"];
export function fitRank(o: Opportunity) { const n=priority.indexOf(o.id); return n>=0 ? n : isClosed(o) ? 1000 : /mismatch|restriction|incompatible/i.test(o.status) ? 500 : /High/i.test(o.fit) ? 50 : 100; }
