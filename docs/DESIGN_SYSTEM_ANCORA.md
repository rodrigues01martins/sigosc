# ÂNCORA — Design System do app "Programa Aprendiz do Futuro" (SEDS/GO)

> **Como usar este arquivo:** cole-o inteiro no início de um novo chat e diga
> "Use este documento como referência obrigatória de design para tudo o que
> construirmos." Ele descreve o sistema de design **real**, extraído do código
> em produção (`src/index.css`, `src/components/ui/`, `src/components/monitor/ui/`).
> Não invente tokens, cores ou componentes fora do que está aqui sem avisar.

---

## 1. Contexto do produto

- **App:** SMA — Aprendiz (título da aba: `SMA-TC-RIOVERDE`), idioma `pt-BR`.
- **Órgão:** Secretaria de Estado de Desenvolvimento Social de Goiás (SEDS/GO).
- **Público:** equipe técnica/gestora (desktop-first, mas responsivo).
- **4 dimensões** escolhidas após o login (`DimensionSelect`):
  1. Acompanhamento Financeiro
  2. Monitoramento e Avaliação
  3. Apuração Mensal
  4. Gestão do Aplicativo (só administradores)
- **Tom visual:** institucional, sóbrio, limpo; verde-petróleo como cor de marca,
  laranja como acento, fundos claros, cantos arredondados, sombras suaves.

## 2. Stack que o design pressupõe

| Item | Uso |
|---|---|
| React 19 + Vite 6 | Base |
| TypeScript (`.tsx`) + JavaScript (`.jsx`) | TSX no lado "nativo"; JSX no lado "monitor" |
| Tailwind CSS v4 (`@import "tailwindcss"`) | Estilização do lado "nativo" |
| Estilo inline + variáveis CSS | Estilização do lado "monitor" |
| `lucide-react` | **Única** biblioteca de ícones |
| `motion/react` | Animação de entrada de modais nativos |
| Chart.js (`react-chartjs-2`) e Recharts | Gráficos |
| Leaflet | Mapa de municípios |
| ExcelJS / impressão nativa do navegador | Exportação Excel / PDF |

**Regra:** não adicionar novas bibliotecas de UI (sem shadcn, MUI, Radix, Floating UI etc.).

## 3. Dois Design Systems lado a lado (IMPORTANTE)

O app tem **dois conjuntos de componentes paralelos**, por histórico de portabilidade.
Use o do módulo em que você está trabalhando — **nunca misture os dois na mesma tela**.

| | **Nativo** | **Monitor** |
|---|---|---|
| Pasta | `src/components/ui/` | `src/components/monitor/ui/` |
| Linguagem | TypeScript (`.tsx`) | JavaScript (`.jsx`) |
| Estilo | Classes Tailwind + tokens `--native-*` | `style={{...}}` inline + tokens `--brand-*`, `--bg-*`, `--text-*`, `--status-*` |
| Onde | Financeiro, Gestão do Aplicativo, shell (Header, login, seleção) | Apuração Mensal, Monitoramento e Avaliação (formulários, painéis, Painel Geral) |
| Canvas | `#F8FAFC` (`bg-[#f8fafc]`) | `#FFFBE6` (`--bg-canvas`) ou `#F8FAFC` quando dentro do shell |

## 4. Tokens (definidos em `src/index.css`, `:root`)

### 4.1 Tokens do lado Monitor

**Marca**
| Token | Valor | Uso |
|---|---|---|
| `--brand-primary` | `#007770` | Cor principal (botões, links, destaque) |
| `--brand-secondary` | `#37966F` | Verde secundário |
| `--brand-light` | `#B9E4C9` | Bordas de marca, spinner |
| `--brand-subtle` | `#F0FAF5` | Fundos suaves de marca |
| `--brand-orange` | `#FD5523` | Acento / alerta visual |
| `--brand-warm` | `#FFFBE6` | Fundo creme |

**Superfícies e texto**
| Token | Valor |
|---|---|
| `--bg-canvas` | `#FFFBE6` |
| `--bg-surface` | `#FFFFFF` |
| `--bg-subtle` | `#F0FAF5` |
| `--text-primary` | `#1A1A1A` |
| `--text-secondary` | `#4B5563` |
| `--text-muted` | `#6B7280` |
| `--text-on-brand` | `#FFFFFF` |
| `--border-default` | `#E5E7EB` |
| `--border-brand` | `#B9E4C9` |
| `--border-strong` | `#D1D5DB` |

