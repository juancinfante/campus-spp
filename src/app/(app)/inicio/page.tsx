import Link from 'next/link';
import { getViewer } from '@/lib/viewer';
import { ConfirmButton } from '@/components/ui/ConfirmButton';
import { deleteNewsPost } from './actions';
import { NewsForm } from './news-form';
import { ClaseCard } from './clase-card';

type NewsPost = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  profiles: { full_name: string } | null;
};

export default async function HomePage() {
  const { supabase, user, profile } = await getViewer();
  if (!user || !profile) return null;

  const { data: rawNews } = await supabase
    .from('news_posts')
    .select('id, title, content, created_at, profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(10);

  // SOLUCIÓN 1: Mapeamos los datos para asegurar que profiles sea un objeto y coincida con el type NewsPost
  const news: NewsPost[] = (rawNews ?? []).map((n: any) => ({
    ...n,
    profiles: Array.isArray(n.profiles) ? n.profiles[0] : n.profiles,
  }));

  const isAdmin = profile.role === 'admin';
  const isTeacher = profile.role === 'teacher';

  return (
    <div className="space-y-12">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Hola, {profile.full_name}</h1>
        <p className="mt-1 text-muted">Novedades del campus.</p>
      </div>

      <NewsSection news={news} isAdmin={isAdmin} />

      {isTeacher ? (
        <TeacherCourses teacherId={user.id} />
      ) : !isAdmin ? (
        <StudentCourses studentId={user.id} />
      ) : null}
    </div>
  );
}

function NewsSection({ news, isAdmin }: { news: NewsPost[]; isAdmin: boolean }) {
  return (
    <section className="space-y-4">
      {isAdmin && <NewsForm />}

      {news.length === 0 ? (
        <p className="text-sm text-muted">Todavía no hay noticias publicadas.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {news.map((n) => (
            <article key={n.id} className="rounded-lg border border-line bg-white p-5">
              <p className="font-display text-lg text-ink">{n.title}</p>
              <div
                className="prose prose-sm mt-2 line-clamp-4 max-w-none text-ink"
                dangerouslySetInnerHTML={{ __html: n.content }}
              />
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-muted">
                  {n.profiles?.full_name} · {new Date(n.created_at).toLocaleDateString('es-AR')}
                </p>
                {isAdmin && (
                  <form action={deleteNewsPost}>
                    <input type="hidden" name="post_id" value={n.id} />
                    <ConfirmButton
                      confirmText={`¿Eliminar la noticia "${n.title}"?`}
                      className="text-xs font-medium text-danger hover:underline"
                    >
                      Eliminar
                    </ConfirmButton>
                  </form>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

async function TeacherCourses({ teacherId }: { teacherId: string }) {
  const { supabase } = await getViewer();
  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, slug, is_published, enrollments(count)')
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false });

  return (
    <section className="space-y-4">
      <h2 className="font-display text-lg font-semibold text-ink">Tus clases</h2>

      {!courses || courses.length === 0 ? (
        <EmptyState
          title="Todavía no creaste ninguna clase"
          description="Creá tu primera clase y después agregale documentos y exámenes."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {courses.map((c) => (
            <ClaseCard
              key={c.id}
              href={`/cursos/${c.slug}`}
              title={c.title}
              badge={
                <div className="mb-2 flex items-center justify-between">
                  <span
                    className={[
                      'rounded-full px-2.5 py-0.5 text-xs font-medium',
                      c.is_published ? 'bg-teal/10 text-teal-dark' : 'bg-highlight/20 text-ink',
                    ].join(' ')}
                  >
                    {c.is_published ? 'Publicada' : 'Borrador'}
                  </span>
                  <span className="text-xs text-muted">
                    {c.enrollments?.[0]?.count ?? 0} inscriptos
                  </span>
                </div>
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}

async function StudentCourses({ studentId }: { studentId: string }) {
  const { supabase } = await getViewer();
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('course:courses(id, title, slug)')
    .eq('student_id', studentId);

  // SOLUCIÓN 2: Extraemos el curso en caso de que supabase lo devuelva como arreglo
  const courses: any[] = (enrollments ?? [])
    .map((e) => (Array.isArray(e.course) ? e.course[0] : e.course))
    .filter(Boolean);

  return (
    <section className="space-y-4">
      <h2 className="font-display text-lg font-semibold text-ink">Tus clases</h2>

      {courses.length === 0 ? (
        <EmptyState
          title="Todavía no estás inscripto en ninguna clase"
          description="Mirá el catálogo y sumate a la que te interese."
          action={{ href: '/cursos', label: 'Ver clases' }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {courses.map((c) => (
            <ClaseCard key={c.id} href={`/cursos/${c.slug}`} title={c.title} />
          ))}
        </div>
      )}
    </section>
  );
}

function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="rounded-lg border border-dashed border-line px-6 py-14 text-center">
      <p className="font-display text-lg text-ink">{title}</p>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">{description}</p>
      {action && (
        <Link
          href={action.href}
          className="mt-5 inline-block rounded-md bg-teal px-4 py-2 text-sm font-medium text-white hover:bg-teal-dark"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}