import React from 'react';

// Identidade textual do sistema (SIGOSC-EV-001): substitui os logotipos PNG
// exibidos como marca. Usa a fonte padrão do app (herdada do body — Roboto
// Flex) e o token de verde primário do lado "nativo" (--native-primary).
//
// Tamanhos acompanham a altura dos logotipos substituídos:
//   md → h-9  (Login, seleção de dimensão)
//   lg → h-10 (Header)

export type BrandWordmarkSize = 'md' | 'lg';

const sizes: Record<BrandWordmarkSize, string> = {
  md: 'h-9 text-2xl',
  lg: 'h-10 text-2xl md:text-[1.75rem]',
};

interface BrandWordmarkProps {
  size?: BrandWordmarkSize;
  className?: string;
}

export const BrandWordmark: React.FC<BrandWordmarkProps> = ({ size = 'md', className = '' }) => (
  <span
    role="img"
    aria-label="SIGESC"
    className={`inline-flex items-center leading-none uppercase font-semibold tracking-wide whitespace-nowrap select-none text-[var(--native-primary)] ${sizes[size]} ${className}`}
  >
    SIGESC
  </span>
);
