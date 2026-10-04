import {
  type DesignSystem,
  MorphElement,
  type Page,
  type SlideMeta,
  type SlideTransition,
  useIsActivePage,
  useSlidePageNumber,
} from '@open-slide/core';
import type { CSSProperties, ReactNode } from 'react';

import shotCatalogue from './assets/17-games-catalogue.png';
import shotFeed from './assets/retake-01-current.png';
import shotResult from './assets/141-optimal-path-result.png';
import shotCareers from './assets/153-recruiter-careers-ready.png';
import shotConsent from './assets/19-game-consent.png';
import shotMoveFast from './assets/22-move-fast-exercise.png';
import shotMemory from './assets/95-memory-forward-key-2.png';
import shotBoard from './assets/131-optimal-path-board.png';
import shotBart from './assets/113-bart-10-pump.png';
import shotIst from './assets/121-ist-decision.png';
import shotLanguage from './assets/50-language-picker.png';
import shotAccess from './assets/52-accessibility.png';
import shotTest from './assets/171-test-created-return.png';
import shotTestResult from './assets/247-native-test-result.png';
import shotApplied from './assets/250-native-application-outcome.png';
import zennytLogo from './assets/zennyt-logo.png';
import espritLogo from './assets/esprit-logo.png';
import logoFlutter from './assets/flutter.png';
import logoDart from './assets/dart.png';
import logoJava from './assets/java.png';
import logoSpring from './assets/spring.png';
import logoPostgres from './assets/postgresql.png';
import logoReact from './assets/react.png';
import logoTs from './assets/typescript.png';
import logoTailwind from './assets/tailwindcss.png';
import logoBun from './assets/bun.png';
import logoTurbo from './assets/turborepo.png';
import logoPython from './assets/python.png';
import logoFastapi from './assets/fastapi.png';
import icCalendar from './assets/icons/calendar-w.svg';
import icGamepad from './assets/icons/gamepad-w.svg';
import icLanguages from './assets/icons/languages-w.svg';
import icCheck from './assets/icons/check-w.svg';
import icUserCheck from './assets/icons/usercheck-w.svg';
import icBriefcase from './assets/icons/briefcase-w.svg';
import icLayers from './assets/icons/layers-w.svg';
import icPhone from './assets/icons/phone-w.svg';
import icServer from './assets/icons/server-w.svg';
import icRoute from './assets/icons/route-w.svg';
import icTimer from './assets/icons/timer-w.svg';
import icBrain from './assets/icons/brain-w.svg';
import icTarget from './assets/icons/target-w.svg';
import icSparkles from './assets/icons/sparkles-w.svg';
import icRepeat from './assets/icons/repeat-w.svg';
import icFlask from './assets/icons/flask-w.svg';
import icFileCode from './assets/icons/filecode-w.svg';
import icLock from './assets/icons/lock-w.svg';
import icShieldNavy from './assets/icons/shield-n.svg';
import icAccess from './assets/icons/access-w.svg';
import icAlert from './assets/icons/alert-w.svg';
import icBug from './assets/icons/bug-w.svg';
import icUserX from './assets/icons/userx-w.svg';
import icDatabase from './assets/icons/database-w.svg';

// ---------------------------------------------------------------------------
// Design tokens — Zennyt app palette (mobile/lib/core/theme/app_colors.dart)
// ---------------------------------------------------------------------------
export const design: DesignSystem = {
  palette: { bg: '#ffffff', text: '#1E293B', accent: '#D12E7D' },
  fonts: {
    display: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
    body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  },
  typeScale: { hero: 76, body: 30 },
  radius: 24,
};

const navy = '#11428D';
const tint = '#EEF2F9';
const slate = '#64748B';
const indigo = '#4F46E5';
const line = '#D8E0EE';
const green = '#16A34A';
const amber = '#D97706';
const PHONE = 596 / 1253;
const PAD = 120;

export const meta: SlideMeta = {
  title: 'Zennyt internship — cognitive games',
  createdAt: '2026-10-04T22:01:13.643Z',
};

// Morph transition: held exit, opacity-only enter, longer morph (morph.md rule 1).
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';
export const transition: SlideTransition = {
  duration: 260,
  exit: { duration: 260, easing: 'cubic-bezier(0.4, 0, 1, 1)', keyframes: [{ opacity: 1 }, { opacity: 1 }] },
  enter: { duration: 260, easing: 'cubic-bezier(0, 0, 0.2, 1)', keyframes: [{ opacity: 0 }, { opacity: 1 }] },
  morph: { duration: 868, easing: EASE },
};

// ---------------------------------------------------------------------------
// Shared building blocks
// ---------------------------------------------------------------------------
const root = (dark = false): CSSProperties => ({
  width: '100%',
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
  background: dark ? navy : 'var(--osd-bg)',
  color: dark ? '#ffffff' : 'var(--osd-text)',
  fontFamily: 'var(--osd-font-body)',
});

const abs = (left: number, top: number, width?: number, height?: number): CSSProperties => ({
  position: 'absolute',
  left,
  top,
  width,
  height,
});

const Title = ({ children, dark = false }: { children: ReactNode; dark?: boolean }) => (
  <h2
    style={{
      ...abs(PAD, 84, 1400),
      margin: 0,
      fontFamily: 'var(--osd-font-display)',
      fontSize: 64,
      lineHeight: 1.1,
      fontWeight: 800,
      color: dark ? '#ffffff' : navy,
      letterSpacing: '-0.01em',
    }}
  >
    {children}
  </h2>
);

