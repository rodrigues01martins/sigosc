# 06 — Impacto nos módulos

> SIGOSC-EV-004 · versão 1.0 · 06/11/2026. Legenda: **[FATO] [PROPOSTA] [HIPÓTESE] [PENDENTE]**.
> Risco de regressão e complexidade: **B** = baixo, **M** = médio, **A** = alto. A "ordem" refere-se ao roadmap (08).

## Resumo

| # | Módulo | Risco | Compl. | Evolução (08) |
|---|---|---|---|---|
| 1 | Acompanhamento Financeiro | A | A | EV-010 |
| 2 | Monitoramento e Avaliação | A | A | EV-011 |
| 3 | Gestão do Aplicativo | A | M | EV-008 / EV-009 |
| 4 | Administração de usuários | **A** | A | EV-008 |
| 5 | Relatórios e painéis | M | M | EV-012 |
| 6 | Importações e exportações | M | M | EV-011 / EV-012 |
| 7 | Componentes compartilhados | M | M | EV-009 |
| 8 | Serviços de persistência | A | A | EV-009 a EV-011 |
| 9 | APIs administrativas | **A** | A | EV-008 |

---

## 1. Acompanhamento Financeiro
- **Situação [FATO]:** a lógica fica em `App.tsx` (estado `ledgerEntries`/`budgetItems`, listeners `App.tsx:143-160`, handlers `handleAddEntry`, `handleUpdateEntry`, `handleStatusChange`, `handleDeleteEntry`, `handleUpdateAuditComment`, `handleExportCSV`, `totals`, `chartData`). Telas: `ExpenseForm`, `Ledger`, `DespesaDetail`, `EditModal`, `BudgetItems`, `BudgetStatus`, `SummaryCards`, `Charts`.
- **Dependências:** `types.ts` (`LedgerEntry`, `BudgetItem`), `lib/utils.ts` (`getSpentForItem`), `lib/currency.ts`.
- **Coleções:** `ledger`, `budgetItems`.
- **Consultas a limitar por tenant e parceria:** os dois listeners (`orderBy createdAt` em `ledger`; `budgetItems` inteira) e todas as escritas (`addDoc`, `updateDoc`, `deleteDoc`, `setDoc`).
- **Permissões:** `canAccessEntry` e `canAccessReport` passam a ser avaliadas por parceria. Aprovar, reprovar e excluir, hoje `isAdmin`, vira `org_admin` ou uma nova permissão de "auditor financeiro" **[PENDENTE]**.
- **Alterações previstas:** extrair um `FinanceiroModule` de `App.tsx` com um hook `useLedger(scope)`; caminhos via construtor com escopo; paginação do `ledger`; bloquear a exclusão de item com despesas; anexos (R12) **[PENDENTE]**.
- **Existente × futuro:** CRUD, painel e exportação CSV existem. A consolidação entre parcerias da OSC é **futura**.

## 2. Monitoramento e Avaliação
- **Situação [FATO]:** `MonitoramentoAvaliacao.tsx` (navegação por `MONITORING_NAV`); páginas em `src/pages/monitor/`; domínio em `src/features/`; serviços `verificacao30DiasService.js`, `visitaInLocoService.js`, `surveyFirestoreService.js`; Relatório Final em `RelatorioFinal.tsx`.
- **Coleções:** `visitas_inloco_caser`, `verificacao30dias_*`, `verificacao30dias_periodos`, `pesquisas_*_respostas`, `pesquisas_importacoes`, `settings/partnership`, `relatorioFinalRascunho/atual`.
- **Limitar por parceria:** **todas**. Atenção especial a:
  - `verificacao30dias_{periodo}`: coleção de **nome dinâmico** (`nomeColecao`), que vira uma coleção fixa por parceria com `where('periodoAplicacao')`;
  - `visitas_inloco_caser`: o ID é a data, que passa a ser única **por parceria**;
  - pesquisas: o ID é o do Forms, que passa a ser único **por parceria**, com a chave `{surveyType}__{sourceResponseId}`;
  - `settings/partnership` e `relatorioFinalRascunho/atual`: deixam de ser documentos únicos e passam a ser um por parceria.
- **Dados escritos no código:** `IDENTIFICACAO_INSTRUMENTO` (`visita-in-loco/config.js`) vira um campo de `Partnership`; o catálogo de 44 indicadores e as fórmulas continuam globais e versionados **[PENDENTE: varia por programa?]**.
- **Permissões:** 12 chaves `canAccess*` do M&A, por parceria.
- **Risco:** A. É o módulo com mais caminhos e regras específicas (autosave, imutabilidade da visita finalizada, histórico imutável de importação). Cada regra atual precisa de um equivalente com escopo e teste.

## 3. Gestão do Aplicativo
- **Situação [FATO]:** a dimensão `gestao` em `App.tsx` mostra `UserManagement` se `isAdmin`. É a "administração" única, global.
- **Futuro:** separar em **Administração da Plataforma** (Platform Admin: OSCs, status, Platform Admins) e **Administração da Organização** (`org_admin`: membros, acessos, parcerias). A primeira é uma funcionalidade **nova**; a segunda adapta a tela existente.
- **Risco:** A. É a porta de entrada de privilégios.