**Status (sempre em trio texto/fundo/borda)**
| Status | `-text` | `-bg` | `-border` |
|---|---|---|---|
| `--status-success-*` | `#166534` | `#F0FDF4` | `#BBF7D0` |
| `--status-warning-*` | `#9A3412` | `#FFF7ED` | `#FED7AA` |
| `--status-danger-*` | `#DC2626` | `#FEF2F2` | `#FECACA` |
| `--status-info-*` | `#7C3AED` | `#F5F3FF` | `#DDD6FE` |

**Gráficos**
| Token | Valor |
|---|---|
| `--chart-1` | `#356859` |
| `--chart-2` | `#FD5523` |
| `--chart-3` | `#7C3AED` |
| `--chart-4` | `#2563EB` |
| `--chart-5` | `#0F766E` |
| `--chart-6` | `#DC2626` |
| `--chart-axis` | `#6B7280` |
| `--chart-grid` | `#E5E7EB` |

**Raio, movimento, fonte**
| Token | Valor |
|---|---|
| `--radius-xs` / `-sm` / `-md` / `-lg` / `-full` | `4px` / `8px` / `12px` / `16px` / `999px` |
| `--motion-fast` / `-normal` / `-slow` | `150ms` / `200ms` / `300ms` |
| `--font-family` | `'Roboto Flex', ui-sans-serif, system-ui, sans-serif` |

**Aliases legados** (existem, não usar em código novo): `--bg`, `--surface`, `--surface2`,
`--border`, `--accent`, `--accent2`, `--accent3`, `--warn`, `--danger`, `--success`, `--text`, `--text-dim`.

### 4.2 Tokens do lado Nativo

| Token | Valor | Uso |
|---|---|---|
| `--native-primary` | `#007770` | Botão primário, aba ativa, ícones de destaque |
| `--native-primary-hover` | `#005F59` | Hover do primário |
| `--native-primary-light` | `#F0FAF5` | Fundo da caixa de ícone do PageHeader |
| `--native-focus` | `var(--native-primary)` | Anel de foco |
| `--native-canvas` | `#F8FAFC` | Fundo da página |
| `--native-surface` | `#FFFFFF` | Cards/modais |
| `--native-text-heading` | `#1E293B` | ≈ `slate-800` |
| `--native-text-body` | `#475569` | ≈ `slate-600` |
| `--native-text-muted` | `#94A3B8` | ≈ `slate-400` |
| `--native-border` | `#E2E8F0` | ≈ `slate-200` |
| `--native-border-subtle` | `#F1F5F9` | ≈ `slate-100` |
| `--native-success` | `#059669` | |
| `--native-warning-bg` / `-text` | `#FCD951` / `#7A5C00` | Amarelo institucional |
| `--native-danger` | `#DC2626` | |
| `--native-info` | `#2563EB` | |

Uso no Tailwind v4: `bg-[var(--native-primary)]`, `text-[var(--native-danger)]`,
`ring-[var(--native-focus)]`. Na paleta neutra, usar a escala `slate-*` do Tailwind.

> Legado: telas antigas do Financeiro ainda têm `#007770`, `#005f59` e `#FCD951` fixos
> no className. Em código novo, prefira os tokens.

### 4.3 Animações globais
```css
@keyframes spin   { to { transform: rotate(360deg); } }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
```

## 5. Tipografia

- **Fonte única:** Roboto Flex (Google Fonts, eixos `opsz,wght@8..144,100..1000`).
- **Nativo (Tailwind):**
  - Título de página: `text-xl font-bold text-slate-800`
  - Descrição: `text-sm text-slate-500`
  - Label de campo: `text-xs font-bold text-slate-500 uppercase tracking-wide`
  - Label de KPI: `text-xs font-semibold text-slate-500`; valor `text-xl`/`text-2xl font-bold`
  - Badge: `text-[11px] font-bold`
