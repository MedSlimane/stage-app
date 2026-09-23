"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowSquareOut, Columns, X } from "@phosphor-icons/react";
import { useWorkspace } from "./context";
import { CompanyMark, Pill, ScoreRing, Stars } from "./ui";
import { fitScore, parseDeadline, relativeDay, shortTitle, skills, stageLabel, statusLabel, statusTone } from "@/lib/insights";
import { hasRemote, region, type Opportunity } from "@/lib/types";

/** Floating tray listing the roles picked for comparison. */
export function CompareTray({ onOpen }: { onOpen: () => void }) {
  const { compare, roleById, toggleCompare } = useWorkspace();
  if (!compare.length) return null;
  return (
    <div className="compare-tray" role="region" aria-label="Comparison">
      <div className="tray-marks">
        {compare.map((id) => {
          const o = roleById(id);
          return o ? (
            <button key={id} onClick={() => toggleCompare(id)} aria-label={`Remove ${o.company} from comparison`} title={`Remove ${o.company}`}>
              <CompanyMark name={o.company} size="sm" /><X size={10} weight="bold" />
            </button>
          ) : null;
        })}
      </div>
      <span>{compare.length}/3 selected</span>
      <button className="primary-button small" disabled={compare.length < 2} onClick={onOpen}><Columns size={16} />Compare</button>
    </div>
  );
}

export function CompareDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { compare, roleById, getProgress, openRole, toggleCompare } = useWorkspace();
  const roles = compare.map(roleById).filter(Boolean) as Opportunity[];
  const scores = roles.map(fitScore);
  // Only crown a winner when the scores actually differ.
  const best = new Set(scores).size > 1 ? Math.max(...scores) : -1;
  const rows: [string, (o: Opportunity) => React.ReactNode][] = [
    ["Fit", (o) => <span className={`compare-fit ${fitScore(o) === best ? "best" : ""}`}><ScoreRing role={o} size={40} />{fitScore(o) === best && <Pill tone="green">Best fit</Pill>}</span>],
    ["Status", (o) => <Pill tone={statusTone(o)}>{statusLabel(o)}</Pill>],
    ["Location", (o) => <>{o.location}<small>{region(o)}{hasRemote(o) ? " · remote-friendly" : ""}</small></>],
    ["Start", (o) => o.start],
    ["Duration", (o) => o.duration],
    ["Deadline", (o) => { const d = parseDeadline(o.deadline); return <>{o.deadline || "Not stated"}{d && <small>{relativeDay(d)}</small>}</>; }],
    ["Compensation", (o) => o.compensation || "Not stated"],
    ["Skills", (o) => <span className="tags">{skills(o).map((s) => <span key={s}>{s}</span>)}</span>],
    ["Work arrangement", (o) => o.remote || "Not stated"],
    ["To confirm", (o) => o.gaps || "—"],
    ["Your stage", (o) => { const p = getProgress(o.id); return <span className="compare-stage">{stageLabel(p.stage)}<Stars value={p.priority ?? 0} /></span>; }],
  ];
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content compare-dialog">
          <div className="dialog-heading">
            <Dialog.Title>Side by side.</Dialog.Title>
            <Dialog.Close className="icon-button" aria-label="Close comparison"><X size={20} /></Dialog.Close>
          </div>
          <Dialog.Description>Compare timing, fit and the details that decide where you apply first.</Dialog.Description>
          <div className="compare-scroll">
            <table className="compare-table" style={{ ["--cols" as string]: roles.length }}>
              <thead>
                <tr>
                  <th scope="col"><span className="sr-only">Attribute</span></th>
                  {roles.map((o) => (
                    <th scope="col" key={o.id}>
                      <div className="compare-head">
                        <CompanyMark name={o.company} />
                        <button onClick={() => { onOpenChange(false); setTimeout(() => openRole(o.id, compare), 0); }}>
                          <small>{o.company}</small>
                          <strong>{shortTitle(o)}</strong>
                        </button>
                        <button className="icon-button" aria-label={`Remove ${o.company}`} onClick={() => toggleCompare(o.id)}><X size={14} /></button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(([label, render]) => (
                  <tr key={label}>
                    <th scope="row">{label}</th>
                    {roles.map((o) => <td key={o.id}>{render(o)}</td>)}
                  </tr>
                ))}
                <tr>
                  <th scope="row">Listing</th>
                  {roles.map((o) => <td key={o.id}>{o.url ? <a className="text-button" href={o.url} target="_blank" rel="noreferrer">Open<ArrowSquareOut size={14} /></a> : "—"}</td>)}
                </tr>
              </tbody>
            </table>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
