/**
 * Throwaway inbox providers. A free grade needs an account, and one
 * account per inbox is the limit that makes the free tier safe, so
 * addresses from these services are refused at sign-up with a message
 * asking for a school or personal email.
 *
 * Deliberately a short, well-known list rather than a 50,000-row
 * dependency: the goal is to stop casual abuse, not every relay.
 * Subdomains are matched too (mail.tempmail.com counts as tempmail.com).
 */
const DISPOSABLE_DOMAINS = new Set([
  '10minutemail.com', '10minutemail.net', '10minemail.com', '20minutemail.com', '33mail.com',
  'anonbox.net', 'anonymbox.com', 'burnermail.io', 'byom.de', 'crazymailing.com',
  'dispostable.com', 'discard.email', 'dropmail.me', 'emailondeck.com', 'emailfake.com',
  'fakeinbox.com', 'fakemail.net', 'fakemailgenerator.com', 'getairmail.com', 'getnada.com',
  'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org', 'guerrillamail.biz', 'guerrillamail.de',
  'guerrillamailblock.com', 'grr.la', 'sharklasers.com', 'spam4.me', 'harakirimail.com',
  'inboxkitten.com', 'incognitomail.com', 'jetable.org', 'kasmail.com', 'linshiyouxiang.net',
  'maildrop.cc', 'mailcatch.com', 'mailexpire.com', 'mailinator.com', 'mailinator.net',
  'mailnesia.com', 'mailnull.com', 'mailsac.com', 'mailtemp.info', 'minuteinbox.com',
  'mintemail.com', 'moakt.com', 'mohmal.com', 'mytemp.email', 'nada.email',
  'nowmymail.com', 'objectmail.com', 'owlymail.com', 'proxymail.eu', 'rcpt.at',
  'spamgourmet.com', 'spambog.com', 'spambox.us', 'spamex.com', 'spamfree24.org',
  'temp-mail.org', 'temp-mail.io', 'tempmail.com', 'tempmail.net', 'tempmail.dev',
  'tempmailo.com', 'tempmailaddress.com', 'tempinbox.com', 'tempr.email', 'temporary-mail.net',
  'throwawaymail.com', 'throwam.com', 'tmail.ws', 'tmailinator.com', 'trashmail.com',
  'trashmail.net', 'trashmail.me', 'trash-mail.com', 'trashymail.com', 'yopmail.com',
  'yopmail.fr', 'yopmail.net', 'cool.fr.nf', 'jetable.fr.nf', 'nospam.ze.tc',
  'mega.zik.dj', 'speed.1s.fr', 'courriel.fr.nf', 'moncourrier.fr.nf', 'monemail.fr.nf',
  'monmail.fr.nf', 'wegwerfmail.de', 'wegwerfmail.net', 'wegwerfmail.org', 'einrot.com',
  'mailseal.de', 'spoofmail.de', 'tempail.com', 'emailtemporanea.com', 'emailtemporanea.net',
  'emailtemporario.com.br', 'correotemporal.org', 'tempemail.co', 'tempemail.net', 'luxusmail.org',
  'mail-temp.com', 'mailtemp.net', 'instantemailaddress.com', 'mail7.io', 'mailpoof.com',
  'tempsky.com', 'disposablemail.com', 'disposableemailaddresses.com', 'burner.kiwi', 'generator.email',
  'emkei.cz', 'mailbox52.ga', 'firemailbox.club', 'inboxbear.com', 'boximail.com',
]);

function emailDomain(email) {
  if (typeof email !== 'string') return '';
  const at = email.lastIndexOf('@');
  if (at < 0) return '';
  return email.slice(at + 1).trim().toLowerCase();
}

/** True when the address belongs to a known throwaway provider. */
function isDisposableEmail(email) {
  let domain = emailDomain(email);
  if (!domain) return false;
  // Walk up the labels so sub.tempmail.com matches tempmail.com.
  while (domain.includes('.')) {
    if (DISPOSABLE_DOMAINS.has(domain)) return true;
    domain = domain.slice(domain.indexOf('.') + 1);
  }
  return false;
}

module.exports = { isDisposableEmail, DISPOSABLE_DOMAINS };
