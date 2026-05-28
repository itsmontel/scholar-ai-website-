#!/usr/bin/env node
/**
 * One-off codemod: migrate pages from Header + WriteScholarEditorialBackgroundLayers
 * to LoggedInPageShell. Skips special-case files handled manually.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..', 'src', 'components');

const EXCLUDE = new Set([
  'CompleteAcademicAIApp.tsx',
  'LandingPage.tsx',
  'LoginPage.tsx',
  'SignUpPage.tsx',
  'EmailVerificationPage.tsx',
  'ResetPasswordPage.tsx',
  'UnsubscribePage.tsx',
  'DocumentsPage.tsx',
  'LoggedInPageShell.tsx',
  'Header.tsx',
  'AnalysisPageOld.tsx',
]);

const MANUAL = new Set([
  'CitationsPage.tsx',
  'StudyPackPage.tsx',
  'QuizGeneratorPage.tsx',
  'WordTowerPage.tsx',
  'LightningReflexQuizPage.tsx',
  'AnalysisHistoryPage.tsx',
  'AnalysisPage.tsx',
  'PricingPage.tsx',
  'CreateFlashcardsPage.tsx',
  'MobileDashboard.tsx',
  'ShareFriendsPage.tsx',
  'WordBlitzPage.tsx',
  'QuizHistoryPage.tsx',
  'CitationHistoryPage.tsx',
  'SummarizerPage.tsx',
  'StudyPackViewerPage.tsx',
  'DashboardPage.tsx',
  'PressKitPage.tsx',
  'ProgrammaticLandingPage.tsx',
]);

function shellImportPath(filePath) {
  const rel = path.relative(path.dirname(filePath), path.join(root, 'workspace', 'LoggedInPageShell.tsx'));
  return rel.startsWith('.') ? rel.replace(/\.tsx$/, '') : './' + rel.replace(/\.tsx$/, '');
}

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, files);
    else if (ent.name.endsWith('.tsx')) files.push(p);
  }
  return files;
}

function migrate(content, filePath) {
  if (!content.includes('import Header from')) return null;
  if (!content.includes('<Header')) return null;

  let out = content;

  // Remove Header import
  out = out.replace(/\nimport Header from ['"][^'"]+['"];?\n/g, '\n');

  // Remove WriteScholarEditorialBackgroundLayers import if present
  const hadBg = out.includes('WriteScholarEditorialBackgroundLayers');
  if (hadBg) {
    out = out.replace(/\nimport \{ WriteScholarEditorialBackgroundLayers \} from ['"][^'"]+['"];?\n/g, '\n');
  }

  // Add LoggedInPageShell import after first import block
  const importPath = shellImportPath(filePath);
  if (!out.includes('LoggedInPageShell')) {
    const firstImport = out.match(/^import .+;\n/m);
    if (firstImport) {
      const idx = out.indexOf(firstImport[0]) + firstImport[0].length;
      out = out.slice(0, idx) + `import LoggedInPageShell from '${importPath}';\n` + out.slice(idx);
    }
  }

  // Replace bg + layers + header blocks (multiple variants)
  const headerLineRe = /<Header[^/]*\/>/g;
  const blockRe = /(\s*)<WriteScholarEditorialBackgroundLayers[^/]*\/>\s*\n\s*<Header[^/]*\/>\s*\n/g;
  if (hadBg && blockRe.test(out)) {
    out = out.replace(blockRe, (match, indent) => {
      const headerMatch = match.match(/<Header[^/]*\/>/);
      if (!headerMatch) return match;
      const header = headerMatch[0];
      const user = header.match(/user=\{([^}]+)\}/)?.[1] ?? 'user';
      const onNav = header.match(/onNavigate=\{([^}]+)\}/)?.[1] ?? 'onNavigate';
      const onLog = header.match(/onLogout=\{([^}]+)\}/)?.[1] ?? 'onLogout';
      const page = header.match(/currentPage="([^"]+)"/)?.[1] ?? header.match(/currentPage=\{([^}]+)\}/)?.[1] ?? 'dashboard';
      const pageProp = page.includes('{') ? `currentPage={${page}}` : `currentPage="${page}"`;
      const sticky = header.includes('sticky') ? ' sticky' : '';
      // sticky is on Header only — LoggedInPageShell doesn't support sticky; drop it
      void sticky;
      return `${indent}<LoggedInPageShell user={${user}} onNavigate={${onNav}} onLogout={${onLog}} ${pageProp}>\n`;
    });
  }

  // Header-only pages (no WriteScholarEditorialBackgroundLayers)
  if (!hadBg || !content.match(blockRe)) {
    out = out.replace(
      /(\s*)<Header onNavigate=\{([^}]+)\} user=\{([^}]+)\} onLogout=\{([^}]+)\} currentPage="([^"]+)"(?: sticky)? \/>\s*\n/g,
      '$1<LoggedInPageShell user={$3} onNavigate={$2} onLogout={$4} currentPage="$5">\n'
    );
    out = out.replace(
      /(\s*)<Header onNavigate=\{([^}]+)\} user=\{([^}]+)\} onLogout=\{([^}]+)\} \/>\s*\n/g,
      '$1<LoggedInPageShell user={$3} onNavigate={$2} onLogout={$4}>\n'
    );
    out = out.replace(
      /(\s*)<Header onNavigate=\{([^}]+)\} user=\{([^}]+)\} onLogout=\{([^}]+)\} sticky \/>\s*\n/g,
      '$1<LoggedInPageShell user={$3} onNavigate={$2} onLogout={$4}>\n'
    );
  }

  // Replace opening outer divs that wrapped header (common patterns)
  out = out.replace(
    /<div className="relative min-h-screen overflow-x-clip bg-\[#FAF7FF\] dark:bg-stone-950"(?: style=\{\{ fontFamily: '"Nunito", system-ui, sans-serif' \}\})?>\s*\n\s*<LoggedInPageShell/g,
    '<LoggedInPageShell'
  );
  out = out.replace(
    /<div className="relative min-h-screen overflow-x-clip bg-stone-50 dark:bg-stone-950"(?: style=\{\{ fontFamily: '"Nunito", system-ui, sans-serif' \}\})?>\s*\n\s*<LoggedInPageShell/g,
    '<LoggedInPageShell className="relative min-h-screen overflow-x-clip bg-stone-50 dark:bg-stone-950"'
  );
  out = out.replace(
    /<div className="relative min-h-screen flex flex-col overflow-x-clip"(?: style=\{\{ fontFamily: '"Nunito", system-ui, sans-serif' \}\})?>\s*\n\s*<LoggedInPageShell/g,
    '<LoggedInPageShell className="relative min-h-screen flex flex-col overflow-x-clip"'
  );
  out = out.replace(
    /<div className="relative min-h-screen overflow-x-clip bg-\[#FAF7FF\] dark:bg-stone-950">\s*\n\s*<LoggedInPageShell/g,
    '<LoggedInPageShell'
  );
  out = out.replace(
    /<div className="min-h-screen relative transition-colors font-sans overflow-x-clip">\s*\n\s*<LoggedInPageShell/g,
    '<LoggedInPageShell className="min-h-screen relative transition-colors font-sans overflow-x-clip"'
  );

  // Close outer div before export — fragile: replace last `</div>\n  );\n};` before export when LoggedInPageShell used
  // Only if we opened LoggedInPageShell and file still has mismatched structure
  if (out.includes('<LoggedInPageShell') && !out.includes('</LoggedInPageShell>')) {
    out = out.replace(/(\n\s*)<\/div>(\n\s*\);\n\};?\n\nexport default)/, '$1</LoggedInPageShell>$2');
  }

  // Clean double newlines from removed imports
  out = out.replace(/\n{3,}/g, '\n\n');

  if (out === content) return null;
  return out;
}

const files = walk(root);
const modified = [];

for (const file of files) {
  const base = path.basename(file);
  if (EXCLUDE.has(base) || MANUAL.has(base)) continue;
  const content = fs.readFileSync(file, 'utf8');
  const result = migrate(content, file);
  if (result) {
    fs.writeFileSync(file, result);
    modified.push(path.relative(path.join(__dirname, '..'), file));
  }
}

console.log('Modified:', modified.length);
modified.forEach((f) => console.log(' -', f));
