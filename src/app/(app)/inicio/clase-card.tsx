import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { type ReactNode } from 'react';

// Card de clase con la "portada" del gorrito — la usan tanto la vista
// de profesor como la de estudiante en el Home.
export function ClaseCard({
  href,
  title,
  badge,
}: {
  href: string;
  title: string;
  badge?: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="overflow-hidden rounded-lg border border-line bg-white transition-colors hover:border-teal"
    >
      <div className="flex aspect-[16/9] items-center justify-center bg-teal/10">
        <GraduationCap size={40} className="text-teal-dark" />
      </div>
      <div className="p-4">
        {badge}
        <p className="font-display text-lg text-ink">{title}</p>
      </div>
    </Link>
  );
}
