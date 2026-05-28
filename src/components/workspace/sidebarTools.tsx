import type { ReactNode } from 'react';
import type { WorkspaceView } from './types';

export const sidebarIcons = {
  Doc: () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h4m-7 4h12a2 2 0 002-2V8.83a2 2 0 00-.59-1.42l-3.83-3.83A2 2 0 0014.17 3H6a2 2 0 00-2 2v15a2 2 0 002 2z" /></svg>),
  Plus: () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m-8-8h16" /></svg>),
  Upload: () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.25} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" /></svg>),
  Search: () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.25} viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="M21 21l-4.5-4.5" /></svg>),
  Sparkle: () => (<svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l1.6 4.9L18 9l-4.4 2.1L12 16l-1.6-4.9L6 9l4.4-2.1z"/></svg>),
  Download: () => (<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.25} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" /></svg>),
  Trash: () => (<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.25} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" /></svg>),
  ArrowR: () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>),
  ArrowL: () => (<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>),
  Review: () => (<svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2.25} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>),
  Pack: () => (<svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2.1} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3l9 4.5-9 4.5-9-4.5L12 3zM3 12l9 4.5L21 12M3 16.5L12 21l9-4.5" /></svg>),
  Cite: () => (<svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2.1} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 006.5 22H20V2H6.5A2.5 2.5 0 004 4.5v15z" /></svg>),
  Game: () => (<svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2.1} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 11h4m-2-2v4m6-3h.01M17 13h.01M7.5 6h9a4.5 4.5 0 014.47 5l-.9 6.3A2.5 2.5 0 0117.6 19.5c-1 0-1.9-.6-2.3-1.5l-.5-1a2 2 0 00-1.8-1.1h-1.9a2 2 0 00-1.8 1.1l-.5 1c-.4.9-1.3 1.5-2.3 1.5a2.5 2.5 0 01-2.47-2.2l-.9-6.3A4.5 4.5 0 017.5 6z" /></svg>),
};

/* ─── Workspace sidebar ──────────────────────────────────────
   The single navigation surface for the whole product. Clicking an
   item swaps the in-page view — it never leaves the page, so the
   workspace always feels like one app. Documents is the home base;
   every study tool lives one click away in the same shell. */
/* Each tool gets its own brand colour for the workspace rail.
 * `tint` is the base colour, `tintBg` is the active background,
 * `tintFg` is the text + icon tone on the active row. */
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
  { view: 'analyze',      label: 'Analyze',      icon: <sidebarIcons.Sparkle />, hint: 'Professor-style feedback', tint: '#A560E8', tintBg: '#F3EAFF', tintBgDark: 'rgba(165,96,232,0.15)', tintFg: '#8A48C7', tintFgDark: '#C9A0F0' },
  { view: 'daily-review', label: 'Daily review', icon: <sidebarIcons.Review />,  hint: 'Quick recall session',     tint: '#58CC02', tintBg: '#E5F8D0', tintBgDark: 'rgba(88,204,2,0.15)',  tintFg: '#46A302', tintFgDark: '#A6E66E' },
  { view: 'study-packs',  label: 'Study packs',  icon: <sidebarIcons.Pack />,    hint: 'Notes → lessons & quizzes', tint: '#FF9600', tintBg: '#FFF4E0', tintBgDark: 'rgba(255,150,0,0.15)', tintFg: '#B85F00', tintFgDark: '#FFBD5C' },
  { view: 'citations',    label: 'Citations',    icon: <sidebarIcons.Cite />,    hint: 'Find & format sources',     tint: '#1CB0F6', tintBg: '#DDF4FF', tintBgDark: 'rgba(28,176,246,0.15)', tintFg: '#1486B5', tintFgDark: '#7DD3FC' },
  { view: 'games',        label: 'Arcade mode',  icon: <sidebarIcons.Game />,    hint: 'Learn by playing',          tint: '#FF4B82', tintBg: '#FFE8EE', tintBgDark: 'rgba(255,75,130,0.15)', tintFg: '#A82754', tintFgDark: '#FFA0BC' },
];