const Footer = ({ chapter, dark = false }: { chapter?: string; dark?: boolean }) => {
  const { current, total } = useSlidePageNumber();
  const color = dark ? '#C9D6EE' : slate;
  return (
    <>
      <div style={{ ...abs(PAD, 1000, 800), fontSize: 22, color }}>Mohamed Slimane · Zennyt internship 2026</div>
      <div style={{ position: 'absolute', right: PAD, top: 1000, fontSize: 22, color, textAlign: 'right' }}>
        {chapter ? `${chapter}   ·   ` : ''}
        {String(current).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </div>
    </>
  );
};

// Chapter tracker — five dots, the current chapter widens into a pill.
// Every dot is a MorphElement, so on a chapter change the pill slides along.
const DOT = 16;
const PILL = 64;
const GAP = 12;
const TRACK_LEFT = 1920 - PAD - (PILL + 4 * DOT + 4 * GAP);
const TrackDot = ({ i, current, dark }: { i: number; current: number; dark: boolean }) => {
  const left = TRACK_LEFT + (i - 1) * (DOT + GAP) + (i > current ? PILL - DOT : 0);
  const on = i === current;
  return (
    <MorphElement id={`track-${i}`}>
      <div
        style={{
          ...abs(left, 112, on ? PILL : DOT, DOT),
          borderRadius: 999,
          background: on ? '#D12E7D' : dark ? 'rgba(255,255,255,0.35)' : line,
        }}
      />
    </MorphElement>
  );
};
const Tracker = ({ current, dark = false }: { current: number; dark?: boolean }) => (
  <>
    <TrackDot i={1} current={current} dark={dark} />
    <TrackDot i={2} current={current} dark={dark} />
    <TrackDot i={3} current={current} dark={dark} />
    <TrackDot i={4} current={current} dark={dark} />
    <TrackDot i={5} current={current} dark={dark} />
  </>
);

const Icon = ({ src, size, bg, left, top }: { src: string; size: number; bg: string; left: number; top: number }) => (
  <div style={{ ...abs(left, top, size, size), borderRadius: 999, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <img src={src} alt="" style={{ width: size * 0.5, height: size * 0.5 }} />
  </div>
);

const Phone = ({ src, left, top, height, alt, morphId }: { src: string; left: number; top: number; height: number; alt: string; morphId?: string }) => {
  const img = <img src={src} alt={alt} style={{ ...abs(left, top, Math.round(height * PHONE), height), display: 'block' }} />;
  return morphId ? <MorphElement id={morphId}>{img}</MorphElement> : img;
};

const Caption = ({ left, top, width, children, accent = false }: { left: number; top: number; width: number; children: ReactNode; accent?: boolean }) => (
  <div style={{ ...abs(left, top, width), fontSize: 24, color: accent ? '#D12E7D' : slate, fontWeight: accent ? 700 : 400, textAlign: 'center' }}>
    {children}
  </div>
);

const Card = ({ left, top, width, height, children, fill = tint, border, style }: { left: number; top: number; width: number; height: number; children?: ReactNode; fill?: string; border?: string; style?: CSSProperties }) => (
  <div
    style={{
      ...abs(left, top, width, height),
      background: fill,
      borderRadius: 'var(--osd-radius)',
      border: border ? `2px solid ${border}` : undefined,
      boxSizing: 'border-box',
      ...style,
    }}
  >
    {children}
  </div>
);

const h3: CSSProperties = { margin: 0, fontSize: 34, fontWeight: 700, color: navy, lineHeight: 1.2 };
const body: CSSProperties = { margin: 0, fontSize: 'var(--osd-size-body)', lineHeight: 1.45 };

// ---------------------------------------------------------------------------
// 1. Cover
// ---------------------------------------------------------------------------
const Cover: Page = () => (
  <section style={root()}>
    <img src={zennytLogo} alt="Zennyt" style={abs(PAD, 92, 100, 100)} />
    <div style={{ ...abs(PAD + 124, 92, 400, 100), display: 'flex', alignItems: 'center', fontSize: 38, fontWeight: 800, color: navy, letterSpacing: '0.18em' }}>
      ZENNYT
    </div>
    <div style={{ ...abs(PAD, 300, 960), fontSize: 30, fontWeight: 700, color: 'var(--osd-accent)' }}>Summer internship defense · 2026</div>
    <h1
      style={{
        ...abs(PAD, 352, 960),
        margin: 0,
        fontFamily: 'var(--osd-font-display)',
        fontSize: 'var(--osd-size-hero)',
        lineHeight: 1.08,
        fontWeight: 800,
        color: navy,
        letterSpacing: '-0.02em',
      }}
    >
      Building the cognitive games of the Zennyt career platform
    </h1>
    <div style={{ ...abs(PAD, 712, 960), fontSize: 34, fontWeight: 700 }}>Mohamed Slimane · Full Stack Mobile Developer</div>
    <div style={{ ...abs(PAD, 766, 960), fontSize: 28, color: slate, lineHeight: 1.5 }}>
      1 June – 30 August 2026
      <br />
      Supervisors: Mehdi Mtir, Abdelmonem Aisa
    </div>
    <img src={espritLogo} alt="ESPRIT" style={abs(PAD, 900, 230, 87)} />
    <div style={{ ...abs(1137, 0, 783, 1080), background: navy }} />
    <Phone src={shotFeed} left={1174} top={209} height={662} alt="Candidate home feed" />
    <Phone src={shotResult} left={1570} top={209} height={662} alt="Optimal Path result" />
    <Phone src={shotCatalogue} left={1338} top={137} height={806} alt="Games catalogue" />
  </section>
);

// ---------------------------------------------------------------------------
// 2. At a glance + agenda (agenda dots morph into the chapter tracker)
// ---------------------------------------------------------------------------
const Stat = ({ left, icon, value, label, sub, accent = false }: { left: number; icon: string; value: string; label: string; sub: string; accent?: boolean }) => (
  <Card left={left} top={240} width={390} height={340}>
    <Icon src={icon} size={72} bg={accent ? '#D12E7D' : navy} left={40} top={36} />
    <div style={{ ...abs(40, 128, 330) }}>
      <div style={{ fontSize: 92, fontWeight: 800, lineHeight: 1, color: accent ? '#D12E7D' : navy, fontFamily: 'var(--osd-font-display)' }}>{value}</div>
      <div style={{ fontSize: 30, fontWeight: 700, marginTop: 18, lineHeight: 1.2 }}>{label}</div>
      <div style={{ fontSize: 22, color: slate, marginTop: 8, lineHeight: 1.3 }}>{sub}</div>
    </div>
  </Card>
);

const AgendaItem = ({ i, label, accent = false }: { i: number; label: string; accent?: boolean }) => {
  const cx = PAD + (i - 1) * 336 + 168;
  return (
    <>
      <MorphElement id={`track-${i}`}>
        <div style={{ ...abs(cx - 36, 740, 72, 72), borderRadius: 999, background: accent ? '#D12E7D' : navy }} />
      </MorphElement>
      <div style={{ ...abs(cx - 36, 740, 72, 72), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 800, color: '#ffffff' }}>{i}</div>
      <div style={{ ...abs(cx - 160, 836, 320), fontSize: 28, textAlign: 'center', fontWeight: accent ? 700 : 400 }}>{label}</div>
    </>
  );
};

const Glance: Page = () => (
  <section style={root()}>
    <Title>The internship at a glance</Title>
    <Stat left={120} icon={icCalendar} value="3" label="months" sub="1 June – 30 August 2026" />
    <Stat left={550} icon={icGamepad} value="14" label="mini-games" sub="across 9 cognitive families" accent />
    <Stat left={980} icon={icLanguages} value="6" label="languages" sub="EN · FR · ES · DE · IT · NL" />
    <Stat left={1410} icon={icCheck} value="2,372" label="tests passing" sub="843 backend · 1,529 Flutter" />
    <div style={{ ...abs(PAD, 650), fontSize: 34, fontWeight: 700, color: navy }}>Today</div>
    <div style={{ ...abs(PAD + 168, 774, 1344, 4), background: tint }} />
    <AgendaItem i={1} label="Context & objectives" />
    <AgendaItem i={2} label="Architecture & stack" />
    <AgendaItem i={3} label="My contribution: the games" accent />
    <AgendaItem i={4} label="Testing & results" />
    <AgendaItem i={5} label="Lessons & next steps" />
    <Footer chapter="Report · Abstract, Ch. 1" />
  </section>
);

// ---------------------------------------------------------------------------
// 3. Context
// ---------------------------------------------------------------------------
const Audience = ({ top, icon, name, text, accent = false }: { top: number; icon: string; name: string; text: string; accent?: boolean }) => (
  <>
    <Icon src={icon} size={88} bg={accent ? '#D12E7D' : navy} left={PAD} top={top} />
    <div style={{ ...abs(PAD + 124, top, 800) }}>
      <p style={h3}>{name}</p>
      <p style={{ ...body, fontSize: 28, marginTop: 8 }}>{text}</p>
    </div>
  </>
);

const Context: Page = () => (
  <section style={root()}>
    <Title>One platform, three audiences</Title>
    <Tracker current={1} />
    <p style={{ ...body, ...abs(PAD, 236, 920), color: slate, fontSize: 32 }}>
      Zennyt is a mobile career platform where profiles, job offers, assessments and conversations meet.
    </p>
    <Audience top={410} icon={icUserCheck} name="Candidates" text="Build a profile, explore offers, play cognitive games, take tests and chat with recruiters." accent />
    <Audience top={580} icon={icBriefcase} name="Recruiters" text="Publish offers, author technical tests and review applicants with a Fit Score." />
    <Audience top={750} icon={icLayers} name="Staff" text="Game Studio and Platform Console manage assessment content and operations." />
    <Phone src={shotFeed} left={1110} top={236} height={680} alt="Candidate home feed" />
    <Phone src={shotCareers} left={1476} top={236} height={680} alt="Recruiter careers dashboard" />
    <Caption left={1070} top={930} width={400}>Candidate · Home feed</Caption>
    <Caption left={1436} top={930} width={404}>Recruiter · Careers dashboard</Caption>
    <Footer chapter="Report · Ch. 2" />
  </section>
);

// ---------------------------------------------------------------------------
// 4. Challenge & objectives
// ---------------------------------------------------------------------------
const FlowStep = ({ top, icon, text, arrow = true }: { top: number; icon: string; text: string; arrow?: boolean }) => (
  <>
    <Icon src={icon} size={80} bg={navy} left={44} top={top} />
    <p style={{ ...body, ...abs(156, top + 2, 580), fontSize: 30 }}>{text}</p>
    {arrow ? <div style={{ ...abs(82, top + 96, 4, 76), background: navy, opacity: 0.4 }} /> : null}
  </>
);

const Objective = ({ left, top, n, text }: { left: number; top: number; n: string; text: string }) => (
  <Card left={left} top={top} width={400} height={300} fill="#ffffff" border={line}>
    <div style={{ ...abs(36, 32), fontSize: 52, fontWeight: 800, color: 'var(--osd-accent)' }}>{n}</div>
    <p style={{ ...body, ...abs(36, 118, 330), fontSize: 32 }}>{text}</p>
  </Card>
);

const Challenge: Page = () => (
  <section style={root()}>
    <Title>Challenge: trustworthy results</Title>
    <Tracker current={1} />
    <Card left={PAD} top={240} width={780} height={700}>
      <p style={{ ...h3, ...abs(44, 40) }}>Why it is hard</p>
      <FlowStep top={150} icon={icPhone} text="The phone captures every action and timing precisely" />
      <FlowStep top={340} icon={icServer} text="The backend validates the session and applies the scoring rule" />
      <FlowStep top={530} icon={icCheck} text="The result stays consistent across games, languages and screens" arrow={false} />
    </Card>
    <p style={{ ...h3, ...abs(960, 240) }}>Objectives</p>
    <Objective left={960} top={310} n="01" text="Implement interactive Flutter game journeys" />
    <Objective left={1400} top={310} n="02" text="Connect raw measurements to server-side scoring" />
    <Objective left={960} top={640} n="03" text="Manage sessions, tutorials and lifecycle states" />
    <Objective left={1400} top={640} n="04" text="Reusable result screens in six languages" />
    <Footer chapter="Report · Ch. 1" />
  </section>
);

// ---------------------------------------------------------------------------
// 5. Architecture (the Games tile morphs into the next page)
// ---------------------------------------------------------------------------
const SideBox = ({ left, top, name, sub }: { left: number; top: number; name: string; sub: string }) => (
  <Card left={left} top={top} width={370} height={160} fill="#ffffff" border={navy} style={{ textAlign: 'center' }}>
    <div style={{ ...abs(0, 38, 366), fontSize: 32, fontWeight: 700, color: navy }}>{name}</div>
    <div style={{ ...abs(0, 90, 366), fontSize: 24, color: slate }}>{sub}</div>
  </Card>
);

const CTX_LEFT = 570;
const CTX_W = 245;
const CTX_H = 150;
const ctxX = (col: number) => CTX_LEFT + col * (CTX_W + 22);
const ctxY = (row: number) => 330 + row * (CTX_H + 18);

const ContextTile = ({ col, row, name, sub, width = CTX_W }: { col: number; row: number; name: string; sub: string; width?: number }) => (
  <Card left={ctxX(col)} top={ctxY(row)} width={width} height={CTX_H} fill="#ffffff" border={line} style={{ textAlign: 'center' }}>
    <div style={{ ...abs(0, 36, width - 4), fontSize: 30, fontWeight: 700, color: navy }}>{name}</div>
    <div style={{ ...abs(0, 86, width - 4), fontSize: 22, color: slate }}>{sub}</div>
  </Card>
);

// Only the magenta box morphs; its label lives outside the MorphElement (morph-element.mdx: keep changing copy outside).
const MORPH_MS = 868;
const GamesTile = ({ left, top, width, height, big = false }: { left: number; top: number; width: number; height: number; big?: boolean }) => {
  const active = useIsActivePage();
  return (
    <>
      <MorphElement id="games-tile">
        <div style={{ ...abs(left, top, width, height), background: '#D12E7D', borderRadius: big ? 32 : 24 }} />
      </MorphElement>
      <div
        style={{
          ...abs(left, top, width, height),
          color: '#ffffff',
          animation: big && active ? `osd-fade 0.4s ease-out ${MORPH_MS}ms both` : undefined,
        }}
      >
        {big ? <style>{'@keyframes osd-fade { from { opacity: 0 } to { opacity: 1 } }'}</style> : null}
        <div style={{ ...abs(big ? 56 : 0, big ? 44 : 36, big ? 900 : width), fontSize: big ? 56 : 30, fontWeight: 800, textAlign: big ? 'left' : 'center' }}>Games</div>
        <div style={{ ...abs(big ? 56 : 0, big ? 120 : 86, big ? 1500 : width), fontSize: big ? 32 : 22, textAlign: big ? 'left' : 'center' }}>
          sessions · scoring{big ? ' — the context I worked in' : ''}
        </div>
      </div>
    </>
  );
};

const Arrow = ({ left, top, width }: { left: number; top: number; width: number }) => (
  <>
    <div style={{ ...abs(left, top - 1, width - 12, 3), background: navy }} />
    <div style={{ ...abs(left + width - 14, top - 9, 0, 0), borderTop: '9px solid transparent', borderBottom: '9px solid transparent', borderLeft: `14px solid ${navy}` }} />
  </>
);

const Architecture: Page = () => (
  <section style={root()}>
    <Title>A modular monolith behind two clients</Title>
    <Tracker current={2} />
    <SideBox left={PAD} top={330} name="Flutter mobile" sub="Candidate · recruiter" />
    <SideBox left={PAD} top={590} name="React staff apps" sub="Game Studio · Console" />
    <Card left={530} top={236} width={860} height={680} border={navy} />
    <div style={{ ...abs(530, 262, 860), fontSize: 30, fontWeight: 700, color: navy, textAlign: 'center' }}>Spring Boot modular monolith</div>
    <ContextTile col={0} row={0} name="Identity" sub="accounts · profiles" />
    <GamesTile left={ctxX(1)} top={ctxY(0)} width={CTX_W} height={CTX_H} />
    <ContextTile col={2} row={0} name="Recruitment" sub="offers · Fit Score" />
    <ContextTile col={0} row={1} name="Engagement" sub="social · messages" />
    <ContextTile col={1} row={1} name="Analytics" sub="event projections" />
    <ContextTile col={2} row={1} name="Referral" sub="invitations · wallet" />
    <ContextTile col={0} row={2} name="Support" sub="help · tickets" />
    <ContextTile col={1} row={2} name="Shared infrastructure" sub="security · events · work queue" width={2 * CTX_W + 22} />
    <SideBox left={1430} top={330} name="PostgreSQL" sub="Context-owned state" />
    <SideBox left={1430} top={590} name="Python help" sub="FastAPI · LangChain" />
    <Arrow left={490} top={410} width={40} />
    <Arrow left={490} top={670} width={40} />
    <Arrow left={1390} top={410} width={40} />
    <Arrow left={1390} top={670} width={40} />
    <div style={{ ...abs(1430, 770, 370), fontSize: 22, color: slate, textAlign: 'center' }}>User JWT + service secret</div>
    <p style={{ ...body, ...abs(PAD, 934, 1680), fontSize: 26, textAlign: 'center' }}>
      <b style={{ color: navy }}>Each context:</b> API → application → pure domain → infrastructure, checked by ArchUnit. Contexts talk through domain events.
    </p>
    <Footer chapter="Report · Ch. 4" />
  </section>
);

// ---------------------------------------------------------------------------
// 6. Inside the Games context
// ---------------------------------------------------------------------------
const DomainCard = ({ left, name, text }: { left: number; name: string; text: string }) => (
  <Card left={left} top={500} width={390} height={330} fill="#ffffff" border={line}>
    <p style={{ ...h3, ...abs(36, 36, 320), fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace', fontSize: 30 }}>{name}</p>
    <p style={{ ...body, ...abs(36, 100, 320), fontSize: 28 }}>{text}</p>
  </Card>
);

const GamesContext: Page = () => (
  <section style={root()}>
    <Title>Inside the Games context</Title>
    <Tracker current={2} />
    <GamesTile left={PAD} top={236} width={1680} height={210} big />
    <DomainCard left={120} name="GameSession" text="Player, family, status, attempts and timestamps" />
    <DomainCard left={550} name="MiniGame" text="The tasks that belong to each family" />
    <DomainCard left={980} name="Score" text="Raw, maximum and normalized values" />
    <DomainCard left={1410} name="Snapshot + form" text="Published settings frozen at start; assigned scenario content" />
    <p style={{ ...body, ...abs(PAD, 880, 1680), color: slate }}>
      A session completes only when every required mini-game has a valid recorded attempt.
    </p>
    <Footer chapter="Report · Ch. 4 Game domain model" />
  </section>
);

// ---------------------------------------------------------------------------
// 7. Stack
// ---------------------------------------------------------------------------
const Logo = ({ src, left, size, alt }: { src: string; left: number; size: number; alt: string }) => (
  <img src={src} alt={alt} style={{ ...abs(left, 104, size, size), objectFit: 'contain' }} />
);

const Layer = ({ left, name, children, items, accent = false }: { left: number; name: string; children: ReactNode; items: ReactNode; accent?: boolean }) => (
  <Card left={left} top={236} width={390} height={590}>
    <p style={{ ...h3, ...abs(40, 36), color: accent ? 'var(--osd-accent)' : navy }}>{name}</p>
    {children}
    <ul style={{ ...abs(40, 220, 330), margin: 0, paddingLeft: 28, fontSize: 28, lineHeight: 1.5 }}>{items}</ul>
  </Card>
);

const Stack: Page = () => (
  <section style={root()}>
    <Title>Technology stack by layer</Title>
    <Tracker current={2} />
    <Layer
      left={120}
      name="Mobile"
      accent
      items={
        <>
          <li>Riverpod state</li>
          <li>go_router</li>
          <li>Flame game runtime</li>
          <li>Dio + STOMP</li>
          <li>Secure storage, Hive</li>
        </>
      }
    >
      <Logo src={logoFlutter} left={40} size={76} alt="Flutter" />
      <Logo src={logoDart} left={140} size={76} alt="Dart" />
    </Layer>
    <Layer
      left={550}
      name="Backend"
      items={
        <>
          <li>Spring Boot monolith</li>
          <li>Spring Data JPA</li>
          <li>Spring Security, OAuth2</li>
          <li>OpenAPI Generator</li>
        </>
      }
    >
      <Logo src={logoJava} left={40} size={76} alt="Java" />
      <Logo src={logoSpring} left={140} size={76} alt="Spring" />
      <Logo src={logoPostgres} left={240} size={76} alt="PostgreSQL" />
    </Layer>
    <Layer
      left={980}
      name="Administration"
      items={
        <>
          <li>TanStack Start</li>
          <li>Game Studio</li>
          <li>Platform Console</li>
        </>
      }
    >
      <Logo src={logoReact} left={40} size={54} alt="React" />
      <Logo src={logoTs} left={104} size={54} alt="TypeScript" />
      <Logo src={logoTailwind} left={168} size={54} alt="Tailwind CSS" />
      <Logo src={logoBun} left={232} size={54} alt="Bun" />
      <Logo src={logoTurbo} left={296} size={54} alt="Turborepo" />
    </Layer>
    <Layer
      left={1410}
      name="Help service"
      items={
        <>
          <li>LangChain</li>
          <li>Chroma retrieval</li>
          <li>Authenticated gateway</li>
        </>
      }
    >
      <Logo src={logoPython} left={40} size={76} alt="Python" />
      <Logo src={logoFastapi} left={140} size={76} alt="FastAPI" />
    </Layer>
    <Card left={PAD} top={860} width={1680} height={96} fill="#ffffff" border={line}>
      <p style={{ ...body, ...abs(40, 0, 1600, 92), display: 'flex', alignItems: 'center', fontSize: 28 }}>
        <b style={{ color: navy, marginRight: 24 }}>Quality & runtime</b> JUnit · ArchUnit · Flutter test · OpenAPI contract-parity tests · Compose · Maven
      </p>
    </Card>
    <Footer chapter="Report · Ch. 5" />
  </section>
);

// ---------------------------------------------------------------------------
// 8. Game catalogue
// ---------------------------------------------------------------------------
const Family = ({ col, row, icon, name, games, accent = false }: { col: number; row: number; icon: string; name: string; games: string; accent?: boolean }) => (
  <Card left={PAD + col * 573} top={236 + row * 240} width={533} height={210}>
    <Icon src={icon} size={80} bg={accent ? '#D12E7D' : navy} left={32} top={36} />
    <div style={{ ...abs(136, 30, 376) }}>
      <p style={{ ...h3, fontSize: 30 }}>{name}</p>
      <p style={{ ...body, fontSize: 26, lineHeight: 1.35, marginTop: 8 }}>{games}</p>
    </div>
  </Card>
);

const Catalogue: Page = () => (
  <section style={root()}>
    <Title>My focus: 9 families, 14 mini-games</Title>
    <Tracker current={3} />
    <Family col={0} row={0} icon={icRoute} name="Planifik" games="Optimal Path · Task Scheduling · Predictive Puzzle" accent />
    <Family col={1} row={0} icon={icTimer} name="Move Fast" games="Move Fast Core" />
    <Family col={2} row={0} icon={icBrain} name="Memory Quest" games="I Investigate" />
    <Family col={0} row={1} icon={icTarget} name="Decision" games="I Decide" />
    <Family col={1} row={1} icon={icSparkles} name="Emotional Regulation" games="Emotional Radar · Reflective Pause · Strategic Choices" accent />
    <Family col={2} row={1} icon={icRepeat} name="Continuous Attention" games="I Continue" />
    <Family col={0} row={2} icon={icGamepad} name="Visuomotor Coordination" games="I Coordinate" />
    <Family col={1} row={2} icon={icLayers} name="Visuospatial Memory" games="I Place" />
    <Family col={2} row={2} icon={icFlask} name="Decision Behavioral" games="BART · IST" accent />
    <Footer chapter="Report · Ch. 7" />
  </section>
);

// ---------------------------------------------------------------------------
// 9–11. Pipeline — the focus frame morphs from step to step
// ---------------------------------------------------------------------------
const STEP_W = 304;
const stepX = (i: number) => PAD + i * (STEP_W + 40);

const PipeStep = ({ i, icon, name, text, server = false }: { i: number; icon: string; name: string; text: string; server?: boolean }) => (
  <>
    <Card left={stepX(i)} top={250} width={STEP_W} height={420} fill={server ? tint : '#ffffff'} border={server ? undefined : line}>
      <Icon src={icon} size={80} bg={server ? navy : '#D12E7D'} left={32} top={36} />
      <p style={{ ...h3, ...abs(32, 146) }}>
        {i + 1}. {name}
      </p>
      <p style={{ ...body, ...abs(32, 204, 250), fontSize: 28, lineHeight: 1.4 }}>{text}</p>
    </Card>
    {i < 4 ? <div style={{ ...abs(stepX(i) + STEP_W, 420, 40), fontSize: 44, color: slate, textAlign: 'center' }}>›</div> : null}
  </>
);

const PipeSteps = () => (
  <>
    <PipeStep i={0} icon={icPhone} name="Record" text="Flutter captures actions, answers and timings" />
    <PipeStep i={1} icon={icFileCode} name="Route" text="The mini-game ID selects the measurement schema" server />
    <PipeStep i={2} icon={icLock} name="Check" text="Owner, mini-game and payload are validated" server />
    <PipeStep i={3} icon={icServer} name="Score" text="A domain service scores; the attempt is stored" server />
    <PipeStep i={4} icon={icCheck} name="Show" text="The result screen shows score and breakdown" />
  </>
);

const Focus = ({ from, to }: { from: number; to: number }) => (
  <MorphElement id="pipe-focus">
    <div
      style={{
        ...abs(stepX(from) - 16, 234, stepX(to) + STEP_W + 16 - (stepX(from) - 16), 452),
        border: '5px solid #D12E7D',
        borderRadius: 34,
        boxSizing: 'border-box',
      }}
    />
  </MorphElement>
);

const PipeNote = ({ label, text }: { label: string; text: string }) => (
  <Card left={PAD} top={740} width={1680} height={190}>
    <div style={{ ...abs(48, 40, 1580), fontSize: 26, fontWeight: 700, color: 'var(--osd-accent)', letterSpacing: '0.08em' }}>{label}</div>
    <p style={{ ...body, ...abs(48, 88, 1580), fontSize: 34 }}>{text}</p>
  </Card>
);

const PipelineRecord: Page = () => (
  <section style={root()}>
    <Title>Client measures, server decides</Title>
    <Tracker current={3} />
    <PipeSteps />
    <Focus from={0} to={0} />
    <PipeNote label="ON THE PHONE" text="Flutter records raw observations: what was tapped, answered and when. Never a score." />
    <Footer chapter="Report · Ch. 7 Measurement pipeline" />
  </section>
);

const PipelineServer: Page = () => (
  <section style={root()}>
    <Title>Client measures, server decides</Title>
    <Tracker current={3} />
    <PipeSteps />
    <Focus from={1} to={3} />
    <PipeNote label="ON THE SERVER" text="The schema is picked by mini-game ID, the session is checked, and a domain service computes the score." />
    <Footer chapter="Report · Ch. 7 Measurement pipeline" />
  </section>
);

const PipelineShow: Page = () => (
  <section style={root()}>
    <Title>Client measures, server decides</Title>
    <Tracker current={3} />
    <PipeSteps />
    <Focus from={4} to={4} />
    <Card left={PAD} top={740} width={1680} height={190} fill={navy}>
      <div style={{ ...abs(48, 55, 80, 80), borderRadius: 999, background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src={icShieldNavy} alt="" style={{ width: 42, height: 42 }} />
      </div>
      <p style={{ ...h3, ...abs(160, 36, 1480), color: '#ffffff' }}>The client never chooses an authoritative score</p>
      <p style={{ ...body, ...abs(160, 88, 1480), color: '#ffffff', fontSize: 28 }}>
        Invalid metrics, foreign sessions, incompatible mini-games and duplicates are rejected. Invalid runs are kept for audit, never counted.
      </p>
    </Card>
    <Footer chapter="Report · Ch. 7 Measurement pipeline" />
  </section>
);

// ---------------------------------------------------------------------------
// 12–13. Shared journey → result zoom (the result phone morphs)
// ---------------------------------------------------------------------------
const J_H = 560;
const J_W = Math.round(J_H * PHONE);
const J_GAP = (1680 - 5 * J_W) / 4;
const jx = (i: number) => PAD + i * (J_W + J_GAP);

const JourneyStep = ({ i, src, name, sub, morphId, accent = false }: { i: number; src: string; name: string; sub: string; morphId?: string; accent?: boolean }) => (
  <>
    <Phone src={src} left={jx(i)} top={236} height={J_H} alt={sub} morphId={morphId} />
    <div style={{ ...abs(jx(i) - 40, 826, J_W + 80), fontSize: 32, fontWeight: 700, color: accent ? '#D12E7D' : navy, textAlign: 'center' }}>
      {i + 1} {name}
    </div>
    <Caption left={jx(i) - 50} top={876} width={J_W + 100}>
      {sub}
    </Caption>
  </>
);

const Journey: Page = () => (
  <section style={root()}>
    <Title>One shared journey for every game</Title>
    <Tracker current={3} />
    <JourneyStep i={0} src={shotConsent} name="Consent" sub="Monitoring conditions" />
    <JourneyStep i={1} src={shotMoveFast} name="Instructions" sub="Move Fast rule" />
    <JourneyStep i={2} src={shotMemory} name="Gameplay" sub="Memory Quest recall" />
    <JourneyStep i={3} src={shotBoard} name="Planning" sub="Optimal Path board" />
    <JourneyStep i={4} src={shotResult} name="Results" sub="Server score: 10 / 10" morphId="shot-result" accent />
    <Footer chapter="Report · Ch. 7 · App. A" />
  </section>
);

const ResultPoint = ({ top, value, text }: { top: number; value: string; text: string }) => (
  <>
    <div style={{ ...abs(620, top, 360), fontSize: 64, fontWeight: 800, color: navy, lineHeight: 1 }}>{value}</div>
    <p style={{ ...body, ...abs(1000, top + 4, 800), fontSize: 30 }}>{text}</p>
  </>
);

const ResultZoom: Page = () => (
  <section style={root()}>
    <Title>Results come back from the server</Title>
    <Tracker current={3} />
    <Phone src={shotResult} left={PAD} top={226} height={720} alt="Optimal Path result" morphId="shot-result" />
    <ResultPoint top={270} value="100%" text="Cognitive score: 10 of 10 points, computed by the backend" />
    <ResultPoint top={450} value="61 / 61" text="Route steps against the server-derived optimum" />
    <ResultPoint top={630} value="3" text="Separate layers: raw performance, normalized score, indicators" />
    <p style={{ ...body, ...abs(620, 830, 1180), color: slate }}>
      Shared result screens: score, breakdown, explanation, then Play again or Compare.
    </p>
    <Footer chapter="Report · Ch. 7 Interaction and result design" />
  </section>
);

// ---------------------------------------------------------------------------
// 14. Replay
// ---------------------------------------------------------------------------
const Row = ({ top, icon, name, text, accent = false, width = 900 }: { top: number; icon: string; name: string; text: string; accent?: boolean; width?: number }) => (
  <>
    <Icon src={icon} size={84} bg={accent ? '#D12E7D' : navy} left={PAD} top={top} />
    <div style={{ ...abs(PAD + 120, top - 2, width) }}>
      <p style={h3}>{name}</p>
      <p style={{ ...body, fontSize: 28, marginTop: 6 }}>{text}</p>
    </div>
  </>
);

const Replay: Page = () => (
  <section style={root()}>
    <Title>Replay: the server rebuilds the run</Title>
    <Tracker current={3} />
    <Row top={240} icon={icFlask} name="BART" text="Pumps and cash-outs per balloon → explosions and earnings rebuilt on the server" accent />
    <Row top={410} icon={icTarget} name="IST" text="Opened boxes and choices → what was visible at decision time" accent />
    <Row top={580} icon={icLayers} name="I Place" text="Placement actions replayed against the controlled layout" accent />
    <Card left={PAD} top={760} width={1000} height={180}>
      <p style={{ ...h3, ...abs(44, 30), fontSize: 30 }}>Controlled content</p>
      <p style={{ ...body, ...abs(44, 80, 920), fontSize: 28 }}>Runtime snapshots freeze settings at session start; assigned forms bind scenario games to a bank.</p>
    </Card>
    <Phone src={shotBart} left={1170} top={236} height={680} alt="BART pumping" />
    <Phone src={shotIst} left={1490} top={236} height={680} alt="IST confidence choice" />
    <Caption left={1130} top={930} width={400}>BART · balloon 10 of 30</Caption>
    <Caption left={1450} top={930} width={404}>IST · choice + confidence</Caption>
    <Footer chapter="Report · Ch. 7 Replay and validation" />
  </section>
);

// ---------------------------------------------------------------------------
// 15. Localization
// ---------------------------------------------------------------------------
const Lang = ({ col, row, name, on = false }: { col: number; row: number; name: string; on?: boolean }) => (
  <div
    style={{
      ...abs(940 + col * 290, 240 + row * 96, 266, 72),
      borderRadius: 999,
      background: on ? navy : tint,
      color: on ? '#ffffff' : navy,
      fontSize: 28,
      fontWeight: 700,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    {name}
  </div>
);

const LocRow = ({ top, icon, name, text }: { top: number; icon: string; name: string; text: string }) => (
  <>
    <Icon src={icon} size={80} bg={navy} left={940} top={top} />
    <div style={{ ...abs(1050, top - 2, 750) }}>
      <p style={{ ...h3, fontSize: 32 }}>{name}</p>
      <p style={{ ...body, fontSize: 28, marginTop: 6 }}>{text}</p>
    </div>
  </>
);

const Localization: Page = () => (
  <section style={root()}>
    <Title>Six languages, adjustable reading</Title>
    <Tracker current={3} />
    <Phone src={shotLanguage} left={PAD} top={236} height={680} alt="Language picker" />
    <Phone src={shotAccess} left={490} top={236} height={680} alt="Accessibility settings" />
    <Caption left={80} top={930} width={404}>Language picker</Caption>
    <Caption left={450} top={930} width={404}>Accessibility settings</Caption>
    <Lang col={0} row={0} name="English" on />
    <Lang col={1} row={0} name="Français" />
    <Lang col={2} row={0} name="Español" />
    <Lang col={0} row={1} name="Deutsch" />
    <Lang col={1} row={1} name="Italiano" />
    <Lang col={2} row={1} name="Nederlands" />
    <LocRow top={470} icon={icLanguages} name="Localization keys everywhere" text="Instructions, controls, errors, accessibility labels; ICU plurals." />
    <LocRow top={630} icon={icPhone} name="Layouts that absorb long strings" text="German and Dutch stay readable on small screens." />
    <LocRow top={790} icon={icAccess} name="Reading preferences" text="Text size, contrast, bold text and reduced motion." />
    <Footer chapter="Report · Ch. 7 Localization" />
  </section>
);

// ---------------------------------------------------------------------------
// 16. Recruiter → application
// ---------------------------------------------------------------------------
const R_H = 560;
const R_W = Math.round(R_H * PHONE);
const rx = (i: number) => 640 + i * (R_W + (1160 - 4 * R_W) / 3);

const FlowNum = ({ i, who, text, accent = false }: { i: number; who: string; text: string; accent?: boolean }) => (
  <>
    <div style={{ ...abs(PAD, 420 + (i - 1) * 130, 60, 60), borderRadius: 999, background: accent ? '#D12E7D' : navy, color: '#ffffff', fontSize: 28, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {i}
    </div>
    <p style={{ ...body, ...abs(PAD + 84, 416 + (i - 1) * 130, 400), fontSize: 28, lineHeight: 1.35 }}>
      <b style={{ color: navy }}>{who}</b> {text}
    </p>
  </>
);

const RecruiterFlow: Page = () => (
  <section style={root()}>
    <Title>From recruiter test to application</Title>
    <Tracker current={3} />
    <p style={{ ...body, ...abs(PAD, 240, 460), color: slate }}>Beyond the games, I tested the full path on a real iPhone build.</p>
    <FlowNum i={1} who="Recruiter" text="creates a test and publishes an offer" />
    <FlowNum i={2} who="Candidate" text="accepts consent, answers shuffled questions" />
    <FlowNum i={3} who="Server" text="grades the attempt: 100%" accent />
    <FlowNum i={4} who="Candidate" text="applies with the passed-test banner" />
    <Phone src={shotCareers} left={rx(0)} top={236} height={R_H} alt="Recruiter careers dashboard" />
    <Phone src={shotTest} left={rx(1)} top={236} height={R_H} alt="Technical test and answer options" />
    <Phone src={shotTestResult} left={rx(2)} top={236} height={R_H} alt="Technical test result" />
    <Phone src={shotApplied} left={rx(3)} top={236} height={R_H} alt="Application sent" />
    <Caption left={rx(0) - 40} top={820} width={R_W + 80}>Careers dashboard</Caption>
    <Caption left={rx(1) - 40} top={820} width={R_W + 80}>Test and answers</Caption>
    <Caption left={rx(2) - 40} top={820} width={R_W + 80} accent>Server result: 100%</Caption>
    <Caption left={rx(3) - 40} top={820} width={R_W + 80}>Application sent</Caption>
    <Footer chapter="Report · Ch. 6, Ch. 8 · App. A" />
  </section>
);

// ---------------------------------------------------------------------------
// 17. Automated suites
// ---------------------------------------------------------------------------
const Suite = ({ left, value, label, sub, accent = false }: { left: number; value: string; label: string; sub: string; accent?: boolean }) => (
  <Card left={left} top={236} width={533} height={330}>
    <div style={{ ...abs(48, 44, 450) }}>
      <div style={{ fontSize: 88, fontWeight: 800, lineHeight: 1, color: accent ? '#D12E7D' : navy, fontFamily: 'var(--osd-font-display)', whiteSpace: 'nowrap' }}>{value}</div>
      <div style={{ fontSize: 30, fontWeight: 700, marginTop: 28, lineHeight: 1.2 }}>{label}</div>
      <div style={{ fontSize: 26, color: slate, marginTop: 10 }}>{sub}</div>
    </div>
  </Card>
);

const Note = ({ left, icon, bg, name, text }: { left: number; icon: string; bg: string; name: string; text: string }) => (
  <Card left={left} top={610} width={820} height={320} fill="#ffffff" border={line}>
    <Icon src={icon} size={76} bg={bg} left={40} top={40} />
    <p style={{ ...h3, ...abs(144, 50, 640), fontSize: 32 }}>{name}</p>
    <p style={{ ...body, ...abs(144, 106, 640), fontSize: 28 }}>{text}</p>
  </Card>
);

const Suites: Page = () => (
  <section style={root()}>
    <Title>Automated suites are green</Title>
    <Tracker current={4} />
    <Suite left={120} value="843" label="backend Maven tests passed" sub="0 failed · 41 skipped" />
    <Suite left={693} value="1,529" label="Flutter tests passed" sub="0 failed · 0 skipped" />
    <Suite left={1266} value="218 / 221" label="API checks passed" sub="2 failed · 1 blocked" accent />
    <Note left={120} icon={icFlask} bg={navy} name="Test environment" text="Spring Boot dev backend, local PostgreSQL, Flutter iPhone app driven by XCTest, synthetic data." />
    <Note left={980} icon={icAlert} bg={amber} name="Not yet covered" text="Email/OTP, push, call media, real payments, multi-device. AI help gateway returned 503." />
    <Footer chapter="Report · Ch. 8" />
  </section>
);

// ---------------------------------------------------------------------------
// 18. Walkthrough table
// ---------------------------------------------------------------------------
const th: CSSProperties = { background: navy, color: '#ffffff', textAlign: 'left', padding: '0 24px', height: 70, fontSize: 28, fontWeight: 700 };
const td: CSSProperties = { padding: '0 24px', height: 74, fontSize: 28 };

const UseCase = ({ id, flow, passed = false, note, shade = false }: { id: string; flow: string; passed?: boolean; note: string; shade?: boolean }) => (
  <tr style={{ background: shade ? tint : '#ffffff' }}>
    <td style={{ ...td, fontWeight: 700, color: navy }}>{id}</td>
    <td style={td}>{flow}</td>
    <td style={{ ...td, textAlign: 'center', fontWeight: 700, color: '#ffffff', background: passed ? green : amber }}>{passed ? 'Passed' : 'Partial'}</td>
    <td style={td}>{note}</td>
  </tr>
);

const Walkthrough: Page = () => (
  <section style={root()}>
    <Title>Walkthrough: 1 passed, 6 partial</Title>
    <Tracker current={4} />
    <table style={{ ...abs(PAD, 236, 1680), borderCollapse: 'collapse', borderRadius: 16, overflow: 'hidden' }}>
      <thead>
        <tr>
          <th style={{ ...th, width: 170 }}>Use case</th>
          <th style={{ ...th, width: 380 }}>Workflow</th>
          <th style={{ ...th, width: 180, textAlign: 'center' }}>Status</th>
          <th style={th}>Principal observation</th>
        </tr>
      </thead>
      <tbody>
        <UseCase id="UC-01" flow="Cognitive assessment" note="Planning result saved; memory payload failed" shade />
        <UseCase id="UC-02" flow="Offer management" note="Offer published; test picker failed" />
        <UseCase id="UC-03" flow="Technical assessment" note="Completed; result read back by both parties" passed shade />
        <UseCase id="UC-04" flow="Communication" note="Message persisted; call media unverified" />
        <UseCase id="UC-05" flow="Community" note="Post and comment persisted; self-friend action" shade />
        <UseCase id="UC-06" flow="Preferences and help" note="Preferences persisted; AI service down" />
        <UseCase id="UC-07" flow="Referrals and plans" note="Local state verified; no real payouts" shade />
      </tbody>
    </table>
    <p style={{ ...abs(PAD, 872, 1680), margin: 0, fontSize: 24, color: slate }}>
      Partial: the core path persisted, but a dependent step or external service failed or was not verified.
    </p>
    <Footer chapter="Report · Ch. 8 Walkthrough" />
  </section>
);

// ---------------------------------------------------------------------------
// 19. Defects
// ---------------------------------------------------------------------------
const Defect = ({ i, icon, area, what, fix, security = false }: { i: number; icon: string; area: string; what: string; fix: string; security?: boolean }) => (
  <Card left={PAD} top={286 + i * 128} width={1680} height={112} fill={security ? '#ffffff' : tint} border={security ? '#D12E7D' : undefined}>
    <Icon src={icon} size={68} bg={security ? '#D12E7D' : navy} left={24} top={20} />
    <div style={{ ...abs(116, 0, 310, 108), display: 'flex', alignItems: 'center', fontSize: 30, fontWeight: 700, color: navy }}>{area}</div>
    <div style={{ ...abs(440, 0, 720, 108), display: 'flex', alignItems: 'center', fontSize: 28, lineHeight: 1.3 }}>{what}</div>
    <div style={{ ...abs(1190, 0, 460, 108), display: 'flex', alignItems: 'center', fontSize: 28, lineHeight: 1.3, fontWeight: 700, color: security ? '#D12E7D' : indigo }}>{fix}</div>
  </Card>
);

const Defects: Page = () => (
  <section style={root()}>
    <Title>Five defects found and documented</Title>
    <Tracker current={4} />
    <div style={{ ...abs(PAD + 116, 238), fontSize: 24, fontWeight: 700, color: slate }}>Area</div>
    <div style={{ ...abs(PAD + 440, 238), fontSize: 24, fontWeight: 700, color: slate }}>What happened</div>
    <div style={{ ...abs(PAD + 1190, 238), fontSize: 24, fontWeight: 700, color: slate }}>Fix direction</div>
    <Defect i={0} icon={icBug} area="Memory Quest" what="Client sends mode, not memoryQuestMode: result not saved" fix="Align payload with contract" />
    <Defect i={1} icon={icLock} area="Decision forms" what="Another candidate could read a player's form" fix="Ownership check on read" security />
    <Defect i={2} icon={icRoute} area="Assessment picker" what="/assessments/pick parsed as an ID → HTTP 400" fix="Static route before /{id}" />
    <Defect i={3} icon={icLanguages} area="Localization" what="French notifications during an English session" fix="Use the session locale" />
    <Defect i={4} icon={icUserX} area="Community" what="Own post offered to add the author as a friend" fix="Hide actions on own posts" />
    <Footer chapter="Report · Ch. 8 Issues identified" />
  </section>
);

// ---------------------------------------------------------------------------
// 20. Takeaways (dark)
// ---------------------------------------------------------------------------
const Skill = ({ top, text }: { top: number; text: string }) => (
  <div style={{ ...abs(PAD, top, 680, 72), borderRadius: 999, background: '#ffffff', color: navy, fontSize: 28, fontWeight: 700, display: 'flex', alignItems: 'center', paddingLeft: 36, boxSizing: 'border-box' }}>
    {text}
  </div>
);

const NextStep = ({ i, text }: { i: number; text: string }) => (
  <>
    <div style={{ ...abs(48, 130 + (i - 1) * 180, 72, 72), borderRadius: 999, background: '#D12E7D', color: '#ffffff', fontSize: 30, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {i}
    </div>
    <p style={{ ...body, ...abs(150, 128 + (i - 1) * 180, 480), fontSize: 30, color: 'var(--osd-text)' }}>{text}</p>
  </>
);

const Takeaways: Page = () => (
  <section style={root(true)}>
    <Title dark>What I take away</Title>
    <Tracker current={5} dark />
    <p style={{ ...abs(PAD, 236, 900), margin: 0, fontSize: 44, lineHeight: 1.3, fontStyle: 'italic', fontWeight: 500 }}>
      “Treat a game as a complete feature: instructions, interaction, measurement, validation, scoring and feedback must stay consistent from Flutter to the backend.”
    </p>
    <div style={{ ...abs(PAD, 640), fontSize: 28, fontWeight: 700, color: '#C9D6EE' }}>Skills developed</div>
    <Skill top={694} text="Mobile ↔ backend integration" />
    <Skill top={784} text="Game protocols as typed payloads" />
    <Skill top={874} text="Async state across screens" />
    <Card left={1110} top={236} width={690} height={700} fill="#ffffff">
      <p style={{ ...h3, ...abs(48, 44) }}>Next steps</p>
      <NextStep i={1} text="Fix the five defects, starting with the ownership check" />
      <NextStep i={2} text="Integration-test email/OTP, push, calls and payments" />
      <NextStep i={3} text="Bring the AI help service online and re-run the walkthrough" />
    </Card>
    <Footer dark />
  </section>
);

// ---------------------------------------------------------------------------
// 21. Thanks
// ---------------------------------------------------------------------------
const Thanks: Page = () => (
  <section style={root(true)}>
    <div style={{ ...abs(852, 180, 216, 216), borderRadius: 999, background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <img src={zennytLogo} alt="Zennyt" style={{ width: 144, height: 144 }} />
    </div>
    <h1 style={{ ...abs(0, 460, 1920), margin: 0, textAlign: 'center', fontSize: 132, fontWeight: 800, fontFamily: 'var(--osd-font-display)' }}>Thank you</h1>
    <div style={{ ...abs(0, 630, 1920), textAlign: 'center', fontSize: 44, color: '#C9D6EE' }}>Questions and discussion</div>
    <div style={{ ...abs(0, 790, 1920), textAlign: 'center', fontSize: 30 }}>Mohamed Slimane · Full Stack Mobile Developer · Zennyt</div>
  </section>
);

export default [
  Cover,
  Glance,
  Context,
  Challenge,
  Architecture,
  GamesContext,
  Stack,
  Catalogue,
  PipelineRecord,
  PipelineServer,
  PipelineShow,
  Journey,
  ResultZoom,
  Replay,
  Localization,
  RecruiterFlow,
  Suites,
  Walkthrough,
  Defects,
  Takeaways,
  Thanks,
] satisfies Page[];

export const notes: (string | undefined)[] = [
  `Good morning. I'm Mohamed Slimane. This summer I worked at Zennyt as a Full Stack Mobile Developer, June to the end of August, supervised by Mehdi Mtir and Abdelmonem Aisa.
My part was the cognitive games: what the candidate plays on the phone, and how those plays become trustworthy results on the server. Each footer points to the matching report chapter.`,
  `In numbers: three months, fourteen mini-games in nine families, six languages, and 2,372 automated tests passing at the end.
Watch the five dots: they become the chapter tracker in the top-right corner for the rest of the talk.`,
  `Zennyt serves three audiences. Candidates keep a profile, browse offers, play the games and take tests. Recruiters publish offers, author tests and review applicants with a Fit Score that mixes hard skills and game results. Staff use Game Studio and Platform Console.`,
  `The core problem: a game result is only useful to a recruiter if it can be trusted. The phone captures inputs and timings, the backend owns validation and scoring, and the experience must stay coherent across very different games, six languages and many screens. Four objectives follow.`,
  `A Spring Boot modular monolith with seven contexts, serving the Flutter app and two React consoles, backed by PostgreSQL, plus a Python help service behind an authenticated gateway.
Games, in magenta, is where I worked. Contexts are layered and ArchUnit keeps the domain framework-free; they talk through domain events, which is how a game result reaches the recruitment projections.`,
  `Zooming into the Games context. A GameSession holds the player, family, status and attempts. MiniGame defines the tasks of each family. Scores keep raw, maximum and normalized values. Selected games also keep a runtime snapshot and an assigned form. A session completes only when every required mini-game has a valid attempt.`,
  `The stack by layer: Flutter with Riverpod, go_router and Flame on mobile; Java and Spring Boot over PostgreSQL with OpenAPI-generated interfaces; React, TypeScript and TanStack Start for the staff apps; Python, FastAPI, LangChain and Chroma for help. JUnit, ArchUnit, Flutter tests and contract-parity checks keep it honest.`,
  `Nine families, fourteen mini-games: planning, response speed, working memory, decisions, emotional regulation, sustained attention, visuomotor tracking, visuospatial memory and risk behaviour. That variety is why a shared measurement model and shared components mattered.`,
  `The heart of my contribution, in three beats. First, on the phone: Flutter records raw observations. Taps, answers, timings. Never a score.`,
  `Then the server: the mini-game ID selects the expected schema, the session is checked against the player and mini-game, the payload is validated and a domain service computes the score. Move Fast is the example: practice and measured trials are separated in the payload.`,
  `Finally the app shows the returned score and breakdown. The rule that never bends: the client never sends an authoritative score.`,
  `Every game follows the same journey from shared components: consent, instructions or practice, gameplay, results, back to Progress. Navigation guards catch accidental exits; lifecycle handling protects a run in progress.`,
  `Zooming into the result. This is a real server result from Optimal Path: 10 out of 10, a 61-step route matching the server-derived optimum. Raw performance, normalized score and indicators are always shown separately.`,
  `For action-based games the phone sends actions, not outcomes, and the server replays them. BART pumps and collects become explosions and earnings; IST box openings become the information available at choice time; I Place placements are replayed against a controlled layout.`,
  `All game text goes through localization keys in six languages, with ICU plurals, layouts that survive German and Dutch, and reading preferences: text size, contrast, bold text, reduced motion.`,
  `I also tested end to end on the native iPhone build. Recruiter creates a test and an offer; the candidate consents and answers shuffled questions without the answer key; the server grades it at 100 percent; the candidate applies. Caveat: attaching the test from the offer form failed, so it went through the API.`,
  `Automated suites are green: 843 backend tests with 41 skipped, 1,529 Flutter tests. 221 API checks covered all fourteen submissions plus negative tests; 218 passed, 2 failed, 1 blocked. External services still need integration testing.`,
  `For the use cases: one fully passed, six partial. Partial means the core path persisted but a step failed or depended on an unverified external service.`,
  `Five concrete defects. The most serious, highlighted, is the Decision forms read: it needs an ownership check. Memory Quest sends the wrong field name. The picker route collides with the ID route. Notifications ignored the session language. And an author could befriend themselves.`,
  `The main lesson: a game is not a screen, it's a complete feature, and almost every bug I found was two of its parts drifting apart. Next: fix the five defects starting with the security one, integration-test the external services, and re-run the walkthrough with help online.`,
  `Thank you. I'm happy to take questions on the games, the architecture or the testing.`,
];
