import { type ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getViewer } from '@/lib/viewer';
import { AppShell } from '@/components/layout/AppShell';

// El middleware ya protege estas rutas, pero si por algún motivo no hay
// perfil (ej: el trigger de la Fase 1 falló) mejor cortar acá con un
// mensaje claro en vez de dejar que cada página truene por separado.
export default async function AppLayout({ children }: { children: ReactNode }) {
  const { user, profile } = await getViewer();

  if (!user) {
    redirect('/login');
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <p className="font-display text-xl text-ink">No encontramos tu perfil</p>
        <p className="mt-2 text-sm text-muted">
          Puede que el trigger `handle_new_user` de la Fase 1 no se haya ejecutado. Revisá la
          tabla `profiles` en Supabase para esta cuenta.
        </p>
      </div>
    );
  }

  return (
    <AppShell fullName={profile.full_name || user.email || ''} role={profile.role}>
      {children}
    </AppShell>
  );
}
