import { createClient } from '@/lib/supabase/server';

export type Viewer = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: { id: string; email?: string } | null;
  profile: { id: string; full_name: string; role: 'student' | 'teacher' | 'admin' } | null;
};

// Helper compartido: quién está mirando la página + su perfil/rol.
// El middleware ya garantiza que si llegamos acá hay sesión, pero
// dejamos el chequeo igual por si esta función se usa en algún lugar
// que el middleware no cubra.
export async function getViewer(): Promise<Viewer> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, profile: null };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', user.id)
    .single();

  return { supabase, user, profile: profile ?? null };
}
