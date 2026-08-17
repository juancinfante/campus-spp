'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { slugify } from '@/lib/slugify';
import { sanitizeRichText } from '@/lib/sanitize';
import { stripHtml } from '@/lib/strip-html';

export async function enroll(courseId: string, slug: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Tenés que iniciar sesión.' };

  const { error } = await supabase
    .from('enrollments')
    .insert({ student_id: user.id, course_id: courseId });

  if (error) {
    // unique(student_id, course_id) -> ya estaba inscripto, no es un error real
    if (error.code !== '23505') return { error: error.message };
  }

  revalidatePath(`/cursos/${slug}`);
  revalidatePath('/inicio');
  return { error: null };
}

export type CourseFormState = { error: string } | undefined;

export async function createCourse(
  _prevState: CourseFormState,
  formData: FormData
): Promise<CourseFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Tenés que iniciar sesión.' };

  const title = String(formData.get('title') ?? '').trim();
  const descriptionHtml = sanitizeRichText(String(formData.get('description') ?? ''));
  const description = stripHtml(descriptionHtml).length > 0 ? descriptionHtml : null;
  const isPublished = formData.get('is_published') === 'on';

  if (!title) return { error: 'El título es obligatorio.' };

  const baseSlug = slugify(title) || 'curso';
  let slug = baseSlug;
  let attempt = 0;

  // Si el slug ya existe (constraint unique), reintenta agregando un
  // sufijo numérico hasta encontrar uno libre.
  while (attempt < 5) {
    const { data: course, error } = await supabase
      .from('courses')
      .insert({ teacher_id: user.id, title, description, is_published: isPublished, slug })
      .select('slug')
      .single();

    if (!error && course) {
      revalidatePath('/cursos');
      redirect(`/cursos/${course.slug}`);
    }

    if (error?.code === '23505') {
      attempt += 1;
      slug = `${baseSlug}-${attempt + 1}`;
      continue;
    }

    return { error: error?.message ?? 'No se pudo crear el curso.' };
  }

  return { error: 'No se pudo generar un slug único para ese título. Probá con otro.' };
}
