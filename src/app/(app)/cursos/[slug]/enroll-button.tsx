'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { enroll } from '../actions';

export function EnrollButton({ courseId, slug }: { courseId: string; slug: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await enroll(courseId, slug);
          router.refresh();
        })
      }
      className="rounded-md bg-teal px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-dark disabled:opacity-60"
    >
      {pending ? 'Inscribiendo…' : 'Inscribirme'}
    </button>
  );
}
