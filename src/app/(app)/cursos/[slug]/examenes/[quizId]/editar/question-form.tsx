'use client';

import { useState } from 'react';
import { addQuestion } from './actions';

export function QuestionForm({ quizId, slug }: { quizId: string; slug: string }) {
  const [optionCount, setOptionCount] = useState(3);

  return (
    <form action={addQuestion} className="mt-4 space-y-4">
      <input type="hidden" name="quiz_id" value={quizId} />
      <input type="hidden" name="slug" value={slug} />

      <div>
        <label className="block text-sm font-medium text-ink">Pregunta</label>
        <input
          name="question_text"
          required
          className="mt-1.5 w-full rounded-md border border-line bg-paper px-3.5 py-2 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-ink">
          Opciones (marcá cuál es la correcta)
        </label>
        {Array.from({ length: optionCount }).map((_, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <input
              type="radio"
              name="correct_option"
              value={i}
              required
              className="accent-[#0f8b6c]"
            />
            <input
              type="text"
              name="option_text"
              required
              placeholder={`Opción ${i + 1}`}
              className="flex-1 rounded-md border border-line bg-paper px-3.5 py-2 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setOptionCount((n) => Math.min(n + 1, 6))}
          className="text-sm font-medium text-teal hover:underline"
        >
          + Agregar opción
        </button>
        {optionCount > 2 && (
          <button
            type="button"
            onClick={() => setOptionCount((n) => n - 1)}
            className="text-sm font-medium text-muted hover:underline"
          >
            − Quitar opción
          </button>
        )}
      </div>

      <button
        type="submit"
        className="rounded-md bg-teal px-4 py-2 text-sm font-medium text-white hover:bg-teal-dark"
      >
        Agregar pregunta
      </button>
    </form>
  );
}
