import {isAbsolute,resolve} from 'node:path';
export function databaseUrl(url:string,root:string):string {
 if(isPostgresDatabaseUrl(url)) return url;
 if(!url.startsWith('file:')) throw new Error('Only local SQLite file URLs are supported.');
 const path=url.slice(5);
 if(!path) throw new Error('DATABASE_URL must name a SQLite file.');
 return isAbsolute(path)?url:`file:${resolve(root,'prisma',path)}`;
}

export function isPostgresDatabaseUrl(url:string):boolean {
 return url.startsWith('postgres://') || url.startsWith('postgresql://');
}
