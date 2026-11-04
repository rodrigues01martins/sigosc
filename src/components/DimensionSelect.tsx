import React from 'react';
import { ArrowRight } from 'lucide-react';
import { BrandWordmark } from './ui/BrandWordmark';
import { LogoPlaceholder } from './ui/LogoPlaceholder';

export type Dimension = 'financeiro' | 'metas' | 'apuracao' | 'gestao';

interface DimensionSelectProps {
  isAdmin: boolean;
  onSelect: (dimension: Dimension) => void;
  onSignOut: () => void;
}

interface DimensionOptionProps {
  lines: string[];
  onClick: () => void;
}

const DimensionOption: React.FC<DimensionOptionProps> = ({ lines, onClick }) => (
  <button
    onClick={onClick}
    className="group w-full flex items-center justify-end gap-4 py-3 text-right transition-all"
  >
    <span className="font-bold text-lg leading-tight text-[#007770] group-hover:text-[#005f59] group-hover:translate-x-[-4px] transition-all">
      {lines.map((line, i) => (
        <React.Fragment key={i}>
          {i > 0 && <br />}
          {line}
        </React.Fragment>
      ))}
    </span>
    <span className="shrink-0 w-11 h-11 rounded-full border-2 border-[#007770] flex items-center justify-center text-[#007770] transition-all group-hover:bg-[#007770] group-hover:text-white group-hover:scale-110">
      <ArrowRight size={20} />
    </span>
  </button>
);

export const DimensionSelect: React.FC<DimensionSelectProps> = ({ isAdmin, onSelect, onSignOut }) => {
  return (
    <div className="min-h-screen flex flex-col bg-white">

      {/* ── Seleção de dimensão ── */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-12 relative">
        <button
          onClick={onSignOut}
          className="absolute top-6 right-6 sm:top-8 sm:right-8 text-slate-400 hover:text-[#007770] text-sm font-bold transition-colors"
        >
          Sair
        </button>

        {/* ── Duas colunas 1:1 — placeholder da logo | botões de acesso.
             Abaixo de `sm` empilha: placeholder primeiro, botões depois. ── */}
        <div className="w-full max-w-3xl mx-auto flex-1 grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 content-center items-stretch">
          <LogoPlaceholder />

          <div className="min-w-0 flex flex-col justify-center divide-y divide-slate-100">
            <DimensionOption
              lines={['Acompanhamento', 'Financeiro']}
              onClick={() => onSelect('financeiro')}
            />
            <DimensionOption
              lines={['Monitoramento', 'e Avaliação']}
              onClick={() => onSelect('metas')}
            />
            {isAdmin && (
              <DimensionOption
                lines={['Gestão do', 'Aplicativo']}
                onClick={() => onSelect('gestao')}
              />
            )}
          </div>
        </div>

        {/* ── Marcas ── */}
        <div className="w-full max-w-sm mx-auto flex items-center justify-center pt-10">
          <BrandWordmark size="md" />
        </div>
      </div>
    </div>
  );
};
