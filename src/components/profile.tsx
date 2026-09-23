"use client";
import { CalendarPlus, Desktop, DownloadSimple, Keyboard, LockSimple, MapPin, Moon, Sun, Table } from "@phosphor-icons/react";
import { useWorkspace, type Theme } from "./context";
import { PageHeading, Pill } from "./ui";

const projects = [
  { name: "Aviary", tag: "Agent tooling", body: "Coding-agent control surface, MCP and skills. Credit the T3 Code foundation and explain your additions.", stack: "React · TypeScript · Electron · Expo" },
  { name: "SamOps", tag: "Cloud workflows", body: "Cloud signals, anomaly analysis and review workflows. Show your contribution to the shared system.", stack: "Next.js · Go · Python · Cloud" },
  { name: "Scribo", tag: "AI product", body: "Lecture capture, transcription and study tools, with mobile clients and a Workers backend.", stack: "SwiftUI · Kotlin · Hono" },
  { name: "Zennyt", tag: "Mobile delivery", body: "Flutter product with Spring Boot and Azure infrastructure. Recent decision-game UI and configuration work.", stack: "Flutter · Spring Boot · Azure" },
];
const themes: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Desktop },
];

export function Profile() {
  const { theme, setTheme, exportCSV, exportCalendar, showShortcuts, install, installed, lock } = useWorkspace();
  return (
    <div className="view profile">
      <PageHeading eyebrow="THE PERSON BEHIND THE SEARCH" title={<>Built <em>around you.</em></>} lead="Your direction, your strengths, your next step." />
      <div className="profile-grid">
        <section className="card profile-card">
          <span className="avatar large">MS</span>
          <h2>Mohamed Slimane</h2>
          <p>Computer science engineering · ESPRIT</p>
          <div className="profile-location"><MapPin size={16} />Tunisia · Expected graduation 2027</div>
          <hr />
          <h3>What you’re looking for</h3>
          <p>A six-month PFE starting between November 2026 and March 2027, building AI agents, workflows and web applications.</p>
          <p>On-site Tunisia stays high alongside international opportunities. Remote geography, sponsorship and eligibility are checked individually.</p>
          <div className="tags"><span>Arabic · Native</span><span>French · B2</span><span>English · B2</span></div>
          <p className="footnote">Graduation month and school agreement still need confirmation.</p>
        </section>

        <section className="portfolio">
          <h2>Your work tells the story.</h2>
          <p className="muted">Selected projects from your local repository inventory.</p>
          {projects.map((p, i) => (
            <article className="project" key={p.name}>
              <span className="project-number">0{i + 1}</span>
              <div>
                <div className="project-title"><h3>{p.name}</h3><Pill>{p.tag}</Pill></div>
                <p>{p.body}</p>
                <small>{p.stack}</small>
              </div>
            </article>
          ))}
        </section>

        <section className="card settings">
          <h2>Preferences</h2>
          <div className="setting">
            <div><strong>Appearance</strong><small>Match your device or pick a side.</small></div>
            <div className="segmented" role="radiogroup" aria-label="Theme">
              {themes.map(({ value, label, icon: Icon }) => (
                <button key={value} role="radio" aria-checked={theme === value} onClick={() => setTheme(value)}><Icon size={16} />{label}</button>
              ))}
            </div>
          </div>
          <div className="setting">
            <div><strong>Your data</strong><small>Take your tracker to a spreadsheet or calendar.</small></div>
            <div className="setting-actions">
              <button className="quiet-button small" onClick={exportCSV}><Table size={16} />Export CSV</button>
              <button className="quiet-button small" onClick={exportCalendar}><CalendarPlus size={16} />Follow-ups (.ics)</button>
            </div>
          </div>
          <div className="setting">
            <div><strong>Keyboard</strong><small>Move fast with shortcuts and the command menu.</small></div>
            <button className="quiet-button small" onClick={showShortcuts}><Keyboard size={16} />Shortcuts</button>
          </div>
        </section>

        <section className="card device-card">
          <div>
            <h2>Take Stage with you.</h2>
            <p>Install it on your home screen and browse saved data offline.</p>
          </div>
          <div className="setting-actions">
            <button className="primary-button" onClick={install}><DownloadSimple size={18} />{installed ? "Installation details" : "Install Stage"}</button>
            <button className="quiet-button danger" onClick={lock}><LockSimple size={16} />Lock & clear this device</button>
          </div>
        </section>
      </div>
    </div>
  );
}
