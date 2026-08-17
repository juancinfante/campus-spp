'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { submitAttempt, type SubmitState } from './actions';

type Option = { id: string; option_text: string };
type Question = { id: string; question_text: string; quiz_options: Option[] };

const initialState: SubmitState = undefined;

const EXIT_WARNING =
  'Si salís ahora, el examen se entrega con lo que ya respondiste — el resto queda en blanco. ¿Salir igual?';

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function QuizForm({
  quizId,
  courseSlug,
  questions,
  requireJustification = false,
  attemptId,
  initialRemainingSeconds,
}: {
  quizId: string;
  courseSlug: string;
  questions: Question[];
  requireJustification?: boolean;
  attemptId?: string;
  initialRemainingSeconds?: number;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const leavingRef = useRef(false);
  const [state, formAction, pending] = useActionState(submitAttempt, initialState);
  const isTimed = attemptId != null && initialRemainingSeconds != null;
  const isDone = state?.score !== undefined;
  const [remaining, setRemaining] = useState(initialRemainingSeconds ?? 0);
  const [expired, setExpired] = useState(isTimed && (initialRemainingSeconds ?? 0) <= 0);

  // El servidor es la autoridad real (submit_quiz_attempt revalida el
  // tiempo transcurrido igual). Este contador es solo para mostrar y
  // para bloquear la entrega en el momento en que se cumple el plazo.
  useEffect(() => {
    if (!isTimed || expired) return;
    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          setExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isTimed, expired]);

  // Avisar antes de salir mientras hay un examen cronometrado en
  // curso: entrega lo que ya está contestado y deja en blanco (sin
  // opción elegida) lo que no. Solo aplica a exámenes con tiempo
  // límite — "si tiene un tiempo límite" fue la condición pedida.
  useEffect(() => {
    if (!isTimed || expired || isDone) return;

    async function submitPartialAndGo(navigate: () => void) {
      if (leavingRef.current) return;
      leavingRef.current = true;
      if (formRef.current) {
        try {
          await submitAttempt(undefined, new FormData(formRef.current));
        } catch {
          // Si falla la entrega igual dejamos salir — no tiene sentido
          // trabar a la persona en esta pantalla.
        }
      }
      navigate();
    }

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      // Cerrar la pestaña / refrescar / escribir otra URL: el navegador
      // no deja mostrar un mensaje propio ni esperar una entrega async
      // con garantías, así que esto es un aviso "mejor esfuerzo" (el
      // click-away y el botón atrás, más abajo, sí entregan de verdad).
      e.preventDefault();
      e.returnValue = '';
    }

    function handleClick(e: MouseEvent) {
      if (leavingRef.current) return;
      const link = (e.target as HTMLElement)?.closest('a');
      if (!link) return;
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:')) return;

      e.preventDefault();
      e.stopImmediatePropagation();

      if (window.confirm(EXIT_WARNING)) {
        submitPartialAndGo(() => {
          window.location.href = href;
        });
      }
    }

    function handlePopState() {
      if (leavingRef.current) return;
      // Cancela visualmente el "atrás" hasta que la persona confirme.
      window.history.pushState(null, '', window.location.href);
      if (window.confirm(EXIT_WARNING)) {
        submitPartialAndGo(() => {
          router.push(`/cursos/${courseSlug}`);
        });
      }
    }

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleClick, true);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isTimed, expired, isDone, courseSlug, router]);

  if (isDone) {
    return (
      <div className="rounded-lg border border-line bg-white p-8 text-center">
        <p className="text-sm font-medium text-teal">Examen entregado</p>
        <p className="mt-2 font-display text-4xl text-ink">{state?.score}%</p>
        <Link
          href={`/cursos/${courseSlug}`}
          className="mt-6 inline-block rounded-md border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-line/40"
        >
          Volver a la clase
        </Link>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="rounded-lg border border-line bg-white p-8 text-center">
        <p className="font-display text-lg text-ink">Se acabó el tiempo</p>
        <p className="mt-1.5 text-sm text-muted">
          Este intento no se guardó. Si te quedan intentos disponibles, podés volver a entrar al
          examen para empezar uno nuevo.
        </p>
        <Link
          href={`/cursos/${courseSlug}`}
          className="mt-6 inline-block rounded-md border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-line/40"
        >
          Volver a la clase
        </Link>
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-8">
      <input type="hidden" name="quiz_id" value={quizId} />
      {attemptId && <input type="hidden" name="attempt_id" value={attemptId} />}

      {isTimed && (
        <div
          className={`sticky top-[60px] z-10 flex items-center justify-between rounded-md border px-4 py-2.5 text-sm font-medium ${
            remaining <= 60
              ? 'border-danger/30 bg-danger/10 text-danger'
              : 'border-line bg-white text-ink'
          }`}
        >
          <span>Tiempo restante</span>
          <span className="font-display text-lg tabular-nums">{formatTime(remaining)}</span>
        </div>
      )}

      {questions.map((q, i) => (
        <fieldset key={q.id} className="space-y-3">
          <legend className="font-medium text-ink">
            {i + 1}. {q.question_text}
          </legend>
          <div className="space-y-2">
            {q.quiz_options.map((opt) => (
              <label
                key={opt.id}
                className="flex cursor-pointer items-center gap-2.5 rounded-md border border-line px-3.5 py-2.5 text-sm text-ink transition-colors has-[:checked]:border-teal has-[:checked]:bg-teal/5"
              >
                <input
                  type="radio"
                  name={`answer__${q.id}`}
                  value={opt.id}
                  required
                  className="accent-[#0f8b6c]"
                />
                {opt.option_text}
              </label>
            ))}
          </div>
          {requireJustification && (
            <textarea
              name={`justification__${q.id}`}
              rows={2}
              placeholder="Justificá o desarrollá tu respuesta (opcional)"
              className="w-full rounded-md border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
            />
          )}
        </fieldset>
      ))}

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
        {pending ? 'Enviando…' : 'Entregar examen'}
      </button>
    </form>
  );
}
