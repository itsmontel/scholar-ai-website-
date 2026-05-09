import { useState, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import Header from '../../common/Header';
import Footer from '../../common/Footer';
import ScholarMascot from '../../common/ScholarMascot';
import { trackCopy } from '../../../data/achievements';
import { applyPageSeoTags, injectToolProductSchema, removeJsonLd } from '../../../utils/seo';
import ToolPageSeoContent from '../../common/ToolPageSeoContent';
import { citationGeneratorSeo } from '../../../data/toolSeoContent';

interface CitationGeneratorToolPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout: () => void;
}

type CitationStyle = 'apa' | 'mla' | 'chicago' | 'harvard' | 'ieee' | 'vancouver';
type SourceType = 'book' | 'journal' | 'website' | 'newspaper' | 'conference' | 'thesis' | 'video' | 'podcast' | 'report' | 'ebook' | 'magazine' | 'encyclopedia';

interface FormData {
  authors: string;
  title: string;
  year: string;
  publisher: string;
  city: string;
  journalName: string;
  volume: string;
  issue: string;
  pages: string;
  doi: string;
  url: string;
  accessDate: string;
  websiteName: string;
  newspaperName: string;
  edition: string;
  conferenceName: string;
  conferenceLocation: string;
  university: string;
  degree: string;
  platform: string;
  director: string;
  duration: string;
  episodeTitle: string;
  hostName: string;
  organization: string;
  reportNumber: string;
  magazineName: string;
  encyclopediaName: string;
  editorName: string;
  month: string;
  day: string;
}

