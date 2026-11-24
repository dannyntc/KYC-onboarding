// The guided tour: one entry per bubble, in order. Each step belongs to one page and points at
// the element carrying the matching data-tour="..." attribute (null = centred on the screen).
// Text is for people who have never worked in compliance, so jargon is explained the first time it appears.
export type TourStep = {
  page: string;
  target: string | null;
  // Used instead of `target` on phones, where the page lays the element out differently.
  phoneTarget?: string;
  title: string;
  text: string;
  // Used instead of `text` in the online (look-only) demo, where the buttons are switched off.
  onlineText?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
};

export const TOUR_STEPS: TourStep[] = [
  {
    page: '/',
    target: null,
    title: 'The problem',
    text: 'KYC ("know your customer") means checking who a new client is and where their money comes from before the bank accepts them. Done by hand, it is slow and error-prone: evidence is scattered, analysts judge risk differently, checks are missed until late, hidden links go unseen, and write-ups and decision records take hours.'
  },
  {
    page: '/',
    target: 'problem',
    title: 'How this demo helps',
    text: 'This workspace closes those gaps: one file per applicant, the same rules for every rating, approval locked until every check is done, linked clients flagged, a drafted memo that cites its records, and a log of every decision. Machine learning (clustering) could go further and surface hidden relationships.',
    side: 'bottom'
  },
  {
    page: '/',
    target: 'sidebar-nav',
    title: 'Finding your way',
    text: 'The sidebar has two areas: the Onboarding queue, where applicants are checked, and the Regulatory library, the MAS rules the checks rely on. Restart this tour any time from the Guided tour link.',
    side: 'right'
  },
  {
    page: '/',
    target: 'queue-metrics',
    title: 'At a glance',
    text: 'These counters show how many applications are in progress, waiting for a senior approver, waiting on information from the applicant, and already decided. They update as files move along.',
    side: 'bottom'
  },
  {
    page: '/',
    target: 'queue-filters',
    title: 'Search and filter',
    text: 'Find an applicant by name, file number or client ID, or narrow the list to one suggested risk level or status, then press Apply filters.',
    side: 'bottom'
  },
  {
    page: '/',
    target: 'queue-table',
    title: 'The onboarding queue',
    text: 'Each row is a new applicant waiting to be checked. "Suggested risk" is worked out from their records by fixed rules, not by AI. A person always makes the final decision. Clustering could also be used to uncover hidden links between these clients and people on watch lists.',
    side: 'top'
  },
  {
    page: '/',
    target: 'outstanding-column',
    phoneTarget: 'outstanding-cell',
    title: 'Outstanding items',
    text: 'This counts what still blocks approval, such as an expired passport or a name-check match nobody has decided on yet. "None" means nothing is in the way.',
    side: 'bottom'
  },
  {
    page: '/onboarding/ONB-006',
    target: 'overview',
    title: 'The KYC file',
    text: 'Opening a row shows the applicant\'s KYC file. The overview holds the basics: client ID, application date, declared wealth, the activity they expect each month, and where the file stands. Meet Sarah Yeo, a straightforward applicant.',
    side: 'right'
  },
  {
    page: '/onboarding/ONB-006',
    target: 'identity',
    title: 'Identity checks',
    text: 'The bank must confirm who the applicant is. Sarah\'s passport and proof of address are both verified, so this check is complete. A missing or expired document would block approval.',
    side: 'right'
  },
  {
    page: '/onboarding/ONB-006',
    target: 'source-of-wealth',
    title: 'Where the money came from',
    text: 'Banks must know how a client got their wealth. Sarah declared SGD 4.5 million, and her payslips and tax records back up all of it.',
    side: 'right'
  },
  {
    page: '/onboarding/ONB-006',
    target: 'risk-assessment',
    title: 'Rating the risk',
    text: 'The rules suggest a risk level and list the reasons, each linked to its record. Sarah has none, so Low is suggested. The analyst is the one deciding the final rating and writes down why.',
    side: 'left'
  },
  {
    page: '/onboarding/ONB-006',
    target: 'decision-panel',
    title: 'The decision',
    text: 'Once a final rating is saved, Approve unlocks. The analyst can also Reject, or Request information from the applicant, with a note each time. Try it here: changes save to the shared demo database.',
    onlineText: 'Once a final rating is saved, Approve unlocks. The analyst can also Reject, or Request information from the applicant, with a note each time.',
    side: 'left'
  },
  {
    page: '/onboarding/ONB-006',
    target: 'audit-history',
    title: 'Every step is recorded',
    text: 'Every save, decision and memo is written to an audit history that cannot be edited or deleted, showing who did what and when. Reviewers and auditors rely on this trail.',
    side: 'left'
  },
  {
    page: '/onboarding/ONB-007',
    target: 'decision-panel',
    title: 'Blocked until fixed',
    text: 'Darren Ho\'s passport has expired. Until a valid one arrives, it is listed as an outstanding item and Approve stays locked, whatever the analyst chooses. This is how the rules stop a missed check.',
    side: 'left'
  },
  {
    page: '/onboarding/ONB-009',
    target: 'screening',
    title: 'A false alarm',
    text: 'Screening checks a name against official watch lists. Ethan Sim partly matches a sanctions list (people and groups the bank must not deal with), but his birth year and nationality differ. The analyst clears it as a false positive, or confirms it, and writes down why.',
    side: 'right'
  },
  {
    page: '/onboarding/ONB-008',
    target: 'screening',
    title: 'A politically exposed person',
    text: 'Aisha Malik strongly matches a PEP, a politically exposed person (someone in a senior public role, who carries a higher risk of suspicious activities). If an analyst confirms the match, her risk becomes higher.',
    side: 'right'
  },
  {
    page: '/onboarding/ONB-008',
    target: 'role-switcher',
    title: 'Two sets of eyes',
    text: 'High-risk applicants need a second person, a Senior approver, to sign off as well. Switch to that role here to give the second approval. This switch is a demo tool, not a real login.',
    onlineText: 'High-risk applicants need a second person, a Senior approver, to sign off as well. Try the role switch here: Read-only access hides the decision buttons.',
    side: 'right'
  },
  {
    page: '/onboarding/ONB-003',
    target: 'ownership',
    title: 'Who really owns it',
    text: 'Beneficial owners are the people who ultimately own or control a company. Priya Menon\'s holding company shares its owner, Morgan Vale, with two other clients, so her suggested risk is Medium. The related clients are linked for checking. Machine learning (clustering) could find links like this automatically.',
    side: 'right'
  },
  {
    page: '/onboarding/ONB-002',
    target: 'source-of-wealth',
    title: 'A wealth gap',
    text: 'Daniel Lim declares SGD 8 million from a company sale, but his documents back up only SGD 3 million. The SGD 5 million gap makes his suggested risk High, and a High rating also needs a senior approver.',
    side: 'right'
  },
  {
    page: '/onboarding/ONB-002',
    target: 'assistant',
    title: 'The KYC assistant',
    text: 'The assistant drafts a summary, and every statement links to a record. It can only suggest, and can never approve or reject. Here it spots SGD 5 million of declared wealth with no document behind it.',
    onlineText: 'The assistant drafts a summary, and every statement links to a record. It can only suggest, and can never approve or reject. Here it spots SGD 5 million of declared wealth with no document behind it. Online, this draft is a preview and is not saved.',
    side: 'left'
  },
  {
    page: '/onboarding/ONB-002',
    target: 'memo-history',
    title: 'Memo history',
    text: 'Every memo is kept, failed attempts included, and never overwritten. Open one to see exactly what the assistant was given and what it returned, so a reviewer can check its work.',
    side: 'left'
  },
  {
    page: '/onboarding/ONB-002',
    target: 'regulatory-refs',
    title: 'The rules behind each check',
    text: 'Each section ends with the MAS Notice 626 paragraphs it relates to, linked to the official notice. These are candidate references: the bank\'s compliance team confirms which apply.',
    side: 'right'
  },
  {
    page: '/controls',
    target: 'library',
    title: 'The regulatory library',
    text: 'This page lists the MAS Notice 626 paragraphs behind the checks, each linked to its page in the official notice. Before an AI memo may cite one, a compliance reviewer must record a review; until then it shows "Compliance review required".',
    side: 'top'
  },
  {
    page: '/controls',
    target: null,
    title: 'That\'s the tour',
    text: 'You\'ve seen the whole workflow: queue, KYC file, checks, risk rating, memo, decision and audit trail. Explore freely, or restart the tour from the sidebar.'
  }
];

export function tourText(step: TourStep, publicDemo: boolean): string {
  return publicDemo && step.onlineText ? step.onlineText : step.text;
}
