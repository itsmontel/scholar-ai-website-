/**
 * Lightweight device-class parser for User-Agent strings.
 *
 * Returns one of: 'mobile' | 'tablet' | 'desktop' | 'unknown'.
 *
 * Why a hand-rolled regex parser instead of `ua-parser-js`:
 *   - We only need 4 buckets, not the full 30+ device-family taxonomy that
 *     UA libraries provide.
 *   - Adding a 70KB+ dependency to detect "is this a phone" is overkill for
 *     a single backend route.
 *   - These regex patterns cover ~99% of real-world User-Agents seen in
 *     production for a consumer/student-facing SaaS.
 *
 * Order of checks matters — a user-agent like "Mozilla/5.0 (Linux; Android
 * 10; SM-T720)" is a Galaxy Tab (tablet) but ALSO matches Android. We test
 * tablets BEFORE mobile so iPad and Android-without-Mobile fall into the
 * tablet bucket where they belong.
 */

const TABLET_PATTERN = /ipad|tablet|kindle|silk|playbook|nexus 7|nexus 9|nexus 10/i;
const ANDROID_TABLET_PATTERN = /android(?!.*mobile)/i;
const MOBILE_PATTERN = /mobile|iphone|ipod|android.*mobile|blackberry|iemobile|opera mini|fennec|webos|windows phone/i;

/**
 * Parse a User-Agent header string into a coarse device class.
 *
 * @param {string|undefined} userAgent - The raw `req.headers['user-agent']`.
 * @returns {'mobile'|'tablet'|'desktop'|'unknown'}
 */
function parseDeviceFromUserAgent(userAgent) {
  if (!userAgent || typeof userAgent !== 'string') return 'unknown';

  // Tablets first — iPad / Android tablets / Kindle Fire / etc.
  if (TABLET_PATTERN.test(userAgent)) return 'tablet';
  if (ANDROID_TABLET_PATTERN.test(userAgent)) return 'tablet';

  // Then mobile — iPhone / Android with "Mobile" / older smartphone OSes.
  if (MOBILE_PATTERN.test(userAgent)) return 'mobile';

  // Default to desktop. This is the right call even for Smart TVs / consoles
  // / bots — those are vanishingly small for our user base, and miscounting
  // them as desktop is preferable to creating a "smart_tv" bucket of one.
  return 'desktop';
}

module.exports = { parseDeviceFromUserAgent };
