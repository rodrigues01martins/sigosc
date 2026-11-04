# SISTEMA DE GESTÃO DE PARCERIAS - ORGANIZAÇÃO DA SOCIEDADE CIVIL

Aplicativo de acompanhamento, gestão financeira, Monitoramento e Avaliação de Parcerias entres Poder Público e Organizações da Sociedade Civil (OSCs)

## Arquitetura

- **Frontend**: React 19 + TypeScript (e JSX/JS nas telas de Monitoramento e Avaliação), Vite, Tailwind CSS v4
- **Backend de dados**: Firebase Authentication (e-mail/senha) + Cloud Firestore
- **Funções administrativas server-side**: Vercel Serverless Functions (`api/admin/*`) usando Firebase Admin SDK — criação e exclusão de usuários nunca passam pelo Client SDK, para não trocar a sessão do administrador logado
- **Gráficos**: Chart.js (react-chartjs-2) e Recharts, conforme a tela
- **Exportação**: impressão nativa do navegador (relatórios e Painel Geral de Indicadores)

O app usa dois Design Systems lado a lado, por história de portabilidade: `src/components/ui/` (Tailwind, dimensões Financeiro/Gestão) e `src/components/monitor/ui/` (estilo inline com variáveis CSS, dimensões Apuração Mensal/Monitoramento e Avaliação).

## Dimensões e funcionalidades

Após o login, o usuário escolhe uma dimensão (`DimensionSelect`). Acompanhamento Financeiro e Monitoramento e Avaliação aparecem para qualquer usuário autenticado — dentro de cada uma, só ficam disponíveis as abas cuja permissão específica foi liberada (administradores têm acesso automático a todas). Gestão do Aplicativo só aparece para administradores.

### Acompanhamento Financeiro

- **Itens do Plano de Trabalho** (etapa, grupo, categoria, valor previsto) cadastrados e editados pelo administrador
- **Novo Lançamento** de despesas vinculadas a um item do plano, com anexo de PDF (Nota Fiscal/comprovante) e máscara monetária brasileira (milhar `.`, decimal `,`) nos campos de valor
- **Fluxo de aprovação** (Em análise → Pendente/Aprovado/Desaprovado), restrito a administradores
- **Painel**: cards de resumo, gráficos de execução por categoria/grupo/etapa/mês, tabela de lançamentos com filtros, análise de saldo por item (com destaque de itens críticos)
- **Exportação CSV** dos lançamentos

### Apuração Mensal

A tela está vazia: o conteúdo anterior (abas Upload, Gerencial, Repasse e Histórico) foi removido, preservando a rota e o cabeçalho global. O atalho na seleção de dimensão também foi retirado. Os dados já gravados no Firestore não foram apagados.

### Monitoramento e Avaliação



### Gestão do Aplicativo (somente administradores)

- **Gestão de Usuários**: criação (`+ Novo usuário`) e exclusão administrativa de contas diretamente pelo app, via `api/admin/create-user` e `api/admin/delete-user` — nunca pelo Firebase Console. A criação gera a conta no Authentication com senha aleatória de alta entropia (nunca exposta) e envia um e-mail de definição de senha; a exclusão neutraliza o acesso (desabilita + revoga tokens), bloqueia a recriação do cadastro com um token antigo e preserva integralmente os registros administrativos já produzidos pelo usuário (lançamentos, formulários, visitas, importações)
- Concessão/revogação de função (admin/usuário) e de cada permissão individual (ver lista abaixo)

## Papéis e permissões

