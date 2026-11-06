# 03 — Arquitetura Firestore

> SIGOSC-EV-004 · versão 1.0 · 06/11/2026. Legenda: **[FATO] [PROPOSTA] [HIPÓTESE] [PENDENTE]**.

## 1. Restrições do Firestore que orientam a decisão [FATO, documentação do Firebase]
- **As regras não são filtros.** Uma consulta só é aceita se o Firestore conseguir provar que *todos* os resultados possíveis passam na regra. A consulta precisa trazer o filtro de escopo, ou estar presa a um caminho com escopo.
- Cada avaliação de regra pode fazer no máximo **10** chamadas `get()`/`exists()` em operações de documento único e **20** em transações e lotes. Cada uma é **cobrada como leitura**.
- Um documento tem limite de **1 MiB**. Hoje `ledger.documentData` guarda anexos de até 2 MB em Base64 (cerca de 2,7 MB de texto), o que **[HIPÓTESE]** já pode falhar com anexos acima de cerca de 700 KB. **[PENDENTE]** Validar.
- Índices de **campo único com escopo de collection group** não são automáticos: é preciso criar uma isenção ou índice.
- Um lote (`writeBatch`) aceita no máximo 500 operações. Hoje o código usa lotes de até 400 (`firestoreService.js`) e importações em lotes (`surveyFirestoreService.js`).
- As operações do **Admin SDK ignoram as Security Rules**.

## 2. Alternativas avaliadas

### Alternativa A — Hierarquia por caminho (a recomendada)
```
organizations/{orgId}
organizations/{orgId}/members/{uid}
organizations/{orgId}/partnerships/{partnershipId}
organizations/{orgId}/partnerships/{pid}/access/{uid}
organizations/{orgId}/partnerships/{pid}/budgetItems/{itemId}
organizations/{orgId}/partnerships/{pid}/ledger/{entryId}
organizations/{orgId}/partnerships/{pid}/siteVisits/{AAAA-MM-DD}
organizations/{orgId}/partnerships/{pid}/verifications30d/{id}          (campo periodoAplicacao)
organizations/{orgId}/partnerships/{pid}/surveyResponses/{surveyType}__{sourceResponseId}
organizations/{orgId}/partnerships/{pid}/surveyImports/{id}
organizations/{orgId}/partnerships/{pid}/finalReport/draft
organizations/{orgId}/auditEvents/{id}
users/{uid}
platformAdmins/{uid}
organizationCnpjIndex/{cnpj}
```

### Alternativa B — Coleções planas com campos de escopo
```
organizations/{orgId}
memberships/{orgId}__{uid}
partnerships/{pid}                  { organizationId }
partnershipAccess/{pid}__{uid}      { organizationId, partnershipId }
ledger/{id}                         { organizationId, partnershipId, ... }
budgetItems/{id}                    { organizationId, partnershipId, ... }
... (todas as coleções atuais + organizationId/partnershipId)
```

### Alternativa C — Um banco Firestore por OSC (*named databases*) ou um projeto Firebase por OSC
É descartada desde já: contradiz a decisão 1 (infraestrutura compartilhada), multiplica deploys, regras e índices, e o Auth continuaria compartilhado. Fica registrada como alternativa rejeitada no ADR-002.

### 2.1 Comparação A × B

| Critério | A — Hierárquica | B — Plana |
|---|---|---|
| **Isolamento nas regras** | O escopo está **no caminho** (`{orgId}`, `{pid}`), e as regras usam as variáveis do caminho sem ler o documento-alvo. Se esquecer o filtro, a consulta não sai da parceria | Depende de `resource.data.organizationId` e de **toda** consulta trazer `where('organizationId','==',X)`. Esquecer um filtro gera erro (bom), mas toda regra de `create` precisa validar `request.resource.data.organizationId` |
| **Injeção de `organizationId` no payload** | Irrelevante para o escopo: o caminho manda. Só se valida que o campo redundante seja igual ao do caminho | **Vetor principal de ataque**: cada regra de escrita precisa conferir o campo contra o vínculo |
| Consultas dentro da parceria | Leitura direta da subcoleção, sem índice extra | `where(org)` + `where(partnership)` + `orderBy` exigem **índices compostos** |
| Consultas entre parcerias da mesma OSC | **Collection group** (`ledger`) com `where('organizationId','==',X)`, com índice e regra de collection group | Consulta simples com `where(organizationId)` |
| Consultas globais (plataforma) | Collection group sem filtro, **só pelo servidor** (Admin SDK) | Consulta simples, só pelo servidor |
| Exportação por tenant | `recursiveDelete`/listagem a partir de `organizations/{orgId}`. Natural | Uma consulta por coleção com filtro |
| Desativar ou excluir uma OSC | Status no documento raiz, verificado pelas regras; exclusão recursiva por um caminho | Status precisa ser checado em cada coleção; exclusão em N coleções |
| Custo de leitura das regras | Por requisição: `members/{uid}` + `organizations/{orgId}` (status) + `access/{uid}` quando há restrição. **2 a 3 leituras extras** | Igual ou maior (o vínculo também precisa ser lido) |
| Crescimento | Subcoleções ilimitadas; sem hotspot por OSC | Coleções gigantes, mas o Firestore escala igual |
| Migração do código atual | Troca `collection(db,'ledger')` por um construtor de caminho com escopo | Exige adicionar filtros em **toda** consulta e índices compostos |
| Risco de erro humano | **Menor**: o padrão seguro é estrutural | **Maior**: depende de disciplina em cada consulta |

