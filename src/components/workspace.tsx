"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowClockwise,
  ArrowDown,
  ArrowRight,
  ArrowSquareOut,
  BookmarkSimple,
  Briefcase,
  CalendarBlank,
  CaretDown,
  Check,
  CheckCircle,
  Clock,
  Compass,
  DownloadSimple,
  FileText,
  FunnelSimple,
  GlobeHemisphereWest,
  Kanban,
  MagnifyingGlass,
  MapPin,
  Plus,
  Sparkle,
  Student,
  WifiSlash,
  X,
} from "@phosphor-icons/react";
import {
  defaultProgress,
  fitRank,
  friendlyDate,
  hasRemote,
  isClosed,
  region,
  stages,
  timingMatch,
  type Opportunity,
  type Progress,
  type Snapshot,
  type Stage,
} from "@/lib/types";

type View = "discover" | "saved" | "pipeline" | "reports" | "profile";
type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
const views: { id: View; label: string; icon: typeof Compass }[] = [
  { id: "discover", label: "Discover", icon: Compass },
  { id: "saved", label: "Saved", icon: BookmarkSimple },
  { id: "pipeline", label: "Pipeline", icon: Kanban },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "profile", label: "My profile", icon: Student },
];
const cacheKey = "stage-workspace-v1";
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
const shortTitle = (o: Opportunity) => titles[o.id] || o.role;
function initials(name: string) {
  return name === "SAP"
    ? "SAP"
    : name === "VINCI Construction SI"
      ? "V"
      : name
          .split(/[\s.]+/)
          .slice(0, 2)
          .map((s) => s[0])
          .join("")
          .toUpperCase();
}
function color(name: string) {
  return ["sage", "clay", "blue", "ink", "ochre"][
    [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 5
  ];
}
function tags(o: Opportunity) {
  const s = (o.role + " " + o.work_and_requirements).toLowerCase();
  return [
    /agent/.test(s)
      ? "AI agents"
      : /full.stack|react|next/.test(s)
        ? "Full-stack"
        : "Applied AI",
    ...(
      [
        [/python/, "Python"],
        [/react|typescript|next/, "React / TS"],
        [/cloud|azure|aws/, "Cloud"],
        [/mcp/, "MCP"],
        [/rag/, "RAG"],
      ] as [RegExp, string][]
    )
      .filter(([re]) => re.test(s))
      .map(([, v]) => v),
  ].slice(0, 3);
}
function Pill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return <span className={`pill ${tone}`}>{children}</span>;
}

