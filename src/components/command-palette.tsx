"use client";
import { useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowClockwise, BookmarkSimple, Briefcase, CalendarPlus, Compass, FileText, Keyboard, Kanban, MagnifyingGlass, Moon, Student, Sun, SunHorizon, Table } from "@phosphor-icons/react";
import { useWorkspace, type View } from "./context";
import { CompanyMark } from "./ui";
import { shortTitle } from "@/lib/insights";

type Command = { id: string; group: string; label: string; hint?: string; icon: React.ReactNode; run: () => void; keywords?: string };

export function CommandPalette({ open, onOpenChange, refresh }: { open: boolean; onOpenChange: (open: boolean) => void; refresh: () => void }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="palette" aria-describedby={undefined}>
          <Dialog.Title className="sr-only">Command menu</Dialog.Title>
          {open && <Palette close={() => onOpenChange(false)} refresh={refresh} />}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Palette({ close, refresh }: { close: () => void; refresh: () => void }) {
  const ws = useWorkspace();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const commands = useMemo<Command[]>(() => {
    const go = (view: View, label: string, icon: React.ReactNode, hint: string): Command => ({ id: "go-" + view, group: "Go to", label, hint, icon, run: () => ws.navigate(view) });
    const base: Command[] = [
      go("today", "Today", <SunHorizon size={18} />, "g t"),
      go("discover", "Discover", <Compass size={18} />, "g d"),
      go("saved", "Saved", <BookmarkSimple size={18} />, "g s"),
      go("pipeline", "Pipeline", <Kanban size={18} />, "g p"),
      go("reports", "Field notes", <FileText size={18} />, "g r"),
      go("profile", "Profile & settings", <Student size={18} />, "g m"),
      { id: "theme", group: "Actions", label: ws.theme === "dark" ? "Switch to light theme" : "Switch to dark theme", icon: ws.theme === "dark" ? <Sun size={18} /> : <Moon size={18} />, run: () => ws.setTheme(ws.theme === "dark" ? "light" : "dark"), keywords: "appearance mode" },
      { id: "refresh", group: "Actions", label: "Sync workspace", icon: <ArrowClockwise size={18} />, run: refresh, keywords: "refresh reload" },
      { id: "csv", group: "Actions", label: "Export tracker as CSV", icon: <Table size={18} />, run: ws.exportCSV, keywords: "download spreadsheet excel" },
      { id: "ics", group: "Actions", label: "Export follow-ups to calendar", icon: <CalendarPlus size={18} />, run: ws.exportCalendar, keywords: "ics download deadlines" },
      { id: "keys", group: "Actions", label: "Keyboard shortcuts", icon: <Keyboard size={18} />, run: ws.showShortcuts, hint: "?" },
    ];
    const roles: Command[] = ws.data.opportunities.map((o) => ({
      id: o.id,
      group: "Opportunities",
      label: `${shortTitle(o)} — ${o.company}`,
      hint: o.location,
      icon: <CompanyMark name={o.company} size="sm" />,
      run: () => ws.openRole(o.id),
      keywords: [o.role, o.location, o.id, o.work_and_requirements].join(" "),
    }));
    return [...base, ...roles];
  }, [ws, refresh]);

  const results = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const matches = commands.filter((c) => terms.every((t) => (c.label + " " + (c.keywords ?? "") + " " + c.group).toLowerCase().includes(t)));
    return terms.length ? matches.slice(0, 40) : matches.filter((c) => c.group !== "Opportunities").concat(matches.filter((c) => c.group === "Opportunities").slice(0, 5));
  }, [commands, query]);
  const selected = Math.min(active, Math.max(0, results.length - 1));

  function run(c: Command) {
    close();
    // Let the palette close before opening another dialog.
    setTimeout(c.run, 0);
  }

  let lastGroup = "";
  return (
    <>
      <div className="palette-input">
        <MagnifyingGlass size={20} />
        <input
          autoFocus
          placeholder="Search roles, jump to a view, run an action…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setActive(0); }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setActive((selected + 1) % Math.max(1, results.length)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setActive((selected - 1 + results.length) % Math.max(1, results.length)); }
            if (e.key === "Enter" && results[selected]) { e.preventDefault(); run(results[selected]); }
          }}
          aria-label="Command"
          aria-controls="palette-results"
          aria-activedescendant={results[selected] ? "cmd-" + results[selected].id : undefined}
          role="combobox"
          aria-expanded="true"
        />
        <kbd>esc</kbd>
      </div>
      <ul className="palette-results" id="palette-results" role="listbox">
        {results.map((c, i) => {
          const heading = c.group !== lastGroup ? c.group : null;
          lastGroup = c.group;
          return (
            <li key={c.id} role="presentation">
              {heading && <div className="palette-group">{heading}</div>}
              <button id={"cmd-" + c.id} role="option" aria-selected={i === selected} className={i === selected ? "active" : ""} onMouseMove={() => setActive(i)} onClick={() => run(c)}>
                <span className="palette-icon">{c.icon}</span>
                <span className="palette-label">{c.label}</span>
                {c.hint && <span className="palette-hint">{c.hint}</span>}
              </button>
            </li>
          );
        })}
        {!results.length && <li className="palette-empty"><Briefcase size={22} />Nothing matches “{query}”.</li>}
      </ul>
    </>
  );
}
