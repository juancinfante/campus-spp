'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

// ---------------- Documentos (Material) ----------------

export async function uploadDocuments(formData: FormData) {
  const supabase = await createClient();
  const courseId = String(formData.get('course_id') ?? '');
  const slug = String(formData.get('slug') ?? '');
  const files = formData.getAll('files').filter((f): f is File => f instanceof File && f.size > 0);
  if (!courseId || files.length === 0) return;

  for (const file of files) {
    const path = `${courseId}/${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('course-resources').upload(path, file);
    if (uploadError) continue;

    await supabase.from('course_resources').insert({
      course_id: courseId,
      file_name: file.name,
      file_path: path,
      file_size: file.size,
    });
  }

  revalidatePath(`/cursos/${slug}`);
  revalidatePath(`/cursos/${slug}/material`);
}

export async function deleteDocument(formData: FormData) {
  const supabase = await createClient();
  const resourceId = String(formData.get('resource_id') ?? '');
  const filePath = String(formData.get('file_path') ?? '');
  const slug = String(formData.get('slug') ?? '');
  if (!resourceId) return;

  if (filePath) {
    await supabase.storage.from('course-resources').remove([filePath]);
  }
  await supabase.from('course_resources').delete().eq('id', resourceId);
  revalidatePath(`/cursos/${slug}`);
  revalidatePath(`/cursos/${slug}/material`);
}

// ---------------- Galería (imágenes/video de portada) ----------------

export async function uploadCourseMedia(formData: FormData) {
  const supabase = await createClient();
  const courseId = String(formData.get('course_id') ?? '');
  const slug = String(formData.get('slug') ?? '');
  const files = formData.getAll('files').filter((f): f is File => f instanceof File && f.size > 0);
  if (!courseId || files.length === 0) return;

  for (const file of files) {
    const kind = file.type.startsWith('video/') ? 'video' : 'image';
    const path = `${courseId}/${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('editor-media').upload(path, file);
    if (uploadError) continue;

    await supabase.from('course_media').insert({
      course_id: courseId,
      kind,
      file_name: file.name,
      file_path: path,
      file_size: file.size,
    });
  }

  revalidatePath(`/cursos/${slug}`);
}

export async function deleteCourseMedia(formData: FormData) {
  const supabase = await createClient();
  const mediaId = String(formData.get('media_id') ?? '');
  const filePath = String(formData.get('file_path') ?? '');
  const slug = String(formData.get('slug') ?? '');
  if (!mediaId) return;

  if (filePath) {
    await supabase.storage.from('editor-media').remove([filePath]);
  }
  await supabase.from('course_media').delete().eq('id', mediaId);
  revalidatePath(`/cursos/${slug}`);
}

// ---------------- Exámenes ----------------

export async function createQuiz(formData: FormData) {
  const supabase = await createClient();
  const courseId = String(formData.get('course_id') ?? '');
  const slug = String(formData.get('slug') ?? '');
  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim() || null;
  const passScore = Number(formData.get('pass_score') ?? 60) || 60;
  const dueAtRaw = String(formData.get('due_at') ?? '');
  const dueAt = dueAtRaw ? new Date(dueAtRaw).toISOString() : null;
  const maxAttemptsRaw = String(formData.get('max_attempts') ?? '');
  const maxAttempts = maxAttemptsRaw ? Number(maxAttemptsRaw) : null;
  const timeLimitRaw = String(formData.get('time_limit_minutes') ?? '');
  const timeLimitMinutes = timeLimitRaw ? Number(timeLimitRaw) : null;
  const requireJustification = formData.get('require_justification') === 'on';

  if (!courseId || !title) return;

  const { data: quiz } = await supabase
    .from('quizzes')
    .insert({
      course_id: courseId,
      title,
      description,
      pass_score: passScore,
      due_at: dueAt,
      max_attempts: maxAttempts,
      time_limit_minutes: timeLimitMinutes,
      require_justification: requireJustification,
    })
    .select('id')
    .single();

  revalidatePath(`/cursos/${slug}`);
  revalidatePath(`/cursos/${slug}/examenes`);

  if (quiz) {
    redirect(`/cursos/${slug}/examenes/${quiz.id}/editar`);
  }
}

export async function updateQuiz(formData: FormData) {
  const supabase = await createClient();
  const quizId = String(formData.get('quiz_id') ?? '');
  const slug = String(formData.get('slug') ?? '');
  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim() || null;
  const passScore = Number(formData.get('pass_score') ?? 60) || 60;
  const dueAtRaw = String(formData.get('due_at') ?? '');
  const dueAt = dueAtRaw ? new Date(dueAtRaw).toISOString() : null;
  const maxAttemptsRaw = String(formData.get('max_attempts') ?? '');
  const maxAttempts = maxAttemptsRaw ? Number(maxAttemptsRaw) : null;
  const timeLimitRaw = String(formData.get('time_limit_minutes') ?? '');
  const timeLimitMinutes = timeLimitRaw ? Number(timeLimitRaw) : null;
  const requireJustification = formData.get('require_justification') === 'on';

  if (!quizId || !title) return;

  await supabase
    .from('quizzes')
    .update({
      title,
      description,
      pass_score: passScore,
      due_at: dueAt,
      max_attempts: maxAttempts,
      time_limit_minutes: timeLimitMinutes,
      require_justification: requireJustification,
    })
    .eq('id', quizId);

  revalidatePath(`/cursos/${slug}`);
  revalidatePath(`/cursos/${slug}/examenes`);
  revalidatePath(`/cursos/${slug}/examenes/${quizId}/editar`);
}

export async function deleteQuiz(formData: FormData) {
  const supabase = await createClient();
  const quizId = String(formData.get('quiz_id') ?? '');
  const slug = String(formData.get('slug') ?? '');
  if (!quizId) return;

  await supabase.from('quizzes').delete().eq('id', quizId);
  revalidatePath(`/cursos/${slug}`);
  revalidatePath(`/cursos/${slug}/examenes`);
  redirect(`/cursos/${slug}/examenes`);
}
