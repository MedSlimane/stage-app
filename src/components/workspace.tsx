"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowClockwise, ArrowRight, BookmarkSimple, Clock, Compass, FileText, Kanban, MagnifyingGlass, Moon, Student, Sun, SunHorizon, WifiSlash, X } from "@phosphor-icons/react";
import { UpdateContext, WorkspaceContext, emptyFilters, type Filters, type Theme, type View, type WorkspaceApi } from "./context";
import { Today } from "./today";
import { Discover, filterRoles } from "./discover";
import { Pipeline } from "./pipeline";
import { Reports } from "./reports";
import { Profile } from "./profile";
import { RoleDetail } from "./role-detail";
import { CommandPalette } from "./command-palette";
import { CompareDialog, CompareTray } from "./compare";
import { Celebration, FiltersDialog, InstallDialog, ShortcutsDialog } from "./dialogs";
import { download, localISO, parseDeadline, parseISODate, shortTitle, toCSV, toICS } from "@/lib/insights";
import { defaultProgress, isClosed, type Opportunity, type Progress, type Snapshot } from "@/lib/types";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
type Toast = { id: number; message: string; undo?: Progress };

const views: { id: View; label: string; short?: string; icon: typeof Compass }[] = [
  { id: "today", label: "Today", icon: SunHorizon },
  { id: "discover", label: "Discover", icon: Compass },
  { id: "saved", label: "Saved", icon: BookmarkSimple },
  { id: "pipeline", label: "Pipeline", icon: Kanban },
  { id: "reports", label: "Field notes", short: "Notes", icon: FileText },
  { id: "profile", label: "Profile", icon: Student },
];
const cacheKey = "stage-workspace-v1";
const chords: Record<string, View> = { t: "today", d: "discover", s: "saved", p: "pipeline", r: "reports", m: "profile" };

function applyTheme(theme: Theme) {
  if (theme === "system") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
}
function isDark(theme: Theme) {
  return theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
}
function typing(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
}

