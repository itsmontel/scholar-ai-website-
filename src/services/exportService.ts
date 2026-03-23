import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

/** Strips characters illegal in XML 1.0 that cause docx (browser) generation to throw. */
function sanitizeForDocxText(input: unknown): string {
  const s = input == null ? '' : typeof input === 'string' ? input : String(input);
  return s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '');
}

function cleanAnalysisMarkdown(raw: string): string {
  return sanitizeForDocxText(raw)
    .replace(/#{1,6}\s*/g, '')
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();
}

export interface AnalysisData {
  documentTitle: string;
  documentContent: string;
  analysisResult: string;
  annotations: Array<{
    id: string;
    type: 'strong' | 'improve' | 'concern';
    text: string;
    comment: string;
    suggestion: string;
  }>;
  analysisType: string;
  citationStyle: string;
  createdAt: string;
}

export class ExportService {
  /**
   * Export analysis as PDF with annotations
   */
  static async exportToPDF(analysisData: AnalysisData): Promise<void> {
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);

      // Helper function to add text with word wrapping
      const addText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
        pdf.setFontSize(fontSize);
        if (isBold) {
          pdf.setFont('helvetica', 'bold');
        } else {
          pdf.setFont('helvetica', 'normal');
        }

        const lines = pdf.splitTextToSize(text, contentWidth);
        
        for (const line of lines) {
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(line, margin, yPosition);
          yPosition += fontSize * 0.4;
        }
        yPosition += 5;
      };

      // Title
      addText('Analysis Report', 18, true);
      addText(`Document: ${analysisData.documentTitle}`, 14, true);
      addText(`Analysis Type: ${analysisData.analysisType}`, 12);
      addText(`Citation Style: ${analysisData.citationStyle}`, 12);
      addText(`Generated: ${new Date(analysisData.createdAt).toLocaleDateString()}`, 12);
      
      yPosition += 10;

      // Analysis Results
      addText('Comprehensive Analysis', 16, true);
      yPosition += 5;
      
      const cleanAnalysis = cleanAnalysisMarkdown(analysisData.analysisResult);

      addText(cleanAnalysis, 11);

      yPosition += 10;

      // Annotations Summary
      if (analysisData.annotations.length > 0) {
        addText('Annotations Summary', 16, true);
        yPosition += 5;

        // Group annotations by type
        const strongPoints = analysisData.annotations.filter(a => a.type === 'strong');
        const improvements = analysisData.annotations.filter(a => a.type === 'improve');
        const concerns = analysisData.annotations.filter(a => a.type === 'concern');

        if (strongPoints.length > 0) {
          addText(`Strong Points (${strongPoints.length})`, 14, true);
          strongPoints.forEach((annotation, index) => {
            addText(`${index + 1}. ${annotation.text}`, 11, true);
            addText(`   ${annotation.comment}`, 10);
            yPosition += 3;
          });
          yPosition += 5;
        }

        if (improvements.length > 0) {
          addText(`Areas for Improvement (${improvements.length})`, 14, true);
          improvements.forEach((annotation, index) => {
            addText(`${index + 1}. ${annotation.text}`, 11, true);
            addText(`   ${annotation.comment}`, 10);
            yPosition += 3;
          });
          yPosition += 5;
        }

        if (concerns.length > 0) {
          addText(`Serious Concerns (${concerns.length})`, 14, true);
          concerns.forEach((annotation, index) => {
            addText(`${index + 1}. ${annotation.text}`, 11, true);
            addText(`   ${annotation.comment}`, 10);
            yPosition += 3;
          });
        }
      }

      // Save the PDF
      const fileName = `analysis-report-${analysisData.documentTitle.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF report');
    }
  }

  /**
   * Export analysis as Word document with annotations
   */
  static async exportToWord(analysisData: AnalysisData): Promise<void> {
    try {
      const title = sanitizeForDocxText(analysisData.documentTitle);
      const analysisType = sanitizeForDocxText(analysisData.analysisType);
      const citationStyle = sanitizeForDocxText(analysisData.citationStyle);
      const generated = sanitizeForDocxText(
        new Date(analysisData.createdAt).toLocaleDateString()
      );

      const analysisBody = cleanAnalysisMarkdown(analysisData.analysisResult);
      const analysisParagraphs =
        analysisBody.length > 0
          ? analysisBody.split(/\r?\n/).map(
              (line) =>
                new Paragraph({
                  children: [
                    new TextRun({
                      text: line.length ? line : ' ',
                      size: 20,
                    }),
                  ],
                })
            )
          : [
              new Paragraph({
                children: [new TextRun({ text: ' ', size: 20 })],
              }),
            ];

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Analysis Report',
                    bold: true,
                    size: 32,
                  }),
                ],
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER,
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: `Document: ${title}`,
                    bold: true,
                    size: 24,
                  }),
                ],
                heading: HeadingLevel.HEADING_1,
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: `Analysis Type: ${analysisType}`,
                    size: 20,
                  }),
                ],
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: `Citation Style: ${citationStyle}`,
                    size: 20,
                  }),
                ],
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: `Generated: ${generated}`,
                    size: 20,
                  }),
                ],
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Comprehensive Analysis',
                    bold: true,
                    size: 28,
                  }),
                ],
                heading: HeadingLevel.HEADING_1,
              }),

              ...analysisParagraphs,

              ...(analysisData.annotations.length > 0
                ? [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: 'Annotations Summary',
                          bold: true,
                          size: 28,
                        }),
                      ],
                      heading: HeadingLevel.HEADING_1,
                    }),
                    ...this.createAnnotationSections(analysisData.annotations),
                  ]
                : []),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const safeSlug = sanitizeForDocxText(analysisData.documentTitle).replace(/[^a-zA-Z0-9]/g, '-') || 'document';
      const fileName = `analysis-report-${safeSlug}-${Date.now()}.docx`;
      saveAs(blob, fileName);
    } catch (error) {
      console.error('Error generating Word document:', error);
      throw new Error('Failed to generate Word report');
    }
  }

  /**
   * Create annotation sections for Word document
   */
  private static createAnnotationSections(annotations: AnalysisData['annotations']) {
    const sections: Paragraph[] = [];
    
    const strongPoints = annotations.filter(a => a.type === 'strong');
    const improvements = annotations.filter(a => a.type === 'improve');
    const concerns = annotations.filter(a => a.type === 'concern');

    if (strongPoints.length > 0) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Strong Points (${strongPoints.length})`,
              bold: true,
              size: 24,
            }),
          ],
          heading: HeadingLevel.HEADING_2,
        })
      );

      strongPoints.forEach((annotation, index) => {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${index + 1}. ${sanitizeForDocxText(annotation.text)}`,
                bold: true,
                size: 20,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: sanitizeForDocxText(annotation.comment),
                size: 18,
              }),
            ],
          })
        );
      });
    }

    if (improvements.length > 0) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Areas for Improvement (${improvements.length})`,
              bold: true,
              size: 24,
            }),
          ],
          heading: HeadingLevel.HEADING_2,
        })
      );

      improvements.forEach((annotation, index) => {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${index + 1}. ${sanitizeForDocxText(annotation.text)}`,
                bold: true,
                size: 20,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: sanitizeForDocxText(annotation.comment),
                size: 18,
              }),
            ],
          })
        );
      });
    }

    if (concerns.length > 0) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Serious Concerns (${concerns.length})`,
              bold: true,
              size: 24,
            }),
          ],
          heading: HeadingLevel.HEADING_2,
        })
      );

      concerns.forEach((annotation, index) => {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${index + 1}. ${sanitizeForDocxText(annotation.text)}`,
                bold: true,
                size: 20,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: sanitizeForDocxText(annotation.comment),
                size: 18,
              }),
            ],
          })
        );
      });
    }

    return sections;
  }
}
