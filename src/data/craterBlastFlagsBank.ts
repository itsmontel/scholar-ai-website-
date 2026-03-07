/**
 * Flags word bank - region-aware, smart wrong answers.
 * Always include exactly 1 obvious country (Spain, France, etc.) as a wrong answer.
 * Other 2 wrong answers from same region or plausibly confusing (Cambodia, Senegal, Laos).
 */
export type Region = 'africa' | 'asia' | 'europe' | 'americas' | 'oceania' | 'middleeast';

export interface RawFlagQuestion {
  prompt: string;
  correctAnswer: string;
  region: Region;
}

function flag(iso: string): string {
  return String.fromCodePoint(0x1F1E6 + iso.charCodeAt(0) - 65, 0x1F1E6 + iso.charCodeAt(1) - 65);
}

const OBVIOUS_LIST: string[] = [
  'United States','United Kingdom','France','Germany','Japan','Italy','Spain','Canada','Australia',
  'China','India','Russia','Brazil','Mexico','Netherlands','Belgium','Switzerland','Sweden',
  'Norway','Denmark','Finland','Poland','Portugal','Greece','Ireland','South Korea','New Zealand',
];

const COUNTRY_ISO_REGION: [string, string, Region][] = [
  ['United States','US','americas'],['United Kingdom','GB','europe'],['France','FR','europe'],
  ['Germany','DE','europe'],['Japan','JP','asia'],['Italy','IT','europe'],['Spain','ES','europe'],
  ['Canada','CA','americas'],['Australia','AU','oceania'],['Brazil','BR','americas'],
  ['China','CN','asia'],['India','IN','asia'],['Russia','RU','europe'],['South Korea','KR','asia'],
  ['Mexico','MX','americas'],['Netherlands','NL','europe'],['Belgium','BE','europe'],
  ['Switzerland','CH','europe'],['Austria','AT','europe'],['Sweden','SE','europe'],
  ['Norway','NO','europe'],['Denmark','DK','europe'],['Finland','FI','europe'],
  ['Poland','PL','europe'],['Portugal','PT','europe'],['Greece','GR','europe'],
  ['Turkey','TR','europe'],['Ireland','IE','europe'],['Argentina','AR','americas'],
  ['Chile','CL','americas'],['Colombia','CO','americas'],['Peru','PE','americas'],
  ['Egypt','EG','africa'],['South Africa','ZA','africa'],['Nigeria','NG','africa'],
  ['Kenya','KE','africa'],['Thailand','TH','asia'],['Vietnam','VN','asia'],
  ['Indonesia','ID','asia'],['Philippines','PH','asia'],['Malaysia','MY','asia'],
  ['Singapore','SG','asia'],['New Zealand','NZ','oceania'],['Israel','IL','middleeast'],
  ['Saudi Arabia','SA','middleeast'],['UAE','AE','middleeast'],['Iran','IR','middleeast'],
  ['Iraq','IQ','middleeast'],['Pakistan','PK','asia'],['Bangladesh','BD','asia'],
  ['Ukraine','UA','europe'],['Czech Republic','CZ','europe'],['Romania','RO','europe'],
  ['Hungary','HU','europe'],['Croatia','HR','europe'],['Serbia','RS','europe'],
  ['Bulgaria','BG','europe'],['Slovakia','SK','europe'],['Slovenia','SI','europe'],
  ['Lithuania','LT','europe'],['Latvia','LV','europe'],['Estonia','EE','europe'],
  ['Belarus','BY','europe'],['Kazakhstan','KZ','asia'],['Georgia','GE','asia'],
  ['Armenia','AM','asia'],['Azerbaijan','AZ','asia'],['Uzbekistan','UZ','asia'],
  ['Mongolia','MN','asia'],['Cambodia','KH','asia'],['Myanmar','MM','asia'],
  ['Sri Lanka','LK','asia'],['Nepal','NP','asia'],['Taiwan','TW','asia'],
  ['Cuba','CU','americas'],['Jamaica','JM','americas'],['Dominican Republic','DO','americas'],
  ['Venezuela','VE','americas'],['Ecuador','EC','americas'],['Bolivia','BO','americas'],
  ['Paraguay','PY','americas'],['Uruguay','UY','americas'],['Morocco','MA','africa'],
  ['Algeria','DZ','africa'],['Tunisia','TN','africa'],['Libya','LY','africa'],
  ['Ethiopia','ET','africa'],['Ghana','GH','africa'],['Tanzania','TZ','africa'],
  ['Uganda','UG','africa'],['Senegal','SN','africa'],['Ivory Coast','CI','africa'],
  ['Cameroon','CM','africa'],['Zimbabwe','ZW','africa'],['Zambia','ZM','africa'],
  ['Botswana','BW','africa'],['Madagascar','MG','africa'],['Mozambique','MZ','africa'],
  ['Rwanda','RW','africa'],['Angola','AO','africa'],['Sudan','SD','africa'],
  ['Malawi','MW','africa'],['Lebanon','LB','middleeast'],['Jordan','JO','middleeast'],
  ['Syria','SY','middleeast'],['Qatar','QA','middleeast'],['Kuwait','KW','middleeast'],
  ['Bahrain','BH','middleeast'],['Oman','OM','middleeast'],['Yemen','YE','middleeast'],
  ['Iceland','IS','europe'],['Luxembourg','LU','europe'],['Cyprus','CY','europe'],
  ['Malta','MT','europe'],['Albania','AL','europe'],['North Macedonia','MK','europe'],
  ['Bosnia and Herzegovina','BA','europe'],['Montenegro','ME','europe'],
  ['Moldova','MD','europe'],['Tajikistan','TJ','asia'],['Kyrgyzstan','KG','asia'],
  ['Turkmenistan','TM','asia'],['Afghanistan','AF','asia'],['Laos','LA','asia'],
  ['Brunei','BN','asia'],['Papua New Guinea','PG','oceania'],['Fiji','FJ','oceania'],
  ['Haiti','HT','americas'],['Trinidad and Tobago','TT','americas'],['Costa Rica','CR','americas'],
  ['Panama','PA','americas'],['Guatemala','GT','americas'],['Honduras','HN','americas'],
  ['El Salvador','SV','americas'],['Nicaragua','NI','americas'],
];

