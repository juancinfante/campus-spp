import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getViewer } from '@/lib/viewer';

const PAGE_SIZE = 10;

export default async function CalificacionesExamenPage({
  params,
  searchParams,
}: {
  params: Promise<{ quizId: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { quizId } = await params;
  const { q = '', page: pageRaw } = await searchParams;
  const page = Math.max(1, Number(pageRaw ?? '1') || 1);

  const { supabase, user, profile } = await getViewer();
  if (!user || !profile) return null;
  if (profile.role !== 'teacher') redirect('/calificaciones');

  const { data: quiz } = await supabase
    .from('quizzes')
    .select('id, title, courses!inner(title, teacher_id)')
    .eq('id', quizId)
    .single();

  // SOLUCIÓN 1: Extraemos el curso
  const courseData: any = Array.isArray(quiz?.courses) ? quiz.courses[0] : quiz?.courses;

  if (!quiz || courseData?.teacher_id !== user.id) notFound();

  let query = supabase
    .from('quiz_attempts')
    .select('id, score, submitted_at, profiles!inner(full_name)', { count: 'exact' })
    .eq('quiz_id', quizId)
    .eq('status', 'submitted')
    .order('submitted_at', { ascending: false });

  if (q.trim()) {
    query = query.ilike('profiles.full_name', `%${q.trim()}%`);
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data: attempts, count } = await query.range(from, to);

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const buildHref = (targetPage: number) => {
    const sp = new URLSearchParams();
    if (q.trim()) sp.set('q', q.trim());
    sp.set('page', String(targetPage));
    return `/calificaciones/${quizId}?${sp.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/calificaciones" className="text-sm font-medium text-teal hover:underline">
            ← Todos los exámenes
          </Link>
          <h1 className="mt-1 font-display text-2xl font-semibold text-ink">{quiz.title}</h1>
          <p className="text-sm text-muted">{courseData?.title}</p>
        </div>
        <a
          href={`/calificaciones/${quizId}/export`}
          className="rounded-md border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-line/40"
        >
          ↓ Descargar Excel
        </a>
      </div>

      <form method="get" className="flex gap-2.5">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre y apellido…"
          className="w-full max-w-xs rounded-md border border-line bg-white px-3.5 py-2 text-sm text-ink placeholder:text-muted focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
        />
        <button
          type="submit"
          className="rounded-md border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-line/40"
        >
          Buscar
        </button>
        {q && (
          <Link
            href={`/calificaciones/${quizId}`}
            className="flex items-center text-sm font-medium text-muted hover:underline"
          >
            Limpiar
          </Link>
        )}
      </form>

      {!attempts || attempts.length === 0 ? (
        <p className="text-sm text-muted">
          {q ? 'Nadie con ese nombre rindió este examen.' : 'Todavía nadie rindió este examen.'}
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-line/20 text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-2.5">Alumno</th>
                <th className="px-4 py-2.5">Puntaje</th>
                <th className="px-4 py-2.5">Fecha</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {attempts.map((a) => {
                // SOLUCIÓN 2: Extraemos el profile para cada fila de la tabla
                const profileData: any = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles;

                return (
                  <tr key={a.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-2.5 text-ink">{profileData?.full_name}</td>
                    <td className="px-4 py-2.5 text-ink">{a.score ?? '—'}%</td>
                    <td className="px-4 py-2.5 text-muted">
                      {new Date(a.submitted_at).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Link
                        href={`/calificaciones/${quizId}/${a.id}`}
                        className="text-sm font-medium text-teal hover:underline"
                      >
                        Ver respuestas
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <Link
            href={buildHref(page - 1)}
            aria-disabled={page <= 1}
            className={
              page <= 1
                ? 'pointer-events-none rounded-md border border-line px-3.5 py-1.5 text-muted opacity-40'
                : 'rounded-md border border-line px-3.5 py-1.5 text-ink hover:bg-line/40'
            }
          >
            ← Anterior
          </Link>
          <span className="text-muted">
            Página {page} de {totalPages}
          </span>
          <Link
            href={buildHref(page + 1)}
            aria-disabled={page >= totalPages}
            className={
              page >= totalPages
                ? 'pointer-events-none rounded-md border border-line px-3.5 py-1.5 text-muted opacity-40'
                : 'rounded-md border border-line px-3.5 py-1.5 text-ink hover:bg-line/40'
            }
          >
            Siguiente →
          </Link>
        </div>
      )}
    </div>
  );
}