import type { ReactNode } from 'react';
import type { WorkspaceView } from './types';

export const sidebarIcons = {
  Home: () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.6 10.4L12 3.8l8.4 6.6V19a1.6 1.6 0 01-1.6 1.6h-3.6v-5.2h-6.4v5.2H5.2A1.6 1.6 0 013.6 19v-8.6z" /></svg>),
  Doc: () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h4m-7 4h12a2 2 0 002-2V8.83a2 2 0 00-.59-1.42l-3.83-3.83A2 2 0 0014.17 3H6a2 2 0 00-2 2v15a2 2 0 002 2z" /></svg>),
  Plus: () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m-8-8h16" /></svg>),
  Upload: () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.25} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" /></svg>),
  Search: () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.25} viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="M21 21l-4.5-4.5" /></svg>),
  Sparkle: () => (<svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l1.6 4.9L18 9l-4.4 2.1L12 16l-1.6-4.9L6 9l4.4-2.1z"/></svg>),
  Download: () => (<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.25} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" /></svg>),
  Trash: () => (<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.25} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" /></svg>),
  ArrowR: () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>),
  ArrowL: () => (<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>),
  /* ─── Tool glyphs — thin-line set that matches the dashboard rail.
     Drawn at 24px on a 1.9 stroke so they read as calm outlines
     rather than the heavier chunky icons used inside the tools. */
  Wand: () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.5 5.5l4 4L9 19H5v-4l9.5-9.5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M17.5 2.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8zM5.5 3l.5 1.3L7.3 5l-1.3.5L5.5 7 5 5.5 3.7 5 5 4.3 5.5 3z" /></svg>),
  Review: () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15.5" rx="3" /><path strokeLinecap="round" d="M8 3v4M16 3v4M3.5 10h17" /><path strokeLinecap="round" strokeLinejoin="round" d="M9.2 14.8l2 2 3.6-3.8" /></svg>),
  Pack: () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3.2l8.5 4.3-8.5 4.3-8.5-4.3L12 3.2z" /><path strokeLinecap="round" strokeLinejoin="round" d="M3.5 12l8.5 4.3 8.5-4.3M3.5 16.4l8.5 4.4 8.5-4.4" /></svg>),
  Cite: () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24"><rect x="3.5" y="4.5" width="17" height="15" rx="4" /><path strokeLinecap="round" strokeLinejoin="round" d="M9.6 15.2c-1.5 0-2.4-1-2.4-2.4 0-1.9 1.3-3.4 3.1-4.1M16 15.2c-1.5 0-2.4-1-2.4-2.4 0-1.9 1.3-3.4 3.1-4.1" /></svg>),
  Game: () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7.6 7.5h8.8a4.5 4.5 0 014.44 5.26l-.62 3.62A2.9 2.9 0 0117.36 18c-.9 0-1.74-.42-2.28-1.14L14 15.5h-4l-1.08 1.36A2.86 2.86 0 016.64 18a2.9 2.9 0 01-2.86-3.62l.62-3.62A4.5 4.5 0 017.6 7.5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M7.7 11.6h2.4m-1.2-1.2v2.4M15.4 11h.01M17.4 12.6h.01" /></svg>),
};

/* ─── Workspace sidebar ──────────────────────────────────────
   The single navigation surface for the whole product. Clicking an
   item swaps the in-page view — it never leaves the page, so the
   workspace always feels like one app. Dashboard is the home base;
   every study tool lives one click away in the same shell. */
/* Each tool shares the WriteScholar purple palette so the workspace
 * feels like one product. Panel headers and mobile drawer read from
 * these tint fields. */
export const SIDEBAR_TOOLS: {
  view: WorkspaceView;
  label: string;
  icon: ReactNode;
  hint: string;
  tint: string;
  tintBg: string;
  tintBgDark: string;
  tintFg: string;
  tintFgDark: string;
}[] = [
  { view: 'analyze',      label: 'Analyze',      icon: <sidebarIcons.Wand />,   hint: 'Professor-style feedback',  tint: '#A560E8', tintBg: '#F3EAFF', tintBgDark: 'rgba(165,96,232,0.15)', tintFg: '#8A48C7', tintFgDark: '#C9A0F0' },
  { view: 'study-packs',  label: 'Study Packs',  icon: <sidebarIcons.Pack />,   hint: 'Notes → lessons & quizzes', tint: '#A560E8', tintBg: '#F3EAFF', tintBgDark: 'rgba(165,96,232,0.15)', tintFg: '#8A48C7', tintFgDark: '#C9A0F0' },
  { view: 'citations',    label: 'Citations',    icon: <sidebarIcons.Cite />,   hint: 'Find & format sources',     tint: '#A560E8', tintBg: '#F3EAFF', tintBgDark: 'rgba(165,96,232,0.15)', tintFg: '#8A48C7', tintFgDark: '#C9A0F0' },
  { view: 'daily-review', label: 'Daily Review', icon: <sidebarIcons.Review />, hint: 'Quick recall session',      tint: '#A560E8', tintBg: '#F3EAFF', tintBgDark: 'rgba(165,96,232,0.15)', tintFg: '#8A48C7', tintFgDark: '#C9A0F0' },
  { view: 'games',        label: 'Arcade Mode',  icon: <sidebarIcons.Game />,   hint: 'Learn by playing',          tint: '#A560E8', tintBg: '#F3EAFF', tintBgDark: 'rgba(165,96,232,0.15)', tintFg: '#8A48C7', tintFgDark: '#C9A0F0' },
];
