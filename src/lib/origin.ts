export function isLocalOrigin(origin:string|null,host:string|null):boolean {
 if(!origin||!host) return false;
 try { const parsed=new URL(origin); return parsed.protocol==='http:' && ['127.0.0.1','localhost'].includes(parsed.hostname) && parsed.host===host; } catch {return false;}
}