const CitationGeneratorToolPage = ({ onNavigate, user, onLogout }: CitationGeneratorToolPageProps) => {
  const [style, setStyle] = useState<CitationStyle>('apa');
  const [sourceType, setSourceType] = useState<SourceType>('book');
  const [formData, setFormData] = useState<FormData>({
    authors: '',
    title: '',
    year: '',
    publisher: '',
    city: '',
    journalName: '',
    volume: '',
    issue: '',
    pages: '',
    doi: '',
    url: '',
    accessDate: '',
    websiteName: '',
    newspaperName: '',
    edition: '',
    conferenceName: '',
    conferenceLocation: '',
    university: '',
    degree: '',
    platform: '',
    director: '',
    duration: '',
    episodeTitle: '',
    hostName: '',
    organization: '',
    reportNumber: '',
    magazineName: '',
    encyclopediaName: '',
    editorName: '',
    month: '',
    day: ''
  });
  const [citation, setCitation] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // SEO: per-route title, description, canonical, OG, Twitter, plus tool schema.
  useEffect(() => {
    applyPageSeoTags({
      title: 'Free Citation Generator – APA, MLA, Chicago, Harvard | WriteScholar',
      description: 'Free online citation generator. Create APA, MLA, Chicago, Harvard citations for books, journals, websites. Generate citations instantly—no signup. Trusted by students.',
    });
    injectToolProductSchema({
      name: 'Citation Generator',
      description: 'Free citation generator for APA, MLA, Chicago, Harvard, IEEE, and Vancouver — books, journals, websites, theses, podcasts and more.',
    });
    return () => removeJsonLd('tool-product');
  }, []);
  const [copied, setCopied] = useState(false);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [showMoreSourceTypes, setShowMoreSourceTypes] = useState(false);
  const [openStyleGuide, setOpenStyleGuide] = useState(false);
  const citationOutputRef = useRef<HTMLDivElement>(null);

  // Scroll to citation output when citation is generated (helps mobile UX)
  useEffect(() => {
    if (citation && citationOutputRef.current) {
      citationOutputRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [citation]);

  // FAQPage schema for SEO / rich snippets in search results
  useEffect(() => {
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: 'What citation styles does this generator support?', acceptedAnswer: { '@type': 'Answer', text: 'We support APA 7th edition, MLA 9th edition, Chicago 17th edition, Harvard, IEEE, and Vancouver. Choose your style and source type to format citations correctly.' } },
        { '@type': 'Question', name: 'Is the Citation Generator free?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. The Citation Generator is completely free with no signup required. Create APA, MLA, Chicago, Harvard, IEEE, and Vancouver citations for books, journals, websites, and 12 source types—instantly.' } },
        { '@type': 'Question', name: 'Can I cite websites, journals, and books?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. You can generate citations for books, journals, websites, newspapers, conference papers, theses, videos, podcasts, reports, ebooks, magazines, and encyclopedias. Select the source type and fill in the details.' } },
        { '@type': 'Question', name: 'Do I need to create an account?', acceptedAnswer: { '@type': 'Answer', text: 'No. The Citation Generator works without an account. Just select your citation style, choose the source type, enter the details, and copy your formatted citation.' } },
        { '@type': 'Question', name: 'Should I verify my citations?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Always verify citations against your style guide or professor\'s requirements. Formatting rules vary by edition and institution. Use this tool as a starting point, then double-check.' } },
        { '@type': 'Question', name: 'What\'s the difference between Citation Generator and Citation Finder?', acceptedAnswer: { '@type': 'Answer', text: 'The Citation Generator formats citations when you already have the source details. Citation Finder (in WriteScholar) searches academic databases to find relevant sources for your topic—then formats them. Use the generator for manual entries; use the finder to discover sources.' } }
      ]
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(faqSchema);
    script.id = 'faq-schema-citation-generator';
    document.head.appendChild(script);
    return () => {
      const el = document.getElementById('faq-schema-citation-generator');
      if (el) el.remove();
    };
  }, []);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const SUFFIXES = /^(Jr\.?|Sr\.?|II|III|IV|V|Ph\.?D\.?|M\.?D\.?|Esq\.?)$/i;
  const CORPORATE_SUFFIXES = /\b(organization|association|committee|institute|department|university|commission|bureau|society|council|foundation|administration|service|agency|authority|office|division|board|group|inc\.?|ltd\.?|corp\.?|co\.?)\s*$/i;

  const isCorporateAuthor = (name: string): boolean => {
    const t = name.trim();
    if (!t || t.includes(',')) return false;
    return CORPORATE_SUFFIXES.test(t);
  };

  const parseAuthorName = (name: string): { lastName: string; firstParts: string[]; suffix?: string; isCorporate: boolean } => {
    const t = name.trim();
    if (!t) return { lastName: '', firstParts: [], isCorporate: false };
    if (isCorporateAuthor(t)) return { lastName: t, firstParts: [], isCorporate: true };
    const parts = t.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return { lastName: parts[0], firstParts: [], isCorporate: false };
    if (t.includes(',') && t.split(',').length === 2) {
      const [left, right] = t.split(',').map(s => s.trim());
      if (left && right) {
        const rightParts = right.split(/\s+/).filter(Boolean);
        const lastRightPart = rightParts[rightParts.length - 1];
        if (rightParts.length >= 2 && SUFFIXES.test(lastRightPart)) {
          return { lastName: left, firstParts: rightParts.slice(0, -1), suffix: lastRightPart, isCorporate: false };
        }
        return { lastName: left, firstParts: rightParts, isCorporate: false };
      }
    }
    const last = parts[parts.length - 1];
    const hasSuffix = SUFFIXES.test(last);
    if (hasSuffix && parts.length >= 3) {
      return { lastName: parts[parts.length - 2], firstParts: parts.slice(0, -2), suffix: last, isCorporate: false };
    }
    return { lastName: parts[parts.length - 1], firstParts: parts.slice(0, -1), isCorporate: false };
  };

  const formatInitialsAPA = (firstParts: string[]): string => {
    return firstParts.map(p => {
      if (p.includes('-')) {
        const subParts = p.split('-').filter(Boolean);
        return subParts.map(s => s[0]?.toUpperCase() + '.').join('-');
      }
      return p[0]?.toUpperCase() + '.';
    }).join(' ');
  };

  const authorSplit = (s: string): string[] => {
    const t = s.trim();
    if (!t) return [];
    const bySemicolon = t.split(/\s*;\s*/).map(a => a.trim()).filter(Boolean);
    if (bySemicolon.length > 1) return bySemicolon;
    const byComma = t.split(',').map(a => a.trim()).filter(Boolean);
    if (byComma.length >= 2 && byComma.every(part => part.includes(' '))) {
      return byComma;
    }
    return [t];
  };

  const formatAuthorsAPA = (authors: string) => {
    const authorList = authorSplit(authors);
    if (authorList.length === 0) return '';
    const formatOne = (author: string) => {
      const { lastName, firstParts, suffix, isCorporate } = parseAuthorName(author);
      if (!lastName) return author;
      if (isCorporate || firstParts.length === 0) return lastName;
      const base = `${lastName}, ${formatInitialsAPA(firstParts)}`;
      return suffix ? `${base}, ${suffix}` : base;
    };
    if (authorList.length === 1) return formatOne(authorList[0]);
    if (authorList.length === 2) {
      return `${formatOne(authorList[0])}, & ${formatOne(authorList[1])}`;
    }
    if (authorList.length > 20) {
      const formatted = authorList.slice(0, 19).map(formatOne);
      const lastFormatted = formatOne(authorList[authorList.length - 1]);
      return `${formatted.join(', ')}, ... ${lastFormatted}`;
    }
    const allButLast = authorList.slice(0, -1).map(formatOne);
    const last = formatOne(authorList[authorList.length - 1]);
    return `${allButLast.join(', ')}, & ${last}`;
  };

  const formatAuthorsMLA = (authors: string) => {
    const authorList = authorSplit(authors);
    if (authorList.length === 0) return '';
    const formatFirst = (author: string) => {
      const { lastName, firstParts, suffix, isCorporate } = parseAuthorName(author);
      if (!lastName) return author;
      if (isCorporate || firstParts.length === 0) return lastName;
      const base = `${lastName}, ${firstParts.join(' ')}`;
      return suffix ? `${base}, ${suffix}` : base;
    };
    const formatSubsequent = (author: string) => {
      const { lastName, firstParts, suffix, isCorporate } = parseAuthorName(author);
      if (!lastName) return author;
      if (isCorporate || firstParts.length === 0) return lastName;
      const base = `${firstParts.join(' ')} ${lastName}`;
      return suffix ? `${base}, ${suffix}` : base;
    };
    if (authorList.length === 1) return formatFirst(authorList[0]);
    if (authorList.length === 2) {
      return `${formatFirst(authorList[0])}, and ${formatSubsequent(authorList[1])}`;
    }
    return `${formatFirst(authorList[0])}, et al.`;
  };

  const formatAuthorsIEEE = (authors: string) => {
    const authorList = authorSplit(authors);
    if (authorList.length === 0) return '';
    const formatOne = (author: string) => {
      const { lastName, firstParts, suffix, isCorporate } = parseAuthorName(author);
      if (!lastName) return author;
      if (isCorporate || firstParts.length === 0) return lastName;
      const initials = firstParts.map(n => n.includes('-') ? n.split('-').map(s => s[0]?.toUpperCase() + '.').join('-') : n[0]?.toUpperCase() + '.').join(' ');
      const base = `${initials} ${lastName}`;
      return suffix ? `${base}, ${suffix}` : base;
    };
    if (authorList.length <= 6) {
      return authorList.map(formatOne).join(', ');
    }
    return `${formatOne(authorList[0])} et al.`;
  };

  const formatAuthorsVancouver = (authors: string) => {
    const authorList = authorSplit(authors);
    if (authorList.length === 0) return '';
    const formatOne = (author: string) => {
      const { lastName, firstParts, suffix, isCorporate } = parseAuthorName(author);
      if (!lastName) return author;
      if (isCorporate || firstParts.length === 0) return lastName;
      const initials = firstParts.map(n => n.includes('-') ? n.split('-').map(s => s[0]?.toUpperCase()).join('') : n[0]?.toUpperCase()).join('');
      const base = `${lastName} ${initials}`;
      return suffix ? `${base} ${suffix.replace(/\./g, '')}` : base;
    };
    const formatted = authorList.slice(0, 6).map(formatOne);
    if (authorList.length > 6) return `${formatted.join(', ')}, et al.`;
    return formatted.join(', ');
  };

  const formatAuthorsChicago = (authors: string) => {
    const authorList = authorSplit(authors);
    if (authorList.length === 0) return '';
    const formatFirst = (author: string) => {
      const { lastName, firstParts, suffix, isCorporate } = parseAuthorName(author);
      if (!lastName) return author;
      if (isCorporate || firstParts.length === 0) return lastName;
      const base = `${lastName}, ${firstParts.join(' ')}`;
      return suffix ? `${base}, ${suffix}` : base;
    };
    const formatSubsequent = (author: string) => {
      const { lastName, firstParts, suffix, isCorporate } = parseAuthorName(author);
      if (!lastName) return author;
      if (isCorporate || firstParts.length === 0) return lastName;
      const base = `${firstParts.join(' ')} ${lastName}`;
      return suffix ? `${base}, ${suffix}` : base;
    };
    if (authorList.length === 1) return formatFirst(authorList[0]);
    if (authorList.length === 2) {
      return `${formatFirst(authorList[0])} and ${formatSubsequent(authorList[1])}`;
    }
    if (authorList.length === 3) {
      return `${formatFirst(authorList[0])}, ${formatSubsequent(authorList[1])}, and ${formatSubsequent(authorList[2])}`;
    }
    return `${formatFirst(authorList[0])} et al.`;
  };

  const generateCitation = () => {
    setValidationError(null);
    const { authors, title, year, publisher, city, journalName, volume, issue, pages, doi, url, accessDate, websiteName, newspaperName, edition, conferenceName, conferenceLocation, university, degree, platform, director, episodeTitle, hostName, organization, reportNumber, magazineName, encyclopediaName, editorName, month, day } = formData;

    if (!title?.trim()) {
      setValidationError('Title is required.');
      setCitation('');
      return;
    }
    const hasAuthor = authors?.trim() || (sourceType === 'report' && organization?.trim()) || (sourceType === 'website' && websiteName?.trim());
    if (!hasAuthor) {
      setValidationError('Author(s), organization, or website name is required for this source type.');
      setCitation('');
      return;
    }

    let result = '';

    if (style === 'apa') {
      if (sourceType === 'book') {
        const formattedAuthors = formatAuthorsAPA(authors);
        result = `${formattedAuthors} (${year}). *${title}*${edition ? ` (${edition} ed.)` : ''}. ${publisher}.${doi ? ` https://doi.org/${doi}` : ''}`;
      } else if (sourceType === 'ebook') {
        const formattedAuthors = formatAuthorsAPA(authors);
        result = `${formattedAuthors} (${year}). *${title}*. ${publisher}. ${url}`;
      } else if (sourceType === 'journal') {
        const formattedAuthors = formatAuthorsAPA(authors);
        result = `${formattedAuthors} (${year}). ${title}. *${journalName}*${volume ? `, *${volume}*` : ''}${issue ? `(${issue})` : ''}${pages ? `, ${pages}` : ''}.${doi ? ` https://doi.org/${doi}` : ''}`;
      } else if (sourceType === 'website') {
        const formattedAuthors = authors ? formatAuthorsAPA(authors) : websiteName;
        const fullDate = month && day ? `${year}, ${month} ${day}` : year || 'n.d.';
        result = `${formattedAuthors}. (${fullDate}). *${title}*. ${websiteName || ''}${url ? `. ${url}` : ''}`;
      } else if (sourceType === 'newspaper') {
        const formattedAuthors = formatAuthorsAPA(authors);
        const fullDate = month && day ? `${year}, ${month} ${day}` : year;
        result = `${formattedAuthors} (${fullDate}). ${title}. *${newspaperName}*${pages ? `, ${pages}` : ''}.${url ? ` ${url}` : ''}`;
      } else if (sourceType === 'conference') {
        const formattedAuthors = formatAuthorsAPA(authors);
        result = `${formattedAuthors} (${year}). ${title}. In *${conferenceName}*${conferenceLocation ? ` (${conferenceLocation})` : ''}${pages ? `, pp. ${pages}` : ''}.${doi ? ` https://doi.org/${doi}` : ''}`;
      } else if (sourceType === 'thesis') {
        const formattedAuthors = formatAuthorsAPA(authors);
        result = `${formattedAuthors} (${year}). *${title}* [${degree || 'Doctoral dissertation'}, ${university}].${url ? ` ${url}` : ''}`;
      } else if (sourceType === 'video') {
        result = `${director || authors} (${year}). *${title}* [Video]. ${platform || publisher}.${url ? ` ${url}` : ''}`;
      } else if (sourceType === 'podcast') {
        const formattedAuthors = hostName || authors;
        result = `${formattedAuthors} (Host). (${year}, ${month || ''} ${day || ''}). ${episodeTitle || title} [Audio podcast episode]. In *${title}*. ${platform || publisher}.${url ? ` ${url}` : ''}`;
      } else if (sourceType === 'report') {
        const formattedAuthors = organization || formatAuthorsAPA(authors);
        result = `${formattedAuthors}. (${year}). *${title}*${reportNumber ? ` (${reportNumber})` : ''}. ${publisher || organization}.${url ? ` ${url}` : ''}`;
      } else if (sourceType === 'magazine') {
        const formattedAuthors = formatAuthorsAPA(authors);
        const fullDate = month ? `${year}, ${month}${day ? ` ${day}` : ''}` : year;
        result = `${formattedAuthors} (${fullDate}). ${title}. *${magazineName}*${volume ? `, *${volume}*` : ''}${issue ? `(${issue})` : ''}${pages ? `, ${pages}` : ''}.${url ? ` ${url}` : ''}`;
      } else if (sourceType === 'encyclopedia') {
        const formattedAuthors = authors ? formatAuthorsAPA(authors) : '';
        result = `${formattedAuthors ? `${formattedAuthors} ` : ''}(${year || 'n.d.'}). ${title}. In ${editorName ? `${editorName} (Ed.), ` : ''}*${encyclopediaName}*${edition ? ` (${edition} ed.)` : ''}.${publisher ? ` ${publisher}.` : ''}${url ? ` ${url}` : ''}`;
      }
    } else if (style === 'mla') {
      if (sourceType === 'book') {
        const formattedAuthors = formatAuthorsMLA(authors);
        result = `${formattedAuthors}. *${title}*${edition ? `, ${edition} ed.` : ''}. ${publisher}${year ? `, ${year}` : ''}.`;
      } else if (sourceType === 'journal') {
        const formattedAuthors = formatAuthorsMLA(authors);
        result = `${formattedAuthors}. "${title}." *${journalName}*${volume ? `, vol. ${volume}` : ''}${issue ? `, no. ${issue}` : ''}${year ? `, ${year}` : ''}${pages ? `, pp. ${pages}` : ''}.${doi ? ` DOI: ${doi}` : ''}`;
      } else if (sourceType === 'website') {
        const formattedAuthors = authors ? formatAuthorsMLA(authors) : '';
        result = `${formattedAuthors}${formattedAuthors ? '. ' : ''}"${title}." *${websiteName}*${year ? `, ${day || ''} ${month || ''} ${year}` : ''}${url ? `, ${url}` : ''}${accessDate ? `. Accessed ${accessDate}` : ''}.`;
      } else if (sourceType === 'newspaper') {
        const formattedAuthors = formatAuthorsMLA(authors);
        result = `${formattedAuthors}. "${title}." *${newspaperName}*${year ? `, ${day || ''} ${month || ''} ${year}` : ''}${pages ? `, ${pages}` : ''}.${url ? ` ${url}` : ''}`;
      } else if (sourceType === 'conference') {
        const formattedAuthors = formatAuthorsMLA(authors);
        result = `${formattedAuthors}. "${title}." *${conferenceName}*${conferenceLocation ? `, ${conferenceLocation}` : ''}${year ? `, ${year}` : ''}.`;
      } else if (sourceType === 'thesis') {
        const formattedAuthors = formatAuthorsMLA(authors);
        result = `${formattedAuthors}. *${title}*. ${year}. ${university}, ${degree || 'PhD dissertation'}.`;
      } else if (sourceType === 'video') {
        result = `*${title}*. Directed by ${director || authors}, ${publisher || platform}, ${year}.`;
      } else if (sourceType === 'podcast') {
        result = `"${episodeTitle || title}." *${title}*, hosted by ${hostName || authors}, ${platform || publisher}, ${day || ''} ${month || ''} ${year}.${url ? ` ${url}` : ''}`;
      } else if (sourceType === 'report') {
        const formattedAuthors = organization || formatAuthorsMLA(authors);
        result = `${formattedAuthors}. *${title}*${reportNumber ? `, ${reportNumber}` : ''}. ${publisher || organization}, ${year}.${url ? ` ${url}` : ''}`;
      } else if (sourceType === 'magazine') {
        const formattedAuthors = formatAuthorsMLA(authors);
        result = `${formattedAuthors}. "${title}." *${magazineName}*${year ? `, ${day || ''} ${month || ''} ${year}` : ''}${pages ? `, pp. ${pages}` : ''}.${url ? ` ${url}` : ''}`;
      } else if (sourceType === 'encyclopedia') {
        const formattedAuthors = authors ? formatAuthorsMLA(authors) : '';
        result = `${formattedAuthors}${formattedAuthors ? '. ' : ''}"${title}." *${encyclopediaName}*${edition ? `, ${edition} ed.` : ''}${year ? `, ${year}` : ''}.`;
      } else if (sourceType === 'ebook') {
        const formattedAuthors = formatAuthorsMLA(authors);
        result = `${formattedAuthors}. *${title}*. ${publisher}, ${year}. ${platform || 'E-book'}.`;
      }
    } else if (style === 'chicago') {
      const formattedChicago = (sourceType === 'report' && organization?.trim()) ? organization : formatAuthorsChicago(authors || '');
      const chicagoAuthor = (authors?.trim() || (sourceType === 'report' && organization?.trim())) ? formattedChicago : (websiteName || '');
      if (sourceType === 'book') {
        result = `${formattedChicago}. *${title}*${edition ? `, ${edition} ed` : ''}. ${city ? `${city}: ` : ''}${publisher}${year ? `, ${year}` : ''}.`;
      } else if (sourceType === 'journal') {
        result = `${formattedChicago}. "${title}." *${journalName}*${volume ? ` ${volume}` : ''}${issue ? `, no. ${issue}` : ''} (${year})${pages ? `: ${pages}` : ''}.${doi ? ` https://doi.org/${doi}` : ''}`;
      } else if (sourceType === 'website') {
        result = `${chicagoAuthor}. "${title}." ${websiteName}${year ? `. ${month || ''} ${day || ''}, ${year}` : ''}. ${url}${accessDate ? `. Accessed ${accessDate}` : ''}.`;
      } else if (sourceType === 'newspaper') {
        result = `${formattedChicago}. "${title}." *${newspaperName}*${year ? `, ${month || ''} ${day || ''}, ${year}` : ''}.${url ? ` ${url}` : ''}`;
      } else if (sourceType === 'conference') {
        result = `${formattedChicago}. "${title}." Paper presented at ${conferenceName}${conferenceLocation ? `, ${conferenceLocation}` : ''}${year ? `, ${year}` : ''}.`;
      } else if (sourceType === 'thesis') {
        result = `${formattedChicago}. "${title}." ${degree || 'PhD diss.'}, ${university}, ${year}.`;
      } else if (sourceType === 'video') {
        result = `*${title}*. Directed by ${director || formattedChicago}. ${city ? `${city}: ` : ''}${publisher || platform}, ${year}.`;
      } else if (sourceType === 'report') {
        result = `${organization || formattedChicago}. *${title}*${reportNumber ? `, ${reportNumber}` : ''}. ${city ? `${city}: ` : ''}${publisher || organization}, ${year}.`;
      } else if (sourceType === 'magazine') {
        result = `${formattedChicago}. "${title}." *${magazineName}*${year ? `, ${month || ''} ${day || ''}, ${year}` : ''}${pages ? `, ${pages}` : ''}.`;
      } else if (sourceType === 'encyclopedia') {
        result = `${formattedChicago ? `${formattedChicago}. ` : ''}"${title}." In *${encyclopediaName}*${edition ? `, ${edition} ed` : ''}${editorName ? `, edited by ${editorName}` : ''}${pages ? `, ${pages}` : ''}. ${city ? `${city}: ` : ''}${publisher}, ${year}.`;
      } else if (sourceType === 'ebook') {
        result = `${formattedChicago}. *${title}*. ${city ? `${city}: ` : ''}${publisher}, ${year}. ${platform}.`;
      } else if (sourceType === 'podcast') {
        result = `${hostName || formattedChicago}. "${episodeTitle || title}." In *${title}*. Podcast audio. ${month || ''} ${day || ''}, ${year}. ${url}`;
      }
    } else if (style === 'harvard') {
      if (sourceType === 'book') {
        const formattedAuthors = formatAuthorsAPA(authors);
        result = `${formattedAuthors} (${year}) *${title}*${edition ? `, ${edition} edn` : ''}. ${city ? `${city}: ` : ''}${publisher}.`;
      } else if (sourceType === 'journal') {
        const formattedAuthors = formatAuthorsAPA(authors);
        result = `${formattedAuthors} (${year}) '${title}', *${journalName}*${volume ? `, ${volume}` : ''}${issue ? `(${issue})` : ''}${pages ? `, pp. ${pages}` : ''}.${doi ? ` doi: ${doi}` : ''}`;
      } else if (sourceType === 'website') {
        const formattedAuthors = authors ? formatAuthorsAPA(authors) : websiteName;
        result = `${formattedAuthors} (${year || 'n.d.'}) *${title}*. Available at: ${url}${accessDate ? ` (Accessed: ${accessDate})` : ''}.`;
      } else if (sourceType === 'newspaper') {
        const formattedAuthors = formatAuthorsAPA(authors);
        result = `${formattedAuthors} (${year}) '${title}', *${newspaperName}*${day && month ? `, ${day} ${month}` : ''}${pages ? `, ${pages}` : ''}.`;
      } else if (sourceType === 'conference') {
        const formattedAuthors = formatAuthorsAPA(authors);
        result = `${formattedAuthors} (${year}) '${title}', *${conferenceName}*${conferenceLocation ? `, ${conferenceLocation}` : ''}${pages ? `, pp. ${pages}` : ''}.`;
      } else if (sourceType === 'thesis') {
        const formattedAuthors = formatAuthorsAPA(authors);
        result = `${formattedAuthors} (${year}) *${title}*. ${degree || 'PhD thesis'}. ${university}.${url ? ` Available at: ${url}` : ''}`;
      } else if (sourceType === 'video') {
        result = `${director || authors} (${year}) *${title}* [Video]. ${platform || publisher}.${url ? ` Available at: ${url}` : ''}`;
      } else if (sourceType === 'report') {
        const formattedAuthors = organization || formatAuthorsAPA(authors);
        result = `${formattedAuthors} (${year}) *${title}*${reportNumber ? ` (${reportNumber})` : ''}. ${city ? `${city}: ` : ''}${publisher || organization}.${url ? ` Available at: ${url}` : ''}`;
      } else if (sourceType === 'magazine') {
        const formattedAuthors = formatAuthorsAPA(authors);
        result = `${formattedAuthors} (${year}) '${title}', *${magazineName}*${day && month ? `, ${day} ${month}` : ''}${pages ? `, pp. ${pages}` : ''}.`;
      } else if (sourceType === 'encyclopedia') {
        const formattedAuthors = authors ? formatAuthorsAPA(authors) : '';
        result = `${formattedAuthors ? `${formattedAuthors} ` : ''}(${year || 'n.d.'}) '${title}', in ${editorName ? `${editorName} (ed.) ` : ''}*${encyclopediaName}*${edition ? `, ${edition} edn` : ''}. ${publisher}.${url ? ` Available at: ${url}` : ''}`;
      } else if (sourceType === 'ebook') {
        const formattedAuthors = formatAuthorsAPA(authors);
        result = `${formattedAuthors} (${year}) *${title}*. ${publisher}. Available at: ${url || platform}`;
      } else if (sourceType === 'podcast') {
        result = `${hostName || authors} (${year}) '${episodeTitle || title}', *${title}* [Podcast]. ${day || ''} ${month || ''}. Available at: ${url}`;
      }
    } else if (style === 'ieee') {
      if (sourceType === 'book') {
        const formattedAuthors = formatAuthorsIEEE(authors);
        result = `${formattedAuthors}, *${title}*${edition ? `, ${edition} ed` : ''}. ${city ? `${city}: ` : ''}${publisher}, ${year}.`;
      } else if (sourceType === 'journal') {
        const formattedAuthors = formatAuthorsIEEE(authors);
        result = `${formattedAuthors}, "${title}," *${journalName}*, vol. ${volume || ''}${issue ? `, no. ${issue}` : ''}${pages ? `, pp. ${pages}` : ''}, ${month || ''} ${year}.${doi ? ` doi: ${doi}` : ''}`;
      } else if (sourceType === 'website') {
        const formattedAuthors = authors ? formatAuthorsIEEE(authors) : websiteName;
        result = `${formattedAuthors}, "${title}," *${websiteName}*. ${url}${accessDate ? ` (accessed ${accessDate})` : ''}.`;
      } else if (sourceType === 'conference') {
        const formattedAuthors = formatAuthorsIEEE(authors);
        result = `${formattedAuthors}, "${title}," in *${conferenceName}*, ${conferenceLocation || ''}, ${year}${pages ? `, pp. ${pages}` : ''}.${doi ? ` doi: ${doi}` : ''}`;
      } else if (sourceType === 'thesis') {
        const formattedAuthors = formatAuthorsIEEE(authors);
        result = `${formattedAuthors}, "${title}," ${degree || 'Ph.D. dissertation'}, ${university}, ${city || ''}, ${year}.`;
      } else if (sourceType === 'report') {
        const formattedAuthors = organization || formatAuthorsIEEE(authors);
        result = `${formattedAuthors}, "${title}," ${reportNumber ? `${reportNumber}, ` : ''}${publisher || organization}, ${city || ''}, ${year}.`;
      } else if (sourceType === 'video') {
        result = `${director || authors}, *${title}*. ${platform || publisher}, ${year}. [Video].${url ? ` ${url}` : ''}`;
      } else if (sourceType === 'ebook') {
        const formattedAuthors = formatAuthorsIEEE(authors);
        result = `${formattedAuthors}, *${title}*. ${publisher}, ${year}. [E-book]. ${url || platform}`;
      } else {
        const formattedAuthors = formatAuthorsIEEE(authors);
        result = `${formattedAuthors}, "${title}," ${year}.`;
      }
    } else if (style === 'vancouver') {
      if (sourceType === 'book') {
        const formattedAuthors = formatAuthorsVancouver(authors);
        result = `${formattedAuthors}. ${title}${edition ? `. ${edition} ed` : ''}. ${city ? `${city}: ` : ''}${publisher}; ${year}.`;
      } else if (sourceType === 'journal') {
        const formattedAuthors = formatAuthorsVancouver(authors);
        result = `${formattedAuthors}. ${title}. ${journalName}. ${year}${month ? ` ${month}` : ''}${day ? ` ${day}` : ''};${volume || ''}${issue ? `(${issue})` : ''}${pages ? `:${pages}` : ''}.${doi ? ` doi: ${doi}` : ''}`;
      } else if (sourceType === 'website') {
        const formattedAuthors = authors ? formatAuthorsVancouver(authors) : websiteName;
        result = `${formattedAuthors}. ${title} [Internet]. ${websiteName}; ${year}${month ? ` ${month}` : ''}${day ? ` ${day}` : ''} [cited ${accessDate || 'date'}]. Available from: ${url}`;
      } else if (sourceType === 'newspaper') {
        const formattedAuthors = formatAuthorsVancouver(authors);
        result = `${formattedAuthors}. ${title}. ${newspaperName}. ${year} ${month || ''} ${day || ''}${pages ? `:${pages}` : ''}.`;
      } else if (sourceType === 'conference') {
        const formattedAuthors = formatAuthorsVancouver(authors);
        result = `${formattedAuthors}. ${title}. In: ${conferenceName}; ${year}${conferenceLocation ? `; ${conferenceLocation}` : ''}${pages ? `. p. ${pages}` : ''}.`;
      } else if (sourceType === 'thesis') {
        const formattedAuthors = formatAuthorsVancouver(authors);
        result = `${formattedAuthors}. ${title} [${degree || 'dissertation'}]. ${city || ''}: ${university}; ${year}.`;
      } else if (sourceType === 'report') {
        const formattedAuthors = organization || formatAuthorsVancouver(authors);
        result = `${formattedAuthors}. ${title}. ${city || ''}: ${publisher || organization}; ${year}${reportNumber ? `. Report No.: ${reportNumber}` : ''}.`;
      } else {
        const formattedAuthors = formatAuthorsVancouver(authors);
        result = `${formattedAuthors}. ${title}. ${year}.`;
      }
    }

    setCitation(result);
  };

  const handleCopy = async () => {
    const plainText = citation.replace(/\*([^*]+)\*/g, '$1'); // strip asterisks for plain
    const htmlText = citation.replace(/\*([^*]+)\*/g, '<i>$1</i>'); // HTML for rich paste (Word, Docs)
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': new Blob([plainText], { type: 'text/plain' }),
          'text/html': new Blob([`<p>${htmlText}</p>`], { type: 'text/html' })
        })
      ]);
    } catch {
      navigator.clipboard.writeText(plainText);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    trackCopy();
  };

  const primarySourceTypes = [
    { value: 'book', label: 'Book', icon: '📚' },
    { value: 'website', label: 'Website', icon: '🌐' },
    { value: 'journal', label: 'Journal', icon: '📄' },
  ];
  const moreSourceTypes = [
    { value: 'ebook', label: 'E-Book', icon: '📱' },
    { value: 'newspaper', label: 'Newspaper', icon: '📰' },
    { value: 'magazine', label: 'Magazine', icon: '📖' },
    { value: 'conference', label: 'Conference', icon: '🎤' },
    { value: 'thesis', label: 'Thesis', icon: '🎓' },
    { value: 'report', label: 'Report', icon: '📋' },
    { value: 'video', label: 'Video', icon: '🎬' },
    { value: 'podcast', label: 'Podcast', icon: '🎙️' },
    { value: 'encyclopedia', label: 'Encyclopedia', icon: '📕' },
  ];

  const inputClass = "w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-600 rounded-xl focus:border-[#1CB0F6] focus:ring-2 focus:ring-[#1CB0F6]/20 outline-none transition-all text-stone-800 dark:text-stone-200";
  const selectClass = "w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-600 rounded-xl focus:border-[#1CB0F6] focus:ring-2 focus:ring-[#1CB0F6]/20 outline-none transition-all text-stone-800 dark:text-stone-200";
  const labelClass = "block text-sm font-extrabold text-stone-700 dark:text-stone-300 mb-1";
  const hintClass = "text-xs text-stone-500 dark:text-stone-400 mt-1";

  const renderFormFields = () => {
    const commonFields = (
      <>
        <div>
          <label className={labelClass}>Author(s) *</label>
          <input
            type="text"
            value={formData.authors}
            onChange={(e) => handleInputChange('authors', e.target.value)}
            placeholder="John Smith, Jane Doe or Li, Wei (family-name-first)"
            className={inputClass}
          />
          <p className={hintClass}>Multiple authors: use commas (John Smith, Jane Doe) or semicolons. Use &quot;Li, Wei&quot; for family-name-first (one author).</p>
        </div>
        <div>
          <label className={labelClass}>Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Enter the title"
            className={inputClass}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Year *</label>
            <input
              type="text"
              value={formData.year}
              onChange={(e) => handleInputChange('year', e.target.value)}
              placeholder="2024"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Month</label>
            <input
              type="text"
              value={formData.month}
              onChange={(e) => handleInputChange('month', e.target.value)}
              placeholder="January"
              className={inputClass}
            />
          </div>
        </div>
      </>
    );

    if (sourceType === 'book' || sourceType === 'ebook') {
      return (
        <>
          {commonFields}
          <div>
            <label className={labelClass}>Publisher</label>
            <input
              type="text"
              value={formData.publisher}
              onChange={(e) => handleInputChange('publisher', e.target.value)}
              placeholder="Publisher name"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="New York"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Edition</label>
              <input
                type="text"
                value={formData.edition}
                onChange={(e) => handleInputChange('edition', e.target.value)}
                placeholder="2nd"
                className={inputClass}
              />
            </div>
          </div>
          {sourceType === 'ebook' && (
            <div>
              <label className={labelClass}>URL / Platform</label>
              <input
                type="text"
                value={formData.url}
                onChange={(e) => handleInputChange('url', e.target.value)}
                placeholder="https://... or Kindle"
                className={inputClass}
              />
            </div>
          )}
          <div>
            <label className={labelClass}>DOI</label>
            <input
              type="text"
              value={formData.doi}
              onChange={(e) => handleInputChange('doi', e.target.value)}
              placeholder="10.1234/example"
              className={inputClass}
            />
          </div>
        </>
      );
    }

    if (sourceType === 'journal') {
      return (
        <>
          {commonFields}
          <div>
            <label className={labelClass}>Journal Name *</label>
            <input
              type="text"
              value={formData.journalName}
              onChange={(e) => handleInputChange('journalName', e.target.value)}
              placeholder="Journal of Academic Research"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Volume</label>
              <input
                type="text"
                value={formData.volume}
                onChange={(e) => handleInputChange('volume', e.target.value)}
                placeholder="12"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Issue</label>
              <input
                type="text"
                value={formData.issue}
                onChange={(e) => handleInputChange('issue', e.target.value)}
                placeholder="3"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Pages</label>
              <input
                type="text"
                value={formData.pages}
                onChange={(e) => handleInputChange('pages', e.target.value)}
                placeholder="45-67"
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>DOI</label>
            <input
              type="text"
              value={formData.doi}
              onChange={(e) => handleInputChange('doi', e.target.value)}
              placeholder="10.1234/example"
              className={inputClass}
            />
          </div>
        </>
      );
    }

    if (sourceType === 'website') {
      return (
        <>
          {commonFields}
          <div>
            <label className={labelClass}>Day</label>
            <input
              type="text"
              value={formData.day}
              onChange={(e) => handleInputChange('day', e.target.value)}
              placeholder="15"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Website Name</label>
            <input
              type="text"
              value={formData.websiteName}
              onChange={(e) => handleInputChange('websiteName', e.target.value)}
              placeholder="Website or organization name"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>URL *</label>
            <input
              type="text"
              value={formData.url}
              onChange={(e) => handleInputChange('url', e.target.value)}
              placeholder="https://example.com/article"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Access Date</label>
            <input
              type="text"
              value={formData.accessDate}
              onChange={(e) => handleInputChange('accessDate', e.target.value)}
              placeholder="January 15, 2024"
              className={inputClass}
            />
          </div>
        </>
      );
    }

    if (sourceType === 'newspaper' || sourceType === 'magazine') {
      return (
        <>
          {commonFields}
          <div>
            <label className={labelClass}>Day</label>
            <input
              type="text"
              value={formData.day}
              onChange={(e) => handleInputChange('day', e.target.value)}
              placeholder="15"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{sourceType === 'newspaper' ? 'Newspaper' : 'Magazine'} Name *</label>
            <input
              type="text"
              value={sourceType === 'newspaper' ? formData.newspaperName : formData.magazineName}
              onChange={(e) => handleInputChange(sourceType === 'newspaper' ? 'newspaperName' : 'magazineName', e.target.value)}
              placeholder={sourceType === 'newspaper' ? 'The New York Times' : 'Time Magazine'}
              className={inputClass}
            />
          </div>
          {sourceType === 'magazine' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Volume</label>
                <input
                  type="text"
                  value={formData.volume}
                  onChange={(e) => handleInputChange('volume', e.target.value)}
                  placeholder="12"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Issue</label>
                <input
                  type="text"
                  value={formData.issue}
                  onChange={(e) => handleInputChange('issue', e.target.value)}
                  placeholder="3"
                  className={inputClass}
                />
              </div>
            </div>
          )}
          <div>
            <label className={labelClass}>Pages</label>
            <input
              type="text"
              value={formData.pages}
              onChange={(e) => handleInputChange('pages', e.target.value)}
              placeholder="A1, B3"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>URL (if online)</label>
            <input
              type="text"
              value={formData.url}
              onChange={(e) => handleInputChange('url', e.target.value)}
              placeholder="https://..."
              className={inputClass}
            />
          </div>
        </>
      );
    }

    if (sourceType === 'conference') {
      return (
        <>
          {commonFields}
          <div>
            <label className={labelClass}>Conference Name *</label>
            <input
              type="text"
              value={formData.conferenceName}
              onChange={(e) => handleInputChange('conferenceName', e.target.value)}
              placeholder="International Conference on..."
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Conference Location</label>
            <input
              type="text"
              value={formData.conferenceLocation}
              onChange={(e) => handleInputChange('conferenceLocation', e.target.value)}
              placeholder="New York, USA"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Pages</label>
            <input
              type="text"
              value={formData.pages}
              onChange={(e) => handleInputChange('pages', e.target.value)}
              placeholder="45-52"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>DOI</label>
            <input
              type="text"
              value={formData.doi}
              onChange={(e) => handleInputChange('doi', e.target.value)}
              placeholder="10.1234/example"
              className={inputClass}
            />
          </div>
        </>
      );
    }

    if (sourceType === 'thesis') {
      return (
        <>
          {commonFields}
          <div>
            <label className={labelClass}>University *</label>
            <input
              type="text"
              value={formData.university}
              onChange={(e) => handleInputChange('university', e.target.value)}
              placeholder="Harvard University"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Degree Type</label>
              <select
                value={formData.degree}
                onChange={(e) => handleInputChange('degree', e.target.value)}
                className={selectClass}
              >
                <option value="">Select degree</option>
                <option value="Doctoral dissertation">PhD Dissertation</option>
                <option value="Master's thesis">Master's Thesis</option>
                <option value="Bachelor's thesis">Bachelor's Thesis</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Cambridge, MA"
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>URL (if available)</label>
            <input
              type="text"
              value={formData.url}
              onChange={(e) => handleInputChange('url', e.target.value)}
              placeholder="https://..."
              className={inputClass}
            />
          </div>
        </>
      );
    }

    if (sourceType === 'video') {
      return (
        <>
          <div>
            <label className={labelClass}>Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Video title"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Director / Creator</label>
            <input
              type="text"
              value={formData.director}
              onChange={(e) => handleInputChange('director', e.target.value)}
              placeholder="Christopher Nolan"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Year</label>
              <input
                type="text"
                value={formData.year}
                onChange={(e) => handleInputChange('year', e.target.value)}
                placeholder="2024"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Platform / Studio</label>
              <input
                type="text"
                value={formData.platform}
                onChange={(e) => handleInputChange('platform', e.target.value)}
                placeholder="YouTube, Netflix, etc."
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>URL</label>
            <input
              type="text"
              value={formData.url}
              onChange={(e) => handleInputChange('url', e.target.value)}
              placeholder="https://..."
              className={inputClass}
            />
          </div>
        </>
      );
    }

    if (sourceType === 'podcast') {
      return (
        <>
          <div>
            <label className={labelClass}>Podcast Name *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="The Daily"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Episode Title</label>
            <input
              type="text"
              value={formData.episodeTitle}
              onChange={(e) => handleInputChange('episodeTitle', e.target.value)}
              placeholder="Episode title"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Host Name</label>
            <input
              type="text"
              value={formData.hostName}
              onChange={(e) => handleInputChange('hostName', e.target.value)}
              placeholder="Host name"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Year</label>
              <input
                type="text"
                value={formData.year}
                onChange={(e) => handleInputChange('year', e.target.value)}
                placeholder="2024"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Month</label>
              <input
                type="text"
                value={formData.month}
                onChange={(e) => handleInputChange('month', e.target.value)}
                placeholder="January"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Day</label>
              <input
                type="text"
                value={formData.day}
                onChange={(e) => handleInputChange('day', e.target.value)}
                placeholder="15"
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Platform</label>
            <input
              type="text"
              value={formData.platform}
              onChange={(e) => handleInputChange('platform', e.target.value)}
              placeholder="Spotify, Apple Podcasts, etc."
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>URL</label>
            <input
              type="text"
              value={formData.url}
              onChange={(e) => handleInputChange('url', e.target.value)}
              placeholder="https://..."
              className={inputClass}
            />
          </div>
        </>
      );
    }

    if (sourceType === 'report') {
      return (
        <>
          {commonFields}
          <div>
            <label className={labelClass}>Organization</label>
            <input
              type="text"
              value={formData.organization}
              onChange={(e) => handleInputChange('organization', e.target.value)}
              placeholder="World Health Organization"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Report Number</label>
              <input
                type="text"
                value={formData.reportNumber}
                onChange={(e) => handleInputChange('reportNumber', e.target.value)}
                placeholder="Report No. 123"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Geneva"
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Publisher</label>
            <input
              type="text"
              value={formData.publisher}
              onChange={(e) => handleInputChange('publisher', e.target.value)}
              placeholder="Publisher name"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>URL</label>
            <input
              type="text"
              value={formData.url}
              onChange={(e) => handleInputChange('url', e.target.value)}
              placeholder="https://..."
              className={inputClass}
            />
          </div>
        </>
      );
    }

    if (sourceType === 'encyclopedia') {
      return (
        <>
          <div>
            <label className={labelClass}>Article/Entry Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Climate Change"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Author(s)</label>
            <input
              type="text"
              value={formData.authors}
              onChange={(e) => handleInputChange('authors', e.target.value)}
              placeholder="John Smith (leave blank if none)"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Encyclopedia Name *</label>
            <input
              type="text"
              value={formData.encyclopediaName}
              onChange={(e) => handleInputChange('encyclopediaName', e.target.value)}
              placeholder="Encyclopedia Britannica"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Editor(s)</label>
              <input
                type="text"
                value={formData.editorName}
                onChange={(e) => handleInputChange('editorName', e.target.value)}
                placeholder="Editor name"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Edition</label>
              <input
                type="text"
                value={formData.edition}
                onChange={(e) => handleInputChange('edition', e.target.value)}
                placeholder="15th"
                className={inputClass}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Year</label>
              <input
                type="text"
                value={formData.year}
                onChange={(e) => handleInputChange('year', e.target.value)}
                placeholder="2024"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Pages</label>
              <input
                type="text"
                value={formData.pages}
                onChange={(e) => handleInputChange('pages', e.target.value)}
                placeholder="123-130"
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Publisher</label>
            <input
              type="text"
              value={formData.publisher}
              onChange={(e) => handleInputChange('publisher', e.target.value)}
              placeholder="Publisher name"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>URL (if online)</label>
            <input
              type="text"
              value={formData.url}
              onChange={(e) => handleInputChange('url', e.target.value)}
              placeholder="https://..."
              className={inputClass}
            />
          </div>
        </>
      );
    }

    return commonFields;
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-stone-50 dark:bg-stone-950" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="citation-generator-tool" />

      {user && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4">
          <button
            onClick={() => onNavigate('dashboard')}
            className="inline-flex items-center gap-2 text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 transition-colors text-sm font-extrabold"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
        </div>
      )}

      {/* Hero Section */}
      <section className="py-8 sm:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center mb-4">
              <ScholarMascot size={56} animated={false} pose="default" />
            </div>
            <span className="inline-flex items-center px-4 py-1.5 bg-[#EAFFD6] text-[#46A302] border-2 border-b-4 border-[#58CC02]/30 rounded-full text-sm font-extrabold uppercase tracking-wide mb-3">
              Free Tool
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-stone-900 dark:text-stone-50 mb-3 leading-tight">
              Citation Generator
            </h1>
            <p className="text-base sm:text-lg text-stone-500 dark:text-stone-400 leading-relaxed max-w-2xl mx-auto">
              APA, MLA, Chicago, Harvard, IEEE & Vancouver for 12 source types.
            </p>
          </div>
        </div>
      </section>

      {/* Main Tool Section */}
      <section className="py-8 sm:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Input Form */}
            <div className="order-2 lg:order-1 border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6">
              <h2 className="text-lg font-extrabold text-stone-900 dark:text-stone-50 mb-6">Source Details</h2>

              {/* Citation Style Selection */}
              <div className="mb-6">
                <label className="block text-sm font-extrabold text-stone-700 dark:text-stone-300 mb-2">Citation Style</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(['apa', 'mla', 'chicago', 'harvard', 'ieee', 'vancouver'] as CitationStyle[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStyle(s)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-extrabold uppercase tracking-wide transition-all border-2 border-b-4 active:border-b-2 active:translate-y-0.5 ${
                        style === s
                          ? 'bg-[#1CB0F6] border-[#1899D6] text-white'
                          : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
                      }`}
                    >
                      {s.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Source Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-extrabold text-stone-700 dark:text-stone-300 mb-2">Source Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {primarySourceTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setSourceType(type.value as SourceType)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wide transition-all flex flex-col items-center justify-center space-y-1 border-2 border-b-4 active:border-b-2 active:translate-y-0.5 ${
                        sourceType === type.value
                          ? 'bg-[#58CC02] border-[#46A302] text-white'
                          : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
                      }`}
                    >
                      <span className="text-base">{type.icon}</span>
                      <span>{type.label}</span>
                    </button>
                  ))}
                </div>
                {showMoreSourceTypes ? (
                  <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {moreSourceTypes.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setSourceType(type.value as SourceType)}
                        className={`px-3 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wide transition-all flex flex-col items-center justify-center space-y-1 border-2 border-b-4 active:border-b-2 active:translate-y-0.5 ${
                          sourceType === type.value
                            ? 'bg-[#58CC02] border-[#46A302] text-white'
                            : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
                        }`}
                      >
                        <span className="text-base">{type.icon}</span>
                        <span>{type.label}</span>
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        if (moreSourceTypes.some(t => t.value === sourceType)) setSourceType('book');
                        setShowMoreSourceTypes(false);
                      }}
                      className="px-3 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wide text-[#1CB0F6] hover:bg-[#DDF4FF] dark:hover:bg-[#1CB0F6]/10 transition-all flex items-center justify-center gap-1 border-2 border-b-4 border-[#1CB0F6]/30 active:border-b-2 active:translate-y-0.5"
                    >
                      Fewer
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowMoreSourceTypes(true)}
                    className="mt-2 w-full py-2 rounded-xl text-xs font-extrabold uppercase tracking-wide text-[#1CB0F6] hover:bg-[#DDF4FF] dark:hover:bg-[#1CB0F6]/10 transition-all border-2 border-b-4 border-[#1CB0F6]/30 active:border-b-2 active:translate-y-0.5"
                  >
                    + More (E-Book, Newspaper, Thesis, etc.)
                  </button>
                )}
              </div>

              {/* Dynamic Form Fields */}
              <div className="space-y-4">
                {renderFormFields()}
              </div>

              {validationError && (
                <div className="mt-4 border-2 border-b-4 border-[#FF9600]/40 bg-[#FFF4E0] dark:bg-[#FF9600]/10 rounded-xl px-4 py-3">
                  <p className="text-sm font-extrabold text-[#D97F00]">
                    {validationError}
                  </p>
                </div>
              )}
              <button
                onClick={generateCitation}
                className="w-full mt-6 px-6 py-3 bg-[#58CC02] hover:bg-[#46A302] border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5 text-white font-extrabold uppercase tracking-wide rounded-xl transition-all"
              >
                Generate Citation
              </button>
            </div>

            {/* Output Panel */}
            <div ref={citationOutputRef} className="order-1 lg:order-2 space-y-6 lg:sticky lg:top-24 lg:self-start">
              {/* Generated Citation */}
              <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-extrabold text-stone-900 dark:text-stone-50">Your Citation</h3>
                  {citation && (
                    <button
                      onClick={handleCopy}
                      className={`px-4 py-2 rounded-xl text-sm font-extrabold uppercase tracking-wide transition-all border-2 border-b-4 active:border-b-2 active:translate-y-0.5 ${
                        copied
                          ? 'bg-[#EAFFD6] border-[#58CC02]/40 text-[#46A302]'
                          : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
                      }`}
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  )}
                </div>
                <div className="bg-stone-50 dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-600 rounded-xl p-4 min-h-[100px]">
                  {citation ? (
                    <p className="text-stone-800 dark:text-stone-200 leading-relaxed text-sm sm:text-base" dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(String(citation).replace(/\*([^*]+)\*/g, '<em>$1</em>'), { ALLOWED_TAGS: ['em', 'i'] })
                    }} />
                  ) : (
                    <p className="text-stone-500 dark:text-stone-400 text-sm">
                      Fill in author, title, and year below, then click <strong>Generate Citation</strong>.
                    </p>
                  )}
                </div>
              </div>

              {/* Style Guide - collapsible */}
              <div className="border-2 border-b-4 border-[#A560E8]/30 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenStyleGuide(!openStyleGuide)}
                  className="w-full flex items-center justify-between px-5 py-4 bg-[#A560E8] text-white text-left transition-colors"
                >
                  <h3 className="text-base font-extrabold">About {style.toUpperCase()} Style</h3>
                  <svg className={`w-5 h-5 flex-shrink-0 transition-transform ${openStyleGuide ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openStyleGuide && (
                  <div className="px-5 py-4 bg-[#F3EAFF] dark:bg-[#A560E8]/10 text-[#8A48C7] dark:text-[#A560E8] text-sm space-y-2">
                    {style === 'apa' && (
                      <>
                        <p>APA (American Psychological Association) 7th edition is commonly used in psychology, education, and social sciences.</p>
                        <p>Key features: Author-date citations, hanging indent in references, DOIs for digital sources.</p>
                      </>
                    )}
                    {style === 'mla' && (
                      <>
                        <p>MLA (Modern Language Association) 9th edition is standard for humanities, especially literature and languages.</p>
                        <p>Key features: Author-page citations, Works Cited page, containers for sources.</p>
                      </>
                    )}
                    {style === 'chicago' && (
                      <>
                        <p>Chicago style (17th edition) is versatile, used in history, arts, and many other fields.</p>
                        <p>Key features: Notes-Bibliography or Author-Date system options.</p>
                      </>
                    )}
                    {style === 'harvard' && (
                      <>
                        <p>Harvard referencing is widely used in UK and Australian universities across disciplines.</p>
                        <p>Key features: Author-date citations, alphabetical reference list.</p>
                      </>
                    )}
                    {style === 'ieee' && (
                      <>
                        <p>IEEE style is used in technical fields like engineering, computer science, and electronics.</p>
                        <p>Key features: Numbered citations in square brackets, numerical reference list.</p>
                      </>
                    )}
                    {style === 'vancouver' && (
                      <>
                        <p>Vancouver style is primarily used in medicine and biomedical sciences.</p>
                        <p>Key features: Numbered citations, references in order of appearance.</p>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Disclaimer */}
              <div className="border-2 border-b-4 border-[#FF9600]/30 bg-[#FFF4E0] dark:bg-[#FF9600]/10 rounded-2xl p-4">
                <p className="text-sm font-extrabold text-[#D97F00]">
                  Please verify: <span className="font-semibold">Always check citations against your style guide or professor&apos;s requirements. Formatting rules vary by edition and institution.</span>
                </p>
              </div>

              {/* Tips */}
              <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6">
                <h3 className="text-lg font-extrabold text-stone-900 dark:text-stone-50 mb-4">Citation Tips</h3>
                <ul className="space-y-2 text-sm text-stone-600 dark:text-stone-400">
                  <li className="flex items-start space-x-2">
                    <span className="text-[#58CC02] mt-0.5 font-extrabold">&#10003;</span>
                    <span>Always verify citations against official style guides</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-[#58CC02] mt-0.5 font-extrabold">&#10003;</span>
                    <span>Include DOIs for journal articles when available</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-[#58CC02] mt-0.5 font-extrabold">&#10003;</span>
                    <span>Check your institution's specific formatting requirements</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-[#58CC02] mt-0.5 font-extrabold">&#10003;</span>
                    <span>Keep track of all sources as you research</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 sm:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-extrabold text-stone-900 dark:text-stone-50 mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {[
              { q: 'What citation styles does this generator support?', a: 'We support APA 7th edition, MLA 9th edition, Chicago 17th edition, Harvard, IEEE, and Vancouver. Choose your style and source type to format citations correctly.' },
              { q: 'Is the Citation Generator free?', a: 'Yes. The Citation Generator is completely free with no signup required. Create APA, MLA, Chicago, Harvard, IEEE, and Vancouver citations for books, journals, websites, and 12 source types—instantly.' },
              { q: 'Can I cite websites, journals, and books?', a: 'Yes. You can generate citations for books, journals, websites, newspapers, conference papers, theses, videos, podcasts, reports, ebooks, magazines, and encyclopedias. Select the source type and fill in the details.' },
              { q: 'Do I need to create an account?', a: 'No. The Citation Generator works without an account. Just select your citation style, choose the source type, enter the details, and copy your formatted citation.' },
              { q: 'Should I verify my citations?', a: 'Always verify citations against your style guide or professor\'s requirements. Formatting rules vary by edition and institution. Use this tool as a starting point, then double-check.' },
              { q: 'What\'s the difference between Citation Generator and Citation Finder?', a: 'The Citation Generator formats citations when you already have the source details. Citation Finder (in WriteScholar) searches academic databases to find relevant sources for your topic—then formats them. Use the generator for manual entries; use the finder to discover sources.' }
            ].map((faq, idx) => (
              <div key={idx} className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-xl overflow-hidden hover:border-stone-300 dark:hover:border-stone-600 transition-colors">
                <button
                  onClick={() => setOpenFAQ(openFAQ === idx ? null : idx)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4"
                >
                  <span className="font-extrabold text-stone-900 dark:text-stone-50 text-sm sm:text-base">{faq.q}</span>
                  <svg className={`w-5 h-5 text-stone-400 flex-shrink-0 transition-transform ${openFAQ === idx ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFAQ === idx && (
                  <div className="px-5 pb-4 pt-0 text-stone-600 dark:text-stone-400 text-sm sm:text-base leading-relaxed border-t-2 border-stone-100 dark:border-stone-700">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 bg-[#A560E8]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">
            Need AI-powered citation search?
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            WriteScholar can automatically find and format citations from academic databases. Get relevant sources for your research in seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {user ? (
              <button
                onClick={() => onNavigate('dashboard')}
                className="px-6 py-3 bg-white text-[#A560E8] font-extrabold uppercase tracking-wide rounded-xl border-2 border-b-4 border-stone-200 active:border-b-2 active:translate-y-0.5 hover:bg-stone-50 transition-all"
              >
                Search Citations
              </button>
            ) : (
              <>
                <button
                  onClick={() => onNavigate('signup')}
                  className="px-6 py-3 bg-white text-[#A560E8] font-extrabold uppercase tracking-wide rounded-xl border-2 border-b-4 border-stone-200 active:border-b-2 active:translate-y-0.5 hover:bg-stone-50 transition-all"
                >
                  Try WriteScholar Free
                </button>
                <button
                  onClick={() => onNavigate('features')}
                  className="px-6 py-3 border-2 border-b-4 border-white/40 text-white font-extrabold uppercase tracking-wide rounded-xl active:border-b-2 active:translate-y-0.5 hover:bg-white/10 transition-all"
                >
                  Learn More
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      <ToolPageSeoContent {...citationGeneratorSeo} onNavigate={onNavigate} />

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default CitationGeneratorToolPage;
