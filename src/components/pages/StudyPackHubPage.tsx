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

interface StudyPackHubPageProps {
  onNavigate: (page: string, options?: { studyPack?: { data: unknown; title: string } }) => void;
  user?: User | null;
  onLogout?: () => void;
}

interface RecentStudyPack {
  id: string;
  title: string;
  quiz_type: string;
  created_at: string;
  question_count: number;
  questions: unknown;
  quiz_bank?: unknown;
  quiz_display_count?: number;
  source_word_count: number;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/* Friendly relative-time formatter — "2 days ago", "Just now", etc. */
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

const StudyPackHubPage: React.FC<StudyPackHubPageProps> = ({ onNavigate, user, onLogout }) => {
  const [recent, setRecent] = useState<RecentStudyPack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) { setLoading(false); return; }
        const res = await fetch(`${API_URL}/analysis/quiz-history?limit=20`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) { setLoading(false); return; }
        const json = await res.json();
        if (cancelled) return;
        // Filter to study packs only — that's what this hub is for.
        const items: RecentStudyPack[] = (json?.data || json?.history || [])
          .filter((row: { quiz_type?: string }) => row.quiz_type === 'study_pack');
        setRecent(items.slice(0, 4));
      } catch {
        /* network errors are silent — we just show the empty state */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleOpen = (pack: RecentStudyPack) => {
    onNavigate('study-pack-viewer', {
      studyPack: {
        data: { questions: pack.questions, quiz_bank: pack.quiz_bank, ...pack },
        title: pack.title,
      },
    });
  };

  const items: HubItem[] = recent.map((pack) => ({
    id: pack.id,
    title: pack.title || 'Untitled study pack',
    meta: `${timeAgo(pack.created_at)} · ${pack.question_count || 0} ${pack.question_count === 1 ? 'card' : 'cards'}`,
    icon: '📚',
    onOpen: () => handleOpen(pack),
  }));

  return (
    <LoggedInPageShell className="relative min-h-screen overflow-x-clip bg-[#FAFAFA] dark:bg-stone-950" user={user as User} onNavigate={onNavigate} onLogout={onLogout} currentPage="study-pack">
      <FeatureHub
        title="Study packs"
        subtitle="Turn your notes into flashcards, quizzes, crosswords & more."
        mascotSrc="/mascot-study.webp"
        themeColor="#FF9600"
        themeBorderColor="#D97F00"
        themeBgColor="#FFF4E0"
        createLabel="+ Create new study pack"
        createSubLabel="Paste your notes — get a full pack in seconds"
        onCreate={() => onNavigate('study-pack')}
        recentItems={items}
        loading={loading}
        onViewAll={() => onNavigate('quiz-history')}
        emptyStateMessage="Your first study pack will live here. Create one above to get started."
      />
      <Footer onNavigate={onNavigate} />
    </LoggedInPageShell>
  );
};

export default StudyPackHubPage;
