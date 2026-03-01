import { useState, useEffect } from 'react';
import Header from '../../common/Header';
import Footer from '../../common/Footer';

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

  // SEO: Set page title and meta description
  useEffect(() => {
    document.title = 'Free Citation Generator - APA, MLA, Chicago, Harvard | WriteScholar';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Free citation generator for APA, MLA, Chicago, Harvard, IEEE, and Vancouver styles. Create accurate citations for books, journals, websites, and more. No signup required.');
    }
  }, []);
  const [copied, setCopied] = useState(false);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatAuthorsAPA = (authors: string) => {
    const authorList = authors.split(',').map(a => a.trim()).filter(Boolean);
    if (authorList.length === 0) return '';
    if (authorList.length === 1) {
      const parts = authorList[0].split(' ');
      if (parts.length >= 2) {
        const lastName = parts[parts.length - 1];
        const initials = parts.slice(0, -1).map(n => n[0]?.toUpperCase() + '.').join(' ');
        return `${lastName}, ${initials}`;
      }
      return authorList[0];
    }
    if (authorList.length > 20) {
      const formatted = authorList.slice(0, 19).map((author) => {
        const parts = author.split(' ');
        if (parts.length >= 2) {
          const lastName = parts[parts.length - 1];
          const initials = parts.slice(0, -1).map(n => n[0]?.toUpperCase() + '.').join(' ');
          return `${lastName}, ${initials}`;
        }
        return author;
      });
      const lastAuthor = authorList[authorList.length - 1].split(' ');
      const lastFormatted = lastAuthor.length >= 2 
        ? `${lastAuthor[lastAuthor.length - 1]}, ${lastAuthor.slice(0, -1).map(n => n[0]?.toUpperCase() + '.').join(' ')}`
        : lastAuthor[0];
      return `${formatted.join(', ')}, ... ${lastFormatted}`;
    }
    return authorList.map((author, i) => {
      const parts = author.split(' ');
      if (parts.length >= 2) {
        const lastName = parts[parts.length - 1];
        const initials = parts.slice(0, -1).map(n => n[0]?.toUpperCase() + '.').join(' ');
        return `${lastName}, ${initials}`;
      }
      return author;
    }).join(', & ');
  };

  const formatAuthorsMLA = (authors: string) => {
    const authorList = authors.split(',').map(a => a.trim()).filter(Boolean);
    if (authorList.length === 0) return '';
    if (authorList.length === 1) {
      const parts = authorList[0].split(' ');
      if (parts.length >= 2) {
        const lastName = parts[parts.length - 1];
        const firstName = parts.slice(0, -1).join(' ');
        return `${lastName}, ${firstName}`;
      }
      return authorList[0];
    }
    if (authorList.length === 2) {
      const first = authorList[0].split(' ');
      const second = authorList[1].split(' ');
      const firstFormatted = first.length >= 2 
        ? `${first[first.length - 1]}, ${first.slice(0, -1).join(' ')}`
        : first[0];
      const secondFormatted = second.length >= 2
        ? `${second.slice(0, -1).join(' ')} ${second[second.length - 1]}`
        : second[0];
      return `${firstFormatted}, and ${secondFormatted}`;
    }
    const first = authorList[0].split(' ');
    const firstFormatted = first.length >= 2 
      ? `${first[first.length - 1]}, ${first.slice(0, -1).join(' ')}`
      : first[0];
    return `${firstFormatted}, et al.`;
  };

  const formatAuthorsIEEE = (authors: string) => {
    const authorList = authors.split(',').map(a => a.trim()).filter(Boolean);
    if (authorList.length === 0) return '';
    return authorList.map((author) => {
      const parts = author.split(' ');
      if (parts.length >= 2) {
        const lastName = parts[parts.length - 1];
        const initials = parts.slice(0, -1).map(n => n[0]?.toUpperCase() + '.').join(' ');
        return `${initials} ${lastName}`;
      }
      return author;
    }).join(authorList.length > 3 ? ' et al.' : ', ');
  };

  const formatAuthorsVancouver = (authors: string) => {
    const authorList = authors.split(',').map(a => a.trim()).filter(Boolean);
    if (authorList.length === 0) return '';
    const formatted = authorList.slice(0, 6).map((author) => {
      const parts = author.split(' ');
      if (parts.length >= 2) {
        const lastName = parts[parts.length - 1];
        const initials = parts.slice(0, -1).map(n => n[0]?.toUpperCase()).join('');
        return `${lastName} ${initials}`;
      }
      return author;
    });
    if (authorList.length > 6) {
      return `${formatted.join(', ')}, et al.`;
    }
    return formatted.join(', ');
  };

  const generateCitation = () => {
    const { authors, title, year, publisher, city, journalName, volume, issue, pages, doi, url, accessDate, websiteName, newspaperName, conferenceName, conferenceLocation, university, degree, platform, director, episodeTitle, hostName, organization, reportNumber, magazineName, encyclopediaName, editorName, month, day } = formData;
    
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
      if (sourceType === 'book') {
        result = `${authors}. *${title}*${edition ? `, ${edition} ed` : ''}. ${city ? `${city}: ` : ''}${publisher}${year ? `, ${year}` : ''}.`;
      } else if (sourceType === 'journal') {
        result = `${authors}. "${title}." *${journalName}*${volume ? ` ${volume}` : ''}${issue ? `, no. ${issue}` : ''} (${year})${pages ? `: ${pages}` : ''}.${doi ? ` https://doi.org/${doi}` : ''}`;
      } else if (sourceType === 'website') {
        result = `${authors || websiteName}. "${title}." ${websiteName}${year ? `. ${month || ''} ${day || ''}, ${year}` : ''}. ${url}${accessDate ? `. Accessed ${accessDate}` : ''}.`;
      } else if (sourceType === 'newspaper') {
        result = `${authors}. "${title}." *${newspaperName}*${year ? `, ${month || ''} ${day || ''}, ${year}` : ''}.${url ? ` ${url}` : ''}`;
      } else if (sourceType === 'conference') {
        result = `${authors}. "${title}." Paper presented at ${conferenceName}${conferenceLocation ? `, ${conferenceLocation}` : ''}${year ? `, ${year}` : ''}.`;
      } else if (sourceType === 'thesis') {
        result = `${authors}. "${title}." ${degree || 'PhD diss.'}, ${university}, ${year}.`;
      } else if (sourceType === 'video') {
        result = `*${title}*. Directed by ${director || authors}. ${city ? `${city}: ` : ''}${publisher || platform}, ${year}.`;
      } else if (sourceType === 'report') {
        result = `${organization || authors}. *${title}*${reportNumber ? `, ${reportNumber}` : ''}. ${city ? `${city}: ` : ''}${publisher || organization}, ${year}.`;
      } else if (sourceType === 'magazine') {
        result = `${authors}. "${title}." *${magazineName}*${year ? `, ${month || ''} ${day || ''}, ${year}` : ''}${pages ? `, ${pages}` : ''}.`;
      } else if (sourceType === 'encyclopedia') {
        result = `${authors ? `${authors}. ` : ''}"${title}." In *${encyclopediaName}*${edition ? `, ${edition} ed` : ''}${editorName ? `, edited by ${editorName}` : ''}${pages ? `, ${pages}` : ''}. ${city ? `${city}: ` : ''}${publisher}, ${year}.`;
      } else if (sourceType === 'ebook') {
        result = `${authors}. *${title}*. ${city ? `${city}: ` : ''}${publisher}, ${year}. ${platform}.`;
      } else if (sourceType === 'podcast') {
        result = `${hostName || authors}. "${episodeTitle || title}." In *${title}*. Podcast audio. ${month || ''} ${day || ''}, ${year}. ${url}`;
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

  const handleCopy = () => {
    navigator.clipboard.writeText(citation.replace(/\*/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sourceTypes = [
    { value: 'book', label: 'Book', icon: '📚' },
    { value: 'ebook', label: 'E-Book', icon: '📱' },
    { value: 'journal', label: 'Journal', icon: '📄' },
    { value: 'website', label: 'Website', icon: '🌐' },
    { value: 'newspaper', label: 'Newspaper', icon: '📰' },
    { value: 'magazine', label: 'Magazine', icon: '📖' },
    { value: 'conference', label: 'Conference', icon: '🎤' },
    { value: 'thesis', label: 'Thesis', icon: '🎓' },
    { value: 'report', label: 'Report', icon: '📋' },
    { value: 'video', label: 'Video', icon: '🎬' },
    { value: 'podcast', label: 'Podcast', icon: '🎙️' },
    { value: 'encyclopedia', label: 'Encyclopedia', icon: '📕' },
  ];

  const renderFormFields = () => {
    const commonFields = (
      <>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Author(s) *</label>
          <input
            type="text"
            value={formData.authors}
            onChange={(e) => handleInputChange('authors', e.target.value)}
            placeholder="John Smith, Jane Doe"
            className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
          />
          <p className="text-xs text-gray-500 mt-1">Separate multiple authors with commas</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Enter the title"
            className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
            <input
              type="text"
              value={formData.year}
              onChange={(e) => handleInputChange('year', e.target.value)}
              placeholder="2024"
              className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <input
              type="text"
              value={formData.month}
              onChange={(e) => handleInputChange('month', e.target.value)}
              placeholder="January"
              className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Publisher</label>
            <input
              type="text"
              value={formData.publisher}
              onChange={(e) => handleInputChange('publisher', e.target.value)}
              placeholder="Publisher name"
              className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="New York"
                className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Edition</label>
              <input
                type="text"
                value={formData.edition}
                onChange={(e) => handleInputChange('edition', e.target.value)}
                placeholder="2nd"
                className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
              />
            </div>
          </div>
          {sourceType === 'ebook' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL / Platform</label>
              <input
                type="text"
                value={formData.url}
                onChange={(e) => handleInputChange('url', e.target.value)}
                placeholder="https://... or Kindle"
                className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">DOI</label>
            <input
              type="text"
              value={formData.doi}
              onChange={(e) => handleInputChange('doi', e.target.value)}
              placeholder="10.1234/example"
              className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Journal Name *</label>
            <input
              type="text"
              value={formData.journalName}
              onChange={(e) => handleInputChange('journalName', e.target.value)}
              placeholder="Journal of Academic Research"
              className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Volume</label>
              <input
                type="text"
                value={formData.volume}
                onChange={(e) => handleInputChange('volume', e.target.value)}
                placeholder="12"
                className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Issue</label>
              <input
                type="text"
                value={formData.issue}
                onChange={(e) => handleInputChange('issue', e.target.value)}
                placeholder="3"
                className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pages</label>
              <input
                type="text"
                value={formData.pages}
                onChange={(e) => handleInputChange('pages', e.target.value)}
                placeholder="45-67"
                className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">DOI</label>
            <input
              type="text"
              value={formData.doi}
              onChange={(e) => handleInputChange('doi', e.target.value)}
              placeholder="10.1234/example"
              className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
            <input
              type="text"
              value={formData.day}
              onChange={(e) => handleInputChange('day', e.target.value)}
              placeholder="15"
              className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Website Name</label>
            <input
              type="text"
              value={formData.websiteName}
              onChange={(e) => handleInputChange('websiteName', e.target.value)}
              placeholder="Website or organization name"
              className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL *</label>
            <input
              type="text"
              value={formData.url}
              onChange={(e) => handleInputChange('url', e.target.value)}
              placeholder="https://example.com/article"
              className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Access Date</label>
            <input
              type="text"
              value={formData.accessDate}
              onChange={(e) => handleInputChange('accessDate', e.target.value)}
              placeholder="January 15, 2024"
              className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
            <input
              type="text"
              value={formData.day}
              onChange={(e) => handleInputChange('day', e.target.value)}
              placeholder="15"
              className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{sourceType === 'newspaper' ? 'Newspaper' : 'Magazine'} Name *</label>
            <input
              type="text"
              value={sourceType === 'newspaper' ? formData.newspaperName : formData.magazineName}
              onChange={(e) => handleInputChange(sourceType === 'newspaper' ? 'newspaperName' : 'magazineName', e.target.value)}
              placeholder={sourceType === 'newspaper' ? 'The New York Times' : 'Time Magazine'}
              className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
            />
          </div>
          {sourceType === 'magazine' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Volume</label>
                <input
                  type="text"
                  value={formData.volume}
                  onChange={(e) => handleInputChange('volume', e.target.value)}
                  placeholder="12"
                  className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Issue</label>
                <input
                  type="text"
                  value={formData.issue}
                  onChange={(e) => handleInputChange('issue', e.target.value)}
                  placeholder="3"
                  className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
                />
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pages</label>
            <input
              type="text"
              value={formData.pages}
              onChange={(e) => handleInputChange('pages', e.target.value)}
              placeholder="A1, B3"
              className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL (if online)</label>
            <input
              type="text"
              value={formData.url}
              onChange={(e) => handleInputChange('url', e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Conference Name *</label>
            <input
              type="text"
              value={formData.conferenceName}
              onChange={(e) => handleInputChange('conferenceName', e.target.value)}
              placeholder="International Conference on..."
              className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Conference Location</label>
            <input
              type="text"
              value={formData.conferenceLocation}
              onChange={(e) => handleInputChange('conferenceLocation', e.target.value)}
              placeholder="New York, USA"
              className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pages</label>
            <input
              type="text"
              value={formData.pages}
              onChange={(e) => handleInputChange('pages', e.target.value)}
              placeholder="45-52"
              className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">DOI</label>
            <input
              type="text"
              value={formData.doi}
              onChange={(e) => handleInputChange('doi', e.target.value)}
              placeholder="10.1234/example"
              className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">University *</label>
            <input
              type="text"
              value={formData.university}
              onChange={(e) => handleInputChange('university', e.target.value)}
              placeholder="Harvard University"
              className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Degree Type</label>
              <select
                value={formData.degree}
                onChange={(e) => handleInputChange('degree', e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
              >
                <option value="">Select degree</option>
                <option value="Doctoral dissertation">PhD Dissertation</option>
                <option value="Master's thesis">Master's Thesis</option>
                <option value="Bachelor's thesis">Bachelor's Thesis</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Cambridge, MA"
                className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL (if available)</label>
            <input
              type="text"
              value={formData.url}
              onChange={(e) => handleInputChange('url', e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
            />
          </div>
        </>
      );
    }

    if (sourceType === 'video') {
      return (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Video title"
              className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Director / Creator</label>
            <input
              type="text"
              value={formData.director}
              onChange={(e) => handleInputChange('director', e.target.value)}
              placeholder="Christopher Nolan"
              className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <input
                type="text"
                value={formData.year}
                onChange={(e) => handleInputChange('year', e.target.value)}
                placeholder="2024"
                className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Platform / Studio</label>
              <input
                type="text"
                value={formData.platform}
                onChange={(e) => handleInputChange('platform', e.target.value)}
                placeholder="YouTube, Netflix, etc."
                className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
            <input
              type="text"
              value={formData.url}
              onChange={(e) => handleInputChange('url', e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
            />
          </div>
        </>
      );
    }

    if (sourceType === 'podcast') {
      return (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Podcast Name *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="The Daily"
              className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Episode Title</label>
            <input
              type="text"
              value={formData.episodeTitle}
              onChange={(e) => handleInputChange('episodeTitle', e.target.value)}
              placeholder="Episode title"
              className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Host Name</label>
            <input
              type="text"
              value={formData.hostName}
              onChange={(e) => handleInputChange('hostName', e.target.value)}
              placeholder="Host name"
              className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <input
                type="text"
                value={formData.year}
                onChange={(e) => handleInputChange('year', e.target.value)}
                placeholder="2024"
                className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <input
                type="text"
                value={formData.month}
                onChange={(e) => handleInputChange('month', e.target.value)}
                placeholder="January"
                className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
              <input
                type="text"
                value={formData.day}
                onChange={(e) => handleInputChange('day', e.target.value)}
                placeholder="15"
                className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
            <input
              type="text"
              value={formData.platform}
              onChange={(e) => handleInputChange('platform', e.target.value)}
              placeholder="Spotify, Apple Podcasts, etc."
              className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
            <input
              type="text"
              value={formData.url}
              onChange={(e) => handleInputChange('url', e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
            <input
              type="text"
              value={formData.organization}
              onChange={(e) => handleInputChange('organization', e.target.value)}
              placeholder="World Health Organization"
              className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Report Number</label>
              <input
                type="text"
                value={formData.reportNumber}
                onChange={(e) => handleInputChange('reportNumber', e.target.value)}
                placeholder="Report No. 123"
                className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Geneva"
                className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Publisher</label>
            <input
              type="text"
              value={formData.publisher}
              onChange={(e) => handleInputChange('publisher', e.target.value)}
              placeholder="Publisher name"
              className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
            <input
              type="text"
              value={formData.url}
              onChange={(e) => handleInputChange('url', e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
            />
          </div>
        </>
      );
    }

    if (sourceType === 'encyclopedia') {
      return (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Article/Entry Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Climate Change"
              className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Author(s)</label>
            <input
              type="text"
              value={formData.authors}
              onChange={(e) => handleInputChange('authors', e.target.value)}
              placeholder="John Smith (leave blank if none)"
              className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Encyclopedia Name *</label>
            <input
              type="text"
              value={formData.encyclopediaName}
              onChange={(e) => handleInputChange('encyclopediaName', e.target.value)}
              placeholder="Encyclopedia Britannica"
              className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Editor(s)</label>
              <input
                type="text"
                value={formData.editorName}
                onChange={(e) => handleInputChange('editorName', e.target.value)}
                placeholder="Editor name"
                className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Edition</label>
              <input
                type="text"
                value={formData.edition}
                onChange={(e) => handleInputChange('edition', e.target.value)}
                placeholder="15th"
                className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <input
                type="text"
                value={formData.year}
                onChange={(e) => handleInputChange('year', e.target.value)}
                placeholder="2024"
                className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pages</label>
              <input
                type="text"
                value={formData.pages}
                onChange={(e) => handleInputChange('pages', e.target.value)}
                placeholder="123-130"
                className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Publisher</label>
            <input
              type="text"
              value={formData.publisher}
              onChange={(e) => handleInputChange('publisher', e.target.value)}
              placeholder="Publisher name"
              className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL (if online)</label>
            <input
              type="text"
              value={formData.url}
              onChange={(e) => handleInputChange('url', e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
            />
          </div>
        </>
      );
    }

    return commonFields;
  };

  return (
    <div className="min-h-screen bg-white">
      {user ? (
        <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="citation-generator-tool" />
      ) : (
        <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-18 py-4">
              <a href="/" onClick={(e) => { e.preventDefault(); onNavigate('landing'); }} className="flex items-center space-x-2.5">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">W</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">WriteScholar</span>
              </a>
              
              <div className="hidden md:flex items-center space-x-2">
                <a href="/features" onClick={(e) => { e.preventDefault(); onNavigate('features'); }} className="px-4 py-2.5 text-base text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors font-medium">Features</a>
                <a href="/pricing" onClick={(e) => { e.preventDefault(); onNavigate('pricing'); }} className="px-4 py-2.5 text-base text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors font-medium">Pricing</a>
                <a href="/blog" onClick={(e) => { e.preventDefault(); onNavigate('blog'); }} className="px-4 py-2.5 text-base text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors font-medium">Blog</a>
                <a href="/about" onClick={(e) => { e.preventDefault(); onNavigate('about'); }} className="px-4 py-2.5 text-base text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors font-medium">About</a>
              </div>
              
              <div className="flex items-center space-x-3">
                <a href="/login" onClick={(e) => { e.preventDefault(); onNavigate('login'); }} className="hidden sm:inline-flex px-4 py-2.5 text-base text-gray-600 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-50 transition-colors">Log in</a>
                <a href="/signup" onClick={(e) => { e.preventDefault(); onNavigate('signup'); }} className="px-5 py-2.5 bg-gray-900 text-white text-base font-medium rounded-xl hover:bg-gray-800 transition-colors">
                  Get Started
                </a>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Hero Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-green-50/50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6 shadow-lg shadow-green-100">
              <svg viewBox="0 0 56 56" fill="none" className="w-16 h-16">
                <circle cx="28" cy="28" r="28" fill="#D1FAE5"/>
                <ellipse cx="28" cy="30" rx="14" ry="15" fill="#8B5A2B"/>
                <path d="M14 28 Q12 18 20 14 Q28 10 36 14 Q44 18 42 28 Q40 22 34 18 Q28 14 22 18 Q16 22 14 28" fill="#1F2937"/>
                <ellipse cx="16" cy="30" rx="5" ry="7" fill="#1F2937"/>
                <ellipse cx="40" cy="30" rx="5" ry="7" fill="#1F2937"/>
                <ellipse cx="20" cy="18" rx="4" ry="5" fill="#1F2937"/>
                <ellipse cx="28" cy="14" rx="5" ry="4" fill="#1F2937"/>
                <ellipse cx="36" cy="18" rx="4" ry="5" fill="#1F2937"/>
                <ellipse cx="22" cy="30" rx="3" ry="3.5" fill="#1F2937"/>
                <ellipse cx="34" cy="30" rx="3" ry="3.5" fill="#1F2937"/>
                <circle cx="23" cy="29" r="1" fill="white"/>
                <circle cx="35" cy="29" r="1" fill="white"/>
                <path d="M24 40 Q28 46 32 40" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round"/>
                <ellipse cx="18" cy="35" rx="3" ry="2" fill="#C9958A" opacity="0.4"/>
                <ellipse cx="38" cy="35" rx="3" ry="2" fill="#C9958A" opacity="0.4"/>
              </svg>
            </div>
            <span className="inline-flex items-center px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-semibold mb-5">
              Free Tool
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-5 leading-tight">
              Citation Generator
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed max-w-2xl mx-auto">
              Generate properly formatted citations in APA, MLA, Chicago, Harvard, IEEE, and Vancouver styles for 12 different source types.
            </p>
          </div>
        </div>
      </section>

      {/* Main Tool Section */}
      <section className="py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Input Form */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Source Details</h2>
              
              {/* Citation Style Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Citation Style</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(['apa', 'mla', 'chicago', 'harvard', 'ieee', 'vancouver'] as CitationStyle[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStyle(s)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        style === s
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {s.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Source Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Source Type</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {sourceTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setSourceType(type.value as SourceType)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium transition-all flex flex-col items-center justify-center space-y-1 ${
                        sourceType === type.value
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <span className="text-base">{type.icon}</span>
                      <span>{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Form Fields */}
              <div className="space-y-4">
                {renderFormFields()}
              </div>

              <button
                onClick={generateCitation}
                className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
              >
                Generate Citation
              </button>
            </div>

            {/* Output Panel */}
            <div className="space-y-6">
              {/* Generated Citation */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Your Citation</h3>
                  {citation && (
                    <button
                      onClick={handleCopy}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        copied
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  )}
                </div>
                <div className="bg-gray-50 rounded-xl p-4 min-h-[120px]">
                  {citation ? (
                    <p className="text-gray-800 leading-relaxed" dangerouslySetInnerHTML={{ 
                      __html: citation.replace(/\*([^*]+)\*/g, '<em>$1</em>') 
                    }} />
                  ) : (
                    <p className="text-gray-400 italic">Your formatted citation will appear here...</p>
                  )}
                </div>
              </div>

              {/* Style Guide */}
              <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-4">About {style.toUpperCase()} Style</h3>
                <div className="text-sm opacity-90 space-y-2">
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
              </div>

              {/* Tips */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Citation Tips</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Always verify citations against official style guides</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Include DOIs for journal articles when available</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Check your institution's specific formatting requirements</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Keep track of all sources as you research</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Need AI-powered citation search?
          </h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            WriteScholar can automatically find and format citations from academic databases. Get relevant sources for your research in seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {user ? (
              <button 
                onClick={() => onNavigate('dashboard')}
                className="px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
              >
                Search Citations
              </button>
            ) : (
              <>
                <button 
                  onClick={() => onNavigate('signup')}
                  className="px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Try WriteScholar Free
                </button>
                <button 
                  onClick={() => onNavigate('features')}
                  className="px-6 py-3 border border-gray-600 text-white font-medium rounded-xl hover:border-gray-500 transition-colors"
                >
                  Learn More
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default CitationGeneratorToolPage;
