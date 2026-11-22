// Candidate references from the official consolidated notice; case applicability
// and any internal control mapping require review by the relevant compliance team.
const notice='https://www.mas.gov.sg/-/media/amld-amendments---30-june-2025/mas-notice-626.pdf';
export const regulatoryReferences=[
 {id:'MAS-626-6.14B',paragraph:'6.14B',title:'Verification of identified persons',summary:'Addresses verification of persons identified under paragraph 6.14 using reliable, independent sources.',page:14,scenarios:['linked_ownership']},
 {id:'MAS-626-6.20',paragraph:'6.20',title:'Ongoing transaction review',summary:'Addresses scrutiny of transactions against the bank’s knowledge of the customer, risk profile and, where appropriate, source of funds.',page:15,scenarios:['rapid_movement','documented_sale']},
 {id:'MAS-626-6.21-6.23',paragraph:'6.21–6.23',title:'Unusual transactions and inquiry',summary:'Addresses certain unusual transactions with no apparent or visible economic or lawful purpose, related monitoring, and inquiry into their background and purpose.',page:16,scenarios:['rapid_movement','documented_sale']},
 {id:'MAS-626-6.24',paragraph:'6.24',title:'Keeping due diligence information current',summary:'Addresses reviews to keep customer due diligence data, documents and information relevant and up to date.',page:16,scenarios:['wealth_gap','linked_ownership']},
] as const;
export function referencesForScenario(scenario:string){return regulatoryReferences.filter(reference=>(reference.scenarios as readonly string[]).includes(scenario));}
export function referenceUrl(page:number){return `${notice}#page=${page}`;}