export default function Workspace() {
  const [view, setView] = useState<View>("discover"),
    [data, setData] = useState<Snapshot | null>(null),
    [busy, setBusy] = useState(false),
    [pending, setPending] = useState(false),
    [offline, setOffline] = useState(false),
    [locked, setLocked] = useState(false),
    [notice, setNotice] = useState("");
  const [query, setQuery] = useState(""),
    [geo, setGeo] = useState("All"),
    [remote, setRemote] = useState(false),
    [timing, setTiming] = useState(false),
    [watch, setWatch] = useState(false),
    [sort, setSort] = useState("fit");
  const [filtersOpen, setFiltersOpen] = useState(false),
    [selected, setSelected] = useState<Opportunity | null>(null),
    [installHelp, setInstallHelp] = useState(false),
    [installEvent, setInstallEvent] = useState<InstallEvent | null>(null),
    [installed, setInstalled] = useState(false),
    [code, setCode] = useState("");
  const refresh = useCallback(async () => {
    setBusy(true);
    try {
      const response = await fetch("/api/workspace");
      if (response.status === 401) {
        setLocked(true);
        setData(null);
        localStorage.removeItem(cacheKey);
        return;
      }
      if (!response.ok) throw new Error();
      const snapshot: Snapshot = await response.json();
      setData(snapshot);
      setLocked(false);
      setOffline(!navigator.onLine || response.headers.get("X-Stage-Offline") === "1");
      try {
        localStorage.setItem(cacheKey, JSON.stringify(snapshot));
      } catch {}
    } catch {
      setOffline(true);
      setNotice("Can’t sync right now. Showing your last saved snapshot.");
    } finally {
      setBusy(false);
    }
  }, []);
  useEffect(() => {
    const initialize = setTimeout(() => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) setData(JSON.parse(cached));
    } catch {
      localStorage.removeItem(cacheKey);
    }
    readView();
    void refresh();
    setInstalled(window.matchMedia("(display-mode: standalone)").matches);
    }, 0);
    const readView = () => {
      const v = new URLSearchParams(location.search).get("view") as View;
      setView(views.some((x) => x.id === v) ? v : "discover");
    };
    const online = () => {
        setOffline(false);
        void refresh();
      },
      off = () => setOffline(true),
      install = (e: Event) => {
        e.preventDefault();
        setInstallEvent(e as InstallEvent);
      },
      done = () => {
        setInstalled(true);
        setInstallEvent(null);
      };
    window.addEventListener("online", online);
    window.addEventListener("offline", off);
    window.addEventListener("popstate", readView);
    window.addEventListener("beforeinstallprompt", install);
    window.addEventListener("appinstalled", done);
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production")
      navigator.serviceWorker
        .register("/sw.js")
        .catch(() =>
          setNotice("Offline setup is unavailable in this browser."),
        );
    const timer = setInterval(() => {
      if (document.visibilityState === "visible" && navigator.onLine)
        void refresh();
    }, 60000);
    return () => {
      clearTimeout(initialize);
      clearInterval(timer);
      window.removeEventListener("online", online);
      window.removeEventListener("offline", off);
      window.removeEventListener("popstate", readView);
      window.removeEventListener("beforeinstallprompt", install);
      window.removeEventListener("appinstalled", done);
    };
  }, [refresh]);
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(""), 6500);
    return () => clearTimeout(id);
  }, [notice]);
  function navigate(next: View) {
    setView(next);
    history.pushState(null, "", next === "discover" ? "/" : "/?view=" + next);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  async function update(p: Progress) {
    if (offline) {
      setNotice("You’re offline. Reconnect to save changes.");
      return false;
    }
    setPending(true);
    try {
      const r = await fetch("/api/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p),
      });
      if (!r.ok) {
        const result = await r.json();
        throw new Error(result.error);
      }
      const updated: Progress = await r.json();
      setData((old) => {
        if (!old) return old;
        const next = {
          ...old,
          progress: [
            ...old.progress.filter((x) => x.sourceId !== p.sourceId),
            updated,
          ],
        };
        try {
          localStorage.setItem(cacheKey, JSON.stringify(next));
        } catch {}
        return next;
      });
      return true;
    } catch (e) {
      setNotice(
        e instanceof Error ? e.message : "Could not save. Please retry.",
      );
      return false;
    } finally {
      setPending(false);
    }
  }
  async function install() {
    if (installEvent) {
      await installEvent.prompt();
      const result = await installEvent.userChoice;
      if (result.outcome === "accepted") setInstalled(true);
      setInstallEvent(null);
    } else setInstallHelp(true);
  }
  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      const r = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!r.ok) throw new Error("That code didn’t match. Please try again.");
      setCode("");
      await refresh();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Unable to unlock");
    } finally {
      setPending(false);
    }
  }
  async function logout() {
    if (!confirm("Lock this workspace and clear offline data on this device?"))
      return;
    const r = await fetch("/api/session", { method: "DELETE" });
    if (!r.ok) {
      setNotice("Could not lock. Please retry.");
      return;
    }
    localStorage.removeItem(cacheKey);
    navigator.serviceWorker?.controller?.postMessage("CLEAR_PRIVATE_CACHE");
    setData(null);
    setLocked(true);
  }
  const opportunities = useMemo(() => data?.opportunities || [], [data]);
  const progressMap = useMemo(
    () => new Map(data?.progress.map((p) => [p.sourceId, p]) || []),
    [data],
  );
  const getProgress = (o: Opportunity) =>
    progressMap.get(o.id) || defaultProgress(o.id);
  const latest = data?.reports[0],
    savedCount = data?.progress.filter((p) => p.saved).length || 0,
    activeCount =
      data?.progress.filter((p) => !["exploring", "archived"].includes(p.stage))
        .length || 0;
  const visible = useMemo(
    () =>
      opportunities
        .filter((o) => {
          if (view === "saved" && !progressMap.get(o.id)?.saved) return false;
          if (view === "discover" && !watch && isClosed(o)) return false;
          if (watch && view === "discover" && !isClosed(o)) return false;
          if (geo !== "All" && region(o) !== geo) return false;
          if (remote && !hasRemote(o)) return false;
          if (timing && !timingMatch(o)) return false;
          return [
            o.company,
            o.role,
            o.location,
            o.work_and_requirements,
            o.portfolio,
          ]
            .join(" ")
            .toLowerCase()
            .includes(query.toLowerCase());
        })
        .sort((a, b) =>
          sort === "newest"
            ? b.first_seen.localeCompare(a.first_seen) ||
              fitRank(a) - fitRank(b)
            : sort === "company"
              ? a.company.localeCompare(b.company)
              : fitRank(a) - fitRank(b),
        ),
    [opportunities, view, watch, geo, remote, timing, query, sort, progressMap],
  );
  function resetFilters() {
    setQuery("");
    setGeo("All");
    setRemote(false);
    setTiming(false);
    setWatch(false);
  }
  const filterCount =
    Number(geo !== "All") + Number(remote) + Number(timing) + Number(watch);
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button
          className="brand"
          onClick={() => navigate("discover")}
          aria-label="Stage home"
        >
          <span className="brand-mark">s</span>stage
          <span className="brand-dot">.</span>
        </button>
        <div className="workspace-label">YOUR NEXT CHAPTER</div>
        <nav aria-label="Main navigation">
          {views.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`nav-item ${view === id ? "active" : ""}`}
              onClick={() => navigate(id)}
              aria-current={view === id ? "page" : undefined}
            >
              <Icon size={21} weight={view === id ? "fill" : "regular"} />
              <span>{label}</span>
              {id === "saved" && savedCount > 0 && (
                <span className="nav-count">{savedCount}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="search-schedule">
            <Clock size={21} />
            <div>
              <strong>Fresh eyes, every day</strong>
              <p>Research at 09:00 · Tunis</p>
            </div>
          </div>
          <button className="account" onClick={() => navigate("profile")}>
            <span className="avatar">MS</span>
            <span>
              <strong>Mohamed Slimane</strong>
              <small>Personal workspace</small>
            </span>
            <CaretDown size={16} />
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="desktop-breadcrumb">
            Workspace <span>/</span>
            <strong>{views.find((v) => v.id === view)?.label}</strong>
          </div>
          <button
            className="brand mobile-brand"
            onClick={() => navigate("discover")}
          >
            <span className="brand-mark">s</span>stage
            <span className="brand-dot">.</span>
          </button>
          <div className="top-actions">
            <span className={`connection ${offline ? "is-offline" : ""}`}>
              {offline ? (
                <WifiSlash size={14} />
              ) : (
                <span className="live-dot" />
              )}
              {offline ? "Offline snapshot" : "Connected"}
            </span>
            <button
              className="icon-button"
              aria-label="Refresh workspace"
              onClick={() => void refresh()}
              disabled={busy}
            >
              <ArrowClockwise size={19} className={busy ? "spinning" : ""} />
            </button>
            <button
              className="avatar small"
              onClick={() => navigate("profile")}
              aria-label="Open your profile"
            >
              MS
            </button>
          </div>
        </header>
        <main id="main-content">
          {locked ? (
            <section className="unlock-panel">
              <span className="brand-mark">s</span>
              <h1>Your next chapter awaits.</h1>
              <p>Enter your workspace access code to continue.</p>
              <form onSubmit={unlock}>
                <label htmlFor="access-code">Access code</label>
                <input
                  id="access-code"
                  type="password"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button className="primary-button" disabled={pending}>
                  Unlock workspace
                  <ArrowRight size={18} />
                </button>
              </form>
            </section>
          ) : !data ? (
            <section className="loading-panel">
              <Compass size={40} />
              <h1>
                {offline ? "Let’s get connected." : "Opening your workspace…"}
              </h1>
              <p>
                {offline
                  ? "Connect once to download opportunities for offline browsing."
                  : "Gathering your opportunities and field notes."}
              </p>
              {offline && (
                <button
                  className="primary-button"
                  onClick={() => void refresh()}
                >
                  Try again
                </button>
              )}
            </section>
          ) : (
            <>
              {(view === "discover" || view === "saved") && (
                <>
                  <div className="page-heading">
                    <div>
                      <div className="eyebrow">
                        {view === "discover"
                          ? "THE SEARCH IS ON"
                          : "A LITTLE CLOSER"}
                      </div>
                      <h1>
                        {view === "discover"
                          ? "Find your next chapter."
                          : "Your shortlist."}
                      </h1>
                      <p>
                        {view === "discover"
                          ? "Meaningful work. Six months. Something worth building."
                          : "The opportunities you want to come back to."}
                      </p>
                    </div>
                    <button
                      className="quiet-button install-desktop"
                      onClick={() => void install()}
                    >
                      <DownloadSimple size={18} />
                      {installed ? "App installed" : "Install app"}
                    </button>
                  </div>
                  {view === "discover" && (
                    <div className="overview-row">
                      <div className="summary-stat">
                        <strong>{opportunities.length}</strong>
                        <span>opportunities tracked</span>
                        <small>Including leads & watchlist</small>
                      </div>
                      <div className="summary-stat">
                        <strong>
                          {opportunities.filter(timingMatch).length}
                          <Sparkle size={20} />
                        </strong>
                        <span>timing matches</span>
                        <small>Eligibility still to verify</small>
                      </div>
                      <button
                        className="summary-stat interactive-stat"
                        onClick={() => navigate("pipeline")}
                      >
                        <strong>
                          {activeCount}
                          <ArrowRight size={20} />
                        </strong>
                        <span>in your pipeline</span>
                        <small>One step at a time</small>
                      </button>
                    </div>
                  )}
                  <div className="content-grid">
                    <section
                      className="opportunity-section"
                      aria-label="Opportunities"
                    >
                      <div className="search-row">
                        <label className="search-input">
                          <MagnifyingGlass size={21} />
                          <input
                            placeholder="Search roles, companies or skills…"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            aria-label="Search opportunities"
                          />
                          {query && (
                            <button
                              aria-label="Clear search"
                              onClick={() => setQuery("")}
                            >
                              <X size={16} />
                            </button>
                          )}
                        </label>
                        <button
                          className={`filter-button ${filterCount ? "enabled" : ""}`}
                          aria-label="Filter opportunities"
                onClick={() => setFiltersOpen(true)}
                        >
                          <FunnelSimple size={18} />
                          <span>Filters</span>
                          {filterCount > 0 && <b>{filterCount}</b>}
                        </button>
                      </div>
                      <div className="quick-filters" aria-label="Quick filters">
                        <button
                          className={
                            geo === "All" && !remote && !watch ? "selected" : ""
                          }
                          onClick={() => {
                            setGeo("All");
                            setRemote(false);
                            setWatch(false);
                          }}
                        >
                          All opportunities
                        </button>
                        <button
                          className={geo === "Tunisia" ? "selected" : ""}
                          onClick={() => {
                            setGeo(geo === "Tunisia" ? "All" : "Tunisia");
                            setWatch(false);
                          }}
                        >
                          <MapPin size={14} />
                          Tunisia
                        </button>
                        <button
                          className={geo === "Europe" ? "selected" : ""}
                          onClick={() => {
                            setGeo(geo === "Europe" ? "All" : "Europe");
                            setWatch(false);
                          }}
                        >
                          Europe
                        </button>
                        <button
                          className={remote ? "selected" : ""}
                          onClick={() => setRemote(!remote)}
                        >
                          <GlobeHemisphereWest size={14} />
                          Remote-friendly
                        </button>
                      </div>
                      <div className="results-heading">
                        <span>
                          <strong>{visible.length}</strong>{" "}
                          {view === "saved"
                            ? "saved opportunities"
                            : "opportunities"}
                          {filterCount > 0 && (
                            <button
                              className="clear-link"
                              onClick={resetFilters}
                            >
                              Reset
                            </button>
                          )}
                        </span>
                        <label className="sort-control">
                          Sort by
                          <select
                            aria-label="Sort opportunities"
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                          >
                            <option value="fit">Best fit</option>
                            <option value="newest">Recently found</option>
                            <option value="company">Company</option>
                          </select>
                          <CaretDown size={12} />
                        </label>
                      </div>
                      <div className="opportunity-list">
                        {visible.map((o) => (
                          <article className="opportunity-card" key={o.id}>
                            <div className="card-top">
                              <span
                                className={`company-mark ${color(o.company)}`}
                              >
                                {initials(o.company)}
                              </span>
                              <div className="company-line">
                                <span>{o.company}</span>
                                <small>
                                  <MapPin size={12} />
                                  {o.location}
                                </small>
                              </div>
                              <button
                                className={`bookmark-button ${getProgress(o).saved ? "saved" : ""}`}
                                disabled={pending || offline}
                                aria-label={`${getProgress(o).saved ? "Unsave" : "Save"} ${o.company} ${o.id}`}
                                aria-pressed={getProgress(o).saved}
                                onClick={() =>
                                  void update({
                                    ...getProgress(o),
                                    saved: !getProgress(o).saved,
                                  })
                                }
                              >
                                <BookmarkSimple
                                  size={21}
                                  weight={
                                    getProgress(o).saved ? "fill" : "regular"
                                  }
                                />
                              </button>
                            </div>
                            <button
                              className="card-main"
                              onClick={() => setSelected(o)}
                              aria-label={`View ${o.company} ${o.id}`}
                            >
                              <h2>{shortTitle(o)}</h2>
                              <p className="role-summary">
                                {o.work_and_requirements}
                              </p>
                              <div className="role-tags">
                                {tags(o).map((tag) => (
                                  <span key={tag}>{tag}</span>
                                ))}
                              </div>
                            </button>
                            <div className="card-footer">
                              <div>
                                <span>
                                  <CalendarBlank size={14} />
                                  {o.start.length > 36
                                    ? o.start.slice(0, 33) + "…"
                                    : o.start}
                                </span>
                                <span>
                                  <Clock size={14} />
                                  {o.duration.length > 24
                                    ? "Duration to confirm"
                                    : o.duration}
                                </span>
                              </div>
                              <Pill
                                tone={
                                  isClosed(o)
                                    ? "closed"
                                    : timingMatch(o)
                                      ? "green"
                                      : "amber"
                                }
                              >
                                {isClosed(o) ? (
                                  "Closed"
                                ) : timingMatch(o) ? (
                                  <>
                                    <CheckCircle size={12} />
                                    Timing match
                                  </>
                                ) : (
                                  "Check details"
                                )}
                              </Pill>
                            </div>
                          </article>
                        ))}
                      </div>
                      {!visible.length && (
                        <div className="empty-state">
                          <BookmarkSimple size={36} />
                          <h2>
                            {view === "saved" && !savedCount
                              ? "Keep the ones that click."
                              : "No matches here yet."}
                          </h2>
                          <p>
                            {view === "saved" && !savedCount
                              ? "Tap the bookmark on any opportunity to build your shortlist."
                              : "Try another keyword or loosen your filters."}
                          </p>
                          <button
                            className="quiet-button"
                            onClick={() => {
                              resetFilters();
                              if (view === "saved" && !savedCount)
                                navigate("discover");
                            }}
                          >
                            {view === "saved" && !savedCount
                              ? "Explore opportunities"
                              : "Clear filters"}
                            <ArrowRight size={16} />
                          </button>
                        </div>
                      )}
                    </section>
                    <aside className="context-rail">
                      {latest && (
                        <div className="report-feature">
                          <div className="report-kicker">
                            <span>
                              <FileText size={17} />
                              FIELD NOTES
                            </span>
                            <span>
                              {friendlyDate(latest.date).replace(" 2026", "")}
                            </span>
                          </div>
                          <h2>
                            A clearer picture,
                            <br />
                            every morning.
                          </h2>
                          <p>{latest.summary.slice(0, 170)}</p>
                          <button onClick={() => navigate("reports")}>
                            Read the latest report
                            <ArrowRight size={18} />
                          </button>
                          <span className="report-corner">
                            <ArrowDown size={46} weight="light" />
                          </span>
                        </div>
                      )}
                      <div className="criteria-card">
                        <div className="section-caption">
                          YOUR SEARCH, IN FOCUS
                          <Compass size={18} />
                        </div>
                        <div className="criterion">
                          <Clock size={18} />
                          <div>
                            <strong>6 months to make an impact</strong>
                            <p>End-of-study internship · PFE</p>
                          </div>
                        </div>
                        <div className="criterion">
                          <CalendarBlank size={18} />
                          <div>
                            <strong>Nov 2026 — Mar 2027</strong>
                            <p>Your starting window</p>
                          </div>
                        </div>
                        <div className="criterion">
                          <GlobeHemisphereWest size={18} />
                          <div>
                            <strong>Open to the right place</strong>
                            <p>Tunisia on-site, Europe, US & beyond</p>
                          </div>
                        </div>
                        <div className="focus-tags">
                          <span>AI agents</span>
                          <span>Agentic workflows</span>
                          <span>Web apps</span>
                        </div>
                        <button
                          className="text-button"
                          onClick={() => navigate("profile")}
                        >
                          View search profile
                          <ArrowRight size={15} />
                        </button>
                      </div>
                      <div className="small-note">
                        <Sparkle size={20} />
                        <p>
                          A strong technical fit is a starting point. Check
                          dates, eligibility and work arrangements before
                          applying.
                        </p>
                      </div>
                    </aside>
                  </div>
                </>
              )}
              {view === "pipeline" && (
                <>
                  <div className="page-heading">
                    <div>
                      <div className="eyebrow">SMALL STEPS, REAL PROGRESS</div>
                      <h1>Your next moves.</h1>
                      <p>
                        Track your applications from first interest to an offer.
                      </p>
                    </div>
                  </div>
                  <div className="pipeline-summary">
                    <Briefcase size={19} />
                    <strong>{activeCount}</strong> active applications
                    <span>Stages are updated by you.</span>
                  </div>
                  <div className="pipeline-grid">
                    {stages
                      .filter((s) => s.value !== "archived")
                      .map((s) => {
                        const roles = opportunities.filter(
                          (o) =>
                            getProgress(o).stage === s.value &&
                            (s.value !== "exploring" || getProgress(o).saved),
                        );
                        return (
                          <section className="pipeline-column" key={s.value}>
                            <h2>
                              <span className={`stage-dot ${s.value}`} />
                              {s.label}
                              <b>{roles.length}</b>
                            </h2>
                            {roles.map((o) => (
                              <button
                                key={o.id}
                                className="pipeline-card"
                                onClick={() => setSelected(o)}
                              >
                                <span
                                  className={`company-mark tiny ${color(o.company)}`}
                                >
                                  {initials(o.company)}
                                </span>
                                <strong>{o.company}</strong>
                                <p>{shortTitle(o)}</p>
                                <small>{o.location}</small>
                              </button>
                            ))}
                            {!roles.length && (
                              <div className="column-empty">
                                {s.value === "exploring"
                                  ? "Your saved roles start here."
                                  : "Your next milestone awaits."}
                              </div>
                            )}
                          </section>
                        );
                      })}
                  </div>
                  <button
                    className="quiet-button"
                    onClick={() => navigate("discover")}
                  >
                    <Plus size={17} />
                    Find your next opportunity
                  </button>
                </>
              )}
              {view === "reports" && (
                <>
                  <div className="page-heading">
                    <div>
                      <div className="eyebrow">A LITTLE MORE CLARITY</div>
                      <h1>Your field notes.</h1>
                      <p>Daily research, verified sources and what changed.</p>
                    </div>
                    <span className="schedule-badge">
                      <Clock size={16} />
                      Daily · 09:00 Tunis
                    </span>
                  </div>
                  <div className="reports-list">
                    {data.reports.map((report, i) => (
                      <article
                        key={report.date}
                        className={`report-card ${i === 0 ? "latest" : ""}`}
                      >
                        <div className="report-document">
                          <FileText size={32} weight="light" />
                          <span>PDF</span>
                        </div>
                        <div className="report-body">
                          <div className="report-date">
                            {friendlyDate(report.date)}
                            {i === 0 && <Pill tone="green">Latest</Pill>}
                          </div>
                          <h2>End-of-study internship report</h2>
                          <p>{report.summary}</p>
                          <a
                            className="text-button"
                            href={`/api/reports/${report.date}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open report
                            <ArrowSquareOut size={17} />
                          </a>
                        </div>
                      </article>
                    ))}
                  </div>
                  <p className="footnote">
                    Reports you’ve opened stay available offline on this device.
                    Original PDFs remain saved on your Mac.
                  </p>
                </>
              )}
              {view === "profile" && (
                <>
                  <div className="page-heading">
                    <div>
                      <div className="eyebrow">
                        THE PERSON BEHIND THE SEARCH
                      </div>
                      <h1>Built around you.</h1>
                      <p>Your direction, your strengths, your next step.</p>
                    </div>
                  </div>
                  <div className="profile-grid">
                    <section className="profile-card">
                      <span className="avatar large">MS</span>
                      <h2>Mohamed Slimane</h2>
                      <p>Computer science engineering · ESPRIT</p>
                      <div className="profile-location">
                        <MapPin size={16} />
                        Tunisia · Expected graduation 2027
                      </div>
                      <div className="profile-divider" />
                      <h3>What you’re looking for</h3>
                      <p>
                        A six-month PFE starting between November 2026 and March
                        2027, building AI agents, workflows and web
                        applications.
                      </p>
                      <p>
                        On-site Tunisia stays high alongside international
                        opportunities. Remote geography, sponsorship and
                        eligibility are checked individually.
                      </p>
                      <div className="focus-tags">
                        <span>Arabic · Native</span>
                        <span>French · B2</span>
                        <span>English · B2</span>
                      </div>
                      <p className="footnote">
                        Graduation month and school agreement still need
                        confirmation.
                      </p>
                    </section>
                    <section className="portfolio-panel">
                      <h2>Your work tells the story.</h2>
                      <p>
                        Selected projects from your local repository inventory.
                      </p>
                      {[
                        {
                          name: "Aviary",
                          tag: "Agent tooling",
                          body: "Coding-agent control surface, MCP and skills. Credit the T3 Code foundation and explain your additions.",
                          stack: "React · TypeScript · Electron · Expo",
                        },
                        {
                          name: "SamOps",
                          tag: "Cloud workflows",
                          body: "Cloud signals, anomaly analysis and review workflows. Show your contribution to the shared system.",
                          stack: "Next.js · Go · Python · Cloud",
                        },
                        {
                          name: "Scribo",
                          tag: "AI product",
                          body: "Lecture capture, transcription and study tools, with mobile clients and a Workers backend.",
                          stack: "SwiftUI · Kotlin · Hono",
                        },
                        {
                          name: "Zennyt",
                          tag: "Mobile delivery",
                          body: "Flutter product with Spring Boot and Azure infrastructure. Recent decision-game UI and configuration work.",
                          stack: "Flutter · Spring Boot · Azure",
                        },
                      ].map((p, i) => (
                        <article className="project-row" key={p.name}>
                          <span className="project-number">0{i + 1}</span>
                          <div>
                            <div className="project-title">
                              <h3>{p.name}</h3>
                              <Pill>{p.tag}</Pill>
                            </div>
                            <p>{p.body}</p>
                            <small>{p.stack}</small>
                          </div>
                        </article>
                      ))}
                    </section>
                    <section className="device-card">
                      <div>
                        <h2>Take Stage with you.</h2>
                        <p>
                          Install it on your home screen. Browse saved data
                          offline.
                        </p>
                      </div>
                      <button
                        className="primary-button"
                        onClick={() => void install()}
                      >
                        <DownloadSimple size={18} />
                        {installed ? "Installation details" : "Install Stage"}
                      </button>
                      <button
                        className="text-button"
                        onClick={() => void logout()}
                      >
                        Lock & clear this device
                      </button>
                    </section>
                  </div>
                </>
              )}
            </>
          )}
        </main>
      </div>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {views.slice(0, 4).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={view === id ? "active" : ""}
            onClick={() => navigate(id)}
            aria-current={view === id ? "page" : undefined}
          >
            <Icon size={23} weight={view === id ? "fill" : "regular"} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      {notice && (
        <div className="toast" role="status">
          {notice}
          <button aria-label="Dismiss message" onClick={() => setNotice("")}>
            <X size={16} />
          </button>
        </div>
      )}
      <Dialog.Root open={filtersOpen} onOpenChange={setFiltersOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="dialog-content filter-dialog">
            <div className="dialog-heading">
              <Dialog.Title>Make it your search.</Dialog.Title>
              <Dialog.Close className="icon-button" aria-label="Close filters">
                <X size={21} />
              </Dialog.Close>
            </div>
            <Dialog.Description>
              Filter by location, flexibility and confirmed timing.
            </Dialog.Description>
            <label className="field-label">
              Location
              <select value={geo} onChange={(e) => setGeo(e.target.value)}>
                {["All", "Tunisia", "Europe", "North America", "Elsewhere"].map(
                  (g) => (
                    <option key={g}>{g}</option>
                  ),
                )}
              </select>
            </label>
            <label className="check-row">
              <input
                type="checkbox"
                checked={remote}
                onChange={(e) => setRemote(e.target.checked)}
              />
              <span>
                <strong>Remote-friendly</strong>
                <small>Includes hybrid; check geographic restrictions.</small>
              </span>
            </label>
            <label className="check-row">
              <input
                type="checkbox"
                checked={timing}
                onChange={(e) => setTiming(e.target.checked)}
              />
              <span>
                <strong>Timing matches only</strong>
                <small>Compatible dates; eligibility may be open.</small>
              </span>
            </label>
            <label className="check-row">
              <input
                type="checkbox"
                checked={watch}
                onChange={(e) => setWatch(e.target.checked)}
              />
              <span>
                <strong>Closed-role watchlist</strong>
                <small>Past roles worth watching for a new intake.</small>
              </span>
            </label>
            <div className="dialog-actions">
              <button className="quiet-button" onClick={resetFilters}>
                Reset filters
              </button>
              <Dialog.Close className="primary-button">
                Show {visible.length} results
                <ArrowRight size={17} />
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <Dialog.Root
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="dialog-content detail-dialog">
            {selected && (
              <RoleDetail
                key={selected.id}
                role={selected}
                progress={getProgress(selected)}
                pending={pending}
                offline={offline}
                onUpdate={update}
                notify={setNotice}
              />
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <Dialog.Root open={installHelp} onOpenChange={setInstallHelp}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="dialog-content install-dialog">
            <div className="dialog-heading">
              <Dialog.Title>Stage, a tap away.</Dialog.Title>
              <Dialog.Close
                className="icon-button"
                aria-label="Close installation help"
              >
                <X size={21} />
              </Dialog.Close>
            </div>
            <Dialog.Description>
              Add this workspace to your home screen.
            </Dialog.Description>
            <div className="install-step">
              <span>1</span>
              <p>
                <strong>iPhone or iPad</strong>
                <br />
                Open in Safari, tap Share, then “Add to Home Screen”.
              </p>
            </div>
            <div className="install-step">
              <span>2</span>
              <p>
                <strong>Android or desktop</strong>
                <br />
                Open your browser menu and choose “Install app” or “Add to Home
                screen”.
              </p>
            </div>
            <p className="footnote">
              Installation requires HTTPS, or localhost on this Mac. On a phone,
              use an HTTPS deployment. Offline browsing becomes available after
              your first online visit.
            </p>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function RoleDetail({
  role: o,
  progress,
  pending,
  offline,
  onUpdate,
  notify,
}: {
  role: Opportunity;
  progress: Progress;
  pending: boolean;
  offline: boolean;
  onUpdate: (p: Progress) => Promise<boolean>;
  notify: (s: string) => void;
}) {
  const [notes, setNotes] = useState(progress.notes);
  return (
    <>
      <div className="detail-top">
        <span className={`company-mark ${color(o.company)}`}>
          {initials(o.company)}
        </span>
        <div>
          <strong>{o.company}</strong>
          <small>{o.location}</small>
        </div>
        <Dialog.Close className="icon-button" aria-label="Close opportunity">
          <X size={22} />
        </Dialog.Close>
      </div>
      <div className="detail-scroll">
        <Pill
          tone={isClosed(o) ? "closed" : timingMatch(o) ? "green" : "amber"}
        >
          {o.status}
        </Pill>
        <Dialog.Title>{o.role}</Dialog.Title>
        <Dialog.Description>{o.work_and_requirements}</Dialog.Description>
        <div className="detail-facts">
          {[
            ["Start", o.start],
            ["Duration", o.duration],
            ["Compensation", o.compensation || "Not stated"],
            ["Deadline", o.deadline || "Not stated"],
          ].map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
        <section className="detail-section">
          <h3>Where & how you’ll work</h3>
          <p>{o.remote}</p>
          <h3>Sponsorship evidence</h3>
          <p>{o.sponsorship || "Not stated"}</p>
        </section>
        <section className="evidence-box">
          <h3>
            <Compass size={18} />
            What to confirm
          </h3>
          <p>{o.gaps}</p>
        </section>
        <section className="detail-section">
          <h3>Your portfolio angle</h3>
          <p>{o.portfolio}</p>
        </section>
        <section className="detail-section">
          <h3>Make your next move</h3>
          <label className="field-label">
            Application stage
            <select
              value={progress.stage}
              disabled={pending || offline}
              onChange={(e) =>
                void onUpdate({ ...progress, stage: e.target.value as Stage })
              }
            >
              {stages.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field-label">
            Your notes
            <textarea
              placeholder="Questions to ask, ideas for your application…"
              rows={4}
              maxLength={10000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
          <button
            className="quiet-button"
            disabled={pending || offline || notes === progress.notes}
            onClick={async () => {
              if (await onUpdate({ ...progress, notes }))
                notify("Notes saved to your workspace.");
            }}
          >
            <Check size={16} />
            Save notes
          </button>
          {offline && (
            <p className="footnote">
              Reconnect to update your application or notes.
            </p>
          )}
        </section>
        <section className="source-details">
          <strong>Evidence & freshness</strong>
          <p>{o.evidence}</p>
          <small>
            Last checked: {o.last_checked} · {o.id}
          </small>
          {o.additional_source && (
            <a href={o.additional_source} target="_blank" rel="noreferrer">
              Additional source
              <ArrowSquareOut size={12} />
            </a>
          )}
        </section>
      </div>
      <div className="detail-actions">
        <button
          className={`quiet-button ${progress.saved ? "is-saved" : ""}`}
          disabled={pending || offline}
          onClick={() => void onUpdate({ ...progress, saved: !progress.saved })}
        >
          <BookmarkSimple
            weight={progress.saved ? "fill" : "regular"}
            size={18}
          />
          {progress.saved ? "Saved" : "Save role"}
        </button>
        <a
          className="primary-button"
          href={o.url}
          target="_blank"
          rel="noreferrer"
        >
          View original listing
          <ArrowSquareOut size={17} />
        </a>
      </div>
    </>
  );
}
