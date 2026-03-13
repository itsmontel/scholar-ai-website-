/**
 * Shared study pack export utility.
 * Exports a single segment (quiz, flashcards, crossword, lesson, notes) to PDF or DOCX.
 */

import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import type { ExportFormat } from '../components/common/ExportFormatModal';

function sanitizeForPDF(text: string): string {
  if (!text) return '';
  return String(text)
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2300}-\u{23FF}\u{2B50}\u{2705}\u{274C}\u{2714}\u{2716}\u{274E}\u{2753}-\u{2755}\u{2757}\u{2763}\u{2764}\u{2795}-\u{2797}\u{27A1}\u{27B0}\u{27BF}\u{2934}\u{2935}\u{3030}\u{303D}\u{3297}\u{3299}]/gu, '')
    .replace(/\u2019/g, "'").replace(/\u2018/g, "'").replace(/\u201C/g, '"').replace(/\u201D/g, '"')
    .replace(/\u2013/g, '-').replace(/\u2014/g, '-').replace(/\u2026/g, '...').replace(/\u2022/g, '-')
    .replace(/[^\x00-\x7F]/g, (c) => {
      const fallback: Record<string, string> = {
        'á': 'a', 'à': 'a', 'â': 'a', 'ä': 'a', 'ã': 'a', 'å': 'a', 'æ': 'ae', 'ç': 'c',
        'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e', 'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
        'ñ': 'n', 'ó': 'o', 'ò': 'o', 'ô': 'o', 'ö': 'o', 'õ': 'o', 'ø': 'o', 'œ': 'oe',
        'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u', 'ý': 'y', 'ÿ': 'y', 'ß': 'ss',
      };
      return fallback[c] ?? '';
    })
    .replace(/\s{2,}/g, ' ');
}

interface StudyTool {
  title: string;
  quiz_type: string;
  difficulty: string;
  questions: any;
}

function buildToolFromPackSegment(pack: any, format: ExportFormat, baseTitle: string): StudyTool | null {
  const base = { title: baseTitle, quiz_type: '', difficulty: 'medium', questions: [] as any };
  switch (format) {
    case 'quiz': {
      const q = pack?.quiz;
      if (!q?.questions?.length) return null;
      return { ...base, quiz_type: q.quizType || 'mixed', difficulty: q.difficulty || 'medium', questions: q.questions };
    }
    case 'flashcards': {
      const f = pack?.flashcards;
      if (!f?.cards?.length) return null;
      return { ...base, quiz_type: 'flashcards', questions: f.cards };
    }
    case 'crossword': {
      const c = pack?.crossword;
      if (!c?.placedWords?.length) return null;
      return { ...base, quiz_type: 'crossword', questions: { grid: c.grid, clues: c.clues, gridSize: c.gridSize, placedWords: c.placedWords } };
    }
    case 'lesson': {
      const l = pack?.lesson;
      const slides = l?.slides || [];
      if (!slides.length) return null;
      return { ...base, quiz_type: 'lesson', difficulty: l.style || 'visual', questions: slides };
    }
    default:
      return null;
  }
}

