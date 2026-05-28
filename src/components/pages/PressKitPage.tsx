import { useEffect, useState } from 'react';
import LoggedInPageShell from '../workspace/LoggedInPageShell';
import Footer from '../common/Footer';
import { applyPageSeoTags } from '../../utils/seo';

/**
 * Press / media kit page.
 *
 * Designed to make WriteScholar trivially easy to write about. Journalists,
 * student-blog editors, and content marketers don't have time to dig — they
 * want logos, copy, screenshots, and a quote in one place. This page is the
 * one URL we send them.
 *
 * Why it earns backlinks: every time a journalist or blogger uses our
 * boilerplate or a logo, they almost always link back here for source
 * attribution. Press kits are some of the highest-converting backlink assets
 * on the internet.
 */

interface PressKitPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout: () => void;
}

const PressKitPage = ({ onNavigate, user, onLogout }: PressKitPageProps) => {
  useEffect(() => {
    applyPageSeoTags({
      title: 'Press & Media Kit | WriteScholar',
      description: 'Press, media, and brand assets for WriteScholar. Download logos, screenshots, boilerplate copy, and founder bio. Press inquiries welcome.',
    });
  }, []);

  return (
    <LoggedInPageShell className="min-h-screen flex flex-col bg-stone-50 dark:bg-stone-950" user={user} onNavigate={onNavigate} onLogout={onLogout}>

      {/* Hero */}
      <section className="relative pt-14 sm:pt-20 pb-10 sm:pb-12 border-b border-stone-200 dark:border-stone-800 overflow-hidden">
        <div
          className="absolute inset-0 opacity-30 dark:opacity-20"
          style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 0%, #A560E830, transparent 60%)' }}
          aria-hidden
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-extrabold uppercase tracking-wider border mb-5 bg-[#A560E8]/15 border-[#A560E8]/40 text-[#A560E8]">
            Press &amp; Media
          </span>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50 mb-5 text-balance leading-[1.05]">
            Press &amp; media kit
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-stone-700 dark:text-stone-300 leading-relaxed max-w-2xl mx-auto mb-8">
            Logos, boilerplate copy, screenshots, and founder bio for journalists, bloggers, and content creators writing about WriteScholar.
          </p>

          {/* CTA wrapper, relative so the pointing-mascot can be absolutely
              positioned beside it. On desktop the mascot sits to the left of
              the email button so it visually "points" at the call-to-action.
              Hidden on small screens because the mascot crowds the layout. */}
          <div className="relative inline-flex items-center justify-center">
            <img
              src="/mascot-pointing.webp"
              alt=""
              aria-hidden
              loading="eager"
              className="hidden md:block absolute right-full -mr-2 lg:-mr-3 -bottom-8 lg:-bottom-10 w-24 lg:w-28 h-auto pointer-events-none"
            />
            <a
              href="mailto:press@writescholar.com"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-extrabold text-white border-2 border-b-4 transition-transform hover:-translate-y-0.5 active:translate-y-0 active:border-b-2 text-[15px] bg-[#A560E8] border-[#8A48C7] shadow-md"
              style={{ boxShadow: '0 6px 16px -4px rgba(165, 96, 232, 0.4)' }}
            >
              Email press@writescholar.com
              <span aria-hidden>→</span>
            </a>
          </div>
        </div>
      </section>

      {/* Body */}
      <main className="flex-1 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Boilerplate copy — three lengths */}
          <Section heading="Boilerplate copy" subtitle="Ready-to-paste descriptions in three lengths.">
            <div className="space-y-4">
              <CopyableBlock
                label="Short (1 sentence)"
                text="WriteScholar is a free AI study app for college students that turns lecture notes into flashcards, quizzes, summaries, and graded essay feedback in seconds."
              />
              <CopyableBlock
                label="Medium (~50 words)"
                text="WriteScholar is a free AI study app for college and university students. Paste any lecture notes or textbook chapter and the AI generates flashcards, multiple-choice quizzes, summaries, and structured study guides in under 60 seconds. The platform also includes an AI essay grader that delivers professor-style rubric feedback. Used by students all over the world."
              />
              <CopyableBlock
                label="Long (~150 words)"
                text="WriteScholar is an all-in-one AI study app built for college and university students. The platform combines a free AI essay grader (with rubric-based feedback, line-by-line annotations, and a polished revision) with a study-pack generator that turns any lecture notes into flashcards, multiple-choice quizzes, summaries, and crosswords in under 60 seconds. WriteScholar also includes a free citation generator (APA, MLA, Chicago, Harvard, IEEE, Vancouver), a Pomodoro timer, GPA calculator, and 7+ other free study tools. The product is a mobile-responsive web app with a free tier covering most casual student use cases. WriteScholar is used by students all over the world. Pro plans start at $19.99/month."
              />
            </div>
          </Section>

          {/* Logo + brand assets */}
          <Section heading="Logo &amp; brand assets" subtitle="Right-click the logo to save. For SVG/EPS or custom variants, email press@writescholar.com.">
            <div className="max-w-md">
              <BrandAsset
                title="Primary logo"
                subtitle="Use on light backgrounds"
                background="#FFFFFF"
                imgSrc="/main-logo.png"
              />
            </div>
          </Section>

          {/* Brand colours */}
          <Section heading="Brand colours" subtitle="Hex codes for the WriteScholar palette.">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
              <ColorSwatch hex="#A560E8" name="Brand Purple" />
              <ColorSwatch hex="#58CC02" name="Success Green" />
              <ColorSwatch hex="#1CB0F6" name="Info Blue" />
              <ColorSwatch hex="#FF9600" name="Energy Orange" />
              <ColorSwatch hex="#FF4B4B" name="Alert Red" />
            </div>
          </Section>

          {/* Stats */}
          <Section heading="Key stats" subtitle="Recent numbers, refreshed quarterly.">
            <div className="grid sm:grid-cols-3 gap-3">
              <StatBlock value="Worldwide" label="Student community" />
              <StatBlock value="14" label="Free tools available" />
              <StatBlock value="6" label="Citation styles supported" />
              <StatBlock value="Web" label="Platform" />
              <StatBlock value="$19.99/mo" label="Pro plan starting price" />
              <StatBlock value="Free" label="Forever-free tier" />
            </div>
          </Section>

          {/* Founder bio + quote */}
          <Section heading="Founder &amp; spokesperson">
            <div className="rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-[#A560E8]/15 border-4 border-[#A560E8]/40 flex items-center justify-center text-2xl font-extrabold text-[#A560E8]" aria-hidden>
                  M
                </div>
                <div>
                  <div className="font-extrabold text-stone-900 dark:text-stone-50 text-lg">Montel</div>
                  <div className="text-[13px] text-stone-600 dark:text-stone-400">Founder &amp; CEO, WriteScholar</div>
                </div>
              </div>
              <p className="text-stone-700 dark:text-stone-300 leading-relaxed text-[14px] sm:text-[15px] mb-4">
                Montel is the founder and CEO of WriteScholar. He started building the platform after watching college students juggle Quizlet, Grammarly, EasyBib, Notion, and Pomodoro apps to do what should have been one workflow. WriteScholar bundles those tools into a single AI-powered study app focused on getting students As, not subscribing them to ten separate services.
              </p>
              <CopyableBlock
                label="Pre-approved quote"
                text={`"Most students fail their first college essay because no one taught them how a thesis statement actually works. AI tools shouldn't replace that learning, they should compress the feedback loop. That's what WriteScholar does: paste your essay, get the rubric feedback you'd normally wait two weeks for from your professor."`}
                small
              />
            </div>
          </Section>

          {/* Topics WriteScholar can comment on */}
          <Section heading="Topics we can speak to" subtitle="Areas where WriteScholar can provide expert commentary, data, or interviews.">
            <div className="grid sm:grid-cols-2 gap-2.5">
              {[
                'AI in education and academic integrity',
                'Student study habits and learning science',
                'College essay writing and admissions',
                'Quizlet, Grammarly, and ed-tech competition',
                'Cost of college tools and student spending',
                'Spaced repetition and active recall research',
                'Academic citation standards (APA, MLA, Chicago)',
                'Free vs paid tools in student software',
              ].map((t) => (
                <div key={t} className="rounded-xl border-2 border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-4 py-2.5 text-[13px] text-stone-800 dark:text-stone-200 font-medium">
                  • {t}
                </div>
              ))}
            </div>
          </Section>

          {/* Press contact */}
          <Section heading="Press inquiries">
            <div className="rounded-2xl border-2 border-b-4 border-[#A560E8]/40 bg-[#F3EAFF]/40 dark:bg-[#A560E8]/10 p-6 text-center">
              <p className="text-stone-700 dark:text-stone-300 leading-relaxed text-[15px] mb-4">
                For interviews, custom assets, exclusive data, or anything else:
              </p>
              <a
                href="mailto:press@writescholar.com"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-extrabold text-white border-2 border-b-4 transition-transform hover:-translate-y-0.5 active:translate-y-0 active:border-b-2 text-[15px] bg-[#A560E8] border-[#8A48C7]"
              >
                press@writescholar.com
              </a>
              <p className="text-[12px] text-stone-500 dark:text-stone-400 mt-3">
                Typical response time: 24 hours on weekdays.
              </p>
            </div>
          </Section>
        </div>
      </main>

      <Footer onNavigate={onNavigate} />
    </LoggedInPageShell>
  );
};

/* ─── Inline section helpers ─────────────────────────────────── */

const Section = ({ heading, subtitle, children }: { heading: React.ReactNode; subtitle?: string; children: React.ReactNode }) => (
  <section>
    <div className="flex items-center gap-3 mb-2">
      <span className="block h-7 w-1.5 rounded-full bg-[#A560E8]" aria-hidden />
      <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50">{heading}</h2>
    </div>
    {subtitle && <p className="text-stone-600 dark:text-stone-400 text-[14px] mb-5 ml-4">{subtitle}</p>}
    {children}
  </section>
);

const CopyableBlock = ({ label, text, small }: { label: string; text: string; small?: boolean }) => {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-stone-500">{label}</span>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="px-3 py-1 rounded-lg text-[11px] font-extrabold text-white border-2 border-b-2 bg-[#A560E8] border-[#A560E8] transition-transform hover:-translate-y-0.5"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <p className={`px-4 py-4 text-stone-800 dark:text-stone-200 leading-relaxed ${small ? 'text-[14px] italic' : 'text-[14px] sm:text-[15px]'}`}>
        {text}
      </p>
    </div>
  );
};

const BrandAsset = ({ title, subtitle, background, imgSrc }: { title: string; subtitle: string; background: string; imgSrc: string }) => (
  <div className="rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden">
    <div
      className="flex items-center justify-center p-8"
      style={{ backgroundColor: background }}
    >
      <img src={imgSrc} alt={title} className="max-w-[160px] max-h-[120px] object-contain" />
    </div>
    <div className="p-4 border-t border-stone-200 dark:border-stone-800">
      <div className="font-extrabold text-stone-900 dark:text-stone-50 text-[14px]">{title}</div>
      <div className="text-[12px] text-stone-600 dark:text-stone-400">{subtitle}</div>
    </div>
  </div>
);

const ColorSwatch = ({ hex, name }: { hex: string; name: string }) => (
  <div className="rounded-xl border-2 border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden">
    <div className="h-16" style={{ backgroundColor: hex }} aria-hidden />
    <div className="px-3 py-2">
      <div className="font-extrabold text-[12px] text-stone-900 dark:text-stone-50">{name}</div>
      <div className="text-[11px] text-stone-500 font-mono">{hex}</div>
    </div>
  </div>
);

const StatBlock = ({ value, label }: { value: string; label: string }) => (
  <div className="rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 text-center">
    <div className="text-2xl sm:text-3xl font-extrabold text-[#A560E8] mb-1">{value}</div>
    <div className="text-[12px] sm:text-[13px] font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider">{label}</div>
  </div>
);

export default PressKitPage;
