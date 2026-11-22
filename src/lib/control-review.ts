import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {z} from 'zod';
import {regulatoryReferences,referenceUrl} from './regulatory-references';

type Reference=(typeof regulatoryReferences)[number];
const sourceVersion='MAS Notice 626, revised 2025-06-30, effective 2025-07-01';
const date=z.iso.date();
const reviewSchema=z.object({id:z.string().min(1),fingerprint:z.string().min(1),reviewer:z.string().trim().min(1),reviewedOn:date,expiresOn:date,scenarios:z.array(z.string().min(1)).min(1)}).strict();
const reviewsSchema=z.array(reviewSchema);
type Review=z.infer<typeof reviewSchema>;
export function controlFingerprint(reference:Reference):string {
 return createHash('sha256').update(JSON.stringify({sourceVersion,url:referenceUrl(reference.page),reference})).digest('hex');
}
export function reviewedControlsForScenario(entries:unknown,scenario:string,asOf:string) {
 const parsed=reviewsSchema.safeParse(entries);
 if(!parsed.success||!date.safeParse(asOf).success) return [];
 const reviews=parsed.data;
 if(new Set(reviews.map(review=>review.id)).size!==reviews.length) return [];
 return regulatoryReferences.flatMap(reference=>{
  const review=reviews.find(r=>r.id===reference.id);
  if(!review||review.fingerprint!==controlFingerprint(reference)||review.reviewedOn>asOf||review.expiresOn<asOf||review.expiresOn<review.reviewedOn||!review.scenarios.includes(scenario)||!(reference.scenarios as readonly string[]).includes(scenario)) return [];
  return [{...reference,sourceVersion,sourceUrl:referenceUrl(reference.page),reviewedOn:review.reviewedOn,expiresOn:review.expiresOn}];
 });
}
// Reviewed references for several check keys at once (used by onboarding drafts), each reference once.
export function reviewedControlsForChecks(entries:unknown,keys:string[],asOf:string) {
 const found=new Map<string,ReturnType<typeof reviewedControlsForScenario>[number]>();
 for(const key of keys) for(const control of reviewedControlsForScenario(entries,key,asOf)) found.set(control.id,control);
 return [...found.values()];
}
export async function loadControlReviews():Promise<{reviews:Review[];error:boolean}> {
 try {
  const raw=await readFile(/*turbopackIgnore: true*/ process.env.KYC_ONBOARDING_CONTROL_REVIEWS_FILE ?? 'control-reviews.json','utf8');
  const parsed=reviewsSchema.safeParse(JSON.parse(raw));
  if(!parsed.success||new Set(parsed.data.map(r=>r.id)).size!==parsed.data.length) return {reviews:[],error:true};
  return {reviews:parsed.data,error:false};
 } catch {return {reviews:[],error:true};}
}
