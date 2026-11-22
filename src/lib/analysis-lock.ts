import {randomUUID} from 'node:crypto';
import {db} from './db';
export async function acquireAnalysisLock(alertId:string,now=new Date()):Promise<string|null>{
 const token=randomUUID();
 await db.analysisLock.deleteMany({where:{alertId,expiresAt:{lte:now}}});
 try {await db.analysisLock.create({data:{alertId,token,expiresAt:new Date(now.getTime()+120000)}});return token;}
 catch(error){if(typeof error==='object'&&error!==null&&'code' in error&&error.code==='P2002') return null;throw error;}
}
export async function releaseAnalysisLock(alertId:string,token:string){
 await db.analysisLock.deleteMany({where:{alertId,token}});
}
