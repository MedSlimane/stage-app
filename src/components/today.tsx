"use client";
import { useMemo } from "react";
import { ArrowRight, BellRinging, BookmarkSimple, CalendarCheck, Compass, FileText, Flag, Kanban, Lightning, Sparkle } from "@phosphor-icons/react";
import { useWorkspace } from "./context";
import { CompanyMark, PageHeading, Pill, ScoreRing, StageDot } from "./ui";
import { dayDiff, fitScore, parseDeadline, parseISODate, relativeDay, relativeTime, shortTitle, stageLabel } from "@/lib/insights";
import { friendlyDate, isClosed, region, regions, stages, type Stage } from "@/lib/types";

type AgendaItem = { key: string; id: string; date: Date | null; kind: "follow-up" | "deadline" | "next"; text: string };

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? "Still up" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export function Today() {
  const { data, getProgress, roleById, openRole, navigate, isNew, update, offline, setFilters } = useWorkspace();
  const open = data.opportunities.filter((o) => !isClosed(o));
  const fresh = open.filter(isNew);
  const saved = data.progress.filter((p) => p.saved);
  const active = data.progress.filter((p) => !["exploring", "archived"].includes(p.stage));

  const agenda = useMemo(() => {
    const items: AgendaItem[] = [];
    for (const p of data.progress) {
      if (p.stage === "archived" || !roleById(p.sourceId)) continue;
      const due = parseISODate(p.followUp);
      if (due) items.push({ key: p.sourceId + "f", id: p.sourceId, date: due, kind: "follow-up", text: p.nextStep || "Follow up" });
      else if (p.nextStep) items.push({ key: p.sourceId + "n", id: p.sourceId, date: null, kind: "next", text: p.nextStep });
    }
    for (const o of data.opportunities) {
      const p = getProgress(o.id);
      const deadline = parseDeadline(o.deadline);
      if (!deadline || isClosed(o) || p.stage === "archived" || ["applied", "interview", "offer"].includes(p.stage)) continue;
      const days = dayDiff(deadline);
      if (days >= -1 && days <= 45) items.push({ key: o.id + "d", id: o.id, date: deadline, kind: "deadline", text: "Application deadline" });
    }
    return items.sort((a, b) => (a.date?.getTime() ?? Infinity) - (b.date?.getTime() ?? Infinity)).slice(0, 7);
  }, [data, getProgress, roleById]);

  const picks = useMemo(
    () => open.filter((o) => !getProgress(o.id).saved).sort((a, b) => fitScore(b) - fitScore(a)).slice(0, 3),
    [open, getProgress],
  );
  const activity = useMemo(
    () =>
      data.progress
        .flatMap((p) => (p.history ?? []).map((h) => ({ ...h, id: p.sourceId })))
        .filter((h) => roleById(h.id))
        .sort((a, b) => b.at - a.at)
        .slice(0, 6),
    [data, roleById],
  );
  const funnel = stages.filter((s) => s.value !== "archived").map((s) => ({
    ...s,
    count: s.value === "exploring" ? saved.filter((p) => p.stage === "exploring").length : data.progress.filter((p) => p.stage === s.value).length,
  }));
  const reached = (stage: Stage) => {
    const order = stages.map((s) => s.value);
    return data.progress.filter((p) => p.saved || p.stage !== "exploring").filter((p) => p.stage !== "archived" && order.indexOf(p.stage) >= order.indexOf(stage)).length;
  };
  const maxFunnel = Math.max(1, reached("exploring"));
  const mix = regions.map((r) => ({ region: r, count: open.filter((o) => region(o) === r).length }));
  const maxMix = Math.max(1, ...mix.map((m) => m.count));
  const overdue = agenda.filter((a) => a.date && dayDiff(a.date) < 0).length;
  const latest = data.reports[0];

  const summary = [
    fresh.length ? `${fresh.length} new ${fresh.length === 1 ? "role" : "roles"} since your last visit` : "No new roles since your last visit",
    agenda.length ? `${agenda.length} ${agenda.length === 1 ? "thing" : "things"} on your agenda` : "a clear agenda",
  ].join(" · ");

  return (
    <div className="view today">
      <PageHeading
        eyebrow={new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }).toUpperCase()}
        title={<>{greeting()}, <em>Mohamed.</em></>}
        lead={summary + "."}
      />
      <div className="kpi-row">
        <button className="kpi" onClick={() => navigate("discover")}>
          <span className="kpi-icon"><Compass size={18} /></span>
          <strong>{open.length}</strong>
          <span>open roles tracked</span>
        </button>
        <button className="kpi accent" onClick={() => { setFilters({ sort: "newest" }); navigate("discover"); }}>
          <span className="kpi-icon"><Sparkle size={18} /></span>
          <strong>{fresh.length}</strong>
          <span>new since last visit</span>
        </button>
        <button className="kpi" onClick={() => navigate("saved")}>
          <span className="kpi-icon"><BookmarkSimple size={18} /></span>
          <strong>{saved.length}</strong>
          <span>on your shortlist</span>
        </button>
        <button className="kpi" onClick={() => navigate("pipeline")}>
          <span className="kpi-icon"><Kanban size={18} /></span>
          <strong>{active.length}</strong>
          <span>applications in motion</span>
        </button>
      </div>

      <div className="today-grid">
        <div className="stack">
          <section className="card agenda">
            <header className="card-head">
              <h2><CalendarCheck size={19} /> Up next</h2>
              {overdue > 0 && <Pill tone="closed">{overdue} overdue</Pill>}
            </header>
            {agenda.length ? (
              <ol>
                {agenda.map((item) => {
                  const o = roleById(item.id)!;
                  const days = item.date ? dayDiff(item.date) : null;
                  return (
                    <li key={item.key}>
                      <button onClick={() => openRole(item.id)}>
                        <span className={`agenda-date ${days !== null && days < 0 ? "overdue" : days !== null && days <= 3 ? "soon" : ""}`}>
                          {item.date ? (
                            <>
                              <b>{item.date.getDate()}</b>
                              <small>{item.date.toLocaleDateString("en-GB", { month: "short" })}</small>
                            </>
                          ) : (
                            <Flag size={18} />
                          )}
                        </span>
                        <span className="agenda-text">
                          <strong>{item.text}</strong>
                          <small>{o.company} · {shortTitle(o)}</small>
                        </span>
                        <span className="agenda-meta">
                          {item.kind === "deadline" ? <Pill tone="amber">Deadline</Pill> : item.kind === "follow-up" ? <Pill tone="blue"><BellRinging size={11} /> Follow-up</Pill> : <Pill>Next step</Pill>}
                          {item.date && <small>{relativeDay(item.date)}</small>}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <div className="soft-empty">
                <CalendarCheck size={28} />
                <p>Nothing scheduled. Open a role and set a next step or a follow-up date to see it here.</p>
              </div>
            )}
          </section>

          <section className="card">
            <header className="card-head">
              <h2><Lightning size={19} /> Top picks you haven’t saved</h2>
              <button className="text-button" onClick={() => navigate("discover")}>See all <ArrowRight size={14} /></button>
            </header>
            <div className="pick-grid">
              {picks.map((o) => (
                <article key={o.id} className="pick">
                  <div className="pick-top">
                    <CompanyMark name={o.company} size="sm" />
                    <ScoreRing role={o} size={38} />
                  </div>
                  <button className="pick-main" onClick={() => openRole(o.id, picks.map((x) => x.id))}>
                    <small>{o.company}</small>
                    <strong>{shortTitle(o)}</strong>
                    <span>{o.location}</span>
                  </button>
                  <button className="quiet-button small" disabled={offline} onClick={() => void update({ ...getProgress(o.id), saved: true }, { undo: `Saved ${o.company} to your shortlist.` })}>
                    <BookmarkSimple size={15} /> Save
                  </button>
                </article>
              ))}
              {!picks.length && <p className="muted">You’ve saved every open role. Impressive.</p>}
            </div>
          </section>

          <section className="card">
            <header className="card-head"><h2>Recent activity</h2></header>
            {activity.length ? (
              <ul className="timeline">
                {activity.map((a) => {
                  const o = roleById(a.id)!;
                  return (
                    <li key={a.id + a.at}>
                      <StageDot stage={a.stage} />
                      <button onClick={() => openRole(a.id)}>
                        Moved <strong>{o.company}</strong> to <strong>{stageLabel(a.stage)}</strong>
                      </button>
                      <time>{relativeTime(a.at)}</time>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="muted">Stage changes will appear here as you move roles through your pipeline.</p>
            )}
          </section>
        </div>

        <aside className="stack">
          <section className="card">
            <header className="card-head">
              <h2>Your funnel</h2>
              <button className="text-button" onClick={() => navigate("pipeline")}>Pipeline <ArrowRight size={14} /></button>
            </header>
            <div className="funnel">
              {funnel.map((s) => (
                <div key={s.value} className="funnel-row">
                  <span className="funnel-label"><StageDot stage={s.value} />{s.label}</span>
                  <span className="funnel-bar"><span className={`fill ${s.value}`} style={{ width: `${(reached(s.value) / maxFunnel) * 100}%` }} /></span>
                  <b>{s.count}</b>
                </div>
              ))}
            </div>
            <p className="caption">Bars show how many roles reached each stage; numbers show where they are now.</p>
          </section>

          <section className="card">
            <header className="card-head"><h2>Where the open roles are</h2></header>
            <div className="bars">
              {mix.map((m) => (
                <button key={m.region} className="bar-row" onClick={() => { setFilters({ geo: m.region, watch: false }); navigate("discover"); }}>
                  <span>{m.region}</span>
                  <span className="bar"><span style={{ width: `${(m.count / maxMix) * 100}%` }} /></span>
                  <b>{m.count}</b>
                </button>
              ))}
            </div>
          </section>

          {latest && (
            <section className="card notes-feature">
              <div className="notes-kicker"><FileText size={16} /> FIELD NOTES · {friendlyDate(latest.date)}</div>
              <h2>A clearer picture, every morning.</h2>
              <p>{latest.summary.replace(/^[-*]\s+/gm, "").slice(0, 190)}{latest.summary.length > 190 ? "…" : ""}</p>
              <button className="text-button" onClick={() => navigate("reports")}>Read the reports <ArrowRight size={14} /></button>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
