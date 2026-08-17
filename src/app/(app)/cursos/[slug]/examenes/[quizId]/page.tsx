import { notFound } from 'next/navigation';
import { getViewer } from '@/lib/viewer';
import { QuizForm } from './quiz-form';

export default async function ExamenPage({
  params,
}: {
  params: Promise<{ slug: string; quizId: string }>;
}) {
  const { slug, quizId } = await params;
  const { supabase } = await getViewer();

  const { data: quiz } = await supabase
    .from('quizzes')
    .select('id, title, description, time_limit_minutes, require_justification')
    .eq('id', quizId)
    .single();

  if (!quiz) notFound();

  // is_correct no viaja acá: la columna está revocada para "authenticated"
  // (ver esquema). Esta consulta solo trae id, question_id, option_text, position.
  const { data: questions } = await supabase
    .from('quiz_questions')
    .select('id, question_text, quiz_options(id, option_text, position)')
    .eq('quiz_id', quizId)
    .order('position', { ascending: true });

  const orderedQuestions = (questions ?? []).map((q) => ({
    ...q,
    quiz_options: [...(q.quiz_options ?? [])].sort((a, b) => a.position - b.position),
  }));

  // Sin tiempo límite: flujo de siempre, un solo paso al entregar.
  if (quiz.time_limit_minutes == null) {
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">{quiz.title}</h1>
          {quiz.description && <p className="mt-1.5 text-muted">{quiz.description}</p>}
        </div>
        <QuizForm
          quizId={quiz.id}
          courseSlug={slug}
          questions={orderedQuestions}
          requireJustification={quiz.require_justification}
        />
      </div>
    );
  }

  // Con tiempo límite: abre (o retoma) el intento en curso. Si ya
  // recargó la página antes, get_or_start_quiz_attempt() devuelve el
  // MISMO intento con su started_at original — por eso el tiempo
  // restante se calcula bien y no se resetea al refrescar.
  const { data: attemptRows, error } = await supabase.rpc('get_or_start_quiz_attempt', {
    p_quiz_id: quizId,
  });

  if (error || !attemptRows || attemptRows.length === 0) {
    return (
      <div className="max-w-2xl space-y-4">
        <h1 className="font-display text-2xl font-semibold text-ink">{quiz.title}</h1>
        <p className="rounded-md bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
          {error?.message ?? 'No se pudo iniciar el examen.'}
        </p>
      </div>
    );
  }

  const attempt = attemptRows[0];
  const elapsedSeconds = Math.floor((Date.now() - new Date(attempt.started_at).getTime()) / 1000);
  const remainingSeconds = Math.max(0, attempt.time_limit_minutes * 60 - elapsedSeconds);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">{quiz.title}</h1>
        {quiz.description && <p className="mt-1.5 text-muted">{quiz.description}</p>}
      </div>
      <QuizForm
        quizId={quiz.id}
        courseSlug={slug}
        questions={orderedQuestions}
        requireJustification={quiz.require_justification}
        attemptId={attempt.attempt_id}
        initialRemainingSeconds={remainingSeconds}
      />
    </div>
  );
}
