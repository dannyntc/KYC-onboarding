export function reviewChange(before:{status:string;notes:string},action:string,notes:string){
 const statuses:Record<string,string>={save:'In review',request:'Information requested',escalate:'Escalated'};
 if(!Object.hasOwn(statuses,action)) throw new Error('Unsupported review action');
 const status=statuses[action];
 return {status,detail:JSON.stringify({before,after:{status,notes}})};
}
