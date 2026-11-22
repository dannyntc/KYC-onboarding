import { expect,it } from 'vitest';
import { isLocalOrigin } from '../src/lib/origin';
it('accepts the browser origin only when it matches the local host header',()=>{
 expect(isLocalOrigin('http://127.0.0.1:3000','127.0.0.1:3000')).toBe(true);
 expect(isLocalOrigin('http://evil.example','127.0.0.1:3000')).toBe(false);
 expect(isLocalOrigin('http://evil.example','evil.example')).toBe(false);
});