**Decisão [PROPOSTA] (ADR-002): Alternativa A**, com **campos redundantes** `organizationId` e `partnershipId` em cada documento de negócio, conferidos pelas regras. Eles servem às consultas de collection group e às exportações.

## 3. Vínculos: alternativas de armazenamento

| Opção | Descrição | Prós | Contras |
|---|---|---|---|
| **M1** (recomendada) | `organizations/{orgId}/members/{uid}` canônico | A regra lê **um** documento de caminho conhecido: `get(/organizations/$(org)/members/$(request.auth.uid))`. A gestão da OSC fica dentro do tenant | Listar "minhas OSCs" exige collection group `members` com `where('uid','==',uid)` |
| M2 | `memberships/{orgId}__{uid}` na raiz | ID determinístico, também 1 leitura nas regras | Mais um caminho global para proteger; a gestão da OSC não fica "dentro" dela |
| M3 | Custom claims (`orgs: {orgId: role}`) | Zero leituras nas regras | Limite de 1000 bytes; **revogação atrasada** até o token renovar (até 1 h); escrita só pelo Admin SDK. Inadequado para vínculos N:N com permissões |
| M4 | Espelho `users/{uid}/memberships/{orgId}` | Listagem direta | **Duplica a fonte de verdade**, com risco de divergência |

**Decisão [PROPOSTA] (ADR-004): M1.** Listar as OSCs do usuário usa collection group `members` filtrada por `uid`, com:
- regra `match /{path=**}/members/{memberUid} { allow read: if request.auth.uid == memberUid; }` (cada pessoa lê só os próprios vínculos);
- índice de campo único `uid` com escopo de collection group.

## 4. Estratégias de consulta

| Necessidade | Consulta proposta | Índice |
|---|---|---|
| Despesas da parceria (hoje `App.tsx:145`) | `collection(…/partnerships/{pid}/ledger)` + `orderBy('createdAt','desc')` + `limit(50)` com paginação | Automático |
| Itens do plano | `…/partnerships/{pid}/budgetItems` | Automático |
| Verificações por período (hoje coleção dinâmica) | `…/verifications30d` + `where('periodoAplicacao','==',p)` | Automático (campo único) |
| Períodos disponíveis | Documento de resumo `…/partnerships/{pid}/meta/verifications30d` (`{periods: [...]}`), mantido na gravação. Alternativa: `verifications30dPeriods/{p}` | — |
| Pesquisas por tipo | `…/surveyResponses` + `where('surveyType','==',t)` | Automático |
| Última importação | `…/surveyImports` + `where('surveyType')` + `orderBy('importadoEm','desc')` + `limit(1)` | **Composto** (hoje evitado com ordenação no cliente) |
| Consolidação de despesas da OSC (futuro) | `collectionGroup('ledger')` + `where('organizationId','==',org)` | Campo único em collection group |
| "Minhas OSCs" | `collectionGroup('members')` + `where('uid','==',uid)` + `where('status','==','active')` | **Composto** em collection group |
| Lista global de OSCs (plataforma) | `organizations` (Platform Admin, cliente) ou API | Automático |
| Auditoria global | **Somente API** (Admin SDK) | — |

**Paginação [PROPOSTA]:** toda listagem de crescimento ilimitado (`ledger`, `surveyResponses`, `verifications30d`, `auditEvents`) passa a usar `limit` + `startAfter`. Hoje **[FATO]** todas as listagens leem a coleção inteira (`getDocs(collection(...))`, ou `onSnapshot` sem `limit`).

