import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { SidebarNav } from '@/components/sidebar-nav';
import { GuidedTour } from '@/components/guided-tour';
import { LookOnlyBanner } from '@/components/look-only-banner';
import { isPublicDemo } from '@/lib/public-demo';
import './globals.css';
export const metadata:Metadata={title:'KYC-onboarding',description:'Synthetic KYC onboarding prototype'};
export default async function RootLayout({children}:{children:React.ReactNode}) {const role=(await cookies()).get('demo-role')?.value ?? 'analyst'; const lookOnly=await isPublicDemo(); return <html lang="en" suppressHydrationWarning><body><div className="shell"><aside className="sidebar"><Link href="/" className="brand"><span className="brandmark">W</span><span>KYC-onboarding <small>KYC</small></span></Link><div className="workspace">COMPLIANCE WORKSPACE</div><SidebarNav/><Link href="/?tour=1" className="tourlink">▶ Guided tour</Link><div className="sidefoot"><form action="/api/role" method="post" data-tour="role-switcher"><label htmlFor="role">Demo role (not authentication)</label><select id="role" name="role" defaultValue={role}><option value="read-only">Read-only access</option><option value="analyst">Analyst</option><option value="senior-approver">Senior approver</option></select><button>Switch role</button>{lookOnly&&<small className="lookonly-note">Switching role changes the view only; saving stays off online.</small>}</form><strong>Demo environment</strong><p>Fictional data only<br/>Human review required</p></div></aside><main><div className="topbar"><span>Singapore private banking <span className="divider">/</span> Compliance operations</span><span className="demo">● &nbsp; {lookOnly?'ONLINE DEMO · LOOK-ONLY':'SYNTHETIC DATA · LOCAL'}</span></div>{lookOnly&&<LookOnlyBanner/>}<div className="content">{children}</div></main></div><GuidedTour publicDemo={lookOnly}/></body></html>}
