import { expect,it } from 'vitest';
import { isLocalOrigin,isSameOrigin } from '../src/lib/origin';
it('accepts the browser origin only when it matches the local host header',()=>{
 expect(isLocalOrigin('http://127.0.0.1:3000','127.0.0.1:3000')).toBe(true);
 expect(isLocalOrigin('http://evil.example','127.0.0.1:3000')).toBe(false);
 expect(isLocalOrigin('http://evil.example','evil.example')).toBe(false);
});

it('isSameOrigin accepts http and https pages that post to their own host',()=>{
 expect(isSameOrigin('http://127.0.0.1:3000','127.0.0.1:3000')).toBe(true);
 expect(isSameOrigin('https://kyc-onboarding-dannyntc.vercel.app','kyc-onboarding-dannyntc.vercel.app')).toBe(true);
});
it('isSameOrigin refuses other hosts, other ports, missing or malformed origins and other protocols',()=>{
 expect(isSameOrigin('https://evil.example','kyc-onboarding-dannyntc.vercel.app')).toBe(false);
 expect(isSameOrigin('http://127.0.0.1:4000','127.0.0.1:3000')).toBe(false);
 expect(isSameOrigin(null,'kyc-onboarding-dannyntc.vercel.app')).toBe(false);
 expect(isSameOrigin('https://kyc-onboarding-dannyntc.vercel.app',null)).toBe(false);
 expect(isSameOrigin('not a url','kyc-onboarding-dannyntc.vercel.app')).toBe(false);
 expect(isSameOrigin('null','kyc-onboarding-dannyntc.vercel.app')).toBe(false);
 expect(isSameOrigin('ftp://kyc-onboarding-dannyntc.vercel.app','kyc-onboarding-dannyntc.vercel.app')).toBe(false);
});
