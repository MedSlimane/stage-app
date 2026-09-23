"use client";
import { useState } from "react";
import { Archive, ArrowRight, BellRinging, CaretRight, CheckSquare, Plus } from "@phosphor-icons/react";
import { useWorkspace } from "./context";
import { CompanyMark, Meter, PageHeading, StageDot, Stars } from "./ui";
import { dayDiff, parseISODate, relativeDay, relativeTime, shortTitle, stageSince, taskProgress } from "@/lib/insights";
import { stages, type Opportunity, type Stage } from "@/lib/types";

const flow = stages.filter((s) => s.value !== "archived");

export function Pipeline() {
  const { data, getProgress, update, openRole, navigate, offline } = useWorkspace();
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<Stage | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const inStage = (stage: Stage) =>
    data.opportunities
      .filter((o) => {
        const p = getProgress(o.id);
        return p.stage === stage && (stage !== "exploring" || p.saved);
      })
      .sort((a, b) => (getProgress(b.id).priority ?? 0) - (getProgress(a.id).priority ?? 0) || (stageSince(getProgress(a.id)) ?? 0) - (stageSince(getProgress(b.id)) ?? 0));
  const active = data.progress.filter((p) => !["exploring", "archived"].includes(p.stage)).length;
  const applied = data.progress.filter((p) => ["applied", "interview", "offer"].includes(p.stage) || (p.history ?? []).some((h) => h.stage === "applied")).length;
  const interviews = data.progress.filter((p) => ["interview", "offer"].includes(p.stage) || (p.history ?? []).some((h) => h.stage === "interview")).length;
  const archived = inStage("archived");

  function move(id: string, stage: Stage) {
    const p = getProgress(id);
    if (p.stage === stage) return;
    const o = data.opportunities.find((x) => x.id === id);
    void update({ ...p, stage, saved: true }, { undo: `Moved ${o?.company ?? id} to ${stages.find((s) => s.value === stage)?.label}.` });
  }

  const card = (o: Opportunity, stage: Stage) => {
    const p = getProgress(o.id);
    const tasks = taskProgress(p);
    const due = parseISODate(p.followUp);
    const days = due ? dayDiff(due) : null;
    const since = stageSince(p);
    const next = flow[flow.findIndex((s) => s.value === stage) + 1];
    return (
      <article
        key={o.id}
        className={`deal ${dragging === o.id ? "dragging" : ""}`}
        draggable={!offline}
        onDragStart={(e) => { e.dataTransfer.setData("text/plain", o.id); e.dataTransfer.effectAllowed = "move"; setDragging(o.id); }}
        onDragEnd={() => { setDragging(null); setOver(null); }}
      >
        <button className="deal-main" onClick={() => openRole(o.id, inStage(stage).map((x) => x.id))}>
          <span className="deal-head">
            <CompanyMark name={o.company} size="sm" />
            <span>
              <small>{o.company}</small>
              <Stars value={p.priority ?? 0} />
            </span>
          </span>
          <strong>{shortTitle(o)}</strong>
          {p.nextStep && <span className="deal-next">→ {p.nextStep}</span>}
          <span className="deal-meta">
            <span className="deal-tasks" title={`${tasks.done} of ${tasks.total} checklist items`}><CheckSquare size={13} />{tasks.done}/{tasks.total}</span>
            <Meter value={tasks.ratio} label="Checklist progress" />
          </span>
          <span className="deal-foot">
            {due && days !== null ? (
              <span className={`due ${days < 0 ? "overdue" : days <= 2 ? "soon" : ""}`}><BellRinging size={12} />{relativeDay(due)}</span>
            ) : <span />}
            {since && <time>{relativeTime(since)}</time>}
          </span>
        </button>
        {next && (
          <button className="advance" disabled={offline} onClick={() => move(o.id, next.value)} aria-label={`Move ${o.company} to ${next.label}`} title={`Move to ${next.label}`}>
            {next.label}<CaretRight size={13} />
          </button>
        )}
      </article>
    );
  };

  return (
    <div className="view pipeline">
      <PageHeading eyebrow="SMALL STEPS, REAL PROGRESS" title={<>Your <em>next moves.</em></>} lead="Drag roles between stages, or use the arrow on each card. Stage changes are logged to your activity.">
        <button className="quiet-button" onClick={() => navigate("discover")}><Plus size={16} />Add from Discover</button>
      </PageHeading>
      <div className="pipeline-stats">
        <div><strong>{active}</strong><span>in motion</span></div>
        <div><strong>{applied}</strong><span>applied so far</span></div>
        <div><strong>{interviews}</strong><span>reached interview</span></div>
        <div><strong>{applied ? Math.round((interviews / applied) * 100) : 0}%</strong><span>interview rate</span></div>
      </div>
      <div className="board">
        {flow.map((s) => {
          const roles = inStage(s.value);
          return (
            <section
              key={s.value}
              className={`lane ${over === s.value ? "over" : ""}`}
              aria-label={s.label}
              onDragOver={(e) => { if (dragging) { e.preventDefault(); setOver(s.value); } }}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(null); }}
              onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData("text/plain"); if (id) move(id, s.value); setOver(null); setDragging(null); }}
            >
              <header>
                <StageDot stage={s.value} />
                <h2>{s.label}</h2>
                <b>{roles.length}</b>
              </header>
              <p className="lane-hint">{s.hint}</p>
              <div className="lane-cards">
                {roles.map((o) => card(o, s.value))}
                {!roles.length && <div className="lane-empty">{s.value === "exploring" ? "Saved roles start here." : "Drop a role here."}</div>}
              </div>
            </section>
          );
        })}
      </div>
      <section className="archived">
        <button className="text-button" onClick={() => setShowArchived(!showArchived)} aria-expanded={showArchived}>
          <Archive size={16} />{showArchived ? "Hide" : "Show"} archived ({archived.length})
        </button>
        {showArchived && (
          <div
            className={`archive-drop ${over === "archived" ? "over" : ""}`}
            onDragOver={(e) => { if (dragging) { e.preventDefault(); setOver("archived"); } }}
            onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData("text/plain"); if (id) move(id, "archived"); setOver(null); }}
          >
            {archived.map((o) => card(o, "archived"))}
            {!archived.length && <p className="muted">Drag a card here to archive it.</p>}
          </div>
        )}
      </section>
      {!active && !inStage("exploring").length && (
        <div className="empty-state">
          <h2>Your board is ready.</h2>
          <p>Save a role in Discover and it lands in Exploring. Move it along as your application progresses.</p>
          <button className="primary-button" onClick={() => navigate("discover")}>Find opportunities <ArrowRight size={16} /></button>
        </div>
      )}
    </div>
  );
}
