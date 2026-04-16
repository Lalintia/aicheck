/**
 * Normalize a raw URL string by trimming whitespace and
 * prepending https:// when no protocol is present.
 */
export function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    return 'https://' + trimmed;
  }
  return trimmed;
}
