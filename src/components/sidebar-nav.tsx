'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', icon: '▦', label: 'Onboarding queue', matches: (path: string) => path === '/' || path.startsWith('/onboarding') },
  { href: '/alerts', icon: '⚑', label: 'Funding alerts', matches: (path: string) => path.startsWith('/alerts') || path.startsWith('/cases') },
  { href: '/controls', icon: '▤', label: 'Regulatory library', matches: (path: string) => path.startsWith('/controls') }
];

// Highlights the link for the page being viewed.
export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav>
      {links.map(link => (
        <Link key={link.href} href={link.href} aria-current={link.matches(pathname) ? 'page' : undefined}>
          {link.icon} <span>{link.label}</span>
        </Link>
      ))}
    </nav>
  );
}
