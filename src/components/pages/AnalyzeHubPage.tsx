import React, { useEffect, useState } from 'react';
import LoggedInPageShell from '../workspace/LoggedInPageShell';
import Footer from '../common/Footer';
import FeatureHub, { type HubItem } from '../common/FeatureHub';

interface User {
  id: string;
  email: string;
  name?: string;
  username?: string;
  plan?: string;
  subscription_status?: string;
}

interface AnalyzeHubPageProps {
  onNavigate: (page: string) => void;
  user?: User | null;
  onLogout?: () => void;
}

interface RecentAnalysis {
  id: string;
  analysis_type: string;
  created_at: string;
  documents?: { title?: string; original_filename?: string } | null;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function timeAgo(iso: string): string {
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return '';
  const diff = Math.max(0, Date.now() - d);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const AnalyzeHubPage: React.FC<AnalyzeHubPageProps> = ({ onNavigate, user, onLogout }) => {
  const [recent, setRecent] = useState<RecentAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) { setLoading(false); return; }
        const res = await fetch(`${API_URL}/analysis/history?limit=10`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) { setLoading(false); return; }
        const json = await res.json();
        if (cancelled) return;
        const items: RecentAnalysis[] = json?.data || json?.history || [];
        setRecent(items.slice(0, 4));
      } catch {
        /* silent */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const items: HubItem[] = recent.map((a) => ({
    id: a.id,
    title: a.documents?.title || a.documents?.original_filename || 'Untitled paper',
    meta: `${timeAgo(a.created_at)}${a.analysis_type ? ' · ' + a.analysis_type.replace(/_/g, ' ') : ''}`,
    icon: '📝',
    onOpen: () => {
      if (typeof window !== 'undefined') {
        // Push the analysis ID into the URL so AnalysisPage can pick it up.
        const url = new URL(window.location.href);
        url.pathname = '/analysis';
        url.searchParams.set('id', a.id);
        window.history.pushState({}, '', url);
      }
      onNavigate('analysis');
    },
  }));

  return (
    <LoggedInPageShell className="relative min-h-screen overflow-x-clip bg-[#FAFAFA] dark:bg-stone-950" user={user as User} onNavigate={onNavigate} onLogout={onLogout} currentPage="analyze">
      <FeatureHub
        title="Essay analysis"
        subtitle="Paste an essay — get professor-level feedback, line-by-line."
        mascotSrc="/mascot-paper.webp"
        themeColor="#A560E8"
        themeBorderColor="#8A48C7"
        themeBgColor="#F3EAFF"
        createLabel="+ Analyze a new essay"
        createSubLabel="Drop in a draft and get feedback in seconds"
        onCreate={() => onNavigate('analyze')}
        recentItems={items}
        loading={loading}
        onViewAll={() => onNavigate('library')}
        emptyStateMessage="Your analyzed papers will appear here. Run your first analysis above."
      />
      <Footer onNavigate={onNavigate} />
    </LoggedInPageShell>
  );
};

export default AnalyzeHubPage;