export default function Workspace() {
  const [view, setView] = useState<View>("today");
  const [data, setData] = useState<Snapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [offline, setOffline] = useState(false);
  const [locked, setLocked] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [code, setCode] = useState("");
  const [filters, setFilterState] = useState<Filters>(emptyFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState<{ id: string; list: string[] } | null>(null);
  const [installHelp, setInstallHelp] = useState(false);
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [compare, setCompare] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [theme, setThemeState] = useState<Theme>("system");
  const [celebrate, setCelebrate] = useState(0);
  const [lastVisit, setLastVisit] = useState<string | null>(null);
  const dataRef = useRef<Snapshot | null>(null);
  const offlineRef = useRef(false);
  const queue = useRef(new Map<string, Promise<Progress>>());
  useEffect(() => {
    dataRef.current = data;
    offlineRef.current = offline;
  });

  const notify = useCallback((message: string, undo?: Progress) => setToast({ id: Date.now(), message, undo }), []);

  const persist = useCallback((next: Snapshot) => {
    try { localStorage.setItem(cacheKey, JSON.stringify(next)); } catch {}
  }, []);

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
      // Keep optimistic edits that are still in flight.
      const pending = dataRef.current?.progress.filter((p) => queue.current.has(p.sourceId)) ?? [];
      const merged = pending.length ? { ...snapshot, progress: [...snapshot.progress.filter((p) => !queue.current.has(p.sourceId)), ...pending] } : snapshot;
      setData(merged);
      setLocked(false);
      setOffline(!navigator.onLine || response.headers.get("X-Stage-Offline") === "1");
      persist(merged);
    } catch {
      setOffline(true);
      notify("Can’t sync right now. Showing your last saved snapshot.");
    } finally {
      setBusy(false);
    }
  }, [notify, persist]);

  const navigate = useCallback((next: View) => {
    setView(next);
    history.pushState(null, "", next === "today" ? "/" : "/?view=" + next);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    const readView = () => {
      const params = new URLSearchParams(location.search);
      const v = params.get("view") as View;
      setView(views.some((x) => x.id === v) ? v : "today");
      const role = params.get("role");
      if (role && /^PFE-\d+$/.test(role)) setSelected({ id: role, list: [] });
    };
    const initialize = setTimeout(() => {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) setData(JSON.parse(cached));
      } catch {
        localStorage.removeItem(cacheKey);
      }
      try {
        const stored = localStorage.getItem("stage-theme");
        if (stored === "light" || stored === "dark") setThemeState(stored);
        setLastVisit(localStorage.getItem("stage-last-visit"));
        localStorage.setItem("stage-last-visit", localISO());
      } catch {}
      readView();
      void refresh();
      setInstalled(window.matchMedia("(display-mode: standalone)").matches);
    }, 0);
    const online = () => { setOffline(false); void refresh(); };
    const off = () => setOffline(true);
    const install = (e: Event) => { e.preventDefault(); setInstallEvent(e as InstallEvent); };
    const done = () => { setInstalled(true); setInstallEvent(null); };
    window.addEventListener("online", online);
    window.addEventListener("offline", off);
    window.addEventListener("popstate", readView);
    window.addEventListener("beforeinstallprompt", install);
    window.addEventListener("appinstalled", done);
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production")
      navigator.serviceWorker.register("/sw.js").catch(() => notify("Offline setup is unavailable in this browser."));
    const timer = setInterval(() => {
      if (document.visibilityState === "visible" && navigator.onLine && !queue.current.size) void refresh();
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
  }, [refresh, notify]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), toast.undo ? 7000 : 5000);
    return () => clearTimeout(id);
  }, [toast]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    applyTheme(next);
    try {
      if (next === "system") localStorage.removeItem("stage-theme");
      else localStorage.setItem("stage-theme", next);
    } catch {}
  }, []);

  const replace = useCallback((p: Progress) => {
    setData((old) => {
      if (!old) return old;
      const next = { ...old, progress: [...old.progress.filter((x) => x.sourceId !== p.sourceId), p] };
      persist(next);
      return next;
    });
  }, [persist]);

  const update = useCallback(async (next: Progress, options?: { undo?: string }): Promise<boolean> => {
    if (offlineRef.current) {
      notify("You’re offline. Reconnect to save changes.");
      return false;
    }
    const id = next.sourceId;
    const previous = dataRef.current?.progress.find((p) => p.sourceId === id) ?? defaultProgress(id);
    const now = Date.now();
    replace({ ...next, updatedAt: now, history: next.stage !== previous.stage ? [...(previous.history ?? []), { stage: next.stage, at: now }] : previous.history });
    const body = JSON.stringify({ sourceId: id, saved: next.saved, stage: next.stage, notes: next.notes, priority: next.priority ?? 0, tasks: next.tasks ?? [], nextStep: next.nextStep ?? "", followUp: next.followUp ?? "" });
    // Requests for the same role run in order so a slow response never overwrites a newer edit.
    const request = (queue.current.get(id) ?? Promise.resolve(previous)).catch(() => previous).then(async () => {
      const r = await fetch("/api/workspace", { method: "PATCH", headers: { "Content-Type": "application/json" }, body });
      if (!r.ok) throw new Error((await r.json().catch(() => null))?.error || "Could not save. Please retry.");
      return (await r.json()) as Progress;
    });
    queue.current.set(id, request);
    try {
      const saved = await request;
      if (queue.current.get(id) === request) {
        queue.current.delete(id);
        replace(saved);
      }
      if (next.stage === "offer" && previous.stage !== "offer") setCelebrate(now);
      if (options?.undo) notify(options.undo, previous);
      return true;
    } catch (e) {
      if (queue.current.get(id) === request) {
        queue.current.delete(id);
        replace(previous);
      }
      notify(e instanceof Error ? e.message : "Could not save. Please retry.");
      return false;
    }
  }, [notify, replace]);

  const progressMap = useMemo(() => new Map(data?.progress.map((p) => [p.sourceId, p]) ?? []), [data]);
  const roleMap = useMemo(() => new Map(data?.opportunities.map((o) => [o.id, o]) ?? []), [data]);
  const getProgress = useCallback((id: string) => progressMap.get(id) ?? defaultProgress(id), [progressMap]);
  const roleById = useCallback((id: string) => roleMap.get(id), [roleMap]);
  const openRole = useCallback((id: string, list: string[] = []) => setSelected({ id, list }), []);
  const setFilters = useCallback((next: Partial<Filters>) => setFilterState((f) => ({ ...f, ...next })), []);
  const toggleCompare = useCallback((id: string) => {
    setCompare((c) => {
      if (c.includes(id)) return c.filter((x) => x !== id);
      if (c.length >= 3) { notify("You can compare up to three roles."); return c; }
      return [...c, id];
    });
  }, [notify]);
  const isNew = useCallback((o: Opportunity) => {
    if (lastVisit) return o.first_seen > lastVisit;
    return Date.now() - new Date(o.first_seen + "T12:00:00").getTime() < 3 * 86400000;
  }, [lastVisit]);

  const tracked = useCallback(() => {
    if (!data) return [];
    const rows = data.opportunities.map((o) => ({ o, p: getProgress(o.id) }));
    const mine = rows.filter(({ p }) => p.saved || p.stage !== "exploring");
    return mine.length ? mine : rows;
  }, [data, getProgress]);
  const exportCSV = useCallback(() => {
    download(`stage-tracker-${localISO()}.csv`, toCSV(tracked()), "text/csv;charset=utf-8");
    notify("Exported your tracker as CSV.");
  }, [tracked, notify]);
  const exportCalendar = useCallback(() => {
    const events = tracked().flatMap(({ o, p }) => {
      if (p.stage === "archived") return [];
      const out = [];
      const due = parseISODate(p.followUp);
      if (due) out.push({ uid: `${o.id}-follow-up`, date: due, title: `Follow up: ${o.company}`, description: `${p.nextStep || "Follow up"} — ${shortTitle(o)}\n${o.url || ""}` });
      const deadline = parseDeadline(o.deadline);
      if (deadline && !isClosed(o) && deadline.getTime() > Date.now() - 86400000) out.push({ uid: `${o.id}-deadline`, date: deadline, title: `Deadline: ${o.company}`, description: `${shortTitle(o)} — ${o.location}\n${o.url || ""}` });
      return out;
    });
    if (!events.length) { notify("No follow-ups or deadlines to export yet."); return; }
    download(`stage-follow-ups-${localISO()}.ics`, toICS(events), "text/calendar;charset=utf-8");
    notify(`Exported ${events.length} calendar ${events.length === 1 ? "event" : "events"}.`);
  }, [tracked, notify]);

  const install = useCallback(async () => {
    if (installEvent) {
      await installEvent.prompt();
      const result = await installEvent.userChoice;
      if (result.outcome === "accepted") setInstalled(true);
      setInstallEvent(null);
    } else setInstallHelp(true);
  }, [installEvent]);

  const lock = useCallback(async () => {
    if (!confirm("Lock this workspace and clear offline data on this device?")) return;
    const r = await fetch("/api/session", { method: "DELETE" });
    if (!r.ok) { notify("Could not lock. Please retry."); return; }
    localStorage.removeItem(cacheKey);
    navigator.serviceWorker?.controller?.postMessage("CLEAR_PRIVATE_CACHE");
    setData(null);
    setLocked(true);
  }, [notify]);

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    setUnlocking(true);
    try {
      const r = await fetch("/api/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
      if (!r.ok) throw new Error("That code didn’t match. Please try again.");
      setCode("");
      await refresh();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Unable to unlock");
    } finally {
      setUnlocking(false);
    }
  }

  // Global shortcuts: ⌘K palette, ? help, g-then-letter navigation.
  useEffect(() => {
    let chord = 0;
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || typing(e.target) || document.querySelector("[role=dialog]") || !dataRef.current) return;
      if (e.key === "?") { e.preventDefault(); setShortcutsOpen(true); return; }
      if (Date.now() - chord < 1200 && chords[e.key]) { e.preventDefault(); chord = 0; navigate(chords[e.key]); return; }
      chord = e.key === "g" ? Date.now() : 0;
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  const savedCount = data?.progress.filter((p) => p.saved).length ?? 0;
  const resultCount = useMemo(() => (data ? filterRoles(data.opportunities, filters, view === "saved", getProgress).length : 0), [data, filters, view, getProgress]);

  const api = useMemo<Omit<WorkspaceApi, "update"> | null>(() => data && {
    data, offline, getProgress, roleById, openRole, navigate, notify, isNew, compare, toggleCompare, filters, setFilters,
    openFilters: () => setFiltersOpen(true),
    openPalette: () => setPaletteOpen(true),
    install: () => void install(),
    installed, theme, setTheme, exportCSV, exportCalendar,
    showShortcuts: () => setShortcutsOpen(true),
    lock: () => void lock(),
  }, [data, offline, getProgress, roleById, openRole, navigate, notify, isNew, compare, toggleCompare, filters, setFilters, install, installed, theme, setTheme, exportCSV, exportCalendar, lock]);
  const current = views.find((v) => v.id === view);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => navigate("today")} aria-label="Stage home">
          <span className="brand-mark">s</span>stage<span className="brand-dot">.</span>
        </button>
        <button className="search-trigger" onClick={() => setPaletteOpen(true)} disabled={!data}>
          <MagnifyingGlass size={16} />Search or jump…<kbd>⌘K</kbd>
        </button>
        <nav aria-label="Main navigation">
          {views.map(({ id, label, icon: Icon }) => (
            <button key={id} className={`nav-item ${view === id ? "active" : ""}`} onClick={() => navigate(id)} aria-current={view === id ? "page" : undefined}>
              <Icon size={20} weight={view === id ? "fill" : "regular"} />
              <span>{label}</span>
              {id === "saved" && savedCount > 0 && <span className="nav-count">{savedCount}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="search-schedule">
            <Clock size={18} />
            <div><strong>Fresh eyes, every day</strong><p>Research at 09:00 · Tunis</p></div>
          </div>
          <button className="account" onClick={() => navigate("profile")}>
            <span className="avatar">MS</span>
            <span><strong>Mohamed Slimane</strong><small>Personal workspace</small></span>
          </button>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <div className="desktop-breadcrumb">Workspace <span>/</span><strong>{current?.label}</strong></div>
          <button className="brand mobile-brand" onClick={() => navigate("today")} aria-label="Stage home">
            <span className="brand-mark">s</span>stage<span className="brand-dot">.</span>
          </button>
          <div className="top-actions">
            <span className={`connection ${offline ? "is-offline" : ""}`} title={offline ? "Showing your offline snapshot" : "Connected"}>
              {offline ? <WifiSlash size={14} /> : <span className="live-dot" />}
              <span>{offline ? "Offline" : "Live"}</span>
            </span>
            <button className="icon-button mobile-only" aria-label="Search" onClick={() => setPaletteOpen(true)} disabled={!data}><MagnifyingGlass size={19} /></button>
            <button className="icon-button" aria-label="Toggle dark theme" onClick={() => setTheme(isDark(theme) ? "light" : "dark")}>
              <Moon size={19} className="theme-moon" /><Sun size={19} className="theme-sun" />
            </button>
            <button className="icon-button" aria-label="Refresh workspace" onClick={() => void refresh()} disabled={busy}>
              <ArrowClockwise size={19} className={busy ? "spinning" : ""} />
            </button>
            <button className="avatar small" onClick={() => navigate("profile")} aria-label="Open your profile">MS</button>
          </div>
        </header>

        <main id="main-content">
          {locked ? (
            <section className="unlock-panel">
              <span className="brand-mark big">s</span>
              <h1>Your next chapter <em>awaits.</em></h1>
              <p>Enter your workspace access code to continue.</p>
              <form onSubmit={unlock}>
                <label htmlFor="access-code">Access code</label>
                <input id="access-code" type="password" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="current-password" required />
                <button className="primary-button" disabled={unlocking}>Unlock workspace<ArrowRight size={18} /></button>
              </form>
            </section>
          ) : !api ? (
            offline ? (
              <section className="loading-panel">
                <WifiSlash size={36} />
                <h1>Let’s get connected.</h1>
                <p>Connect once to download opportunities for offline browsing.</p>
                <button className="primary-button" onClick={() => void refresh()}>Try again</button>
              </section>
            ) : (
              <div className="skeleton" aria-busy="true" aria-label="Opening your workspace">
                <span className="sk sk-eyebrow" />
                <span className="sk sk-title" />
                <div className="sk-row">{[0, 1, 2, 3].map((i) => <span key={i} className="sk sk-tile" />)}</div>
                {[0, 1, 2].map((i) => <span key={i} className="sk sk-card" />)}
              </div>
            )
          ) : (
            <WorkspaceContext.Provider value={api}>
              <UpdateContext.Provider value={update}>
              {view === "today" && <Today />}
              {(view === "discover" || view === "saved") && <Discover key={view} savedOnly={view === "saved"} />}
              {view === "pipeline" && <Pipeline />}
              {view === "reports" && <Reports />}
              {view === "profile" && <Profile />}
              </UpdateContext.Provider>
            </WorkspaceContext.Provider>
          )}
        </main>
      </div>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {views.slice(0, 5).map(({ id, label, short, icon: Icon }) => (
          <button key={id} className={view === id ? "active" : ""} onClick={() => navigate(id)} aria-current={view === id ? "page" : undefined}>
            <Icon size={22} weight={view === id ? "fill" : "regular"} />
            <span>{short ?? label}</span>
            {id === "saved" && savedCount > 0 && <b className="badge">{savedCount}</b>}
          </button>
        ))}
      </nav>

      {toast && (
        <div className="toast" role="status" key={toast.id}>
          <span>{toast.message}</span>
          {toast.undo && <button className="toast-action" onClick={() => { void update(toast.undo!); setToast(null); }}>Undo</button>}
          <button aria-label="Dismiss message" onClick={() => setToast(null)}><X size={16} /></button>
        </div>
      )}

      {api && (
        <WorkspaceContext.Provider value={api}>
          <UpdateContext.Provider value={update}>
          <CompareTray onOpen={() => setCompareOpen(true)} />
          <CompareDialog open={compareOpen && compare.length > 0} onOpenChange={setCompareOpen} />
          <FiltersDialog open={filtersOpen} onOpenChange={setFiltersOpen} count={resultCount} />
          <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} refresh={() => void refresh()} />
          <Dialog.Root open={!!selected && !!roleById(selected.id)} onOpenChange={(open) => { if (!open) setSelected(null); }}>
            <Dialog.Portal>
              <Dialog.Overlay className="dialog-overlay" />
              <Dialog.Content className="dialog-content detail-dialog">
                {selected && roleById(selected.id) && (
                  <RoleDetail key={selected.id} id={selected.id} list={selected.list} onMove={(id) => setSelected({ id, list: selected.list })} />
                )}
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
          </UpdateContext.Provider>
        </WorkspaceContext.Provider>
      )}
      <InstallDialog open={installHelp} onOpenChange={setInstallHelp} />
      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      <Celebration burst={celebrate} />
    </div>
  );
}
