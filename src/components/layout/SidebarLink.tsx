'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type LucideIcon } from 'lucide-react';

export function SidebarLink({
  href,
  icon: Icon,
  children,
  onClick,
}: {
  href: string;
  icon: LucideIcon;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = href === '/inicio' ? pathname === '/inicio' : pathname.startsWith(href);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={[
        'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        active ? 'bg-teal/10 text-teal-dark' : 'text-ink/80 hover:bg-line/40 hover:text-ink',
      ].join(' ')}
    >
      <Icon size={17} />
      {children}
    </Link>
  );
}