- **Monitor (inline):**
  - Label de KPI: `12px / 700 / uppercase / letterSpacing .08em / --text-muted`
  - Valor de KPI: `28px / 700`
  - Label de input: `12px / 600 / --text-secondary`
  - Botão: `13px` (sm) · `14px` (md) · `15px` (lg), peso 600
  - Badge: `12px / 600`
  - Tooltip: `12px / 600`
- Pesos usados: 400, 500, 600, 700. Evite 800+.

## 6. Espaçamento, raio e elevação

- Grade de 4px. Paddings típicos: card 16–24px (`p-4`/`p-6`), modal `px-6 py-5`.
- Raio nativo: `rounded-xl` (botões, inputs, abas) e `rounded-2xl` (cards, modais, toast).
- Raio monitor: `--radius-sm` (botões/inputs), `--radius-md` (cards), `--radius-lg` (modais), `--radius-full` (badges).
- Sombras nativas: `shadow-sm` (cards), `shadow-lg` (botão primário/aba ativa), `shadow-2xl` (modais/toast).
- Largura máxima: shell `max-w-[1440px]`; conteúdo `max-w-7xl mx-auto`, padding `p-4 md:p-8`.

## 7. Catálogo de componentes — Nativo (`src/components/ui/`)

### Button (`Button.tsx`)
```tsx
<Button variant="primary|secondary|danger|ghost" size="sm|md|lg" loading type="button">Salvar</Button>
```
- Base: `inline-flex items-center justify-center gap-2 rounded-xl font-bold whitespace-nowrap transition-all`, foco `focus-visible:ring-2 ring-[var(--native-focus)] ring-offset-2`, `disabled:opacity-50`.
- primary: `bg-[var(--native-primary)] text-white shadow-lg hover:bg-[var(--native-primary-hover)]`
- secondary: `bg-white text-slate-600 border border-slate-200 hover:bg-slate-50`
- danger: `bg-[var(--native-danger)] text-white hover:bg-red-700`
- ghost: `bg-transparent text-slate-500 hover:bg-slate-100`
- Tamanhos: sm `h-9 px-4 text-xs` · md `h-11 px-6 text-sm` · lg `h-12 px-8 text-base`.
- `loading` mostra spinner branco e desabilita. `type` padrão = `button`.

### FormField (`FormField.tsx`) — `TextInput`, `Select`, `Textarea`
```tsx
<TextInput label="Nome" helperText="..." error="..." variant="outlined|filled" id="nome" />
```
- Controle: `w-full rounded-xl p-3 text-sm outline-none`; filled `bg-slate-50 border-none`; outlined `bg-white border border-slate-200`.
- Erro: borda danger + `<p role="alert">` + `aria-invalid` + `aria-describedby`.
- **Não usa `forwardRef`** (não é possível dar foco programático no input).

### Badge (`Badge.tsx`)
`variant`: `neutral | primary | success | warning | danger`; prop `icon`.
Classe base: `inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold`.

### Card e KpiCard (`Card.tsx`)
```tsx
<Card padded>...</Card>   // bg-white border border-slate-100 rounded-2xl shadow-sm p-6
<KpiCard label="Total" value="R$ 1.234,56" description="..." tone="neutral|muted|primary|success|warning|danger" compact onClick={fn} selected />
```
- Com `onClick` vira botão acessível (`role="button"`, `tabIndex=0`, Enter/Espaço, `aria-pressed`); selecionado = borda + anel primário (não só cor).
- Hover: `-translate-y-0.5 shadow-md`.

### PageHeader (`PageHeader.tsx`)
`icon`, `title`, `description`, `actions`. Ícone dentro de `bg-[var(--native-primary-light)] p-2.5 rounded-xl text-[var(--native-primary)]`.

### EmptyState (`EmptyState.tsx`)
`icon` (padrão lucide `Inbox` 32px), `title`, `description`, `action`.

### Padrão de modal nativo (não há componente genérico — replicar o padrão)
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="titulo-id">
  <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !enviando && onClose()} />
  <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative z-10 flex flex-col">
    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between"> {/* ícone + título + botão X */}</div>
    <div className="p-6">...</div>
    <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">{/* Cancelar (secondary) + Confirmar (primary/danger) */}</div>
  </div>
