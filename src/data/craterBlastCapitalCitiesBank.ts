/**
 * Capital cities word bank - region-aware, smart wrong answers.
 * Always include exactly 1 obvious capital (Paris, London, Tokyo, etc.) as a wrong answer.
 * Other 2 wrong answers from same region (plausible confusions).
 */
export type Region = 'africa' | 'asia' | 'europe' | 'americas' | 'oceania' | 'middleeast';

export interface RawCapitalQuestion {
  prompt: string;
  correctAnswer: string;
  region: Region;
}

const COUNTRY_CAPITAL_REGION: [string, string, Region][] = [
  ['Afghanistan','Kabul','asia'],['Albania','Tirana','europe'],['Algeria','Algiers','africa'],
  ['Argentina','Buenos Aires','americas'],['Australia','Canberra','oceania'],['Austria','Vienna','europe'],
  ['Bangladesh','Dhaka','asia'],['Belgium','Brussels','europe'],['Brazil','Brasília','americas'],
  ['Bulgaria','Sofia','europe'],['Canada','Ottawa','americas'],['Chile','Santiago','americas'],
  ['China','Beijing','asia'],['Colombia','Bogotá','americas'],['Cuba','Havana','americas'],
  ['Czech Republic','Prague','europe'],['Denmark','Copenhagen','europe'],['Egypt','Cairo','africa'],
  ['Finland','Helsinki','europe'],['France','Paris','europe'],['Germany','Berlin','europe'],
  ['Greece','Athens','europe'],['Hungary','Budapest','europe'],['Iceland','Reykjavik','europe'],
  ['India','New Delhi','asia'],['Indonesia','Jakarta','asia'],['Iran','Tehran','middleeast'],
  ['Iraq','Baghdad','middleeast'],['Ireland','Dublin','europe'],['Israel','Jerusalem','middleeast'],
  ['Italy','Rome','europe'],['Japan','Tokyo','asia'],['Jordan','Amman','middleeast'],
  ['Kenya','Nairobi','africa'],['Kuwait','Kuwait City','middleeast'],['Lebanon','Beirut','middleeast'],
  ['Malaysia','Kuala Lumpur','asia'],['Mexico','Mexico City','americas'],['Morocco','Rabat','africa'],
  ['Netherlands','Amsterdam','europe'],['New Zealand','Wellington','oceania'],['Nigeria','Abuja','africa'],
  ['Norway','Oslo','europe'],['Pakistan','Islamabad','asia'],['Peru','Lima','americas'],
  ['Philippines','Manila','asia'],['Poland','Warsaw','europe'],['Portugal','Lisbon','europe'],
  ['Romania','Bucharest','europe'],['Russia','Moscow','europe'],['Saudi Arabia','Riyadh','middleeast'],
  ['South Africa','Pretoria','africa'],['South Korea','Seoul','asia'],['Spain','Madrid','europe'],
  ['Sweden','Stockholm','europe'],['Switzerland','Bern','europe'],['Thailand','Bangkok','asia'],
  ['Turkey','Ankara','europe'],['Ukraine','Kyiv','europe'],['UAE','Abu Dhabi','middleeast'],
  ['United Kingdom','London','europe'],['United States','Washington D.C.','americas'],['Vietnam','Hanoi','asia'],
  ['Armenia','Yerevan','asia'],['Azerbaijan','Baku','asia'],['Belarus','Minsk','europe'],
  ['Croatia','Zagreb','europe'],['Estonia','Tallinn','europe'],['Georgia','Tbilisi','asia'],
  ['Kazakhstan','Astana','asia'],['Latvia','Riga','europe'],['Lithuania','Vilnius','europe'],
  ['Moldova','Chișinău','europe'],['North Macedonia','Skopje','europe'],['Serbia','Belgrade','europe'],
  ['Slovakia','Bratislava','europe'],['Slovenia','Ljubljana','europe'],['Uzbekistan','Tashkent','asia'],
  ['Cambodia','Phnom Penh','asia'],['Mongolia','Ulaanbaatar','asia'],['Myanmar','Naypyidaw','asia'],
  ['Nepal','Kathmandu','asia'],['Singapore','Singapore','asia'],['Sri Lanka','Sri Jayawardenepura Kotte','asia'],
  ['Taiwan','Taipei','asia'],['Tajikistan','Dushanbe','asia'],['Turkmenistan','Ashgabat','asia'],
  ['Angola','Luanda','africa'],['Cameroon','Yaoundé','africa'],['Ethiopia','Addis Ababa','africa'],
  ['Ghana','Accra','africa'],['Madagascar','Antananarivo','africa'],['Senegal','Dakar','africa'],
  ['Tanzania','Dodoma','africa'],['Tunisia','Tunis','africa'],['Uganda','Kampala','africa'],
  ['Zambia','Lusaka','africa'],['Zimbabwe','Harare','africa'],['Bolivia','Sucre','americas'],
  ['Ecuador','Quito','americas'],['Paraguay','Asunción','americas'],['Uruguay','Montevideo','americas'],
  ['Venezuela','Caracas','americas'],['Costa Rica','San José','americas'],['Guatemala','Guatemala City','americas'],
  ['Honduras','Tegucigalpa','americas'],['Nicaragua','Managua','americas'],['Panama','Panama City','americas'],
  ['El Salvador','San Salvador','americas'],['Dominican Republic','Santo Domingo','americas'],
  ['Haiti','Port-au-Prince','americas'],['Jamaica','Kingston','americas'],
  ['Trinidad and Tobago','Port of Spain','americas'],['Bahrain','Manama','middleeast'],
  ['Oman','Muscat','middleeast'],['Qatar','Doha','middleeast'],['Syria','Damascus','middleeast'],
  ['Yemen',"Sana'a",'middleeast'],['Libya','Tripoli','africa'],['Sudan','Khartoum','africa'],
  ['Mozambique','Maputo','africa'],['Rwanda','Kigali','africa'],['Malawi','Lilongwe','africa'],
  ['Botswana','Gaborone','africa'],['Mali','Bamako','africa'],['Niger','Niamey','africa'],
  ['Burkina Faso','Ouagadougou','africa'],['Guinea','Conakry','africa'],['Benin','Porto-Novo','africa'],
  ['Laos','Vientiane','asia'],['Brunei','Bandar Seri Begawan','asia'],['Papua New Guinea','Port Moresby','oceania'],
  ['Fiji','Suva','oceania'],['Samoa','Apia','oceania'],
];

