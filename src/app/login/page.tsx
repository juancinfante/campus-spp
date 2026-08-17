import type { Metadata } from 'next';
import { AuthShell } from '@/components/auth/AuthShell';
import { LoginForm } from '@/components/auth/LoginForm';
import { BRAND_NAME } from '@/lib/brand';

export const metadata: Metadata = { title: `Iniciar sesión — ${BRAND_NAME}` };

export default function LoginPage() {
  return (
    <AuthShell title="" subtitle="">
      <LoginForm />
    </AuthShell>
  );
}
