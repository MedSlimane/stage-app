import "server-only";
import { mergeProgress, type ProgressInput } from "./progress";
import type { Opportunity, Progress, Snapshot } from "./types";

/** Local demo mode: STAGE_DEMO=true serves fictional data from memory. Never active on Vercel. */
export function demoMode() {
  return process.env.STAGE_DEMO === "true" && !process.env.VERCEL;
}

const base = { duration: "6 months", compensation: "Not stated", sponsorship: "Not stated", additional_source: "", fit: "High" };
const role = (o: Partial<Opportunity> & Pick<Opportunity, "id" | "company" | "role" | "location" | "status" | "start" | "first_seen">): Opportunity => ({
  ...base,
  last_checked: "2026-09-22",
  url: `https://example.com/careers/${o.id.toLowerCase()}`,
  remote: "On-site; remote not stated",
  gaps: "Confirm the exact start date and whether the school agreement (convention de stage) is accepted.",
  portfolio: "Lead with Aviary for agent tooling, then SamOps for cloud workflows.",
  evidence: "Fictional demo listing used for local development.",
  work_and_requirements: "",
  deadline: "Not stated",
  ...o,
}) as Opportunity;

const opportunities: Opportunity[] = [
  role({ id: "PFE-101", company: "Northwind Labs", role: "AI Agents Engineer — PFE", location: "Tunis, Tunisia", status: "Open — confirmed timing", start: "February 2027", first_seen: "2026-09-21", deadline: "2026-10-18", remote: "Hybrid, two remote days a week", work_and_requirements: "Build tool-using LLM agents with MCP servers, retrieval (RAG) and evaluation harnesses. Python, TypeScript and a taste for product.", compensation: "1,200 TND / month" }),
  role({ id: "PFE-102", company: "Helio Systems", role: "Full-stack Engineer, Agent Platform", location: "Paris, France", status: "Open — timing fit likely", start: "January – March 2027", first_seen: "2026-09-19", deadline: "2026-11-01", remote: "Hybrid, 2 days on-site in Paris", work_and_requirements: "Ship React / Next.js surfaces for an internal agent platform backed by Python services on Azure.", compensation: "€1,400 / month", sponsorship: "Convention de stage accepted from partner schools." }),
  role({ id: "PFE-103", company: "Kestrel Analytics", role: "Applied AI Intern — Retrieval", location: "Dublin, Ireland", status: "Open — check start date", start: "Spring 2027", first_seen: "2026-09-12", deadline: "Rolling", remote: "Remote-friendly within the EU", work_and_requirements: "Improve RAG pipelines, embeddings and ranking for customer-support copilots. Python, PyTorch, cloud." }),
  role({ id: "PFE-104", company: "Atlas Cloud", role: "AIOps & Cloud Engineer", location: "Sousse, Tunisia", status: "Open — confirmed timing", start: "November 2026", first_seen: "2026-09-08", deadline: "2026-10-05", work_and_requirements: "Anomaly detection over cloud telemetry, alert triage agents and AWS automation.", fit: "Medium" }),
  role({ id: "PFE-105", company: "Orbital Health", role: "ML Engineer Intern", location: "Toronto, Canada", status: "Open — work-permit restriction", start: "January 2027", first_seen: "2026-09-02", remote: "On-site", work_and_requirements: "Clinical NLP models and evaluation. Python, data pipelines.", gaps: "Requires Canadian work authorisation — likely incompatible.", fit: "Medium" }),
  role({ id: "PFE-106", company: "Lumen Studio", role: "Product Engineer — Generative UI", location: "Berlin, Germany", status: "Open — timing fit likely", start: "March 2027", first_seen: "2026-09-22", deadline: "2026-12-15", remote: "Hybrid; one remote day", work_and_requirements: "Prototype generative interfaces in React and TypeScript, wire them to LLM APIs and agent workflows." }),
  role({ id: "PFE-107", company: "Sable Robotics", role: "Agentic Workflows Intern", location: "Remote — Europe", status: "Lead — confirm intake", start: "Early 2027", first_seen: "2026-09-15", remote: "Remote; worldwide applicants considered", work_and_requirements: "Design multi-agent workflows for robot fleet operations. MCP, Python, evaluations." }),
  role({ id: "PFE-108", company: "Medina Pay", role: "Software Engineering PFE — Payments", location: "Tunis, Tunisia", status: "Open — confirmed timing", start: "February 2027", first_seen: "2026-08-28", deadline: "2026-10-30", work_and_requirements: "Spring Boot services, React dashboards and fraud-signal experiments.", fit: "Medium" }),
  role({ id: "PFE-109", company: "Quartz AI", role: "Research Engineer Intern — LLM Evals", location: "London, UK", status: "Closed — watch for next intake", start: "Autumn 2026", first_seen: "2026-08-20", work_and_requirements: "Build evaluation suites for LLM agents; Python, statistics.", gaps: "The 2026 intake closed in August." }),
  role({ id: "PFE-110", company: "Verdant Energy", role: "Data & AI Platform Intern", location: "Amsterdam, Netherlands", status: "Open — timing fit likely", start: "February 2027", first_seen: "2026-09-10", deadline: "2026-11-20", remote: "Hybrid; 40% remote", work_and_requirements: "Data platform on Azure, forecasting models and an internal RAG assistant for engineers." }),
  role({ id: "PFE-111", company: "Pixel & Pine", role: "Mobile + AI Intern", location: "Lyon, France", status: "Open — check duration", start: "January 2027", duration: "4 to 6 months, to be agreed", first_seen: "2026-09-05", work_and_requirements: "Flutter app features with on-device and cloud AI; Kotlin a plus.", fit: "Medium" }),
  role({ id: "PFE-112", company: "Carthage Digital", role: "IT & Agentic AI — PFE", location: "Ariana, Tunisia", status: "Open — confirmed timing", start: "February 2027", first_seen: "2026-09-18", deadline: "2026-10-25", work_and_requirements: "Automate internal IT processes with LLM agents, n8n and Python; integrate with Microsoft 365." }),
];