export async function exportStudyPackSegment(
  packData: any,
  packTitle: string,
  format: ExportFormat,
  targetFormat: 'pdf' | 'docx'
): Promise<void> {
  if (format === 'notes') {
    const text = packData?.originalNotes || '';
    if (!text?.trim()) return;
    if (targetFormat === 'pdf') {
      const doc = new jsPDF();
      const margin = 20;
      const pageHeight = doc.internal.pageSize.height;
      let yPos = 20;
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(doc.splitTextToSize(sanitizeForPDF(packTitle || 'Original Notes'), 170), margin, yPos);
      yPos += 20;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.splitTextToSize(sanitizeForPDF(text), 170).forEach((line: string) => {
        if (yPos > pageHeight - 20) { doc.addPage(); yPos = 20; }
        doc.text(line, margin, yPos);
        yPos += 6;
      });
      doc.save(`notes-${Date.now()}.pdf`);
    } else {
      const docFile = new Document({
        sections: [{ children: [
          new Paragraph({ text: packTitle || 'Original Notes', heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ text: '' }),
          new Paragraph({ text }),
        ] }],
      });
      const blob = await Packer.toBlob(docFile);
      saveAs(blob, `notes-${Date.now()}.docx`);
    }
    return;
  }

  const tool = buildToolFromPackSegment(packData, format, packTitle);
  if (!tool) return;

  const qs = Array.isArray(tool.questions) ? tool.questions : [];
  const cards = Array.isArray(tool.questions) ? tool.questions : [];
  const placedWords = (tool.questions as any)?.placedWords || [];
  const slides = Array.isArray(tool.questions) ? tool.questions : [];

  if (targetFormat === 'pdf') {
    if (format === 'quiz') {
      const doc = new jsPDF();
      let yPos = 20;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      const lineHeight = 7;
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(doc.splitTextToSize(sanitizeForPDF(tool.title || 'Quiz'), 170), margin, yPos);
      yPos += 25;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(sanitizeForPDF(`Type: ${tool.quiz_type} | Difficulty: ${tool.difficulty} | Questions: ${qs.length}`), margin, yPos);
      yPos += 15;
      qs.forEach((q: any, idx: number) => {
        if (yPos > pageHeight - 60) { doc.addPage(); yPos = 20; }
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(doc.splitTextToSize(`${idx + 1}. ${sanitizeForPDF(q.question)}`, 170), margin, yPos);
        yPos += 25;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        if (q.type === 'true_false') doc.text('   [ ] True    [ ] False', margin, yPos);
        else if (q.options) q.options.forEach((opt: string) => { doc.text(`   [ ] ${sanitizeForPDF(opt)}`, margin, yPos); yPos += 7; });
        yPos += 15;
      });
      doc.addPage();
      yPos = 20;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Answer Key', margin, yPos);
      yPos += 12;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      qs.forEach((q: any, idx: number) => {
        if (yPos > pageHeight - 30) { doc.addPage(); yPos = 20; }
        doc.text(`${idx + 1}. ${sanitizeForPDF(q.correctAnswer)}`, margin, yPos);
        yPos += q.explanation ? doc.splitTextToSize(`   Explanation: ${sanitizeForPDF(q.explanation)}`, 165).length * 7 + 10 : 10;
      });
      doc.save(`quiz-${Date.now()}.pdf`);
    } else if (format === 'flashcards') {
      const doc = new jsPDF();
      const margin = 20;
      const pageHeight = doc.internal.pageSize.height;
      let yPos = 20;
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(doc.splitTextToSize(sanitizeForPDF(tool.title || 'Flashcards'), 170), margin, yPos);
      yPos += 25;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`${cards.length} cards`, margin, yPos);
      yPos += 12;
      cards.forEach((card: any, idx: number) => {
        if (yPos > pageHeight - 50) { doc.addPage(); yPos = 20; }
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(`Card ${idx + 1}`, margin, yPos);
        yPos += 6;
        doc.setFontSize(11);
        doc.text('Front:', margin, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        doc.text(doc.splitTextToSize(sanitizeForPDF(card.front || ''), 165), margin + 4, yPos);
        yPos += 25;
        if (yPos > pageHeight - 30) { doc.addPage(); yPos = 20; }
        doc.setFont('helvetica', 'bold');
        doc.text('Back:', margin, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        doc.text(doc.splitTextToSize(sanitizeForPDF(card.back || ''), 165), margin + 4, yPos);
        yPos += 25;
      });
      doc.save(`flashcards-${Date.now()}.pdf`);
    } else if (format === 'crossword') {
      const doc = new jsPDF();
      const margin = 20;
      const pageHeight = doc.internal.pageSize.height;
      let yPos = 20;
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(doc.splitTextToSize(sanitizeForPDF(tool.title || 'Crossword'), 170), margin, yPos);
      yPos += 25;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`${placedWords.length} words`, margin, yPos);
      yPos += 12;
      const grid = (tool.questions as any).grid;
      if (grid?.length) {
        const cellSize = Math.min(8, Math.floor(160 / grid[0].length));
        for (let ri = 0; ri < grid.length; ri++) {
          for (let ci = 0; ci < grid[ri].length; ci++) {
            const x = margin + ci * cellSize;
            const y = yPos + ri * cellSize;
            if (grid[ri][ci] !== '') {
              doc.setDrawColor(100, 100, 100);
              doc.setFillColor(255, 255, 255);
              doc.rect(x, y, cellSize, cellSize, 'FD');
              const wordAtCell = placedWords.find((pw: any) => pw.row === ri && pw.col === ci);
              if (wordAtCell) {
                doc.setFontSize(4);
                doc.setTextColor(80, 80, 80);
                doc.text(String(wordAtCell.number), x + 0.5, y + 3.5);
                doc.setTextColor(0, 0, 0);
                doc.setFontSize(10);
              }
            } else {
              doc.setFillColor(40, 40, 40);
              doc.rect(x, y, cellSize, cellSize, 'F');
            }
          }
        }
        yPos += grid.length * cellSize + 14;
      }
      ['across', 'down'].forEach(dir => {
        const words = placedWords.filter((pw: any) => pw.direction === dir).sort((a: any, b: any) => a.number - b.number);
        if (!words.length) return;
        if (yPos > pageHeight - 30) { doc.addPage(); yPos = 20; }
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text(dir === 'across' ? 'Across' : 'Down', margin, yPos);
        yPos += 8;
        words.forEach((pw: any) => {
          if (yPos > pageHeight - 15) { doc.addPage(); yPos = 20; }
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.text(doc.splitTextToSize(`${pw.number}. ${sanitizeForPDF(pw.clue)} (${pw.word.length} letters)`, 165), margin + 2, yPos);
          yPos += 15;
        });
        yPos += 4;
      });
      if (yPos > pageHeight - 40) { doc.addPage(); yPos = 20; }
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('Answer Key', margin, yPos);
      yPos += 8;
      placedWords.sort((a: any, b: any) => a.number - b.number).forEach((pw: any) => {
        if (yPos > pageHeight - 12) { doc.addPage(); yPos = 20; }
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`${pw.number}. ${sanitizeForPDF(pw.word)} (${pw.direction})`, margin + 2, yPos);
        yPos += 6;
      });
      doc.save(`crossword-${Date.now()}.pdf`);
    } else if (format === 'lesson') {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 14;
      const lineHeight = 5;
      const contentTop = 18;
      const dividerY = pageHeight / 2;
      const lectureBottom = dividerY - 6;
      const lectureHeight = lectureBottom - contentTop;
      const notesTop = dividerY + 4;
      const contentWidth = pageWidth - margin * 2;
      const styleLabel = (tool.difficulty === 'stepByStep' || tool.difficulty === 'step_by_step') ? 'Step-by-Step' : tool.difficulty === 'story' ? 'Story Mode' : 'Visual';
      const getSlideColor = (type?: string): [number, number, number] => {
        const t = (type || '').toLowerCase();
        if (t === 'intro') return [124, 58, 237];
        if (t === 'concept') return [59, 130, 246];
        if (t === 'example') return [245, 158, 11];
        if (t === 'keypoint') return [16, 185, 129];
        if (t === 'funfact') return [236, 72, 153];
        if (t === 'summary') return [99, 102, 241];
        return [100, 116, 139];
      };
      const getSlideTypeLabel = (type?: string) => {
        const t = (type || '').toLowerCase();
        if (t === 'intro') return 'INTRODUCTION';
        if (t === 'concept') return 'CONCEPT';
        if (t === 'example') return 'EXAMPLE';
        if (t === 'keypoint') return 'KEY POINT';
        if (t === 'funfact') return 'FUN FACT';
        if (t === 'summary') return 'SUMMARY';
        return 'SLIDE';
      };
      doc.setFillColor(248, 250, 252);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      doc.setFillColor(124, 58, 237);
      doc.rect(0, 0, pageWidth, 45, 'F');
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(sanitizeForPDF(tool.title || 'Lesson Plan'), pageWidth / 2, 28, { align: 'center' });
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`${styleLabel}  |  ${slides.length} slides`, pageWidth / 2, 38, { align: 'center' });
      doc.setTextColor(100, 116, 139);
      doc.text('Lecture Notes', pageWidth / 2, 70, { align: 'center' });
      doc.text(new Date().toLocaleDateString(), pageWidth / 2, 78, { align: 'center' });
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, 100, pageWidth - margin, 100);
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page 1 of ${slides.length + 1}`, pageWidth - margin, pageHeight - 10);
      slides.forEach((slide: any, idx: number) => {
        doc.addPage();
        const [r, g, b] = getSlideColor(slide.type);
        const typeLabel = getSlideTypeLabel(slide.type);
        doc.setFillColor(252, 252, 254);
        doc.rect(margin, contentTop, contentWidth, lectureHeight, 'F');
        doc.setDrawColor(235, 235, 240);
        doc.rect(margin, contentTop, contentWidth, lectureHeight, 'S');
        doc.setFillColor(r, g, b);
        doc.rect(margin, contentTop, contentWidth, 12, 'F');
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(typeLabel, margin + 6, contentTop + 8);
        doc.text(`${idx + 1}`, pageWidth - margin - 10, contentTop + 8);
        let slideY = contentTop + 22;
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text(doc.splitTextToSize(sanitizeForPDF(slide.title || `Slide ${idx + 1}`), contentWidth - 16), margin + 8, slideY);
        slideY += 20;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const content = sanitizeForPDF(slide.content || '');
        if (content) {
          doc.text(doc.splitTextToSize(content, contentWidth - 16), margin + 8, slideY);
          slideY += 30;
        }
        if (slide.bulletPoints?.length) {
          slide.bulletPoints.forEach((bp: string) => {
            doc.setFillColor(r, g, b);
            doc.rect(margin + 10, slideY, 2.5, 2.5, 'F');
            doc.text(doc.splitTextToSize(sanitizeForPDF(bp), contentWidth - 30), margin + 16, slideY + 2);
            slideY += 15;
          });
        }
        doc.setDrawColor(220, 220, 220);
        doc.line(margin, dividerY, pageWidth - margin, dividerY);
        doc.setFontSize(8);
        doc.setTextColor(180, 180, 180);
        doc.text('Notes', margin, notesTop + 4);
        for (let i = 0; i < 10; i++) {
          doc.setDrawColor(225, 225, 230);
          doc.line(margin, notesTop + 10 + i * 7, pageWidth - margin, notesTop + 10 + i * 7);
        }
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text(`${idx + 2}`, pageWidth - margin, pageHeight - 10);
      });
      const safeFilename = (tool.title || 'Lesson').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, ' ').trim().slice(0, 50) || 'Lesson';
      doc.save(`${safeFilename} Lecture Notes.pdf`);
    }
  } else {
    if (format === 'quiz') {
      const children: any[] = [
        new Paragraph({ text: tool.title || 'Quiz', heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ children: [new TextRun({ text: `Type: ${tool.quiz_type} | Difficulty: ${tool.difficulty} | Questions: ${qs.length}`, size: 20, color: '666666' })] }),
        new Paragraph({ text: '' }),
      ];
      qs.forEach((q: any, idx: number) => {
        children.push(new Paragraph({ children: [new TextRun({ text: `${idx + 1}. ${q.question}`, bold: true })] }));
        if (q.type === 'true_false') children.push(new Paragraph({ text: '   ☐ True    ☐ False' }));
        else if (q.options) q.options.forEach((opt: string) => children.push(new Paragraph({ text: `   ☐ ${opt}` })));
        children.push(new Paragraph({ text: '' }));
      });
      children.push(new Paragraph({ text: 'Answer Key', heading: HeadingLevel.HEADING_2 }));
      qs.forEach((q: any, idx: number) => {
        children.push(new Paragraph({ children: [new TextRun({ text: `${idx + 1}. `, bold: true }), new TextRun({ text: q.correctAnswer })] }));
        if (q.explanation) children.push(new Paragraph({ children: [new TextRun({ text: `   Explanation: ${q.explanation}`, italics: true, size: 20, color: '666666' })] }));
      });
      const docFile = new Document({ sections: [{ children }] });
      const blob = await Packer.toBlob(docFile);
      saveAs(blob, `quiz-${Date.now()}.docx`);
    } else if (format === 'flashcards') {
      const children: any[] = [
        new Paragraph({ text: tool.title || 'Flashcards', heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ children: [new TextRun({ text: `${cards.length} cards`, size: 20, color: '666666' })] }),
        new Paragraph({ text: '' }),
      ];
      cards.forEach((card: any, idx: number) => {
        children.push(new Paragraph({ children: [new TextRun({ text: `Card ${idx + 1}`, bold: true, color: 'B47800', size: 20 })] }));
        children.push(new Paragraph({ children: [new TextRun({ text: 'Front: ', bold: true }), new TextRun({ text: card.front || '' })] }));
        children.push(new Paragraph({ children: [new TextRun({ text: 'Back: ', bold: true }), new TextRun({ text: card.back || '', color: '3C643C' })] }));
        children.push(new Paragraph({ text: '' }));
      });
      const docFile = new Document({ sections: [{ children }] });
      const blob = await Packer.toBlob(docFile);
      saveAs(blob, `flashcards-${Date.now()}.docx`);
    } else if (format === 'crossword') {
      const children: any[] = [
        new Paragraph({ text: tool.title || 'Crossword', heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ children: [new TextRun({ text: `${placedWords.length} words`, size: 20, color: '666666' })] }),
        new Paragraph({ text: '' }),
      ];
      ['across', 'down'].forEach(dir => {
        const words = placedWords.filter((pw: any) => pw.direction === dir).sort((a: any, b: any) => a.number - b.number);
        if (!words.length) return;
        children.push(new Paragraph({ text: dir === 'across' ? 'Across' : 'Down', heading: HeadingLevel.HEADING_2 }));
        words.forEach((pw: any) => children.push(new Paragraph({ children: [new TextRun({ text: `${pw.number}. `, bold: true }), new TextRun({ text: `${pw.clue} (${pw.word.length} letters)` })] })));
        children.push(new Paragraph({ text: '' }));
      });
      children.push(new Paragraph({ text: 'Answer Key', heading: HeadingLevel.HEADING_2 }));
      placedWords.sort((a: any, b: any) => a.number - b.number).forEach((pw: any) => {
        children.push(new Paragraph({ children: [new TextRun({ text: `${pw.number}. `, bold: true }), new TextRun({ text: pw.word, color: '1A5C1A' }), new TextRun({ text: ` (${pw.direction})`, italics: true, color: '666666' })] }));
      });
      const docFile = new Document({ sections: [{ children }] });
      const blob = await Packer.toBlob(docFile);
      saveAs(blob, `crossword-${Date.now()}.docx`);
    } else if (format === 'lesson') {
      const children: any[] = [
        new Paragraph({ text: tool.title || 'Lesson', heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ children: [new TextRun({ text: `Style: ${(tool.difficulty === 'stepByStep' || tool.difficulty === 'step_by_step') ? 'Step-by-Step' : tool.difficulty === 'story' ? 'Story Mode' : 'Visual'} | Slides: ${slides.length}`, size: 20, color: '666666' })] }),
        new Paragraph({ text: '' }),
      ];
      slides.forEach((slide: any, idx: number) => {
        children.push(new Paragraph({ children: [new TextRun({ text: `${idx + 1}. ${slide.title || `Slide ${idx + 1}`}`, bold: true })] }));
        if (slide.content) children.push(new Paragraph({ text: slide.content }));
        slide.bulletPoints?.forEach((bp: string) => children.push(new Paragraph({ text: `  • ${bp}` })));
        children.push(new Paragraph({ text: '' }));
      });
      const docFile = new Document({ sections: [{ children }] });
      const blob = await Packer.toBlob(docFile);
      saveAs(blob, `${(tool.title || 'lesson').replace(/[^a-zA-Z0-9]/g, '-').slice(0, 50)}-${Date.now()}.docx`);
    }
  }
}
