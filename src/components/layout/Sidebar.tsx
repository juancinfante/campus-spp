import { Home, BookOpen, FileText, GraduationCap, LogOut } from 'lucide-react';
import { SidebarLink } from './SidebarLink';
import { signOut } from '@/app/auth/actions';
import { BRAND_NAME } from '@/lib/brand';

export function Sidebar({
  fullName,
  role,
  onNavigate,
}: {
  fullName: string;
  role: 'student' | 'teacher' | 'admin';
  onNavigate?: () => void;
}) {
  return (
    <aside className="flex h-full w-64 flex-col border-r border-line bg-white">
      <div className="border-b border-line px-5 py-4">
        <span className="font-display text-lg font-semibold text-ink">{BRAND_NAME}</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        <SidebarLink href="/inicio" icon={Home} onClick={onNavigate}>
          Inicio
        </SidebarLink>
        <SidebarLink href="/cursos" icon={BookOpen} onClick={onNavigate}>
          Clases
        </SidebarLink>
        <SidebarLink href="/documentacion" icon={FileText} onClick={onNavigate}>
          Documentación
        </SidebarLink>
        <SidebarLink href="/calificaciones" icon={GraduationCap} onClick={onNavigate}>
          Calificaciones
        </SidebarLink>
      </nav>

      <div className="border-t border-line px-5 py-4">
        <p className="truncate text-sm font-medium text-ink">{fullName}</p>
        <p className="text-xs text-muted">
          {role === 'teacher' ? 'Profesor' : role === 'admin' ? 'Administrador' : 'Estudiante'}
        </p>
        <form action={signOut} className="mt-3">
          <button
            type="submit"
            className="flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-danger"
          >
            <LogOut size={14} />
            Salir
          </button>
        </form>
      </div>
    </aside>
  );
}
