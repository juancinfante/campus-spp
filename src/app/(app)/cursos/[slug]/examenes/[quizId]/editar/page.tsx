import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getViewer } from '@/lib/viewer';
import { QuestionForm } from './question-form';
import { deleteQuestion } from './actions';
import { updateQuiz, deleteQuiz } from '../../../manage-actions';
import { ConfirmButton } from '@/components/ui/ConfirmButton';

const inputClass =
  'w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30';

function toDatetimeLocal(value: string | null) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 16);
}

type QuizAnswerRow = {
  question_id: string;
  question_text: string;
  option_id: string;
  option_text: string;
  is_correct: boolean;
};

export default async function EditarExamenPage({
  params,
}: {
  params: Promise<{ slug: string; quizId: string }>;
}) {
  const { slug, quizId } = await params;
  const { supabase, user, profile } = await getViewer();
  if (!user || !profile) return null;
  if (profile.role !== 'teacher') redirect(`/cursos/${slug}`);

  const { data: quiz } = await supabase
    .from('quizzes')
    .select(
      'id, title, description, pass_score, due_at, max_attempts, time_limit_minutes, require_justification, course_id, courses(teacher_id)'
    )
    .eq('id', quizId)
    .single();

  // SOLUCIÓN: Extraemos courses en caso de que venga como arreglo
  const courseData: any = Array.isArray(quiz?.courses) ? quiz?.courses[0] : quiz?.courses;

  if (!quiz || courseData?.teacher_id !== user.id) notFound();

  // get_quiz_with_answers es la única forma de leer is_correct desde el
  // cliente (la columna está revocada para SELECT directo). La función
  // misma verifica que seas el dueño del curso.
  const { data: rows } = await supabase.rpc('get_quiz_with_answers', {
    p_quiz_id: quizId,
  });

  const questions = new Map<
    string,
    { question_id: string; question_text: string; options: QuizAnswerRow[] }
  >();
  for (const row of (rows ?? []) as QuizAnswerRow[]) {
    if (!questions.has(row.question_id)) {
      questions.set(row.question_id, {
        question_id: row.question_id,
        question_text: row.question_text,
        options: [],
      });
    }
    questions.get(row.question_id)!.options.push(row);
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <Link
          href={`/cursos/${slug}/examenes`}
          className="text-sm font-medium text-teal hover:underline"
        >
          ← Exámenes
        </Link>
        <h1 className="mt-1 font-display text-2xl font-semibold text-ink">Editar examen</h1>
      </div>

      {/* -------------------- NOMBRE, DESCRIPCIÓN Y CONFIGURACIÓN -------------------- */}
      <section className="space-y-3 rounded-lg border border-line bg-white p-5">
        <form action={updateQuiz} className="space-y-3">
          <input type="hidden" name="quiz_id" value={quiz.id} />
          <input type="hidden" name="slug" value={slug} />

          <div>
            <label className="block text-sm font-medium text-ink">Título</label>
            <input
              name="title"
              defaultValue={quiz.title}
              required
              className={`${inputClass} mt-1.5`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink">Descripción</label>
            <textarea
              name="description"
              defaultValue={quiz.description ?? ''}
              rows={2}
              className={`${inputClass} mt-1.5`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <label className="text-xs text-muted">
              % para aprobar
              <input
                type="number"
                name="pass_score"
                defaultValue={quiz.pass_score}
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
                defaultValue={quiz.max_attempts ?? ''}
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
                defaultValue={quiz.time_limit_minutes ?? ''}
                min={1}
                placeholder="Sin límite"
                className={`${inputClass} mt-1`}
              />
            </label>
            <label className="text-xs text-muted">
              Vence
              <input
                type="datetime-local"
                name="due_at"
                defaultValue={toDatetimeLocal(quiz.due_at)}
                className={`${inputClass} mt-1`}
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              name="require_justification"
              defaultChecked={quiz.require_justification}
              className="accent-[#0f8b6c]"
            />
            Pedir que justifique/desarrolle cada respuesta (opcional para el alumno)
          </label>

          <div className="flex items-center justify-between border-t border-line pt-3">
            <button
              type="submit"
              className="rounded-md bg-teal px-4 py-2 text-sm font-medium text-white hover:bg-teal-dark"
            >
              Guardar
            </button>
            <ConfirmButton
              formAction={deleteQuiz}
              confirmText={`¿Eliminar el examen "${quiz.title}" y todos sus intentos? No se puede deshacer.`}
              className="text-sm font-medium text-danger hover:underline"
            >
              Eliminar examen
            </ConfirmButton>
          </div>
        </form>
      </section>

      {/* -------------------- PREGUNTAS -------------------- */}
      <section className="space-y-4">
        <h2 className="font-display text-lg font-semibold text-ink">Preguntas</h2>
        <p className="text-sm text-muted">
          Para corregir una pregunta, eliminala y volvé a cargarla — todavía no hay edición en
          línea de preguntas existentes.
        </p>

        {questions.size === 0 ? (
          <p className="text-sm text-muted">Este examen todavía no tiene preguntas.</p>
        ) : (
          <ul className="space-y-3">
            {[...questions.values()].map((q) => (
              <li key={q.question_id} className="rounded-lg border border-line bg-white p-5">
                <div className="flex items-start justify-between gap-4">
                  <p className="font-medium text-ink">{q.question_text}</p>
                  <form action={deleteQuestion}>
                    <input type="hidden" name="question_id" value={q.question_id} />
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="quiz_id" value={quizId} />
                    <ConfirmButton
                      confirmText="¿Eliminar esta pregunta?"
                      className="shrink-0 text-xs font-medium text-danger hover:underline"
                    >
                      Eliminar
                    </ConfirmButton>
                  </form>
                </div>
                <ul className="mt-3 space-y-1 text-sm">
                  {q.options.map((o) => (
                    <li
                      key={o.option_id}
                      className={o.is_correct ? 'font-medium text-teal-dark' : 'text-muted'}
                    >
                      {o.is_correct ? '✓ ' : '· '}
                      {o.option_text}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}

        <div className="rounded-lg border border-line bg-white p-5">
          <h3 className="font-display text-base font-semibold text-ink">Agregar pregunta</h3>
          <QuestionForm quizId={quizId} slug={slug} />
        </div>
      </section>
    </div>
  );
}