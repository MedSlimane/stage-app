"use client";
import { Star } from "@phosphor-icons/react";
import { fitScore, hue, initials } from "@/lib/insights";
import type { Opportunity, Stage } from "@/lib/types";

export function Pill({ children, tone = "neutral", title }: { children: React.ReactNode; tone?: string; title?: string }) {
  return <span className={`pill ${tone}`} title={title}>{children}</span>;
}

export function CompanyMark({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  return <span className={`company-mark ${hue(name)} ${size}`} aria-hidden="true">{initials(name)}</span>;
}

export function ScoreRing({ role, size = 44 }: { role: Opportunity; size?: number }) {
  const score = fitScore(role);
  const r = 16, c = 2 * Math.PI * r;
  const tone = score >= 80 ? "high" : score >= 60 ? "mid" : "low";
  return (
    <span className={`score-ring ${tone}`} style={{ width: size, height: size }} title={`Fit ${score}/100 — estimated from research fit, priority and timing`} aria-label={`Fit score ${score} out of 100`} role="img">
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="20" r={r} className="track" />
        <circle cx="20" cy="20" r={r} className="value" strokeDasharray={`${(score / 100) * c} ${c}`} />
      </svg>
      <b>{score}</b>
    </span>
  );
}

export function StageDot({ stage }: { stage: Stage }) {
  return <span className={`stage-dot ${stage}`} aria-hidden="true" />;
}

export function Stars({ value, onChange, disabled, size = 18 }: { value: number; onChange?: (n: number) => void; disabled?: boolean; size?: number }) {
  if (!onChange)
    return value ? (
      <span className="stars readonly" aria-label={`Priority ${value} of 3`}>
        {Array.from({ length: value }, (_, i) => <Star key={i} size={12} weight="fill" />)}
      </span>
    ) : null;
  return (
    <span className="stars" role="radiogroup" aria-label="Priority">
      {[1, 2, 3].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} of 3`} disabled={disabled} className={n <= value ? "on" : ""} onClick={() => onChange(value === n ? 0 : n)}>
          <Star size={size} weight={n <= value ? "fill" : "regular"} />
        </button>
      ))}
    </span>
  );
}

export function Meter({ value, label }: { value: number; label?: string }) {
  return (
    <span className="meter" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)} aria-label={label}>
      <span style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
    </span>
  );
}

export function PageHeading({ eyebrow, title, lead, children }: { eyebrow: string; title: React.ReactNode; lead?: string; children?: React.ReactNode }) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {lead && <p>{lead}</p>}
      </div>
      {children && <div className="page-actions">{children}</div>}
    </div>
  );
}
