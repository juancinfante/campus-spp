import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ClipboardList, Plus } from 'lucide-react';
import { getViewer } from '@/lib/viewer';

export default async function ExamenesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { supabase, user, profile } = await getViewer();
  if (!user || !profile) return null;

  const { data: course } = await supabase
    .from('courses')
    .select('id, title, slug, teacher_id')
    .eq('slug', slug)
    .single();

  if (!course) notFound();

  const isOwner = course.teacher_id === user.id;

  let isEnrolled = isOwner;
  if (!isOwner) {
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('course_id', course.id)
      .eq('student_id', user.id)
      .maybeSingle();
    isEnrolled = Boolean(enrollment);
  }
  if (!isEnrolled) notFound();

  const { data: quizzes } = await supabase
    .from('quizzes')
    .select(
      'id, title, description, due_at, max_attempts, time_limit_minutes, quiz_questions(count)'
    )
    .eq('course_id', course.id)
    .order('created_at', { ascending: true });

  let myAttemptCounts: Record<string, number> = {};
  if (!isOwner && quizzes && quizzes.length > 0) {
    const { data: attempts } = await supabase
      .from('quiz_attempts')
      .select('quiz_id')
      .eq('student_id', user.id)
      .in(
        'quiz_id',
        quizzes.map((q) => q.id)
      );
    myAttemptCounts = (attempts ?? []).reduce<Record<string, number>>((acc, a) => {
      acc[a.quiz_id] = (acc[a.quiz_id] ?? 0) + 1;
      return acc;
    }, {});
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/cursos/${course.slug}`}
          className="text-sm font-medium text-teal hover:underline"
        >
          ← {course.title}
        </Link>
        <h1 className="mt-1 font-display text-2xl font-semibold text-ink">Exámenes</h1>
      </div>

      {(!quizzes || quizzes.length === 0) && !isOwner && (
        <p className="text-sm text-muted">Esta clase todavía no tiene exámenes cargados.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {(quizzes ?? []).map((quiz) => {
          const questionCount = quiz.quiz_questions?.[0]?.count ?? 0;

          if (isOwner) {
            return (
              <Link
                key={quiz.id}
                href={`/cursos/${course.slug}/examenes/${quiz.id}/editar`}
                className="rounded-lg border border-line bg-white p-5 transition-colors hover:border-teal"
              >
                <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-highlight/20 text-ink">
                  <ClipboardList size={16} />
                </div>
                <p className="font-display text-lg text-ink">{quiz.title}</p>
                <p className="mt-1 text-xs text-muted">
                  {questionCount} {questionCount === 1 ? 'pregunta' : 'preguntas'}
                  {quiz.time_limit_minutes != null && ` · ${quiz.time_limit_minutes} min`}
                </p>
              </Link>
            );
          }

          const used = myAttemptCounts[quiz.id] ?? 0;
          const exhausted = quiz.max_attempts != null && used >= quiz.max_attempts;
          const expired = quiz.due_at != null && new Date(quiz.due_at) < new Date();
          const blocked = exhausted || expired;

          const card = (
            <div
              className={`rounded-lg border border-line bg-white p-5 ${blocked ? '' : 'transition-colors hover:border-teal'}`}
            >
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-highlight/20 text-ink">
                <ClipboardList size={16} />
              </div>
              <p className="font-display text-lg text-ink">{quiz.title}</p>
              <p className="mt-1 text-xs text-muted">
                {quiz.time_limit_minutes != null && `${quiz.time_limit_minutes} min · `}
                {quiz.max_attempts != null && `Intentos: ${used}/${quiz.max_attempts} · `}
                {quiz.due_at && `Vence: ${new Date(quiz.due_at).toLocaleDateString('es-AR')}`}
              </p>
              {blocked && (
                <p className="mt-2 text-xs font-medium text-muted">
                  {exhausted ? 'Sin intentos disponibles' : 'Vencido'}
                </p>
              )}
            </div>
          );

          return blocked ? (
            <div key={quiz.id}>{card}</div>
          ) : (
            <Link key={quiz.id} href={`/cursos/${course.slug}/examenes/${quiz.id}`}>
              {card}
            </Link>
          );
        })}

        {isOwner && (
          <Link
            href={`/cursos/${course.slug}/examenes/nuevo`}
            className="flex min-h-[132px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-white p-5 text-muted transition-colors hover:border-teal hover:text-teal-dark"
          >
            <Plus size={20} />
            <span className="text-sm font-medium">Crear examen</span>
          </Link>
        )}
      </div>
    </div>
  );
}
