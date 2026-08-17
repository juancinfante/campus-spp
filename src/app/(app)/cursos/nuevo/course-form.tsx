'use client';

import { useActionState } from 'react';
import { createCourse, type CourseFormState } from '../actions';
import { RichTextEditor } from '@/components/ui/RichTextEditor';

const initialState: CourseFormState = undefined;

export function CourseForm() {
  const [state, formAction, pending] = useActionState(createCourse, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-ink">
          Título
        </label>
        <input
          id="title"
          name="title"
          required
          className="mt-1.5 w-full rounded-md border border-line bg-paper px-3.5 py-2.5 text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
          placeholder="Introducción a SQL"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink">Descripción</label>
        <div className="mt-1.5">
          <RichTextEditor
            name="description"
            placeholder="De qué se trata la clase, a quién está dirigida…"
          />
        </div>
      </div>

      <label className="flex items-center gap-2.5 text-sm text-ink">
        <input type="checkbox" name="is_published" className="accent-[#0f8b6c]" />
        Publicar ahora (si no, queda como borrador y solo vos la ves)
      </label>

      {state?.error && (
        <p role="alert" className="rounded-md bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-teal px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-dark disabled:opacity-60"
      >
        {pending ? 'Creando…' : 'Crear clase'}
      </button>
    </form>
  );
}
