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
    title: 'About this demo',
    text: 'This demo shows how a bank\'s onboarding team can check new clients faster, with improved quality controls. Identity, ownership, watch-list, wealth and funding checks sit in one file, and risk controls block approval until every check is done. The checks follow MAS Notice 626, Singapore\'s anti-money-laundering rules for banks.'
  },
  {
    page: '/',
    target: null,
    title: 'Welcome',
    text: 'KYC ("know your customer") means checking who a new client really is before the bank accepts them. Here an analyst works through each applicant in one place: every finding links to its evidence, and fixed rules flag what still blocks approval. The team decides faster, with fewer missed checks and a clear record for reviewers.'
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
    target: 'identity',
    title: 'A clean applicant',
    text: 'Meet Sarah Yeo. Her passport and proof of address are both verified, so there is no doubt about who she is.',
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
    target: 'decision-panel',
    title: 'The decision',
    text: 'The analyst saves a final risk rating with reasons, then approves. Try it here: save a rating and the Approve button unlocks. Changes stay in your local demo database.',
    onlineText: 'The analyst saves a final risk rating with reasons, then approves.',
    side: 'left'
  },
  {
    page: '/onboarding/ONB-009',
    target: 'screening',
    title: 'A false alarm',
    text: 'Screening checks a name against official watch lists. Ethan Sim partly matches a sanctions list (people and groups the bank must not deal with), but his birth year and nationality differ. An analyst would clear it as a false positive and write down why.',
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
    onlineText:
      'High-risk applicants need a second person, a Senior approver, to sign off as well. Try the role switch here: Read-only access hides the decision buttons.',
    side: 'right'
  },
  {
    page: '/onboarding/ONB-002',
    target: 'assistant',
    title: 'The KYC assistant',
    text: 'The assistant drafts a summary, and every statement links to a record. It can only suggest, and can never approve or reject. Here it spots SGD 5 million of declared wealth with no document behind it.',
    onlineText:
      'The assistant drafts a summary, and every statement links to a record. It can only suggest, and can never approve or reject. Here it spots SGD 5 million of declared wealth with no document behind it. Online, this draft is a preview and is not saved.',
    side: 'left'
  },
  {
    page: '/onboarding/ONB-001',
    target: 'aml-funding',
    title: 'Money coming in',
    text: 'AML (anti-money-laundering) checks look for suspicious transactions through the bank. Here SGD 1.2 million arrived and SGD 850,000 left almost straight away, which raised an alert. Next, open that alert.',
    side: 'right'
  },
  {
    page: '/cases/ALT-001',
    target: 'alert-evidence',
    title: 'Investigating the alert',
    text: 'This page shows the payment that triggered the alert, marked "Alert trigger", next to the other evidence. Amelia\'s file cannot be approved until an analyst reviews this alert.',
    side: 'right'
  },
  {
    page: '/cases/ALT-001',
    target: 'audit-history',
    title: 'Every step is recorded',
    text: 'Every action is saved in an audit trail that cannot be edited. That is the end of the tour! Explore freely, visit the Regulatory library, or restart the tour from the sidebar.',
    side: 'left'
  }
];

export function tourText(step: TourStep, publicDemo: boolean): string {
  return publicDemo && step.onlineText ? step.onlineText : step.text;
}
