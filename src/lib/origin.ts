export function isLocalOrigin(origin:string|null,host:string|null):boolean {
 if(!origin||!host) return false;
 try { const parsed=new URL(origin); return parsed.protocol==='http:' && ['127.0.0.1','localhost'].includes(parsed.hostname) && parsed.host===host; } catch {return false;}
}

// Used only by /api/role, which just sets the visitor's own demo-role cookie. It accepts a request
// from whichever site is serving the page (http or https), and refuses other sites.
// The save routes keep the stricter isLocalOrigin check above.
export function isSameOrigin(origin: string | null, host: string | null): boolean {
  if (!origin || !host) return false;
  try {
    const parsed = new URL(origin);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.host === host;
  } catch {
    return false;
  }
}
