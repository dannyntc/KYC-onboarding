import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
const temp=mkdtempSync(join(tmpdir(),'kyc-onboarding-public-e2e-'));
const reviewFile=join(temp,'control-reviews.json');
writeFileSync(reviewFile,'[]');
const env={...process.env,KYC_ONBOARDING_CONTROL_REVIEWS_FILE:reviewFile,DATABASE_URL:`file:${join(temp,'test.db')}`,OPENAI_API_KEY:'',OPENAI_MODEL:'',KYC_ONBOARDING_PUBLIC_DEMO:'1'};
let status=1;
try {
 for(const [cmd,args] of [['npx',['prisma','migrate','deploy']],['npx',['tsx','prisma/seed.ts']],['npx',['playwright','test','--config','playwright.public.config.ts']]]) {
  const result=spawnSync(cmd,args,{env,stdio:'inherit'});
  if(result.status!==0){status=result.status??1;break;}
  status=0;
 }
} finally {rmSync(temp,{recursive:true,force:true});}
process.exit(status);
