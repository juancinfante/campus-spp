import Link from 'next/link';
import { getViewer } from '@/lib/viewer';

export default async function CalificacionesPage() {
  const { supabase, user, profile } = await getViewer();
  if (!user || !profile) return null;

  if (profile.role === 'teacher') {
    return <TeacherCalificaciones />;
  }

  const { data: attempts } = await supabase
    .from('quiz_attempts')
    .select('id, score, submitted_at, quizzes(title, courses(title))')
    .eq('student_id', user.id)
    .order('submitted_at', { ascending: false });

  // SOLUCIÓN: Extraer quizzes y courses
  const formattedAttempts = (attempts ?? []).map((a: any) => {
    const quizData: any = Array.isArray(a.quizzes) ? a.quizzes[0] : a.quizzes;
    const courseData: any = Array.isArray(quizData?.courses) ? quizData?.courses[0] : quizData?.courses;
    
    return {
      ...a,
      quizzes: {
        ...quizData,
        courses: courseData,
      },
    };
  });

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Calificaciones</h1>
        <p className="mt-1 text-muted">Tus exámenes rendidos.</p>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-ink">Exámenes rendidos</h2>
        {formattedAttempts.length === 0 ? (
          <p className="text-sm text-muted">Todavía no rendiste ningún examen.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-line bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-line/20 text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-2.5">Examen</th>
                  <th className="px-4 py-2.5">Clase</th>
                  <th className="px-4 py-2.5">Puntaje</th>
                  <th className="px-4 py-2.5">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {formattedAttempts.map((a) => (
                  <tr key={a.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-2.5 text-ink">{a.quizzes?.title}</td>
                    <td className="px-4 py-2.5 text-muted">{a.quizzes?.courses?.title}</td>
                    <td className="px-4 py-2.5 text-ink">{a.score ?? '—'}%</td>
                    <td className="px-4 py-2.5 text-muted">
                      {new Date(a.submitted_at).toLocaleDateString('es-AR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

async function TeacherCalificaciones() {
  const { supabase, user } = await getViewer();
  if (!user) return null;

  const { data: quizzes } = await supabase
    .from('quizzes')
    .select('id, title, due_at, courses!inner(title, teacher_id), quiz_attempts(count)')
    .eq('courses.teacher_id', user.id)
    .order('created_at', { ascending: false });

  // SOLUCIÓN: Extraer courses
  const formattedQuizzes = (quizzes ?? []).map((q: any) => {
    const courseData: any = Array.isArray(q.courses) ? q.courses[0] : q.courses;
    return {
      ...q,
      courses: courseData,
    };
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Calificaciones</h1>
        <p className="mt-1 text-muted">Elegí un examen para ver cómo les fue a tus alumnos.</p>
      </div>

      {formattedQuizzes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line px-6 py-14 text-center">
          <p className="font-display text-lg text-ink">Todavía no tenés exámenes</p>
          <p className="mt-1.5 text-sm text-muted">
            Cuando crees un examen en alguna de tus clases, va a aparecer acá.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {formattedQuizzes.map((q) => {
            const attemptCount = q.quiz_attempts?.[0]?.count ?? 0;
            return (
              <Link
                key={q.id}
                href={`/calificaciones/${q.id}`}
                className="rounded-lg border border-line bg-white p-5 transition-colors hover:border-teal"
              >
                <p className="text-xs text-muted">{q.courses?.title}</p>
                <p className="mt-1 font-display text-lg text-ink">{q.title}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-muted">
                  <span>
                    {attemptCount} {attemptCount === 1 ? 'intento' : 'intentos'}
                  </span>
                  {q.due_at && <span>Venció: {new Date(q.due_at).toLocaleDateString('es-AR')}</span>}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}