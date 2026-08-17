import { redirect } from 'next/navigation';
import { getViewer } from '@/lib/viewer';
import { CourseForm } from './course-form';

export default async function NuevoCursoPage() {
  const { user, profile } = await getViewer();
  if (!user || !profile) return null;
  if (profile.role !== 'teacher') redirect('/cursos');

  return (
    <div className="max-w-lg space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Nueva clase</h1>
        <p className="mt-1 text-muted">Después le agregás documentos y exámenes.</p>
      </div>
      <CourseForm />
    </div>
  );
}
