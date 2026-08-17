import { GraduationCap } from 'lucide-react';

// Placeholder prolijo mientras no haya una foto institucional real.
// Para reemplazarlo: sacá este componente de la landing y poné
// <Image src="/hero.jpg" alt="..." fill className="rounded-2xl object-cover" />
// apuntando a un archivo que agregues en /public/hero.jpg — el resto
// del layout (tamaño, bordes redondeados) no necesita cambios.
export function HeroGraphic() {
  return (
    <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl bg-ink">
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, transparent, transparent 22px, currentColor 22px, currentColor 23px)',
          color: '#ffffff',
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-teal text-paper">
          <GraduationCap size={44} />
        </div>
      </div>
    </div>
  );
}
