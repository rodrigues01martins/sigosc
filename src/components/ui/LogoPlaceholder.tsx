import React from 'react';
import { Image } from 'lucide-react';

// Espaço reservado para a futura logomarca da organização (SIGOSC-EV-003).
// Exclusivamente visual: não é clicável e não faz upload — quando a logo
// existir, basta trocar este componente pela imagem.

interface LogoPlaceholderProps {
  className?: string;
}

export const LogoPlaceholder: React.FC<LogoPlaceholderProps> = ({ className = '' }) => (
  <div
    role="img"
    aria-label="Espaço reservado para a logomarca da organização"
    className={`w-full h-full min-h-[180px] sm:min-h-[220px] flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-dashed border-slate-300 bg-[var(--native-canvas)] text-center ${className}`}
  >
    <span
      aria-hidden="true"
      className="w-14 h-14 rounded-full bg-[var(--native-primary-light)] flex items-center justify-center text-[var(--native-primary)]"
    >
      <Image size={28} />
    </span>
    <span className="text-lg font-semibold leading-tight text-[var(--native-primary)]">
      Inclua a sua Logo
    </span>
  </div>
);
