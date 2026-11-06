# 05 — Segurança e isolamento

> SIGOSC-EV-004 · versão 1.0 · 06/11/2026. Legenda: **[FATO] [PROPOSTA] [HIPÓTESE] [PENDENTE]**.

## 1. Princípios [PROPOSTA]
1. **Negar por padrão** em toda camada: regras, APIs e interface.
2. **O escopo vem do caminho, não do payload.**
3. **Toda autorização é reavaliada no servidor** (regras ou API). A interface só esconde opções.
4. **O Admin SDK é tratado como "root"**: cada endpoint precisa de verificação explícita e testada.
5. **Vínculos e papéis são escritos só pelo servidor**, com trilha de auditoria.

## 2. Análise das regras atuais (`firestore.rules`) [FATO]

| Trecho | Situação atual | Problema no modelo multi-tenant | Ação futura |
|---|---|---|---|
| `isAdmin()` (`:11`) | Admin global por `role` **ou e-mail fixo** | Admin de uma OSC viraria admin de todas; e-mail fixo nas regras | Substituir por `isPlatformAdmin()` + `isOrgAdmin(org)` |
| `hasPermission(field)` (`:18`) | Lê `users/{uid}[field]` | Permissão global, sem escopo | `canPartnership(org,pid,perm)` (03 §9) |
| `semPermissoesElevadas()` (`:28`) | Permite autocriar `users/{uid}` com flags `false` | No novo modelo o perfil não tem flags | Simplificar: o perfil só aceita `uid/email/displayName/status` |
| `match /users/{userId}` (`:97`) | Leitura própria ou admin; admin escreve `role` | Admin de OSC leria perfis de outras OSCs | Leitura do perfil por quem compartilha OSC: **[PENDENTE]** usar um resumo em `members` (nome e e-mail) para não abrir `users` |
| `match /settings/{docId}` (`:151`) | **Leitura de qualquer autenticado** | Vazamento entre OSCs | Vira campos de `partnerships/{pid}` |
| `match /periodos`, `/{collectionId}/{colaboradorId}` (`:191`, `:205`) | Leitura de qualquer autenticado; permissões legadas | Vazamento; coleções de nome dinâmico não ficam sob um caminho de tenant | Desativar (LEGADO) ou migrar para uma coleção fixa da parceria |
| `match /visitas_inloco_caser/{dataVisita}` (`:222`) | Uma visita por data **no sistema inteiro** | Duas OSCs não poderiam ter visitas na mesma data | Caminho por parceria (o ID = data continua) |
| `match /{collectionId}/{respostaId}` 30 dias (`:251`) | Leitura de qualquer autenticado; coleção dinâmica | Vazamento | Coleção fixa por parceria + filtro `periodoAplicacao` |
| `pesquisas_*` (`:277-357`) | Bom controle de formato e de permissão | ID do Forms colide entre OSCs; escopo global | Caminho por parceria; manter `respostaDePesquisaValida` |
| `relatorioFinalRascunho` (`:362`) | Leitura de qualquer autenticado; documento único | Vazamento; uma parceria só | `…/partnerships/{pid}/finalReport/draft` |
| Default deny (`:369`) | Correto | — | **Manter** |

## 3. Riscos e pontos críticos

| ID | Risco | Situação atual [FATO] | Controle proposto | Severidade no multi-tenant |
|---|---|---|---|---|
| R01 | **Cadastro público pelo Auth** + coleções liberadas só por estar autenticado | Qualquer um com a `apiKey` pode criar conta e ler `settings`, `relatorioFinalRascunho`, `verificacao30dias_*`, `colaboradores_*` (se a criação de conta estiver ativa no Console) | Desativar o sign-up no Console; regras exigem vínculo ativo, não só autenticação | **Crítica** |
| R02 | Escalada horizontal (OSC A → OSC B) | Não se aplica hoje (um tenant só) | Escopo pelo caminho + `isMember(org)` em toda regra; testes C01, C02 e C12 | Crítica |
| R03 | Escalada vertical (usuário → admin) | Bloqueada: `update` do próprio doc só altera `displayName` | Vínculos escritos só pelo servidor (ADR-008); teste C09 | Alta |
| R04 | Injeção de `organizationId` ou `partnershipId` no payload | — | As regras comparam o campo redundante com o caminho; as APIs ignoram o corpo | Alta |
| R05 | Admin SDK sem checagem de escopo | `requireAdmin` é global | `requireOrgRole`/`requirePartnershipPermission` obrigatórios, com teste por endpoint (C03, C08) | **Crítica** |
| R06 | Exclusão de identidade compartilhada por um admin de OSC | `delete-user` apaga a conta global | Separar a revogação de vínculo da exclusão de identidade (04 §5.2) | Alta |
| R07 | Revogação com sessão aberta | A interface só relê permissões ao recarregar (`App.tsx:62`, `getDoc`) | As regras leem o vínculo por requisição; o frontend escuta o vínculo; `revokeRefreshTokens` (04 §4.3) | Média |
| R08 | Listener ou estado de outro tenant após a troca de contexto | Listeners em `App.tsx` presos só a `user` | `TenantProvider` com `key` por contexto (04 §4.2); teste C04 | Alta |
| R09 | E-mail de bootstrap nas regras | `firestore.rules:15`, `src/firebase.ts:78`, variável do servidor | `platformAdmins/{uid}` + script único (ADR-007) | Média |
| R10 | Platform Admin com acesso irrestrito a dados | — | Separação plataforma × OSC; break-glass auditado (ADR-006) | Média |
| R11 | Falta de auditoria | Não há trilha (o tipo `AuditLogEntry` existe, sem uso) | `auditEvents` escrito pelo servidor (03 §7) | Média |
| R12 | Anexos em Base64 no Firestore | `ledger.documentData` com até 2 MB | **[PENDENTE]** Migrar para o Storage com regras por parceria, ou limitar o tamanho | Média |
| R13 | Código morto que libera acesso | `isDemoMode` permite os listeners sem usuário (o caminho não é ativável hoje) | Remover em uma EV de limpeza | Baixa |
| R14 | IDs com significado colidindo entre tenants | Visita (data), pesquisa (ID do Forms), item (código) | Resolvido pelo caminho por parceria | Alta, se fosse usada a Alternativa B |
| R15 | Consulta global pelo cliente | `UserManagement` escuta **toda** a coleção `users` | A lista de membros vem de `organizations/{org}/members`; consultas globais só pelo servidor | Alta |