const reports = [
  { date: "2026-09-22", summary: "Two new Tunisia-based roles with confirmed timing.\n\n- Carthage Digital opened an agentic AI PFE in Ariana.\n- Lumen Studio posted a generative UI role in Berlin.\n- Quartz AI closed its 2026 intake; kept on the watchlist." },
  { date: "2026-09-21", summary: "Northwind Labs published an AI agents PFE with a February start and a mid-October deadline. Verified the listing and the hybrid policy." },
  { date: "2026-09-19", summary: "Helio Systems confirmed partner-school agreements are accepted. Kestrel Analytics still lists spring 2027 without a firm date." },
];

const day = 86400000;
let progress: Progress[] = [
  { sourceId: "PFE-101", saved: true, stage: "applied", notes: "Mention the MCP server in Aviary.", priority: 3, tasks: ["research", "cv", "letter", "portfolio", "submit"], nextStep: "Follow up with the recruiter", followUp: new Date(Date.now() + 2 * day).toISOString().slice(0, 10), history: [{ stage: "preparing", at: Date.now() - 6 * day }, { stage: "applied", at: Date.now() - 3 * day }], updatedAt: Date.now() - 3 * day },
  { sourceId: "PFE-102", saved: true, stage: "preparing", notes: "", priority: 2, tasks: ["research", "cv"], nextStep: "Finish the cover letter", followUp: new Date(Date.now() - day).toISOString().slice(0, 10), history: [{ stage: "preparing", at: Date.now() - 2 * day }], updatedAt: Date.now() - 2 * day },
  { sourceId: "PFE-104", saved: true, stage: "interview", notes: "Technical interview: system design for alerting.", priority: 2, tasks: ["research", "cv", "letter", "submit"], nextStep: "Prepare the system design round", followUp: new Date(Date.now() + 5 * day).toISOString().slice(0, 10), history: [{ stage: "applied", at: Date.now() - 12 * day }, { stage: "interview", at: Date.now() - day }], updatedAt: Date.now() - day },
  { sourceId: "PFE-106", saved: true, stage: "exploring", notes: "", priority: 1, tasks: [], nextStep: "", followUp: "", history: [], updatedAt: Date.now() - 4 * day },
  { sourceId: "PFE-112", saved: true, stage: "exploring", notes: "", priority: 0, tasks: [], nextStep: "", followUp: "", history: [], updatedAt: Date.now() - day },
];

export function demoSnapshot(): Snapshot {
  return { opportunities, progress, reports };
}

export function demoUpdate(input: ProgressInput): Progress {
  if (!opportunities.some((o) => o.id === input.sourceId)) throw new Error("Opportunity not found");
  const next = mergeProgress(progress.find((p) => p.sourceId === input.sourceId), input, Date.now());
  progress = [...progress.filter((p) => p.sourceId !== input.sourceId), next];
  return next;
}
