'use client';

import { useActionState } from 'react';
import { updateCourse, deleteCourse, type EditCourseState } from './actions';
import { ConfirmButton } from '@/components/ui/ConfirmButton';
import { RichTextEditor } from '@/components/ui/RichTextEditor';

type Course = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  is_published: boolean;
};

const initialState: EditCourseState = undefined;
const FORM_ID = 'edit-course-form';

export function EditCourseForm({ course }: { course: Course }) {
  const [state, formAction, pending] = useActionState(updateCourse, initialState);

  return (
    <div className="space-y-5">
      {/* Un <form> no puede contener otro <form> (HTML no lo permite y
          React tira error de hidratación) — por eso el botón "Guardar
          cambios" vive afuera y se asocia a este form por id, y el
          form de "Eliminar" es un hermano, no un hijo. */}
      <form id={FORM_ID} action={formAction} className="space-y-5">
        <input type="hidden" name="course_id" value={course.id} />
        <input type="hidden" name="slug" value={course.slug} />

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-ink">
            Título
          </label>
          <input
            id="title"
            name="title"
            required
            defaultValue={course.title}
            className="mt-1.5 w-full rounded-md border border-line bg-paper px-3.5 py-2.5 text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink">Descripción</label>
          <div className="mt-1.5">
            <RichTextEditor name="description" defaultValue={course.description ?? ''} />
          </div>
        </div>

        <label className="flex items-center gap-2.5 text-sm text-ink">
          <input
            type="checkbox"
            name="is_published"
            defaultChecked={course.is_published}
            className="accent-[#0f8b6c]"
          />
          Publicada (visible para todos)
        </label>

        {state?.error && (
          <p role="alert" className="rounded-md bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
            {state.error}
          </p>
        )}
      </form>

      <div className="flex items-center justify-between border-t border-line pt-5">
        <button
          type="submit"
          form={FORM_ID}
          disabled={pending}
          className="rounded-md bg-teal px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-dark disabled:opacity-60"
        >
          {pending ? 'Guardando…' : 'Guardar cambios'}
        </button>

        <form action={deleteCourse}>
          <input type="hidden" name="course_id" value={course.id} />
          <ConfirmButton
            confirmText={`¿Eliminar "${course.title}"? Se borran también sus documentos, exámenes, inscripciones y calificaciones. No se puede deshacer.`}
            className="text-sm font-medium text-danger hover:underline"
          >
            Eliminar clase
          </ConfirmButton>
        </form>
      </div>
    </div>
  );
}
