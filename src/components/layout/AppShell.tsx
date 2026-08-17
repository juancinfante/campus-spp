import { type ReactNode } from 'react';
import { AppShellChrome } from './AppShellChrome';

export function AppShell({
  fullName,
  role,
  children,
}: {
  fullName: string;
  role: 'student' | 'teacher' | 'admin';
  children: ReactNode;
}) {
  return (
    <AppShellChrome fullName={fullName} role={role}>
      {children}
    </AppShellChrome>
  );
}
