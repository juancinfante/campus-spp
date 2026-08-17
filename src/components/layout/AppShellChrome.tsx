'use client';

import { type ReactNode, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { BRAND_NAME } from '@/lib/brand';

export function AppShellChrome({
  fullName,
  role,
  children,
}: {
  fullName: string;
  role: 'student' | 'teacher' | 'admin';
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-paper lg:flex">
      {/* Sidebar fija en desktop */}
      <div className="hidden lg:block">
        <Sidebar fullName={fullName} role={role} />
      </div>

      {/* Sidebar como cajón en mobile */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            aria-hidden
            className="absolute inset-0 bg-ink/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 shadow-xl">
            <Sidebar fullName={fullName} role={role} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-paper/95 px-4 py-3 backdrop-blur lg:hidden">
          <span className="font-display text-lg font-semibold text-ink">{BRAND_NAME}</span>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-md p-2 text-ink hover:bg-line/40"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>

        <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
      </div>
    </div>
  );
}