## 4. Administração de usuários
- **Situação [FATO]:** `UserManagement.tsx` escuta **toda** a coleção `users` (`onSnapshot`, linha 244), grava `role` e `canAccess*` pelo Client SDK (`togglePermission`, `toggleRole`), cria contas via `CreateUserModal` → `/api/admin/create-user` e exclui via `DeleteUserModal` → `/api/admin/delete-user`.
- **Mudanças:** a lista vem de `organizations/{org}/members`; as alterações passam por APIs (ADR-008); "excluir usuário" vira "revogar vínculo"; "convidar" reaproveita a conta já existente no Auth (uma pessoa em várias OSCs).
- **Risco:** A (R03, R05, R06, R15).

## 5. Relatórios e painéis
- **Situação [FATO]:** `PainelGeralIndicadores` → `useGeneralIndicators.js` lê `periodos`/`colaboradores_*` (legado), `verificacao30dias_*` e as 4 coleções de pesquisa. `Painel30Dias`, `PainelIndicadoresSatisfacao`, `PainelAvaliacaoPosPrograma` e o painel financeiro (`SummaryCards`/`Charts`/`BudgetStatus`) leem coleções inteiras.
- **Mudanças:** cada painel recebe o escopo `{org, pid}`. O Painel Geral perde (ou reativa com escopo) a fonte `periodos`/`colaboradores_*` **[PENDENTE]**. Painéis consolidados por OSC são funcionalidade **futura**.
- **Risco:** M. A lógica de cálculo é pura (`features/*/indicators`, `indicadoresExecucaoService`) e não muda; só muda a fonte de dados.

## 6. Importações e exportações
- **Existentes [FATO]:** importação CSV de pesquisas (`SurveyCsvDropzone`, `surveyImportService`, `writeBatch` de até 500); exportação CSV do ledger (`handleExportCSV`); exportação JSON do Relatório Final (`handleExport`).
- **Mudanças:** a importação grava no caminho da parceria; `importadoPorUid` continua; o histórico continua imutável. As exportações passam a ter o escopo do contexto. A **exportação completa por tenant** (03 §7) é **nova**, feita no servidor.
- **Legado:** `csvService`, `uploadValidationService` e `classificacaoService` servem tanto às pesquisas quanto à antiga Apuração (`salvarPeriodo`, sem chamador).

## 7. Componentes compartilhados
- **[FATO]** `Header`, `DimensionSelect`, `Login`, os kits `ui/` e `monitor/ui/`, `BrandWordmark`, `LogoPlaceholder`.
- **Mudanças:** o `Header` mostra a OSC e a parceria ativas, com um seletor de troca; o `DimensionSelect` aparece depois do seletor de contexto. O `LogoPlaceholder` passa a mostrar a logo da OSC numa evolução futura. O design system não muda.
- **Risco:** M (navegação e estado).

## 8. Serviços de persistência
- **[FATO]** Cada serviço chama `collection(db, '<nome>')` direto, com o `db` global.
- **[PROPOSTA]** Criar `src/data/scope.ts`: `scopedCollection(scope, 'ledger')` gera `organizations/{org}/partnerships/{pid}/ledger` e `scopedDoc(scope, …)`. Os serviços recebem `scope` como **primeiro parâmetro obrigatório**. Um teste estático (no estilo de `firebaseIsolation.test.js`) proíbe `collection(db, '<literal>')` fora de uma lista permitida (`users`, `platformAdmins`, `organizations`).
- **Risco:** A, pela quantidade de arquivos, mas é **mecânico e verificável** pelo teste estático.

## 9. APIs administrativas
- **[FATO]** `api/admin/create-user.ts`, `api/admin/delete-user.ts`, `api/_lib/requireAdmin.ts`. `DEFAULT_PERMISSIONS` é importado de `src/config/permissions.ts`.
- **Mudanças:** novos helpers (04 §5.1), rotas com escopo (04 §5.2) e auditoria. Manter os padrões bons já existentes: lista de campos permitidos, idempotência, reversão do Auth se o Firestore falhar, sem logar segredos.
- **Risco:** A (R05). Exige testes de API com emulador antes de publicar.

## 10. Existente × futuro (resumo)
| Existe hoje [FATO] | Fica igual com escopo | Novo [PROPOSTA] |
|---|---|---|
| Login e-mail/senha | ✔ | Seletor de OSC e parceria |
| Financeiro (lançar, aprovar, painel, CSV) | ✔ | Consolidação por OSC |
| M&A (visita, 30 dias, pesquisas, relatório final, painéis) | ✔ | Catálogo por tipo de programa [PENDENTE] |
| Gestão de usuários global | Adaptada para membros da OSC | Administração da plataforma; acesso por parceria |
| Criar e excluir conta (API) | Dividido em convite e revogação × exclusão de identidade | Auditoria; exportação por tenant |
| — | — | Identidade visual por OSC |
