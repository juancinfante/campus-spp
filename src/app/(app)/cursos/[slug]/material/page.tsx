import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getViewer } from '@/lib/viewer';
import { ConfirmButton } from '@/components/ui/ConfirmButton';
import { uploadDocuments, deleteDocument } from '../manage-actions';

function formatSize(bytes: number | null) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function MaterialPage({
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

  const { data: resources } = await supabase
    .from('course_resources')
    .select('id, file_name, file_path, file_size')
    .eq('course_id', course.id)
    .order('uploaded_at', { ascending: false });

  const resourcesWithUrls = await Promise.all(
    (resources ?? []).map(async (r) => {
      const { data } = await supabase.storage
        .from('course-resources')
        .createSignedUrl(r.file_path, 60 * 10);
      return { ...r, signedUrl: data?.signedUrl ?? null };
    })
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link
          href={`/cursos/${course.slug}`}
          className="text-sm font-medium text-teal hover:underline"
        >
          ← {course.title}
        </Link>
        <h1 className="mt-1 font-display text-2xl font-semibold text-ink">Material</h1>
      </div>

      {resourcesWithUrls.length === 0 ? (
        <p className="text-sm text-muted">Todavía no hay documentos cargados.</p>
      ) : (
        <ul className="divide-y divide-line rounded-lg border border-line bg-white">
          {resourcesWithUrls.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div>
                <p className="text-sm text-ink">{r.file_name}</p>
                {r.file_size != null && (
                  <p className="text-xs text-muted">{formatSize(r.file_size)}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {r.signedUrl ? (
                  <a href={r.signedUrl} className="text-sm font-medium text-teal hover:underline">
                    ↓ Descargar
                  </a>
                ) : (
                  <span className="text-xs text-muted">No disponible</span>
                )}
                {isOwner && (
                  <form action={deleteDocument}>
                    <input type="hidden" name="resource_id" value={r.id} />
                    <input type="hidden" name="file_path" value={r.file_path} />
                    <input type="hidden" name="slug" value={course.slug} />
                    <ConfirmButton
                      confirmText={`¿Eliminar "${r.file_name}"?`}
                      className="text-xs font-medium text-danger hover:underline"
                    >
                      Eliminar
                    </ConfirmButton>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {isOwner && (
        <form
          action={uploadDocuments}
          className="flex flex-wrap items-center gap-2.5 rounded-lg border border-dashed border-line p-5"
        >
          <input type="hidden" name="course_id" value={course.id} />
          <input type="hidden" name="slug" value={course.slug} />
          <input
            type="file"
            name="files"
            multiple
            required
            className="flex-1 text-sm text-muted file:mr-3 file:rounded-md file:border file:border-line file:bg-paper file:px-3 file:py-1.5 file:text-sm file:text-ink"
          />
          <button
            type="submit"
            className="rounded-md bg-teal px-4 py-2 text-sm font-medium text-white hover:bg-teal-dark"
          >
            Subir
          </button>
          <p className="w-full text-xs text-muted">Podés seleccionar varios archivos a la vez.</p>
        </form>
      )}
    </div>
  );
}