## 4. Matriz de isolamento (Etapa G)

Convenções: **OSC A** (`orgA`), **OSC B** (`orgB`), parcerias `pA1` e `pA2` de A.
Testes previstos: **RT** = teste de regras no Firestore Emulator (`@firebase/rules-unit-testing`); **AT** = teste de API com o Auth/Firestore Emulator; **UT** = teste de unidade ou componente do frontend.

| Caso | Ator | Contexto | Operação | Resultado esperado | Camada de controle | Teste recomendado |
|---|---|---|---|---|---|---|
| **C01** | `org_user` de A | Ativo em A | `get`/`list` em `organizations/orgB/partnerships/*/ledger` | **Negado** (`permission-denied`) | Regras: `isMember(orgB)` falso | RT: `assertFails(getDocs(orgB ledger))` com o contexto de usuário de A |
| **C02** | `org_user` de A | Ativo em A | `create`/`update`/`delete` em um doc de `orgB` | **Negado** | Regras | RT: `assertFails(setDoc/updateDoc/deleteDoc)` em caminhos de B |
| **C03** | `org_admin` de A | Ativo em A | `POST /api/orgs/orgB/members` ou `DELETE /api/orgs/orgB/members/{uid}` | **403**, sem efeito no Firestore nem no Auth | API: `requireOrgRole(req,'orgB',['org_admin'])` | AT: resposta 403 **e** conferência de que nada mudou no emulador |
| **C04** | Membro de A e de B | Troca A → B | Listeners e estado | Nenhum dado de A visível no contexto B; nenhum listener de A ativo | Frontend (`TenantProvider` com `key`) + regras | UT: montar o contexto A, trocar para B, conferir que os unsubscribes foram chamados e o estado esvaziou; RT: leitura de B com o vínculo de B passa |
| **C05** | Usuário revogado de A | Sessão aberta em A | Nova leitura/escrita; listener aberto | Novas operações **negadas**; listener encerrado pelo frontend ao detectar a revogação | Regras (`member.status`) + frontend + `revokeRefreshTokens` | RT: revogar e `assertFails`; UT: listener do vínculo dispara a saída; **[HIPÓTESE]** comportamento do listener validado no emulador |
| **C06** | `org_user` só com `access` em `pA1` (`allPartnerships:false`) | A / pA1 | Ler `pA2/ledger` | **Negado** | Regras: `canPartnership(orgA,'pA2',…)` falso | RT: `assertSucceeds(pA1)` e `assertFails(pA2)` |
| **C07** | `org_user` de A | Edita o `organizationId` no estado ou no `sessionStorage` para `orgB` | Qualquer operação | **Negado**; a interface volta ao seletor | Regras (caminho) + revalidação do contexto no carregamento | RT (igual ao C01); UT: contexto salvo inválido é descartado |
| **C08** | `org_admin` de A | — | `POST /api/orgs/orgA/members` com corpo `{organizationId:'orgB', role:'platform_admin'}` | Campo ignorado: cria vínculo **só em A**, papel limitado a `org_admin`/`org_user` | API: escopo pela rota + lista de campos permitidos | AT: confere que não existe doc em B nem em `platformAdmins` |
| **C09** | `org_user` de A | — | `updateDoc(members/{self}, {role:'org_admin'})` ou `setDoc(platformAdmins/{self})` | **Negado** | Regras: escrita do cliente em vínculos e admins = `false` | RT: `assertFails` nos dois |
| **C10** | Platform Admin | — | `POST /api/platform/organizations/{org}/status` (suspender) | **Permitido** + `auditEvents` gravado | API `requirePlatformAdmin` | AT: 200, status alterado, evento de auditoria presente; com um não-admin: 403 |
| **C11** | Membro ativo de A | A com `status:'suspended'` | Ler/escrever dados de A | **Negado**; interface mostra "Organização suspensa" | Regras (`orgActive`) + APIs | RT: suspender e `assertFails` em leitura e escrita |
| **C12** | `org_user` de A | — | `collectionGroup('ledger')` sem filtro, ou `collectionGroup('members')` sem `where(uid==me)` | **Negado** (a consulta não pode ser provada segura) | Regras de collection group | RT: `assertFails(sem filtro)`, `assertSucceeds(where organizationId==orgA)` quando permitido |

**Casos adicionais recomendados:**
- **C13:** usuário sem nenhum vínculo (conta criada pelo sign-up público) lê qualquer coleção de negócio → negado.
- **C14:** remover o último `org_admin` → 409/403.
- **C15:** escrita em parceria `closed` → negada.
- **C16:** o Platform Admin lê dados de negócio sem break-glass → negado.

## 5. Critério de liberação
Nenhuma segunda OSC entra em produção enquanto **todos** os casos C01–C16 não estiverem automatizados e passando na CI, contra as regras e as APIs que de fato serão publicadas (ver 07 §9 e 08).
