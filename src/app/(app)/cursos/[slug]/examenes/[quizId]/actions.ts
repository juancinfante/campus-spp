'use server';

import { createClient } from '@/lib/supabase/server';

export type SubmitState = { error?: string; score?: number } | undefined;

export async function submitAttempt(
  _prevState: SubmitState,
  formData: FormData
): Promise<SubmitState> {
  const supabase = await createClient();
  const quizId = String(formData.get('quiz_id'));
  const attemptIdRaw = formData.get('attempt_id');
  const attemptId = attemptIdRaw ? String(attemptIdRaw) : null;

  const answers: {
    question_id: string;
    selected_option_id: string;
    justification: string | null;
  }[] = [];

  for (const [key, value] of formData.entries()) {
    if (key.startsWith('answer__')) {
      const questionId = key.replace('answer__', '');
      const justificationRaw = formData.get(`justification__${questionId}`);
      answers.push({
        question_id: questionId,
        selected_option_id: String(value),
        justification: justificationRaw ? String(justificationRaw).trim() || null : null,
      });
    }
  }

  // Toda la validación (inscripción, fecha límite, intentos, tiempo
  // restante si es cronometrado, corrección) vive en la función
  // submit_quiz_attempt() — acá solo empaquetamos las respuestas.
  const { data, error } = await supabase.rpc('submit_quiz_attempt', {
    p_quiz_id: quizId,
    p_answers: answers,
    p_attempt_id: attemptId,
  });

  if (error) {
    return { error: error.message };
  }

  return { score: data?.[0]?.score ?? undefined };
}
