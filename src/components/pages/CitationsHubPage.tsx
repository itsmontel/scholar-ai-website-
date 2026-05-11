import React, { useEffect, useState } from 'react';
import Header from '../common/Header';
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

interface CitationsHubPageProps {
  onNavigate: (page: string) => void;
  user?: User | null;
  onLogout?: () => void;
}

interface RecentCitationSearch {
  id: string;
  research_topic: string;
  citation_style: string;
  year_range?: string;
  search_results?: {
    citations?: unknown[];
    keywords?: string[];
    searchStrategies?: string[];
    researchTopic?: string;
    citationStyle?: string;
    yearRange?: string;
  };
  created_at: string;
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

const CitationsHubPage: React.FC<CitationsHubPageProps> = ({ onNavigate, user, onLogout }) => {
  const [recent, setRecent] = useState<RecentCitationSearch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) { setLoading(false); return; }
        const res = await fetch(`${API_URL}/analysis/citation-history?limit=10`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) { setLoading(false); return; }
        const json = await res.json();
        if (cancelled) return;
        const items: RecentCitationSearch[] = json?.data || json?.history || [];
        setRecent(items.slice(0, 4));
      } catch {
        /* silent */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleOpen = (search: RecentCitationSearch) => {
    if (typeof window !== 'undefined' && search.search_results) {
      // Stash the saved search results so CitationResultsPage can pick them up.
      const payload = {
        citations: search.search_results.citations ?? [],
        keywords: search.search_results.keywords ?? [],
        searchStrategies: search.search_results.searchStrategies ?? [],
        researchTopic: search.research_topic || search.search_results.researchTopic || '',
        citationStyle: search.citation_style || search.search_results.citationStyle || 'APA',
        yearRange: search.year_range || search.search_results.yearRange,
      };
      localStorage.setItem('citationSearchResults', JSON.stringify(payload));
    }
    onNavigate('citation-results');
  };

  const items: HubItem[] = recent.map((s) => {
    const count = s.search_results?.citations?.length ?? 0;
    return {
      id: s.id,
      title: s.research_topic || 'Untitled search',
      meta: `${timeAgo(s.created_at)} · ${s.citation_style || 'APA'} · ${count} ${count === 1 ? 'source' : 'sources'}`,
      icon: '📖',
      onOpen: () => handleOpen(s),
    };
  });

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#FAFAFA] dark:bg-stone-950">
      <Header onNavigate={onNavigate} user={user as User} onLogout={onLogout} currentPage="citations" />
      <FeatureHub
        title="Citations"
        subtitle="Find peer-reviewed sources in APA, MLA, Chicago & more."
        mascotSrc="/mascot-thinking.webp"
        themeColor="#FF9600"
        themeBorderColor="#D97F00"
        themeBgColor="#FFF4E0"
        createLabel="+ Find new citations"
        createSubLabel="Search by topic — get formatted, real sources"
        onCreate={() => onNavigate('citations')}
        recentItems={items}
        loading={loading}
        onViewAll={() => onNavigate('citation-history')}
        emptyStateMessage="Your citation searches will live here. Run your first search above."
      />
      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default CitationsHubPage;