</div>
```
- Modal empilhado sobre outro: `z-[60]`. Modais como `EditModal`/`DespesaDetail` e o `Toast` animam a entrada com `motion/react`.
- Erro dentro do modal: `<p role="alert" className="text-sm text-[var(--native-danger)] bg-red-50 border border-red-100 rounded-xl px-3 py-2">`.

### Toast (padrão)
`fixed bottom-8 right-8 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-sm font-medium z-50`, com `role="status" aria-live="polite"`.

### Abas do Financeiro (padrão)
Ativa: `px-6 py-2.5 rounded-xl font-bold bg-[#007770] text-white shadow-lg`; inativa: `bg-white text-[#007770] border`.

### Formulário de despesa (legado Financeiro)
Labels `text-[14px] uppercase tracking-wider font-bold text-[#007770]` com ícone lucide; inputs `bg-slate-50 border-none rounded-xl p-3.5`.

## 8. Catálogo de componentes — Monitor (`src/components/monitor/ui/`)

| Componente | API / características |
|---|---|
| `Button.jsx` | `variant`: `primary \| secondary \| ghost \| destructive`; `size`: `sm` 32px/13px · `md` 40px/14px · `lg` 48px/15px; `iconLeft`, `iconRight`, `loading`; raio `--radius-sm`. Hover primary `#005f59`, destructive `#b91c1c`. Secondary = branco, texto marca, borda `--border-brand`. |
| `Badge.jsx` | `variant`: `neutral \| brand \| success \| warning \| danger \| info` (usa trio de status); altura 24px, `padding 0 12px`, `--radius-full`, 12px/600. |
| `Input.jsx` | Exporta `Input`, `MonthInput`, `Select`. Altura 40px, `--radius-sm`, label 12px/600. Foco: borda `--brand-primary` + `box-shadow: 0 0 0 3px rgba(53,104,89,0.12)`. Erro: borda `--status-danger-border`. `Select` com chevron SVG próprio. |
| `KpiCard.jsx` | `label` (aceita JSX), `value`, `sub`, `color`: `blue \| green \| teal \| purple \| warn \| danger`, `icon`, `onDetails`, `detailsLabel='Ver detalhes →'`. Barra colorida de 4px no topo, `overflow: hidden`, `--radius-md`, padding 20px. Com `onDetails` vira acionável (clique + Enter/Espaço). |
| `Loader.jsx` | Spinner (borda `--brand-light`, topo `--brand-primary`) + `message`. |
| `EmptyState.jsx` | Ícone SVG padrão, `title='Nenhum dado encontrado'`, `description`. |
| `AutosaveStatus.jsx` | Estados `dirty \| saving \| saved \| error`, sempre ícone + texto, `aria-live="polite"`. |
| `Tooltip.jsx` | Portal no `body`, `position: fixed`, abre por hover/foco/clique, fecha com Esc, reposiciona em scroll/resize; balão `#0f172a`, 12px/600, `maxWidth 240`, `zIndex 9999`; gatilho com sublinhado pontilhado e `cursor: help`; `className="no-print"`. |
| `IndicatorDrilldown.jsx` | Modal de detalhamento (`zIndex 60`, `maxWidth 760`, `--radius-lg`), `titulo` **string** (vai para `aria-label`), estados carregando/erro/vazio. Blocos exportados: `DrilldownComposicao`, `DrilldownFormula`, `DrilldownLista` ("Mostrar mais", 50 por vez), `DrilldownCriterios`. |

**Tooltip de sigla de indicador** (`src/features/indicators-general/IndicatorTooltip.jsx`):
```jsx
<IndicatorTooltip code="PVP" />   // mostra "PVP" com tooltip "Percentual de Vagas Preenchidas"
```
Fonte única dos nomes: `INDICATOR_CATALOG` (44 indicadores). Sigla desconhecida → texto simples,
nunca nome inventado. Não aplicar em siglas administrativas (OSC, EAD, PDF).

## 9. Padrões de conteúdo e estado

- **Situação de indicador** (Painel Geral): Atingida `#059669` · Não atingida `#DC2626` · Não apurado `#94A3B8` · Não aplicável `#64748B` — sempre com texto junto.
- **Estados obrigatórios** de qualquer tela com dados: carregando (`Loader`), erro, vazio (`EmptyState`), com dados.
- **Moeda:** máscara BRL (milhar `.`, decimal `,`) via `src/lib/currency.ts` + hook `useCurrencyInput` (`{...fieldProps}`, `inputMode="decimal"`, `reset()`).
- **Datas/números:** formato brasileiro (`toLocaleString('pt-BR')`), competência `MM/AAAA`.
- **Textos:** sempre em português do Brasil, frases curtas, sem jargão técnico para o usuário final.
- **Navegação do Monitoramento:** grupos "Formulários" e "Painéis" (Painel Geral de Indicadores primeiro); grupo com 1 item liberado vira acesso direto.
- **Acesso restrito:** tela centralizada com ícone 🔒, "Acesso restrito" + explicação.

## 10. Shell e identidade

- **Header** (`Header.tsx`): `bg-white border-b border-slate-200 sticky top-0 z-30`, altura `h-24`, identidade textual `<BrandWordmark size="lg" />` ("SIGESC", 600, uppercase, `--native-primary`; substitui o antigo logo PNG), links `text-sm font-medium text-slate-700 hover:text-[#007770]`, botão "Sair" primário.
- **Seleção de dimensão** (`DimensionSelect.tsx`): coluna única centralizada, opções alinhadas à direita em `text-lg font-bold text-[#007770]` com círculo `w-11 h-11 border-2 border-[#007770]` + `ArrowRight`; hover preenche o círculo de verde; logo no rodapé.

## 11. Impressão / PDF

```css
@media print {
  header { display: none !important; }
  .no-print { display: none !important; }
  .relatorio-geral .ficha-indicador { break-inside: avoid; }
  .relatorio-geral .quebra-pagina   { break-before: page; }
  .relatorio-geral thead            { display: table-header-group; }
  .relatorio-geral                  { color: #000 !important; }
  .relatorio-geral *                { box-shadow: none !important; }
}
@page { size: A4 portrait; margin: 15mm; }
```
- Botões, tooltips e controles interativos levam `className="no-print"`.
- Relatórios usam impressão nativa (`window.print()`), sem gerar PDF por biblioteca.

## 12. Acessibilidade (regras obrigatórias)

1. Status **nunca só por cor** — sempre texto e/ou ícone.
2. Modais: `role="dialog"` + `aria-modal="true"` + rótulo; foco no botão de fechar ao abrir; devolver o foco ao elemento anterior ao fechar; `Esc` fecha; bloquear fechamento durante envio.
3. Elementos clicáveis que não são `<button>`: `role="button"`, `tabIndex={0}`, Enter/Espaço.
4. Foco visível: `focus-visible:ring-2` (nativo) ou borda + sombra de marca (monitor).
5. Mensagens de erro com `role="alert"`; feedback assíncrono com `aria-live="polite"`.
6. Imagens decorativas com `alt=""`; logos com `alt` descritivo.

## 13. Convenções de código

- **Sem `@types/react`:** componentes declaram props explicitamente (`[key: string]: any` para repasse); não estender `React.ButtonHTMLAttributes`/`HTMLAttributes`.
- Lado nativo: TSX + Tailwind; lado monitor: JSX + `style={{}}` com `var(--token)`.
- Reutilizar componentes existentes antes de criar novos; não criar fórmulas/cálculos paralelos na UI.
- Ícones apenas de `lucide-react` (nativo) ou SVG inline (monitor).
- Validação: `npm run lint` (`tsc --noEmit`) e `npm run build` devem passar.
- Nunca colocar segredos no frontend nem usar prefixo `VITE_` para chaves privadas.

## 14. Checklist rápido para uma nova tela

- [ ] Estou no módulo certo e usando **um só** Design System?
- [ ] Cores vêm de tokens (`--native-*` ou `--brand-*/--status-*`), não de hex solto?
- [ ] Tipografia Roboto Flex e tamanhos do item 5?
- [ ] Estados carregando / erro / vazio / com dados?
- [ ] Status com texto além da cor?
- [ ] Modal com foco, Esc e `aria-modal`?
- [ ] Elementos interativos com `no-print` quando a tela é imprimível?
- [ ] Textos em pt-BR, moeda BRL, datas brasileiras?