- **Administrador**: `role: "admin"` no documento `/users/{uid}` do Firestore, com acesso automático a todas as funcionalidades. Um e-mail de bootstrap (`BOOTSTRAP_ADMIN_EMAIL`, definido em `src/firebase.ts`, replicado em `firestore.rules` e nas variáveis de ambiente do servidor) garante acesso de administrador antes de qualquer papel ser atribuído — essa conta nunca pode ser excluída pelo app, e o último administrador operacional também é protegido contra autoexclusão em cascata.
- **Usuário comum**: acesso liberado individualmente pelo administrador, permissão por permissão. A fonte única das 14 permissões é `src/config/permissions.ts` (espelhada em `firestore.rules`):

  | Área | Permissões |
  |---|---|
  | Monitoramento e Avaliação — Formulários | Visita In Loco, Verificação Inicial — 30 Dias, Relatório Final, Indicadores de Satisfação, Avaliação Pós-Programa |
  | Monitoramento e Avaliação — Painéis | Painel Geral de Indicadores, Eixo 1 — Inclusão, Eixo 2 — Alcance, Visita In Loco, Verificação Inicial — 30 Dias, Indicadores de Satisfação, Avaliação Pós-Programa |
  | Acompanhamento Financeiro | Novo Lançamento, Acompanhar Despesa e Painel Financeiro |

  Um usuário novo sempre nasce com `role: "user"` e todas as permissões desligadas — a elevação a administrador é sempre uma ação explícita, nunca automática.

## Configuração

**Pré-requisitos:** Node.js

1. Instale as dependências:
   `npm install`
2. Crie um projeto no [Firebase Console](https://console.firebase.google.com/), ative **Authentication** (e-mail/senha) e **Cloud Firestore**.
3. Copie as credenciais do projeto (config do app web) para `src/firebase.ts`.
4. Publique as regras de segurança em `firestore.rules` no seu projeto Firebase.
5. Ajuste `BOOTSTRAP_ADMIN_EMAIL` em `src/firebase.ts` e em `firestore.rules` para o e-mail que deve ser administrador antes de qualquer papel ser atribuído.
6. Rode o app localmente:
   `npm run dev`
7. Faça login com o e-mail de bootstrap, acesse Gestão do Aplicativo → Gestão de Usuários para cadastrar os demais usuários, e Acompanhamento Financeiro → Itens do Plano para cadastrar os itens orçamentários.

### Variáveis de ambiente do servidor (Vercel)

Necessárias apenas para as funções administrativas em `api/admin/*` (criação/exclusão de usuários) — **nunca** usar o prefixo `VITE_` nelas, pois variáveis `VITE_*` são embutidas no bundle público do navegador. Ver `.env.example` para os nomes exatos:

| Variável | Origem |
|---|---|
| `FIREBASE_ADMIN_PROJECT_ID` | Conta de serviço do Firebase (Console → Configurações do projeto → Contas de serviço) |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Idem |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Idem — colar como veio do JSON; o código converte `\n` literal automaticamente |
| `BOOTSTRAP_ADMIN_EMAIL` | Mesmo e-mail de `src/firebase.ts`/`firestore.rules` |

Sem essas variáveis cadastradas no ambiente de deploy, a Gestão de Usuários (criar/excluir) responde com erro — as demais funcionalidades do app não dependem delas.

## Estrutura de dados (Firestore)

`firebase-blueprint.json` documenta o schema das coleções originais do módulo financeiro (`users`, `budgetItems`, `ledger`, `settings/partnership`) — ele **não foi atualizado** para as coleções adicionadas pelo módulo de Monitoramento e Avaliação. As demais coleções em uso (ver `firestore.rules` para as regras completas):

| Coleção | Conteúdo |
|---|---|
| `periodos` | Metadados das competências importadas na Apuração Mensal |
| `colaboradores_aaaa_mm` | Uma coleção por competência, com a classificação de vínculo já calculada na ingestão |
| `visitas_inloco_caser` | Visita In Loco — um documento por data (ID = `AAAA-MM-DD`), status rascunho/finalizada |
| `verificacao30dias_aaaa_mm` + `verificacao30dias_periodos` | Formulários de Verificação Inicial — 30 Dias, por período de aplicação |
| `pesquisas_aprendiz_respostas`, `pesquisas_mentor_respostas`, `pesquisas_responsavel_respostas`, `pesquisas_egresso_respostas` | Respostas normalizadas dos 4 instrumentos de pesquisa |
| `pesquisas_importacoes` | Histórico imutável de importações das pesquisas |
| `relatorioFinalRascunho` | Rascunho compartilhado do Relatório Final de Execução do Objeto |
| `deletedUsers` | Registro mínimo (UID + data) de contas excluídas, usado só para impedir que um token antigo recrie o próprio cadastro |

O Painel Geral de Indicadores não persiste nenhuma coleção própria — ele lê e recalcula a partir das coleções acima, pelos mesmos serviços já usados pelos painéis individuais.