const OBVIOUS_CAPITALS: string[] = [
  'Paris','London','Tokyo','Beijing','Washington D.C.','Berlin','Rome','Madrid','Ottawa','Canberra',
  'Brasília','Moscow','Seoul','Mexico City','Amsterdam','Brussels','Stockholm','Oslo','Copenhagen',
  'Helsinki','Warsaw','Lisbon','Athens','Dublin','Vienna','Prague','Budapest','Cairo','New Delhi',
];

const CAPITALS_BY_REGION: Record<Region, string[]> = {} as Record<Region, string[]>;
for (const [, cap, region] of COUNTRY_CAPITAL_REGION) {
  if (!CAPITALS_BY_REGION[region]) CAPITALS_BY_REGION[region] = [];
  if (!CAPITALS_BY_REGION[region].includes(cap)) CAPITALS_BY_REGION[region].push(cap);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickSmartWrongsCapital(correct: string, region: Region): string[] {
  const sameRegion = CAPITALS_BY_REGION[region] || [];
  const sameRegionPool = sameRegion.filter(c => c !== correct);
  const plausiblePool = sameRegionPool.length >= 2 ? sameRegionPool : (() => {
    const other = (Object.keys(CAPITALS_BY_REGION) as Region[]).filter(r => r !== region)
      .flatMap(r => CAPITALS_BY_REGION[r] || []);
    return [...sameRegionPool, ...other.filter(c => !OBVIOUS_CAPITALS.includes(c))];
  })();
  const obviousPool = OBVIOUS_CAPITALS.filter(c => c !== correct);
  const out: string[] = [];
  const used = new Set<string>([correct]);
  const shuffledPlausible = shuffle(plausiblePool);
  for (const c of shuffledPlausible) {
    if (out.length >= 2) break;
    if (!used.has(c) && !OBVIOUS_CAPITALS.includes(c)) { used.add(c); out.push(c); }
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

export function buildCapitalAnswers(correct: string, region: Region): { answers: string[]; correctIndex: number } {
  const wrongs = pickSmartWrongsCapital(correct, region);
  const all = shuffle([correct, ...wrongs]);
  return { answers: all, correctIndex: all.indexOf(correct) };
}

export function buildCapitalQuestions(): RawCapitalQuestion[] {
  const seen = new Set<string>();
  const out: RawCapitalQuestion[] = [];
  for (const [country, capital, region] of COUNTRY_CAPITAL_REGION) {
    const k = `${country}|${capital}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ prompt: `What is the capital of ${country}?`, correctAnswer: capital, region });
  }
  return out;
}
