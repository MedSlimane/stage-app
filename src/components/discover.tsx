"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, BookmarkSimple, CalendarBlank, CheckCircle, Clock, Columns, FunnelSimple, GlobeHemisphereWest, HourglassMedium, ListBullets, MagnifyingGlass, MapPin, SquaresFour, X } from "@phosphor-icons/react";
import { useWorkspace, type Filters } from "./context";
import { CompanyMark, PageHeading, Pill, ScoreRing, StageDot, Stars } from "./ui";
import { allSkills, dayDiff, fitScore, parseDeadline, relativeDay, shortTitle, skills, stageLabel, statusLabel, statusTone } from "@/lib/insights";
import { fitRank, hasRemote, isClosed, region, timingMatch, type Opportunity, type Progress } from "@/lib/types";

export function filterRoles(roles: Opportunity[], f: Filters, savedOnly: boolean, getProgress: (id: string) => Progress) {
  const q = f.query.trim().toLowerCase();
  const deadline = (o: Opportunity) => parseDeadline(o.deadline)?.getTime() ?? Infinity;
  return roles
    .filter((o) => {
      if (savedOnly && !getProgress(o.id).saved) return false;
      if (!savedOnly && (f.watch ? !isClosed(o) : isClosed(o))) return false;
      if (f.geo !== "All" && region(o) !== f.geo) return false;
      if (f.remote && !hasRemote(o)) return false;
      if (f.timing && !timingMatch(o)) return false;
      if (f.skill && !skills(o).includes(f.skill)) return false;
      if (!q) return true;
      return [o.company, o.role, o.location, o.work_and_requirements, o.portfolio, o.id, getProgress(o.id).notes].join(" ").toLowerCase().includes(q);
    })
    .sort((a, b) =>
      f.sort === "newest" ? b.first_seen.localeCompare(a.first_seen) || fitRank(a) - fitRank(b)
      : f.sort === "company" ? a.company.localeCompare(b.company)
      : f.sort === "deadline" ? deadline(a) - deadline(b) || fitRank(a) - fitRank(b)
      : fitScore(b) - fitScore(a) || fitRank(a) - fitRank(b),
    );
}

function typing(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
}

