import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getViewer } from '@/lib/viewer';

type AnswerRow = {
  question_id: string;
  question_text: string;
  option_id: string;
  option_text: string;
  is_correct: boolean;
};

export default async function VerRespuestasPage({
  params,
}: {
  params: Promise<{ quizId: string; attemptId: string }>;
}) {
  const { quizId, attemptId } = await params;
  const { supabase, user, profile } = await getViewer();
  if (!user || !profile) return null;
  if (profile.role !== 'teacher') redirect('/calificaciones');

  const { data: quiz } = await supabase
    .from('quizzes')
    .select('id, title, courses!inner(title, teacher_id)')
    .eq('id', quizId)
    .single();

  // 1. SOLUCIÓN PARA COURSES
  const courseData: any = Array.isArray(quiz?.courses) ? quiz.courses[0] : quiz?.courses;

  if (!quiz || courseData?.teacher_id !== user.id) notFound();

  const { data: attempt } = await supabase
    .from('quiz_attempts')
    .select('id, score, submitted_at, profiles(full_name)')
    .eq('id', attemptId)
    .eq('quiz_id', quizId)
    .single();

  if (!attempt) notFound();

  // 2. SOLUCIÓN PARA PROFILES
  const profileData: any = Array.isArray(attempt.profiles) ? attempt.profiles[0] : attempt.profiles;

  // get_quiz_with_answers trae is_correct (columna bloqueada para
  // SELECT directo) — la usamos acá para marcar la opción correcta,
  // igual que en el editor de preguntas del profesor.
  const [{ data: keyRows }, { data: myAnswers }] = await Promise.all([
    supabase.rpc('get_quiz_with_answers', { p_quiz_id: quizId }),
    supabase
      .from('quiz_answers')
      .select('question_id, selected_option_id, justification')
      .eq('attempt_id', attemptId),
  ]);

  const questions = new Map<
    string,
    { question_id: string; question_text: string; options: AnswerRow[] }
  >();
  for (const row of (keyRows ?? []) as AnswerRow[]) {
    if (!questions.has(row.question_id)) {
      questions.set(row.question_id, {
        question_id: row.question_id,
        question_text: row.question_text,
        options: [],
      });
    }
    questions.get(row.question_id)!.options.push(row);
  }

  const answerByQuestion = new Map(
    (myAnswers ?? []).map((a) => [a.question_id, a])
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link
          href={`/calificaciones/${quizId}`}
          className="text-sm font-medium text-teal hover:underline"
        >
          ← {quiz.title}
        </Link>
        <h1 className="mt-1 font-display text-2xl font-semibold text-ink">
          {/* USAMOS profileData AQUÍ */}
          {profileData?.full_name ?? 'Alumno Desconocido'}
        </h1>
        <p className="text-sm text-muted">
          {attempt.score ?? '—'}% ·{' '}
          {new Date(attempt.submitted_at).toLocaleString('es-AR')}
        </p>
      </div>

      <ul className="space-y-3">
        {[...questions.values()].map((q, i) => {
          const myAnswer = answerByQuestion.get(q.question_id);
          return (
            <li key={q.question_id} className="rounded-lg border border-line bg-white p-5">
              <p className="font-medium text-ink">
                {i + 1}. {q.question_text}
              </p>
              <ul className="mt-3 space-y-1 text-sm">
                {q.options.map((o) => {
                  const wasSelected = o.option_id === myAnswer?.selected_option_id;
                  return (
                    <li
                      key={o.option_id}
                      className={[
                        o.is_correct ? 'font-medium text-teal-dark' : 'text-muted',
                        wasSelected && !o.is_correct ? 'text-danger' : '',
                      ].join(' ')}
                    >
                      {o.is_correct ? '✓ ' : wasSelected ? '✗ ' : '· '}
                      {o.option_text}
                      {wasSelected && (
                        <span className="ml-1.5 text-xs text-muted">(elegida)</span>
                      )}
                    </li>
                  );
                })}
              </ul>
              {myAnswer?.justification && (
                <div className="mt-3 rounded-md bg-paper px-3.5 py-2.5 text-sm text-ink">
                  <p className="text-xs font-medium uppercase text-muted">Justificación</p>
                  <p className="mt-1">{myAnswer.justification}</p>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}