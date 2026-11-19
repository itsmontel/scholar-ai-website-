/**
 * Shared class names for the website's own look: Nunito, brand purple,
 * lavender surfaces, soft purple-tinted shadows and buttons with a darker
 * bottom lip. Used by the landing hero, the try-first flow and the
 * dashboard home so they read as one site.
 *
 * Not the iOS app's sticker look (ink outlines, hard offset shadows):
 * that stays in the app.
 */
export const FONT = { fontFamily: '"Nunito", system-ui, sans-serif' } as const;

const press = 'transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0';

/** Main action: green with a darker lip, white label. */
export const BTN_GREEN = `inline-flex items-center justify-center gap-2.5 rounded-2xl border-2 border-b-[5px] border-[#46A302] bg-[#58CC02] font-black text-white hover:bg-[#61E002] ${press}`;

/** Secondary action in brand purple. */
export const BTN_PURPLE = `inline-flex items-center justify-center gap-2.5 rounded-2xl border-2 border-b-4 border-[#8A48C7] bg-[#A560E8] font-black text-white hover:bg-[#B070EE] ${press}`;

/** Quiet action: white with a soft lilac lip. */
export const BTN_WHITE = `inline-flex items-center justify-center gap-2.5 rounded-2xl border-2 border-b-4 border-[#E4D4F8] bg-white font-black text-[#7733B5] hover:bg-[#FBF8FF] ${press}`;

/** White surface with the soft purple shadow. */
export const CARD = 'rounded-[24px] border border-[#E4D4F8] bg-white shadow-[0_2px_4px_rgba(60,40,90,0.04),0_22px_50px_-34px_rgba(90,45,140,0.55)]';

/** Text field. */
export const INPUT = 'rounded-2xl border-2 border-[#DCC3F6] bg-[#FBF8FF] font-bold text-[#1C1917] placeholder:text-[#8A8580] focus:border-[#A560E8] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#A560E8]/25';

/** Small uppercase label above a heading. */
export const EYEBROW = 'text-[11.5px] font-extrabold uppercase tracking-[0.16em] text-[#7733B5]';
