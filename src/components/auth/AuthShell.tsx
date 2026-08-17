import { type ReactNode } from 'react';
import { BRAND_NAME, BRAND_TAGLINE } from '@/lib/brand';

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-paper">
      {/* Panel de marca — oculto en mobile */}
      <div className="relative hidden w-[42%] flex-col justify-between overflow-hidden lg:flex">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/formacion.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Scrim para que el texto siga siendo legible arriba de la imagen. */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/30 to-ink/60" />

        <div className="relative flex h-full flex-col justify-between px-12 py-14 text-paper">
          <span className="font-display text-2xl font-semibold tracking-tight">{BRAND_NAME}</span>

          <div className="max-w-sm">
            <div className="mb-6 inline-flex h-11 w-11 items-center justify-center rounded-full bg-teal text-paper">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M4 10.5 8 14l8-9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="font-display text-3xl leading-snug">{BRAND_TAGLINE}</p>
          </div>

          <p className="text-sm text-paper/60">Acceso exclusivo para personal autorizado.</p>
        </div>
      </div>

      {/* Panel del formulario */}
      <div className="flex w-full flex-1 items-center justify-center px-6 py-14 lg:w-[58%]">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <span className="font-display text-xl font-semibold text-ink">{BRAND_NAME}</span>
          </div>
          <h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
          <p className="mt-1.5 text-sm text-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