const COUNTRIES_BY_REGION: Record<Region, string[]> = {} as Record<Region, string[]>;
for (const [name, , region] of COUNTRY_ISO_REGION) {
  if (!COUNTRIES_BY_REGION[region]) COUNTRIES_BY_REGION[region] = [];
  if (!COUNTRIES_BY_REGION[region].includes(name)) COUNTRIES_BY_REGION[region].push(name);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickSmartWrongsFlag(correct: string, region: Region): string[] {
  const sameRegion = COUNTRIES_BY_REGION[region] || [];
  const samePool = sameRegion.filter(c => c !== correct);
  const plausiblePool = samePool.length >= 2 ? samePool : (() => {
    const other = (Object.keys(COUNTRIES_BY_REGION) as Region[]).filter(r => r !== region)
      .flatMap(r => COUNTRIES_BY_REGION[r] || []);
    return [...samePool, ...other.filter(c => !OBVIOUS_LIST.includes(c))];
  })();
  const obviousPool = OBVIOUS_LIST.filter(c => c !== correct);
  const out: string[] = [];
  const used = new Set<string>([correct]);
  const shuffledPlausible = shuffle(plausiblePool);
  for (const c of shuffledPlausible) {
    if (out.length >= 2) break;
    if (!used.has(c) && !OBVIOUS_LIST.includes(c)) { used.add(c); out.push(c); }
  }
  const oneObvious = obviousPool[Math.floor(Math.random() * obviousPool.length)];
  if (oneObvious && !used.has(oneObvious)) out.push(oneObvious);
  while (out.length < 3) {
    const extra = plausiblePool.find(c => !used.has(c) && c !== correct);
    if (!extra) break;
    used.add(extra);
    out.push(extra);
  }
  return shuffle(out).slice(0, 3);
}

export function buildFlagAnswers(correct: string, region: Region): { answers: string[]; correctIndex: number } {
  const wrongs = pickSmartWrongsFlag(correct, region);
  const all = shuffle([correct, ...wrongs]);
  return { answers: all, correctIndex: all.indexOf(correct) };
}

export function buildFlagQuestions(): RawFlagQuestion[] {
  const seen = new Set<string>();
  const out: RawFlagQuestion[] = [];
  for (const [country, iso, region] of COUNTRY_ISO_REGION) {
    const k = `${country}|${iso}`;
    if (seen.has(k)) continue;
    seen.add(k);
    const emoji = flag(iso);
    out.push({ prompt: `Which country has this flag? ${emoji}`, correctAnswer: country, region });
  }
  return out;
}
