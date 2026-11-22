import { db } from './db';

type RelationshipKey={owner:string;entity:string};
export async function relatedRelationships(clientId:string, relationships:RelationshipKey[]) {
 if(!relationships.length) return [];
 return db.relationship.findMany({where:{clientId:{not:clientId},OR:relationships.map(({owner,entity})=>({owner,entity}))},include:{client:{select:{id:true,name:true,accounts:{select:{id:true},orderBy:{id:'asc'}},alerts:{select:{id:true},orderBy:{id:'asc'},take:1}}}},orderBy:{id:'asc'}});
}
