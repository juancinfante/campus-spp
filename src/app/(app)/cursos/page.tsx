import Link from 'next/link';
import { getViewer } from '@/lib/viewer';
import { stripHtml } from '@/lib/strip-html';

export default async function CursosPage() {
  const { supabase, user, profile } = await getViewer();
  if (!user || !profile) return null;

  // La policy "courses_select" ya filtra: publicados para todos + los
  // propios sin publicar si sos el profesor dueño.
  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, slug, description, is_published, teacher_id')
    .order('created_at', { ascending: false });

  let enrolledIds = new Set<string>();
  if (profile.role === 'student') {
    const { data: myEnrollments } = await supabase
      .from('enrollments')
      .select('course_id')
      .eq('student_id', user.id);
    enrolledIds = new Set((myEnrollments ?? []).map((e) => e.course_id));
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Clases</h1>
          <p className="mt-1 text-muted">Catálogo de clases disponibles.</p>
        </div>
        {profile.role === 'teacher' && (
          <Link
            href="/cursos/nuevo"
            className="rounded-md bg-teal px-4 py-2 text-sm font-medium text-white hover:bg-teal-dark"
          >
            + Nueva clase
          </Link>
        )}
      </div>

      {!courses || courses.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line px-6 py-14 text-center">
          <p className="font-display text-lg text-ink">Todavía no hay clases publicadas</p>
          <p className="mt-1.5 text-sm text-muted">
            Cuando un profesor publique una clase, va a aparecer acá.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {courses.map((c) => {
            const isOwner = c.teacher_id === user.id;
            const isEnrolled = enrolledIds.has(c.id);
            return (
              <Link
                key={c.id}
                href={`/cursos/${c.slug}`}
                className="rounded-lg border border-line bg-white p-5 transition-colors hover:border-teal"
              >
                <div className="flex items-center gap-2">
                  {!c.is_published && (
                    <span className="rounded-full bg-highlight/20 px-2.5 py-0.5 text-xs font-medium text-ink">
                      Borrador
                    </span>
                  )}
                  {isEnrolled && (
                    <span className="rounded-full bg-teal/10 px-2.5 py-0.5 text-xs font-medium text-teal-dark">
                      Inscripto
                    </span>
                  )}
                  {isOwner && (
                    <span className="rounded-full bg-ink/5 px-2.5 py-0.5 text-xs font-medium text-ink">
                      Tu clase
                    </span>
                  )}
                </div>
                <p className="mt-3 font-display text-lg text-ink">{c.title}</p>
                {c.description && (
                  <p className="mt-1.5 line-clamp-2 text-sm text-muted">
                    {stripHtml(c.description)}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
