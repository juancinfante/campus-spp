'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function addQuestion(formData: FormData) {
  const supabase = await createClient();
  const quizId = String(formData.get('quiz_id') ?? '');
  const slug = String(formData.get('slug') ?? '');
  const questionText = String(formData.get('question_text') ?? '').trim();
  const correctIndex = String(formData.get('correct_option') ?? '');
  const optionTexts = formData.getAll('option_text').map((v) => String(v).trim());

  if (!quizId || !questionText || optionTexts.length < 2) return;

  const { data: question, error } = await supabase
    .from('quiz_questions')
    .insert({ quiz_id: quizId, question_text: questionText, position: 0 })
    .select('id')
    .single();

  if (error || !question) return;

  const rows = optionTexts.map((text, i) => ({
    question_id: question.id,
    option_text: text,
    is_correct: String(i) === correctIndex,
    position: i,
  }));

  await supabase.from('quiz_options').insert(rows);

  revalidatePath(`/cursos/${slug}/examenes/${quizId}/editar`);
}

export async function deleteQuestion(formData: FormData) {
  const supabase = await createClient();
  const questionId = String(formData.get('question_id') ?? '');
  const slug = String(formData.get('slug') ?? '');
  const quizId = String(formData.get('quiz_id') ?? '');
  if (!questionId) return;

  await supabase.from('quiz_questions').delete().eq('id', questionId);
  revalidatePath(`/cursos/${slug}/examenes/${quizId}/editar`);
}
