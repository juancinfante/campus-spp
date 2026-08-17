import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getViewer } from '@/lib/viewer';
import { createQuiz } from '../../manage-actions';

const inputClass =
  'w-full rounded-md border border-line bg-paper px-3.5 py-2.5 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30';

export default async function NuevoExamenPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { supabase, user, profile } = await getViewer();
  if (!user || !profile) return null;
  if (profile.role !== 'teacher') redirect(`/cursos/${slug}/examenes`);

  const { data: course } = await supabase
    .from('courses')
    .select('id, title, slug, teacher_id')
    .eq('slug', slug)
    .single();

  if (!course) notFound();
  if (course.teacher_id !== user.id) redirect(`/cursos/${slug}/examenes`);

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <Link
          href={`/cursos/${course.slug}/examenes`}
          className="text-sm font-medium text-teal hover:underline"
        >
          ← Exámenes
        </Link>
        <h1 className="mt-1 font-display text-2xl font-semibold text-ink">Nuevo examen</h1>
        <p className="mt-1 text-muted">Después de crearlo cargás las preguntas.</p>
      </div>

      <form action={createQuiz} className="space-y-4">
        <input type="hidden" name="course_id" value={course.id} />
        <input type="hidden" name="slug" value={course.slug} />

        <div>
          <label className="block text-sm font-medium text-ink">Título</label>
          <input name="title" required placeholder="Examen final" className={`${inputClass} mt-1.5`} />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink">Descripción</label>
          <textarea
            name="description"
            rows={2}
            placeholder="Opcional"
            className={`${inputClass} mt-1.5`}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-muted">
            % para aprobar
            <input
              type="number"
              name="pass_score"
              defaultValue={60}
              min={0}
              max={100}
              className={`${inputClass} mt-1`}
            />
          </label>
          <label className="text-xs text-muted">
            Máx. intentos
            <input
              type="number"
              name="max_attempts"
              min={1}
              placeholder="Sin límite"
              className={`${inputClass} mt-1`}
            />
          </label>
          <label className="text-xs text-muted">
            Tiempo (min)
            <input
              type="number"
              name="time_limit_minutes"
              min={1}
              placeholder="Sin límite"
              className={`${inputClass} mt-1`}
            />
          </label>
          <label className="text-xs text-muted">
            Vence
            <input type="datetime-local" name="due_at" className={`${inputClass} mt-1`} />
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" name="require_justification" className="accent-[#0f8b6c]" />
          Pedir que justifique/desarrolle cada respuesta (opcional para el alumno)
        </label>

        <button
          type="submit"
          className="rounded-md bg-teal px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-dark"
        >
          Crear y cargar preguntas
        </button>
      </form>
    </div>
  );
}
