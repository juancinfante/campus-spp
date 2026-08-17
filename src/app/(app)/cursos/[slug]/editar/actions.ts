'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { sanitizeRichText } from '@/lib/sanitize';
import { stripHtml } from '@/lib/strip-html';

export type EditCourseState = { error: string } | undefined;

export async function updateCourse(
  _prevState: EditCourseState,
  formData: FormData
): Promise<EditCourseState> {
  const supabase = await createClient();
  const courseId = String(formData.get('course_id') ?? '');
  const slug = String(formData.get('slug') ?? '');
  const title = String(formData.get('title') ?? '').trim();
  const descriptionHtml = sanitizeRichText(String(formData.get('description') ?? ''));
  const description = stripHtml(descriptionHtml).length > 0 ? descriptionHtml : null;
  const isPublished = formData.get('is_published') === 'on';

  if (!title) return { error: 'El título es obligatorio.' };

  const { error } = await supabase
    .from('courses')
    .update({ title, description, is_published: isPublished, updated_at: new Date().toISOString() })
    .eq('id', courseId);

  if (error) return { error: error.message };

  revalidatePath(`/cursos/${slug}`);
  revalidatePath('/cursos');
  redirect(`/cursos/${slug}`);
}

export async function deleteCourse(formData: FormData) {
  const supabase = await createClient();
  const courseId = String(formData.get('course_id') ?? '');
  if (!courseId) return;

  // El curso borra en cascada documentos, inscripciones, exámenes,
  // calificaciones asociadas (así quedó definido en el esquema).
  await supabase.from('courses').delete().eq('id', courseId);

  revalidatePath('/cursos');
  redirect('/cursos');
}
