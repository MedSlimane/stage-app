"use client";
import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, X } from "@phosphor-icons/react";
import { useWorkspace } from "./context";
import { regions } from "@/lib/types";

function Sheet({ open, onOpenChange, title, description, className = "", children }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; description: string; className?: string; children: React.ReactNode }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className={`dialog-content ${className}`}>
          <div className="dialog-heading">
            <Dialog.Title>{title}</Dialog.Title>
            <Dialog.Close className="icon-button" aria-label="Close"><X size={20} /></Dialog.Close>
          </div>
          <Dialog.Description>{description}</Dialog.Description>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function FiltersDialog({ open, onOpenChange, count }: { open: boolean; onOpenChange: (open: boolean) => void; count: number }) {
  const { filters: f, setFilters } = useWorkspace();
  const check = (key: "remote" | "timing" | "watch", title: string, hint: string) => (
    <label className="check-row">
      <input type="checkbox" checked={f[key]} onChange={(e) => setFilters({ [key]: e.target.checked })} />
      <span><strong>{title}</strong><small>{hint}</small></span>
    </label>
  );
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Make it your search." description="Filter by location, flexibility and confirmed timing." className="filter-dialog">
      <div className="field">
        <span>Location</span>
        <div className="segmented wrap" role="radiogroup" aria-label="Location">
          {["All", ...regions].map((g) => (
            <button key={g} role="radio" aria-checked={f.geo === g} onClick={() => setFilters({ geo: g })}>{g}</button>
          ))}
        </div>
      </div>
      {check("remote", "Remote-friendly", "Includes hybrid; check geographic restrictions.")}
      {check("timing", "Timing matches only", "Compatible dates; eligibility may still be open.")}
      {check("watch", "Closed-role watchlist", "Past roles worth watching for a new intake.")}
      <div className="dialog-actions">
        <button className="quiet-button" onClick={() => setFilters({ geo: "All", remote: false, timing: false, watch: false, skill: "" })}>Reset filters</button>
        <Dialog.Close className="primary-button">Show {count} results<ArrowRight size={17} /></Dialog.Close>
      </div>
    </Sheet>
  );
}

export function InstallDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Stage, a tap away." description="Add this workspace to your home screen.">
      <div className="install-step"><span>1</span><p><strong>iPhone or iPad</strong><br />Open in Safari, tap Share, then “Add to Home Screen”.</p></div>
      <div className="install-step"><span>2</span><p><strong>Android or desktop</strong><br />Open your browser menu and choose “Install app” or “Add to Home screen”.</p></div>
      <p className="footnote">Installation requires HTTPS, or localhost on this Mac. Offline browsing becomes available after your first online visit.</p>
    </Sheet>
  );
}

const shortcuts: [string[], string][] = [
  [["⌘", "K"], "Open the command menu"],
  [["/"], "Search opportunities"],
  [["j"], "Next role in the list"],
  [["k"], "Previous role in the list"],
  [["↵"], "Open the highlighted role"],
  [["s"], "Save or unsave the highlighted role"],
  [["c"], "Add the highlighted role to comparison"],
  [["←", "→"], "Previous or next role in the detail sheet"],
  [["g", "t"], "Go to Today"],
  [["g", "d"], "Go to Discover"],
  [["g", "s"], "Go to Saved"],
  [["g", "p"], "Go to Pipeline"],
  [["g", "r"], "Go to Field notes"],
  [["g", "m"], "Go to Profile"],
  [["?"], "Show this list"],
];
export function ShortcutsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Keyboard shortcuts." description="Everything is a few keys away.">
      <dl className="shortcut-list">
        {shortcuts.map(([keys, label]) => (
          <div key={label}>
            <dt>{keys.map((k) => <kbd key={k}>{k}</kbd>)}</dt>
            <dd>{label}</dd>
          </div>
        ))}
      </dl>
    </Sheet>
  );
}

/** A short confetti burst for offers. Renders nothing when reduced motion is preferred. */
export function Celebration({ burst }: { burst: number }) {
  const [pieces, setPieces] = useState<{ id: number; left: number; delay: number; hue: number; rotate: number; drift: number }[]>([]);
  useEffect(() => {
    if (!burst || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const start = setTimeout(() => setPieces(Array.from({ length: 70 }, (_, i) => ({ id: burst * 100 + i, left: Math.random() * 100, delay: Math.random() * 0.4, hue: [152, 38, 205, 265, 12][i % 5], rotate: Math.random() * 720 - 360, drift: Math.random() * 160 - 80 }))), 0);
    const end = setTimeout(() => setPieces([]), 2800);
    return () => { clearTimeout(start); clearTimeout(end); };
  }, [burst]);
  if (!pieces.length) return null;
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p) => (
        <span key={p.id} style={{ left: `${p.left}%`, animationDelay: `${p.delay}s`, background: `hsl(${p.hue} 70% 55%)`, ["--rotate" as string]: `${p.rotate}deg`, ["--drift" as string]: `${p.drift}px` }} />
      ))}
    </div>
  );
}
