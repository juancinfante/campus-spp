import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LogIn, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { HeroGraphic } from '@/components/landing/HeroGraphic';
import { BRAND_FULL, BRAND_TAGLINE } from '@/lib/brand';

export default async function LandingPage() {
  // Si ya tenés sesión, no tiene sentido mostrarte la landing —
  // directo al campus.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect('/inicio');

  return (
    <div className="min-h-screen bg-paper">
      <LandingNavbar />

      <section className="mx-auto grid max-w-5xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:py-24">
        <div>
          <h1 className="font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">
            {BRAND_FULL}
          </h1>
          <p className="mt-4 max-w-md text-ink/80">{BRAND_TAGLINE}</p>
          <Link
            href="/login"
            className="mt-8 inline-flex items-center gap-2 rounded-md bg-teal px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-teal-dark"
          >
            Ingresá al campus
          </Link>
        </div>

        <HeroGraphic />
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-6 pb-20 sm:grid-cols-2">
        <Link
          href="/login"
          className="rounded-lg border border-line bg-white p-6 transition-colors hover:border-teal"
        >
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-teal/10 text-teal-dark">
            <LogIn size={18} />
          </div>
          <p className="font-display text-lg text-ink">Ingresá al campus</p>
          <p className="mt-1.5 text-sm text-muted">
            Accedé con el usuario y la contraseña que te asignó la institución.
          </p>
        </Link>

        <div className="rounded-lg border border-line bg-white p-6">
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-highlight/20 text-ink">
            <Mail size={18} />
          </div>
          {/* <p className="font-display text-lg text-ink">¿Sos parte del plantel?</p> */}
          <p className="mt-1.5 text-sm text-muted">
            El acceso no es autogestionado: tu usuario y contraseña te llegan por correo
            electrónico institucional. Si todavía no los recibiste, consultá con tu área de
            capacitación.
          </p>
        </div>
      </section>
    </div>
  );
}
