'use client';

import { type ReactNode } from 'react';

// Botón de submit que pide confirmación antes de disparar la acción.
// Si le pasás formAction, sobreescribe la acción del <form> que lo
// contiene (útil para tener "Guardar" y "Eliminar" en el mismo form).
export function ConfirmButton({
  confirmText,
  formAction,
  className,
  children,
}: {
  confirmText: string;
  formAction?: (formData: FormData) => void | Promise<void>;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      formAction={formAction}
      onClick={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
      className={className}
    >
      {children}
    </button>
  );
}
