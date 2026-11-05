import { useEffect, useState } from 'react';
import { VERIFY_EMAIL_EVENT, type VerifyEmailDetail } from '../../utils/verifyEmail';
import { trackEvent } from '../../utils/analytics';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const COPY: Record<VerifyEmailDetail['reason'], { title: string; body: string }> = {
  verify: {
    title: 'Verify your email to keep grading',
    body: 'Your first grade was on us. Click the link we emailed you to confirm your account, and your free grade each month is yours to keep.',
  },
  ip_limit: {
    title: 'Verify your email to keep grading',
    body: 'A lot of new accounts have graded from this connection today. Click the link we emailed you and you can carry on.',
  },
  checkout: {
    title: 'Verify your email before upgrading',
    body: 'So your receipts and your account always reach you. Click the link we emailed you, then come back and upgrade.',
  },
};

/**
 * One prompt for the whole app, opened by openVerifyEmailIfNeeded().
 * Mounted once at the root, so the analysis page, the paywall and every
 * checkout button share it.
 */
export default function VerifyEmailPrompt() {
  const [detail, setDetail] = useState<VerifyEmailDetail | null>(null);
  const [sending, setSending] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    const onOpen = (e: Event) => {
      const d = (e as CustomEvent<VerifyEmailDetail>).detail;
      setDetail(d);
      setNote('');
      trackEvent('verify_email_prompt', { reason: d.reason });
    };
    window.addEventListener(VERIFY_EMAIL_EVENT, onOpen);
    return () => window.removeEventListener(VERIFY_EMAIL_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!detail) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDetail(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [detail]);

  if (!detail) return null;

  const copy = COPY[detail.reason] ?? COPY.verify;

  const resend = async () => {
    if (!detail.email) {
      setNote('Log out and back in, then try again.');
      return;
    }
    setSending(true);
    setNote('');
    try {
      const res = await fetch(`${API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: detail.email }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setNote('Sent. Check your inbox, and your spam folder just in case.');
      else if (/already verified/i.test(data?.message || '')) setNote('This email is already verified. Try again now.');
      else setNote(data?.message || 'We could not send it. Try again in a minute.');
    } catch {
      setNote('Network problem. Try again in a minute.');
    } finally {
      setSending(false);
    }
  };

  const font = { fontFamily: '"Nunito", system-ui, sans-serif' } as const;

  return (
    <div className="fixed inset-0 z-[260] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="verify-email-title">
      <div className="absolute inset-0 bg-[#2A1540]/60" onClick={() => setDetail(null)} aria-hidden />
      <section
        className="relative w-full max-w-[480px] rounded-[24px] border-2 border-[#1C1917] bg-white p-6 text-center text-[#1C1917] sm:p-8"
        style={{ boxShadow: '8px 8px 0 #7733B5', ...font }}
      >
        <button
          type="button"
          onClick={() => setDetail(null)}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#1C1917] bg-white hover:bg-[#FAF7FF]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
        <img src="/mascot-paper-still.webp" alt="" width={88} height={88} className="mx-auto h-[88px] w-[88px] object-contain" />
        <h2 id="verify-email-title" className="mt-3 text-[24px] font-black leading-[1.15] sm:text-[26px]">{copy.title}</h2>
        <p className="mt-2 text-[15px] font-semibold leading-relaxed text-[#57534E]">{copy.body}</p>
        {detail.email && (
          <p className="mx-auto mt-4 inline-block max-w-full truncate rounded-full border-2 border-[#1C1917] bg-[#F3EEFF] px-4 py-1.5 text-[14px] font-black">
            {detail.email}
          </p>
        )}
        <div className="mt-5 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => setDetail(null)}
            className="min-h-[54px] rounded-[14px] border-2 border-[#1C1917] bg-[#58CC02] text-[17px] font-black text-[#1C1917] transition-all hover:bg-[#61E002] active:translate-x-px active:translate-y-px"
            style={{ boxShadow: '4px 4px 0 #1C1917' }}
          >
            Got it
          </button>
          <button
            type="button"
            onClick={resend}
            disabled={sending}
            className="min-h-[50px] rounded-[14px] border-2 border-[#1C1917] bg-white text-[15px] font-extrabold text-[#1C1917] hover:bg-[#FAF7FF] disabled:opacity-60"
          >
            {sending ? 'Sending…' : 'Resend the email'}
          </button>
        </div>
        {note && <p className="mt-3 text-[13px] font-bold text-[#57534E]" role="status">{note}</p>}
      </section>
    </div>
  );
}
