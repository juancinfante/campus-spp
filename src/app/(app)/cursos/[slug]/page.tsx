import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FileText, ClipboardList } from 'lucide-react';
import { getViewer } from '@/lib/viewer';
import { EnrollButton } from './enroll-button';
import { ConfirmButton } from '@/components/ui/ConfirmButton';
import { deleteCourseMedia } from './manage-actions';

export default async function ClaseDetallePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { supabase, user, profile } = await getViewer();
  if (!user || !profile) return null;

  const { data: course } = await supabase
    .from('courses')
    .select('id, title, slug, description, is_published, teacher_id, profiles(full_name)')
    .eq('slug', slug)
    .single();

  if (!course) notFound();

  // SOLUCIÓN: Extraer profiles
  const profileData: any = Array.isArray(course.profiles) ? course.profiles[0] : course.profiles;

  const isOwner = course.teacher_id === user.id;

  let isEnrolled = false;
  if (profile.role === 'student' && !isOwner) {
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('course_id', course.id)
      .eq('student_id', user.id)
      .maybeSingle();
    isEnrolled = Boolean(enrollment);
  }

  const canSeeContent = isOwner || isEnrolled;

  let materialCount = 0;
  let examCount = 0;
  if (canSeeContent) {
    const [{ count: mc }, { count: ec }] = await Promise.all([
      supabase
        .from('course_resources')
        .select('id', { count: 'exact', head: true })
        .eq('course_id', course.id),
      supabase.from('quizzes').select('id', { count: 'exact', head: true }).eq('course_id', course.id),
    ]);
    materialCount = mc ?? 0;
    examCount = ec ?? 0;
  }

  const { data: media } = await supabase
    .from('course_media')
    .select('id, kind, file_name, file_path')
    .eq('course_id', course.id)
    .order('uploaded_at', { ascending: false });

  const mediaWithUrls = (media ?? []).map((m) => ({
    ...m,
    url: supabase.storage.from('editor-media').getPublicUrl(m.file_path).data.publicUrl,
  }));

  return (
    <div className="space-y-10">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">{course.title}</h1>
            <p className="mt-1 text-sm text-muted">
              Profesor: {profileData?.full_name ?? '—'}
            </p>
          </div>
          {isOwner ? (
            <Link
              href={`/cursos/${course.slug}/editar`}
              className="rounded-md border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-line/40"
            >
              Editar clase
            </Link>
          ) : (
            profile.role === 'student' &&
            !isEnrolled && <EnrollButton courseId={course.id} slug={course.slug} />
          )}
        </div>
        {course.description && (
          <div
            className="prose prose-sm mt-4 max-w-2xl text-ink"
            dangerouslySetInnerHTML={{ __html: course.description }}
          />
        )}
        {isOwner && !course.is_published && (
          <p className="mt-3 inline-block rounded-full bg-highlight/20 px-2.5 py-0.5 text-xs font-medium text-ink">
            Borrador — solo vos la ves. Publicala desde &quot;Editar clase&quot;.
          </p>
        )}
      </div>

      {mediaWithUrls.length > 0 && (
        <section className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {mediaWithUrls.map((m) => (
              <div key={m.id} className="group relative overflow-hidden rounded-lg border border-line bg-white">
                {m.kind === 'video' ? (
                  <video src={m.url} controls className="aspect-video w-full bg-ink object-cover" />
                ) : (
                  <a href={m.url} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.url} alt={m.file_name} className="aspect-video w-full object-cover" />
                  </a>
                )}
                {isOwner && (
                  <form
                    action={deleteCourseMedia}
                    className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <input type="hidden" name="media_id" value={m.id} />
                    <input type="hidden" name="file_path" value={m.file_path} />
                    <input type="hidden" name="slug" value={course.slug} />
                    <ConfirmButton
                      confirmText={`¿Eliminar "${m.file_name}"?`}
                      className="rounded-md bg-ink/70 px-2 py-1 text-xs font-medium text-paper hover:bg-danger"
                    >
                      Eliminar
                    </ConfirmButton>
                  </form>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {!canSeeContent ? (
        <div className="rounded-lg border border-dashed border-line px-6 py-14 text-center">
          <p className="font-display text-lg text-ink">Inscribite para ver el contenido</p>
          <p className="mt-1.5 text-sm text-muted">
            El material y los exámenes se habilitan una vez que estás inscripto.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href={`/cursos/${course.slug}/material`}
            className="rounded-lg border border-line bg-white p-6 transition-colors hover:border-teal"
          >
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-teal/10 text-teal-dark">
              <FileText size={18} />
            </div>
            <p className="font-display text-lg text-ink">Material</p>
            <p className="mt-1 text-sm text-muted">
              {materialCount} {materialCount === 1 ? 'documento' : 'documentos'}
            </p>
          </Link>

          <Link
            href={`/cursos/${course.slug}/examenes`}
            className="rounded-lg border border-line bg-white p-6 transition-colors hover:border-teal"
          >
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-highlight/20 text-ink">
              <ClipboardList size={18} />
            </div>
            <p className="font-display text-lg text-ink">Exámenes</p>
            <p className="mt-1 text-sm text-muted">
              {examCount} {examCount === 1 ? 'examen' : 'exámenes'}
            </p>
          </Link>
        </div>
      )}
    </div>
  );
}