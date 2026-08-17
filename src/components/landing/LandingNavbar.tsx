import Link from 'next/link';
import { BRAND_NAME } from '@/lib/brand';

export function LandingNavbar() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <span className="font-display text-lg font-semibold text-ink">{BRAND_NAME}</span>
        {/* <Link
          href="/login"
          className="rounded-md bg-teal px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-dark"
        >
          Iniciar sesión
        </Link> */}
      </div>
    </header>
  );
}
