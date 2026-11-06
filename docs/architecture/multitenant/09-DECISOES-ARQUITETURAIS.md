# 09 — Registro de decisões arquiteturais (ADRs)

> SIGOSC-EV-004 · versão 1.0 · 06/11/2026.
> Status: **Proposta** (aguardando aprovação humana) · **Aceita** · **Rejeitada** · **Pendente** (precisa de decisão).
> As decisões de negócio 1–10 da EV-004 são premissas e não são rediscutidas aqui.

| ADR | Título | Status |
|---|---|---|
| 001 | Multi-tenant com banco e aplicação compartilhados | **Aceita** (decisão de negócio 1) |
| 002 | Escopo por caminho hierárquico `organizations/{org}/partnerships/{pid}` | Proposta |
| 003 | IDs gerados pelo sistema; CNPJ só como atributo com índice de reserva | Proposta |
| 004 | Vínculos em `organizations/{org}/members/{uid}` (M1) | Proposta |
| 005 | Manter o catálogo de 14 permissões `canAccess*`, agora por vínculo e por parceria | Proposta |
| 006 | Platform Admin sem acesso a dados de negócio, salvo break-glass auditado | Proposta |
| 007 | 1º Platform Admin por script único + `platformAdmins/{uid}`; fim do e-mail de bootstrap | Proposta |
| 008 | Vínculos, papéis e auditoria escritos só pelo servidor | Proposta |
| 009 | `TenantProvider` com `key` por contexto para isolar estado e listeners | Proposta |
| 010 | Começar do zero se o inventário confirmar que não há dados reais | Proposta |
| 011 | Fim das coleções de nome dinâmico | Proposta |
| 012 | Testes de regras e de API com emulador são condição para liberar | Proposta |

---

### ADR-002 — Escopo por caminho hierárquico
- **Contexto:** o isolamento entre OSCs é o requisito mais crítico (decisão 9).
- **Decisão:** Alternativa A de 03, com campos redundantes `organizationId`/`partnershipId` conferidos pelas regras.
- **Alternativas rejeitadas:**
  - **B (coleções planas com campo):** um único filtro ou regra esquecido vaza dados; exige índices compostos em toda consulta.
  - **C (banco ou projeto por OSC):** contraria a infraestrutura compartilhada; multiplica deploys e regras.
- **Consequências:** as consultas consolidadas da OSC usam collection group; a exclusão e a exportação por tenant ficam simples.

### ADR-003 — IDs estáveis
- **Decisão:** os IDs de `Organization` e `Partnership` são gerados pelo sistema. O CNPJ é normalizado (14 dígitos), e sua unicidade vem da reserva `organizationCnpjIndex/{cnpj}`, gravada em transação pelo servidor.
- **Rejeitado:** usar o CNPJ como ID, porque o CNPJ pode ser corrigido e porque expõe um dado da OSC em todo caminho e log.

### ADR-004 — Vínculos M1
- **Decisão:** `organizations/{org}/members/{uid}` é a fonte única. A lista de "minhas OSCs" vem de um collection group com uma regra que só deixa ler o próprio vínculo.
- **Rejeitado:** custom claims (revogação atrasada e limite de 1000 bytes); espelho em `users/{uid}/memberships` (duas fontes de verdade).

### ADR-005 — Catálogo de permissões
- **Decisão:** reaproveitar `src/config/permissions.ts` como catálogo. Os valores passam a ficar em `members/{uid}.permissions` e `access/{uid}.permissions`.
- **Pendente:** remover `canAccessFrequencia`/`canAccessAlcance` (sem tela) e as 4 chaves legadas; criar uma permissão de "aprovar despesas" separada de `org_admin`?

### ADR-006 — Separação entre plataforma e OSC
- **Decisão:** o Platform Admin gere tenants, mas **não** lê dados de negócio. O acesso excepcional (suporte, ordem judicial) segue o procedimento de **break-glass**: um vínculo temporário criado pelo servidor, com prazo de validade e auditoria reforçada.
- **Pendente:** quem aprova o break-glass e qual o prazo máximo.

### ADR-007 — Bootstrap do Platform Admin
- **Decisão:** script único com a credencial de serviço grava `platformAdmins/{uid}`, e as regras usam `exists()`, o que dá revogação imediata. Remover o e-mail fixo de regras, front e API no **mesmo deploy** em que o novo mecanismo entra.
- **Rejeitado:** lista de e-mails nas regras (exigência da EV-004); custom claim sozinha (revogação atrasada).

### ADR-008 — Escrita privilegiada só no servidor
- **Decisão:** `members`, `access`, `platformAdmins`, `organizationCnpjIndex` e `auditEvents` têm `allow write: if false` para o cliente. Toda mudança passa pelas APIs (04 §5).
- **Consequência:** `UserManagement.tsx` deixa de escrever no Firestore diretamente.

### ADR-009 — Isolamento de estado no frontend
- **Decisão:** um `TenantProvider` com `key={org:pid}` desmonta a árvore inteira ao trocar de contexto. A camada `src/data/scope.ts` exige o escopo em todo acesso.
- **Rejeitado:** limpar listeners manualmente em cada componente, porque é fácil esquecer um (R08).

### ADR-010 — Começar do zero quando possível
- **Decisão:** se o inventário (07 §2) mostrar que só há dados de teste, a 1ª OSC começa vazia e os dados atuais são arquivados (backup) em vez de migrados.
- **Pendente:** essa confirmação depende do inventário somente leitura (EV-012).

### ADR-011 — Fim das coleções de nome dinâmico
- **Decisão:** `verificacao30dias_{periodo}` e `colaboradores_{periodo}` viram uma coleção fixa por parceria com o campo `periodo`. As regras e os collection groups passam a funcionar e o escopo fica claro.

### ADR-012 — Testes como critério de liberação
- **Decisão:** nenhuma 2ª OSC sem C01–C16 automatizados e verdes (05 §5).

## Questões pendentes de decisão humana
| # | Questão | Onde impacta |
|---|---|---|
| P1 | O `org_admin` vê os **dados** de todas as parcerias da OSC ou só administra? | 02 §2.5, regras |
| P2 | O catálogo de indicadores e os instrumentos de M&A variam por tipo de programa ou parceria? | 02 §1, EV-011 |
| P3 | Anexos de despesa: migrar para o Storage ou manter em Base64 com limite menor? | R12, EV-010 |
| P4 | Destino de `periodos`/`colaboradores_*` (legado só de leitura) | EV-012 |
| P5 | Qual OSC é dona dos dados atuais, se existirem? | 07 §3 |
| P6 | Aprovação dupla para nomear Platform Admins? | ADR-007 |
| P7 | Fluxo e prazo do break-glass | ADR-006 |
| P8 | Custo × consistência: guardar o status da OSC no vínculo? | 03 §5 |
| P9 | Sign-up público do Auth está desativado no Console? | R01 (ação já recomendada) |
| P10 | Remover `canAccessFrequencia`/`canAccessAlcance` e as chaves legadas | ADR-005 |
