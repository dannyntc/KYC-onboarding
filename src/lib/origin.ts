// Accepts a request only from the site that is serving the page (http or https), and refuses
// requests sent from other websites. Used by every route that changes data or the demo-role cookie.
export function isSameOrigin(origin: string | null, host: string | null): boolean {
  if (!origin || !host) return false;
  try {
    const parsed = new URL(origin);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.host === host;
  } catch {
    return false;
  }
}
