/**
 * Turn an uploaded essay into text. Word and text files are read in the
 * browser; a PDF (or an old .doc) is read by the server's file reader,
 * which works before sign-in and uses no credits.
 */
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const ESSAY_FILE_ACCEPT = '.pdf,.docx,.doc,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,text/plain';
const MAX_BYTES = 8 * 1024 * 1024;
const SERVER_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
};

export class EssayFileError extends Error {}

/** The text of an essay file, tidied. Throws EssayFileError with a message to show. */
export async function readEssayFile(file: File): Promise<string> {
  const name = (file.name || '').toLowerCase();
  const ext = name.split('.').pop() || '';
  if (file.size > MAX_BYTES) throw new EssayFileError('That file is over 8MB. Paste the text instead.');

  let content = '';
  if (ext === 'docx') {
    try {
      const mammoth = (await import('mammoth')).default;
      content = (await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })).value || '';
    } catch {
      throw new EssayFileError('We could not read that Word file. Paste the text instead.');
    }
  } else if (ext === 'txt' || ext === 'md' || file.type.startsWith('text/')) {
    content = await file.text();
  } else if (SERVER_TYPES[ext]) {
    const form = new FormData();
    // Name the type from the extension: some computers send none, and the server checks it.
    form.append('file', new File([file], file.name, { type: SERVER_TYPES[ext] }));
    let json: { success?: boolean; message?: string; data?: { content?: string } } | null = null;
    try {
      const res = await fetch(`${API_URL}/preview/read-file`, { method: 'POST', body: form });
      json = await res.json().catch(() => null);
    } catch {
      throw new EssayFileError('Could not reach WriteScholar. Check your connection and try again.');
    }
    if (!json?.success) {
      throw new EssayFileError(ext === 'pdf'
        ? 'We could not read text from that PDF. If it is a scan, paste the text instead.'
        : json?.message || 'We could not read that file. Paste the text instead.');
    }
    content = json.data?.content || '';
  } else {
    throw new EssayFileError('Upload a PDF, Word or text file, or paste the text.');
  }

  content = content.replace(/\r\n?/g, '\n').replace(/[ \t\u00a0]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if (!content) throw new EssayFileError('That file looks empty. Paste the text instead.');
  return content;
}