export function Discover({ savedOnly }: { savedOnly: boolean }) {
  const ws = useWorkspace();
  const { data, filters: f, setFilters, getProgress, openRole, update, offline, compare, toggleCompare, isNew, navigate } = ws;
  const [layout, setLayout] = useState<"list" | "grid">(() => {
    try { return localStorage.getItem("stage-layout") === "grid" ? "grid" : "list"; } catch { return "list"; }
  });
  const [cursor, setCursor] = useState(-1);
  const search = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const visible = useMemo(() => filterRoles(data.opportunities, f, savedOnly, getProgress), [data, f, savedOnly, getProgress]);
  const ids = useMemo(() => visible.map((o) => o.id), [visible]);
  const savedCount = data.progress.filter((p) => p.saved).length;
  const filterCount = Number(f.geo !== "All") + Number(f.remote) + Number(f.timing) + Number(f.watch) + Number(!!f.skill);
  const skillCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const o of data.opportunities) if (!isClosed(o)) for (const s of skills(o)) counts.set(s, (counts.get(s) ?? 0) + 1);
    return allSkills.filter((s) => counts.get(s)).map((s) => ({ skill: s, count: counts.get(s)! }));
  }, [data]);

  function chooseLayout(next: "list" | "grid") {
    setLayout(next);
    try { localStorage.setItem("stage-layout", next); } catch {}
  }

  // j/k move through results, Enter opens, s saves, c adds to compare, / focuses search.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey || typing(e.target) || document.querySelector("[role=dialog]")) return;
      if (e.key === "/") { e.preventDefault(); search.current?.focus(); return; }
      if (!ids.length) return;
      if (e.key === "j" || e.key === "k") {
        e.preventDefault();
        setCursor((c) => {
          const next = Math.max(0, Math.min(ids.length - 1, c + (e.key === "j" ? 1 : -1)));
          list.current?.querySelectorAll<HTMLElement>(".role-card")[next]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
          return next;
        });
        return;
      }
      const id = ids[cursor];
      if (!id) return;
      if (e.key === "Enter" || e.key === "o") { e.preventDefault(); openRole(id, ids); }
      else if (e.key === "s") {
        const p = getProgress(id), company = data.opportunities.find((o) => o.id === id)?.company ?? id;
        void update({ ...p, saved: !p.saved }, { undo: p.saved ? `Removed ${company} from your shortlist.` : `Saved ${company} to your shortlist.` });
      }
      else if (e.key === "c") toggleCompare(id);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ids, cursor, openRole, getProgress, update, toggleCompare, data]);

  const chip = (label: React.ReactNode, active: boolean, onClick: () => void, key?: string) => (
    <button key={key} className={`chip ${active ? "selected" : ""}`} aria-pressed={active} onClick={onClick}>{label}</button>
  );

  return (
    <div className="view discover">
      <PageHeading
        eyebrow={savedOnly ? "A LITTLE CLOSER" : "THE SEARCH IS ON"}
        title={savedOnly ? <>Your <em>shortlist.</em></> : <>Find your <em>next chapter.</em></>}
        lead={savedOnly ? "The opportunities you want to come back to." : "Meaningful work. Six months. Something worth building."}
      >
        <div className="segmented" role="group" aria-label="Layout">
          <button aria-pressed={layout === "list"} onClick={() => chooseLayout("list")} aria-label="List layout"><ListBullets size={17} /></button>
          <button aria-pressed={layout === "grid"} onClick={() => chooseLayout("grid")} aria-label="Grid layout"><SquaresFour size={17} /></button>
        </div>
      </PageHeading>

      <div className="search-row">
        <label className="search-input">
          <MagnifyingGlass size={20} />
          <input ref={search} placeholder="Search roles, companies, skills or your notes…" value={f.query} onChange={(e) => setFilters({ query: e.target.value })} aria-label="Search opportunities" onKeyDown={(e) => { if (e.key === "Escape") { setFilters({ query: "" }); e.currentTarget.blur(); } }} />
          {f.query ? (
            <button aria-label="Clear search" onClick={() => setFilters({ query: "" })}><X size={16} /></button>
          ) : (
            <kbd className="hint">/</kbd>
          )}
        </label>
        <button className={`filter-button ${filterCount ? "enabled" : ""}`} onClick={ws.openFilters} aria-label="Filter opportunities">
          <FunnelSimple size={18} /><span>Filters</span>{filterCount > 0 && <b>{filterCount}</b>}
        </button>
      </div>

      <div className="chips" aria-label="Quick filters">
        {chip("All", f.geo === "All" && !f.remote && !f.timing && !f.skill && !f.watch, () => setFilters({ geo: "All", remote: false, timing: false, skill: "", watch: false }))}
        {chip(<><MapPin size={14} />Tunisia</>, f.geo === "Tunisia", () => setFilters({ geo: f.geo === "Tunisia" ? "All" : "Tunisia" }))}
        {chip("Europe", f.geo === "Europe", () => setFilters({ geo: f.geo === "Europe" ? "All" : "Europe" }))}
        {chip(<><GlobeHemisphereWest size={14} />Remote-friendly</>, f.remote, () => setFilters({ remote: !f.remote }))}
        {chip(<><CheckCircle size={14} />Timing match</>, f.timing, () => setFilters({ timing: !f.timing }))}
        <span className="chip-divider" aria-hidden="true" />
        {skillCounts.map(({ skill, count }) => chip(<>{skill}<small>{count}</small></>, f.skill === skill, () => setFilters({ skill: f.skill === skill ? "" : skill }), skill))}
      </div>

      <div className="results-heading">
        <span>
          <strong>{visible.length}</strong> {savedOnly ? "saved" : f.watch ? "closed roles on your watchlist" : "open roles"}
          {(filterCount > 0 || f.query) && <button className="clear-link" onClick={() => setFilters({ geo: "All", remote: false, timing: false, watch: false, skill: "", query: "" })}>Reset</button>}
        </span>
        <label className="sort-control">
          Sort
          <select aria-label="Sort opportunities" value={f.sort} onChange={(e) => setFilters({ sort: e.target.value as Filters["sort"] })}>
            <option value="fit">Best fit</option>
            <option value="newest">Recently found</option>
            <option value="deadline">Deadline</option>
            <option value="company">Company</option>
          </select>
        </label>
      </div>

      <div ref={list} className={`role-list ${layout}`}>
        {visible.map((o, i) => {
          const p = getProgress(o.id);
          const deadline = parseDeadline(o.deadline);
          const days = deadline ? dayDiff(deadline) : null;
          const comparing = compare.includes(o.id);
          return (
            <article key={o.id} className={`role-card ${cursor === i ? "cursor" : ""} ${p.saved ? "is-saved" : ""}`} onFocusCapture={() => setCursor(i)}>
              <div className="role-top">
                <CompanyMark name={o.company} />
                <div className="company-line">
                  <span>{o.company}{isNew(o) && <Pill tone="new">New</Pill>}</span>
                  <small><MapPin size={12} />{o.location}</small>
                </div>
                <ScoreRing role={o} />
              </div>
              <button className="role-main" onClick={() => openRole(o.id, ids)} aria-label={`View ${shortTitle(o)} at ${o.company}`}>
                <h2>{shortTitle(o)}</h2>
                <p>{o.work_and_requirements}</p>
                <div className="tags">{skills(o).slice(0, 4).map((s) => <span key={s}>{s}</span>)}</div>
              </button>
              <div className="role-foot">
                <div className="facts">
                  <span><CalendarBlank size={14} />{o.start.length > 30 ? o.start.slice(0, 28) + "…" : o.start}</span>
                  <span><Clock size={14} />{o.duration.length > 22 ? "Duration to confirm" : o.duration}</span>
                  {deadline && days !== null && days >= -3 && (
                    <span className={days <= 7 ? "urgent" : ""}><HourglassMedium size={14} />{days < 0 ? "Deadline passed" : relativeDay(deadline)}</span>
                  )}
                </div>
                <div className="role-actions">
                  {p.stage !== "exploring" && <Pill tone="stage"><StageDot stage={p.stage} />{stageLabel(p.stage)}</Pill>}
                  <Stars value={p.priority ?? 0} />
                  <Pill tone={statusTone(o)}>{statusLabel(o)}</Pill>
                  <button className={`icon-button ${comparing ? "on" : ""}`} aria-pressed={comparing} aria-label={`${comparing ? "Remove from" : "Add to"} comparison`} title="Compare (c)" onClick={() => toggleCompare(o.id)}>
                    <Columns size={18} weight={comparing ? "fill" : "regular"} />
                  </button>
                  <button className={`icon-button bookmark ${p.saved ? "on" : ""}`} disabled={offline} aria-pressed={p.saved} aria-label={`${p.saved ? "Unsave" : "Save"} ${o.company} ${o.id}`} title="Save (s)" onClick={() => void update({ ...p, saved: !p.saved }, { undo: p.saved ? `Removed ${o.company} from your shortlist.` : `Saved ${o.company} to your shortlist.` })}>
                    <BookmarkSimple size={19} weight={p.saved ? "fill" : "regular"} />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {!visible.length && (
        <div className="empty-state">
          <BookmarkSimple size={34} />
          <h2>{savedOnly && !savedCount ? "Keep the ones that click." : "No matches here yet."}</h2>
          <p>{savedOnly && !savedCount ? "Tap the bookmark on any opportunity to build your shortlist." : "Try another keyword or loosen your filters."}</p>
          <button className="quiet-button" onClick={() => { setFilters({ geo: "All", remote: false, timing: false, watch: false, skill: "", query: "" }); if (savedOnly && !savedCount) navigate("discover"); }}>
            {savedOnly && !savedCount ? "Explore opportunities" : "Clear filters"} <ArrowRight size={16} />
          </button>
        </div>
      )}
      {visible.length > 0 && <p className="keyboard-tip"><kbd>j</kbd><kbd>k</kbd> move · <kbd>↵</kbd> open · <kbd>s</kbd> save · <kbd>c</kbd> compare · <kbd>⌘</kbd><kbd>K</kbd> command menu</p>}
    </div>
  );
}
