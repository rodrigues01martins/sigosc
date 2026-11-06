# Arquitetura multi-tenant do SIGOSC — Auditoria e planejamento (EV-004)

> Versão 1.0 · 06/11/2026 · branch `evo-dev` (base `c130d2f`).
> **Documento de planejamento.** Nenhuma funcionalidade multi-tenant foi implementada, nenhum dado foi alterado, nenhuma regra Firebase foi modificada ou publicada.
>
> Legenda: **[FATO]** verificado no código · **[PROPOSTA]** recomendação · **[HIPÓTESE]** inferência a validar · **[PENDENTE]** decisão humana.

## Resumo executivo

**Diagnóstico.** **[FATO]** O SIGOSC foi construído para **uma organização e uma parceria**. As 13 famílias de coleções do Firestore (2 com nome dinâmico) são globais. A autorização usa um papel global (`users.role`), 14 permissões booleanas no perfil e um e-mail de bootstrap fixo nas regras, no frontend e no servidor. Dados da parceria (instrumento, OSC, processo SEI) aparecem até no código-fonte (`visita-in-loco/config.js`). Não existe o conceito de OSC, nem de vínculo, nem de contexto ativo.

**Pontos fortes a preservar.** Regras com negação por padrão; usuários sem como se autoconceder privilégio; criação e exclusão de contas só no servidor, com payload restrito e passos idempotentes; validação estrita das pesquisas importadas; inicialização Firebase única e validada (EV-002).

**Arquitetura recomendada [PROPOSTA].**
- **Escopo pelo caminho:** `organizations/{orgId}/partnerships/{partnershipId}/<dados>`, com `organizationId`/`partnershipId` redundantes e conferidos (ADR-002).
- **Identidade global** em `users/{uid}`, sem papéis; **vínculos** em `organizations/{org}/members/{uid}`; **acesso por parceria** em `…/partnerships/{pid}/access/{uid}`. A política nega na falta de concessão explícita (ADR-004, 02 §2.5).
- **Três papéis:** Platform Admin (gere tenants, sem ver dados), Organization Admin e Organization User.
- **Platform Admin** em `platformAdmins/{uid}`, provisionado por um script único; o e-mail fixo é eliminado (ADR-007).
- Vínculos, papéis e auditoria **escritos só pelo servidor**, com verificações explícitas nas APIs, porque o Admin SDK ignora as regras (ADR-008).
- **`TenantProvider`** no frontend com `key` por contexto para descartar estado e listeners na troca de OSC (ADR-009).

## Riscos críticos
1. **R01:** se o sign-up público do Firebase Auth estiver ativo, qualquer pessoa cria conta e lê coleções protegidas só por `isAuthenticated()` (`settings`, `relatorioFinalRascunho`, `verificacao30dias_*`, `colaboradores_*`). **Ação recomendada já:** desativar no Console.
2. **R05:** APIs com Admin SDK sem checagem de escopo, com risco de um admin de OSC agir em outra.
3. **R02:** vazamento horizontal se qualquer coleção global continuar legível quando houver 2+ OSCs.
4. **R06:** a exclusão de usuário hoje apaga a identidade global; no modelo novo, isso afetaria outras OSCs.
5. **R08:** listeners presos ao usuário e não ao contexto.

## Índice
| # | Documento | Conteúdo |
|---|---|---|
| 01 | [Diagnóstico atual](01-DIAGNOSTICO-ATUAL.md) | Inventário de aplicação, auth, autorização, persistência e infraestrutura, com referências ao código |
| 02 | [Modelo de domínio](02-MODELO-DOMINIO.md) | Classificação das entidades atuais; Organization, Partnership, User, vínculos; política de acesso; ER |
| 03 | [Arquitetura Firestore](03-ARQUITETURA-FIRESTORE.md) | Alternativas A/B/C, vínculos M1–M4, consultas, índices, custo, auditoria, esboço de regras |
| 04 | [Autenticação e autorização](04-AUTENTICACAO-AUTORIZACAO.md) | Identidade × vínculo × contexto × permissão; papéis; bootstrap; fluxos; APIs |
| 05 | [Segurança e isolamento](05-SEGURANCA-ISOLAMENTO.md) | Análise das regras atuais, riscos R01–R15, matriz C01–C16 |
| 06 | [Impacto nos módulos](06-IMPACTO-MODULOS.md) | Os 9 módulos: situação, coleções, mudanças, risco e ordem |
| 07 | [Estratégia de transição](07-ESTRATEGIA-TRANSICAO.md) | Inventário, dono dos dados, backup, migração idempotente, rollback, liberação |
| 08 | [Roadmap](08-ROADMAP-EVOLUCOES.md) | EV-005 a EV-015 com dependências e critérios de aceite |
| 09 | [Decisões arquiteturais](09-DECISOES-ARQUITETURAIS.md) | ADR-001 a ADR-012 e as questões pendentes P1–P10 |

## Próximo passo
Revisão humana destes documentos e decisão sobre os ADRs e as pendências P1–P10. **A EV-005 não foi iniciada.**

## Histórico
| Versão | Data | Evolução | Alteração |
|---|---|---|---|
| 1.0 | 06/11/2026 | SIGOSC-EV-004 | Criação |
