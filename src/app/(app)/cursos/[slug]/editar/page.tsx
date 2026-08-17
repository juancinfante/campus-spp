import { notFound, redirect } from 'next/navigation';
import { getViewer } from '@/lib/viewer';
import { EditCourseForm } from './edit-course-form';

export default async function EditarCursoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { supabase, user, profile } = await getViewer();
  if (!user || !profile) return null;

  const { data: course } = await supabase
    .from('courses')
    .select('id, slug, title, description, is_published, teacher_id')
    .eq('slug', slug)
    .single();

  if (!course) notFound();
  if (course.teacher_id !== user.id) redirect(`/cursos/${slug}`);

  return (
    <div className="max-w-lg space-y-8">
      <h1 className="font-display text-2xl font-semibold text-ink">Editar clase</h1>
      <EditCourseForm course={course} />
    </div>
  );
}
