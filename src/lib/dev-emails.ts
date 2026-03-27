/**
 * Utility to check if an email belongs to a dev account.
 * Reads DEV_EMAILS env var (comma-separated list).
 * When DEV_EMAILS is not set, all emails are considered dev (backward-compatible).
 */
export function getDevEmails(): string[] {
  const raw = process.env.DEV_EMAILS;
  if (!raw) { return []; }
  return raw.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
}

export function isDevEmail(email: string): boolean {
  const devEmails = getDevEmails();
  if (devEmails.length === 0) { return true; }
  return devEmails.includes(email.toLowerCase());
}
