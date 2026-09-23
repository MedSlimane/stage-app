"use client";
import { useMemo, useState } from "react";
import { ArrowSquareOut, Clock, FilePdf, MagnifyingGlass } from "@phosphor-icons/react";
import { useWorkspace } from "./context";
import { PageHeading, Pill } from "./ui";
import { friendlyDate } from "@/lib/types";

/** Renders the plain-text summary with paragraph and bullet support. */
function Summary({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="summary">
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        return lines.every((l) => /^\s*[-*]\s+/.test(l)) ? (
          <ul key={i}>{lines.map((l, j) => <li key={j}>{l.replace(/^\s*[-*]\s+/, "").replace(/\*\*/g, "")}</li>)}</ul>
        ) : (
          <p key={i}>{block.replace(/\*\*/g, "").replace(/^#+\s*/gm, "")}</p>
        );
      })}
    </div>
  );
}

export function Reports() {
  const { data } = useWorkspace();
  const [query, setQuery] = useState("");
  const reports = useMemo(() => data.reports.filter((r) => (r.date + " " + r.summary).toLowerCase().includes(query.toLowerCase())), [data, query]);
  const months = useMemo(() => {
    const groups = new Map<string, typeof reports>();
    for (const r of reports) {
      const key = new Date(r.date + "T12:00:00").toLocaleDateString("en-GB", { month: "long", year: "numeric" });
      groups.set(key, [...(groups.get(key) ?? []), r]);
    }
    return [...groups];
  }, [reports]);

  return (
    <div className="view reports">
      <PageHeading eyebrow="A LITTLE MORE CLARITY" title={<>Your <em>field notes.</em></>} lead="Daily research, verified sources and what changed.">
        <span className="schedule-badge"><Clock size={16} />Daily · 09:00 Tunis</span>
      </PageHeading>
      <label className="search-input compact">
        <MagnifyingGlass size={18} />
        <input placeholder="Search reports…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search reports" />
      </label>
      <div className="report-timeline">
        {months.map(([month, list]) => (
          <section key={month}>
            <h2 className="month">{month}</h2>
            {list.map((report) => {
              const latest = report.date === data.reports[0]?.date;
              return (
                <article key={report.date} className={`report ${latest ? "latest" : ""}`}>
                  <div className="report-rail">
                    <b>{new Date(report.date + "T12:00:00").getDate()}</b>
                    <small>{new Date(report.date + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short" })}</small>
                  </div>
                  <div className="report-body">
                    <div className="report-date">{friendlyDate(report.date)}{latest && <Pill tone="green">Latest</Pill>}</div>
                    <Summary text={report.summary} />
                    <a className="quiet-button small" href={`/api/reports/${report.date}`} target="_blank" rel="noreferrer">
                      <FilePdf size={16} />Open PDF<ArrowSquareOut size={14} />
                    </a>
                  </div>
                </article>
              );
            })}
          </section>
        ))}
        {!reports.length && <p className="muted">No reports match “{query}”.</p>}
      </div>
      <p className="footnote">Reports you’ve opened stay available offline on this device. Original PDFs remain saved on your Mac.</p>
    </div>
  );
}