## 5. Custo estimado [HIPÓTESE, ordem de grandeza]
- **Regras:** +2 leituras por requisição de cliente (vínculo + status da OSC) e +1 quando o usuário tem acesso restrito por parceria. Um listener conta as leituras de regra na abertura e a cada documento alterado, não a cada documento lido.
- **Mitigação:** guardar `status` da OSC no próprio vínculo (`members/{uid}.orgStatus`, mantido pelo servidor) reduz para 1 leitura, mas cria uma cópia. **[PENDENTE]** Decidir entre consistência (2 leituras) e custo (1 leitura). A proposta inicial é consistência: 2 leituras.
- O volume esperado por OSC é baixo (dezenas a milhares de documentos por ano), então o custo das regras domina e continua barato.

## 6. Integridade referencial, IDs e operações em lote
- **IDs estáveis:** os IDs gerados pelo sistema valem para organizations, partnerships e records. Os IDs com significado (data da visita, código do item, ID do Forms) **só são únicos dentro da parceria**, o que é seguro no modelo A, porque o caminho já isola.
- `budgetItems`: hoje o ID **é** o código digitado (`BudgetItems.tsx:60`). **[PROPOSTA]** Manter o código como campo `code`, com unicidade por parceria via o ID `code` normalizado, e não trocar o vínculo `ledger.itemCode`.
- **Integridade** (sem FK no Firestore): a exclusão de item com despesas vinculadas passa a ser bloqueada no **servidor** ou numa transação. Hoje **[FATO]** é possível apagar um item com despesas.
- **Lotes:** as importações de pesquisa continuam em lotes de até 500, agora dentro da parceria. A regra de escrita em lote pode ler até 20 documentos, o que é suficiente (vínculo, OSC, acesso).

## 7. Auditoria, rastreabilidade e exportação
- **[PROPOSTA]** `organizations/{orgId}/auditEvents/{id}`: `{ at, actorUid, action, target, partnershipId?, before?, after? }`, gravado **só pelo servidor** (as regras negam escrita do cliente). O Platform Admin consulta pelo servidor.
- Eventos mínimos: criação e suspensão de OSC; vínculo criado, alterado ou revogado; acesso por parceria concedido ou revogado; aprovação ou reprovação de despesa; exclusão de qualquer registro; uso de break-glass.
- **Exportação por tenant:** um endpoint de servidor percorre `organizations/{orgId}` recursivamente e gera JSON/CSV. Só Platform Admin ou `org_admin` da própria OSC.
- **Exclusão de OSC:** primeiro `archived` (bloqueio), depois exportação, depois exclusão recursiva por um processo manual com dupla confirmação, sempre registrando a auditoria em local fora da árvore excluída (`platformAuditEvents`).

## 8. Ciclo de vida da parceria
`draft → active → closed → archived`. Em `closed`, as escritas operacionais são bloqueadas (despesas, visitas), mas a leitura e o Relatório Final continuam. Em `archived`, só leitura e exportação. As regras leem `partnerships/{pid}.status` apenas nas operações de escrita.

## 9. Esboço das regras (só documentação — nada foi aplicado)
```
// Estrutura conceitual — NÃO É O ARQUIVO firestore.rules
function signedIn() { return request.auth != null; }
function isPlatformAdmin() { return signedIn() && exists(/databases/$(database)/documents/platformAdmins/$(request.auth.uid)); }
function member(org) { return get(/databases/$(database)/documents/organizations/$(org)/members/$(request.auth.uid)); }
function orgActive(org) { return get(/databases/$(database)/documents/organizations/$(org)).data.status == 'active'; }
function isMember(org) { return signedIn() && exists(/databases/$(database)/documents/organizations/$(org)/members/$(request.auth.uid))
                               && member(org).data.status == 'active' && orgActive(org); }
function isOrgAdmin(org) { return isMember(org) && member(org).data.role == 'org_admin'; }
function canPartnership(org, pid, perm) {
  return isOrgAdmin(org)
    || (isMember(org) && member(org).data.allPartnerships == true && member(org).data.permissions[perm] == true)
    || (isMember(org) && get(/databases/$(database)/documents/organizations/$(org)/partnerships/$(pid)/access/$(request.auth.uid)).data.status == 'active'
        && get(/databases/$(database)/documents/organizations/$(org)/partnerships/$(pid)/access/$(request.auth.uid)).data.permissions[perm] == true);
}
match /organizations/{org}/partnerships/{pid}/ledger/{id} {
  allow read:   if canPartnership(org, pid, 'canAccessReport') || canPartnership(org, pid, 'canAccessEntry');
  allow create: if canPartnership(org, pid, 'canAccessEntry')
                && request.resource.data.organizationId == org
                && request.resource.data.partnershipId == pid
                && request.resource.data.authorUid == request.auth.uid;
}
```
**[PENDENTE]** Validar o número de `get()` por regra contra o limite de 10, usando o emulador (EV-005). As leituras repetidas do mesmo documento dentro de uma avaliação são deduplicadas pelo Firestore.
