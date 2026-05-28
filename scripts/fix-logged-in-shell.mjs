#!/usr/bin/env node
/** Fix nested outer div + LoggedInPageShell and remove stale Header imports */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..', 'src', 'components', 'pages');

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, files);
    else if (ent.name.endsWith('.tsx')) files.push(p);
  }
  return files;
}

function fix(content) {
  let out = content;
  let changed = false;

  // Remove unused Header import when LoggedInPageShell present and no <Header
  if (out.includes('LoggedInPageShell') && !out.includes('<Header')) {
    const next = out.replace(/\nimport Header from ['"][^'"]+['"];?\n/g, '\n');
    if (next !== out) { out = next; changed = true; }
  }

  // Fix: outer div wrapping LoggedInPageShell (move className/style to shell)
  const nestedRe = /return \(\s*\n\s*<div className="([^"]*)"(?: style=\{\{ fontFamily: '"Nunito", system-ui, sans-serif' \}\})?>\s*\n\s*<LoggedInPageShell/g;
  if (nestedRe.test(out)) {
    out = out.replace(
      /return \(\s*\n\s*<div className="([^"]*)"(?: style=\{\{ fontFamily: '"Nunito", system-ui, sans-serif' \}\})?>\s*\n\s*<LoggedInPageShell/g,
      (m, cls) => {
        changed = true;
        const classProp = cls && cls !== 'relative min-h-screen overflow-x-clip'
          ? ` className="${cls}"`
          : '';
        return `return (\n    <LoggedInPageShell${classProp}`;
      }
    );
  }

  // Fix help center broken structure
  if (out.includes('currentPage="help"')) {
    const helpFix = out.replace(
      /return \(\s*\n\s*<div className="relative min-h-screen overflow-x-clip" style=\{\{ fontFamily: '"Nunito", system-ui, sans-serif' \}\}>\s*\n\s*<LoggedInPageShell user=\{user\} onNavigate=\{onNavigate\} onLogout=\{onLogout\} currentPage="help">\s*\n\s*\{helpContent\}\s*\n\s*<\/LoggedInPageShell>\s*\n\s*\);/,
      'return (\n    <LoggedInPageShell user={user} onNavigate={onNavigate} onLogout={onLogout} currentPage="help">\n      {helpContent}\n    </LoggedInPageShell>\n  );'
    );
    if (helpFix !== out) { out = helpFix; changed = true; }
  }

  return changed ? out : null;
}

const modified = [];
for (const file of walk(root)) {
  const content = fs.readFileSync(file, 'utf8');
  if (!content.includes('LoggedInPageShell')) continue;
  const result = fix(content);
  if (result) {
    fs.writeFileSync(file, result);
    modified.push(path.relative(path.join(__dirname, '..'), file));
  }
}
console.log('Fixed:', modified.length);
modified.forEach((f) => console.log(' -', f));
