export function isRapidMovement(inflow:number,inflowDate:string,outflow:number,outflowDate:string,expectedMaximum:number):boolean {
 const elapsed=Date.parse(outflowDate)-Date.parse(inflowDate);
 return inflow>expectedMaximum && outflow<0 && Number.isFinite(elapsed) && elapsed>=0 && elapsed<=48*60*60*1000;
}
