"use client";
import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Archive, ArrowSquareOut, BookmarkSimple, CaretLeft, CaretRight, Check, CheckCircle, Circle, CloudCheck, CloudSlash, Columns, Compass, LinkSimple, SpinnerGap, X } from "@phosphor-icons/react";
import { useWorkspace } from "./context";
import { CompanyMark, Meter, Pill, ScoreRing, Stars } from "./ui";
import { dayDiff, localISO, parseDeadline, parseISODate, relativeDay, relativeTime, shortTitle, skills, stageLabel, statusTone, taskProgress } from "@/lib/insights";
import { checklist, stages, type Stage } from "@/lib/types";

const flow = stages.filter((s) => s.value !== "archived");

export function RoleDetail({ id, list, onMove }: { id: string; list: string[]; onMove: (id: string) => void }) {
  const { roleById, getProgress, update, offline, compare, toggleCompare, notify } = useWorkspace();
  const o = roleById(id)!;
  const p = getProgress(id);
  const [notes, setNotes] = useState(p.notes);
  const [nextStep, setNextStep] = useState(p.nextStep ?? "");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const latest = useRef(p);
  const draft = useRef({ notes, nextStep });
  useEffect(() => {
    latest.current = p;
    draft.current = { notes, nextStep };
  });

  // Autosave notes and next step shortly after typing stops.
  useEffect(() => {
    if (notes === latest.current.notes && nextStep === (latest.current.nextStep ?? "")) return;
    const timer = setTimeout(async () => {
      setSaveState("saving");
      setSaveState((await update({ ...latest.current, notes, nextStep })) ? "saved" : "error");
    }, 900);
    return () => clearTimeout(timer);
  }, [notes, nextStep, update]);
  // Flush unsaved text when the sheet closes or moves to another role.
  useEffect(() => () => {
    const d = draft.current, current = latest.current;
    if (d.notes !== current.notes || d.nextStep !== (current.nextStep ?? "")) void update({ ...current, notes: d.notes, nextStep: d.nextStep });
  }, [update]);

  const index = list.indexOf(id);
  const prev = index > 0 ? list[index - 1] : null;
  const next = index >= 0 && index < list.length - 1 ? list[index + 1] : null;
  const tasks = taskProgress(p);
  const stageIndex = flow.findIndex((s) => s.value === p.stage);
  const deadline = parseDeadline(o.deadline);
  const due = parseISODate(p.followUp);
  const comparing = compare.includes(id);
  const locked = offline;

  const setStage = (stage: Stage) => void update({ ...p, stage, saved: true, notes, nextStep }, { undo: `Moved to ${stageLabel(stage)}.` });
  const toggleTask = (task: string) => {
    const done = p.tasks ?? [];
    void update({ ...p, notes, nextStep, tasks: done.includes(task) ? done.filter((t) => t !== task) : [...done, task] });
  };
  const setFollowUp = (value: string) => void update({ ...p, notes, nextStep, followUp: value });
  const inDays = (n: number) => localISO(new Date(Date.now() + n * 86400000));

  return (
    <div
      className="detail"
      onKeyDown={(e) => {
        const typing = e.target instanceof HTMLElement && ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName);
        if (typing || e.metaKey || e.ctrlKey) return;
        if (e.key === "ArrowLeft" && prev) onMove(prev);
        if (e.key === "ArrowRight" && next) onMove(next);
      }}
    >
      <div className="detail-top">
        <CompanyMark name={o.company} />
        <div className="detail-company">
          <strong>{o.company}</strong>
          <small>{o.location}</small>
        </div>
        <div className="detail-nav">
          {list.length > 1 && index >= 0 && <span className="muted">{index + 1} / {list.length}</span>}
          <button className="icon-button" disabled={!prev} onClick={() => prev && onMove(prev)} aria-label="Previous role"><CaretLeft size={18} /></button>
          <button className="icon-button" disabled={!next} onClick={() => next && onMove(next)} aria-label="Next role"><CaretRight size={18} /></button>
          <Dialog.Close className="icon-button" aria-label="Close opportunity"><X size={20} /></Dialog.Close>
        </div>
      </div>

      <div className="detail-scroll">
        <div className="detail-hero">
          <div>
            <Pill tone={statusTone(o)}>{o.status}</Pill>
            <Dialog.Title>{o.role !== shortTitle(o) ? shortTitle(o) : o.role}</Dialog.Title>
            {o.role !== shortTitle(o) && <p className="muted">{o.role}</p>}
            <div className="tags">{skills(o).map((s) => <span key={s}>{s}</span>)}</div>
          </div>
          <ScoreRing role={o} size={64} />
        </div>
        <Dialog.Description className="lede">{o.work_and_requirements}</Dialog.Description>

        <dl className="facts-grid">
          {[
            ["Start", o.start],
            ["Duration", o.duration],
            ["Compensation", o.compensation || "Not stated"],
            ["Deadline", deadline ? `${o.deadline} · ${relativeDay(deadline)}` : o.deadline || "Not stated"],
          ].map(([label, value]) => (
            <div key={label} className={label === "Deadline" && deadline && dayDiff(deadline) <= 7 && dayDiff(deadline) >= 0 ? "urgent" : ""}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>

        <section className="tracker" aria-label="Your application">
          <header>
            <h3>Your application</h3>
            <span className={`save-state ${saveState}`} aria-live="polite">
              {locked ? <><CloudSlash size={14} />Offline — read only</> : saveState === "saving" ? <><SpinnerGap size={14} className="spinning" />Saving</> : saveState === "saved" ? <><CloudCheck size={14} />Saved</> : saveState === "error" ? "Not saved" : p.updatedAt ? `Updated ${relativeTime(p.updatedAt)}` : ""}
            </span>
          </header>
          <ol className="stepper" aria-label="Application stage">
            {flow.map((s, i) => (
              <li key={s.value} className={`${p.stage === s.value ? "current" : ""} ${stageIndex >= 0 && i < stageIndex ? "done" : ""}`}>
                <button disabled={locked} onClick={() => setStage(s.value)} aria-current={p.stage === s.value ? "step" : undefined}>
                  <span className="step-mark">{stageIndex >= 0 && i < stageIndex ? <Check size={12} weight="bold" /> : i + 1}</span>
                  <span>{s.label}</span>
                </button>
              </li>
            ))}
          </ol>
          <div className="tracker-row">
            <div className="field">
              <span>Priority</span>
              <Stars value={p.priority ?? 0} disabled={locked} onChange={(n) => void update({ ...p, notes, nextStep, priority: n })} />
            </div>
            <button className={`text-button ${p.stage === "archived" ? "on" : ""}`} disabled={locked} onClick={() => setStage(p.stage === "archived" ? "exploring" : "archived")}>
              <Archive size={15} />{p.stage === "archived" ? "Restore" : "Archive"}
            </button>
          </div>
          <div className="tracker-grid">
            <label className="field">
              <span>Next step</span>
              <input value={nextStep} maxLength={280} disabled={locked} placeholder="e.g. Ask Sami for a referral" onChange={(e) => setNextStep(e.target.value)} />
            </label>
            <div className="field">
              <span>Follow-up {due && <em className={dayDiff(due) < 0 ? "overdue" : ""}>· {relativeDay(due)}</em>}</span>
              <div className="date-row">
                <input type="date" value={p.followUp ?? ""} disabled={locked} onChange={(e) => setFollowUp(e.target.value)} aria-label="Follow-up date" />
                <button className="chip" disabled={locked} onClick={() => setFollowUp(inDays(3))}>+3d</button>
                <button className="chip" disabled={locked} onClick={() => setFollowUp(inDays(7))}>+1w</button>
                {p.followUp && <button className="chip" disabled={locked} onClick={() => setFollowUp("")} aria-label="Clear follow-up"><X size={12} /></button>}
              </div>
            </div>
          </div>
          <div className="checklist">
            <div className="checklist-head"><span>Checklist</span><small>{tasks.done}/{tasks.total}</small></div>
            <Meter value={tasks.ratio} label="Checklist progress" />
            <ul>
              {checklist.map((c) => {
                const done = (p.tasks ?? []).includes(c.id);
                return (
                  <li key={c.id}>
                    <button role="checkbox" aria-checked={done} disabled={locked} className={done ? "done" : ""} onClick={() => toggleTask(c.id)}>
                      {done ? <CheckCircle size={19} weight="fill" /> : <Circle size={19} />}
                      <span>{c.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          <label className="field">
            <span>Notes</span>
            <textarea rows={4} maxLength={10000} disabled={locked} placeholder="Questions to ask, ideas for your application…" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
        </section>

        <section className="detail-section">
          <h3>Where & how you’ll work</h3>
          <p>{o.remote || "Not stated"}</p>
          <h3>Sponsorship & agreements</h3>
          <p>{o.sponsorship || "Not stated"}</p>
        </section>
        {o.gaps && (
          <section className="evidence-box">
            <h3><Compass size={18} />What to confirm</h3>
            <p>{o.gaps}</p>
          </section>
        )}
        {o.portfolio && (
          <section className="detail-section">
            <h3>Your portfolio angle</h3>
            <p>{o.portfolio}</p>
          </section>
        )}
        <section className="source-details">
          <strong>Evidence & freshness</strong>
          <p>{o.evidence}</p>
          <small>First seen {o.first_seen} · Last checked {o.last_checked} · {o.id}</small>
          {o.additional_source && (
            <a href={o.additional_source} target="_blank" rel="noreferrer">Additional source<ArrowSquareOut size={12} /></a>
          )}
        </section>
      </div>

      <div className="detail-actions">
        <button className={`quiet-button ${p.saved ? "is-saved" : ""}`} disabled={locked} onClick={() => void update({ ...p, notes, nextStep, saved: !p.saved })}>
          <BookmarkSimple weight={p.saved ? "fill" : "regular"} size={18} />{p.saved ? "Saved" : "Save"}
        </button>
        <button className={`icon-button bordered ${comparing ? "on" : ""}`} aria-pressed={comparing} onClick={() => toggleCompare(id)} aria-label="Toggle comparison" title="Compare">
          <Columns size={18} weight={comparing ? "fill" : "regular"} />
        </button>
        <button
          className="icon-button bordered"
          aria-label="Copy link to this role"
          title="Copy link"
          onClick={() => {
            navigator.clipboard?.writeText(`${location.origin}/?role=${id}`).then(() => notify("Link copied."), () => notify("Could not copy the link."));
          }}
        >
          <LinkSimple size={18} />
        </button>
        {o.url && (
          <a className="primary-button" href={o.url} target="_blank" rel="noreferrer">View listing<ArrowSquareOut size={17} /></a>
        )}
      </div>
    </div>
  );
}
