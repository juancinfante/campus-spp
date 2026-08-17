'use client';

import { useActionState } from 'react';
import { createNewsPost, type NewsFormState } from './actions';
import { RichTextEditor } from '@/components/ui/RichTextEditor';

const initialState: NewsFormState = undefined;

export function NewsForm() {
  const [state, formAction, pending] = useActionState(createNewsPost, initialState);

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-lg border border-line bg-white p-5"
    >
      <p className="text-sm font-medium text-ink">Publicar una noticia</p>
      <input
        name="title"
        required
        placeholder="Título"
        className="w-full rounded-md border border-line bg-paper px-3.5 py-2 text-sm text-ink placeholder:text-muted focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
      />
      <RichTextEditor name="content" placeholder="Escribí el anuncio…" />

      {state?.error && (
        <p role="alert" className="rounded-md bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-teal px-4 py-2 text-sm font-medium text-white hover:bg-teal-dark disabled:opacity-60"
      >
        {pending ? 'Publicando…' : 'Publicar'}
      </button>
    </form>
  );
}
