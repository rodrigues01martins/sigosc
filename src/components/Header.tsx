import React from 'react';
import { Home } from 'lucide-react';
import { Button } from './ui/Button';
import { BrandWordmark } from './ui/BrandWordmark';

interface HeaderProps {
  showExportButton: boolean;
  onGoHome: () => void;
  onExportCSV: () => void;
  onSignOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({ showExportButton, onGoHome, onExportCSV, onSignOut }) => {
  return (
    <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-[1440px] mx-auto h-24 px-6 md:px-10 flex items-center justify-between gap-6">

        {/* ── Marcas ── */}
        <div className="flex items-center gap-4 shrink-0">
          <BrandWordmark size="lg" />
        </div>

        {/* ── Menu ── */}
        <nav className="flex items-center gap-8">
          <button
            onClick={onGoHome}
            title="Voltar para a seleção de dimensão"
            className="flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-[#007770] transition-colors whitespace-nowrap"
          >
            <Home size={16} />
            Início
          </button>
          {showExportButton && (
            <button
              onClick={onExportCSV}
              className="text-sm font-medium text-slate-700 hover:text-[#007770] transition-colors whitespace-nowrap"
            >
              Exportar registros
            </button>
          )}
          <Button onClick={onSignOut} className="rounded-lg">
            Sair
          </Button>
        </nav>
      </div>
    </header>
  );
};
