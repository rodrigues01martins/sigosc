# Firebase do SIGOSC — configuração e isolamento (SIGOSC-EV-002)

O SIGOSC usa **somente** o projeto Firebase `sigosc-8f529`. Este documento registra o que foi herdado do aplicativo de origem, como a configuração está organizada agora e o que precisa ser feito manualmente no Firebase Console.

## 1. Arquitetura atual

| Camada | Arquivo | Projeto |
|---|---|---|
| Configuração validada (cliente) | `src/config/firebaseConfig.js` | `sigosc-8f529`, lido de `VITE_FIREBASE_*` |
| Inicialização única do Client SDK (Auth + Firestore) | `src/firebase.ts` | idem; `getApps().length ? getApp() : initializeApp(...)` |
| Tela de erro de configuração | `src/main.tsx` | valida antes de carregar o App |
| Admin SDK (servidor, `api/admin/*`) | `api/_lib/firebaseAdmin.ts` | exige `FIREBASE_ADMIN_PROJECT_ID=sigosc-8f529` |
| Verificação automática de isolamento | `src/config/firebaseIsolation.test.js` | roda em `npm test` |

- **Sem fallback.** Se uma variável faltar, ou se `projectId`, `authDomain` ou `storageBucket` não forem os do `sigosc-8f529`, o app mostra "O aplicativo não pôde ser iniciado" com a lista de problemas. Do lado do servidor, as funções `api/admin/*` respondem com erro 500.
- **Storage não é usado.** Nenhum componente faz upload ou download pelo Firebase Storage: os anexos do ledger ficam no próprio documento do Firestore, em `documentData`. Por isso o Storage não é inicializado. O bucket `sigosc-8f529.firebasestorage.app` faz parte da configuração e é validado, mas nenhum código o acessa.

## 2. Referências herdadas encontradas

| Onde | O que havia | Situação |
|---|---|---|
| `src/firebase.ts` | Configuração web do projeto de origem `sgma-tcrioverde20262` escrita direto no código, incluindo `measurementId` | **Removida.** Agora vem de variáveis de ambiente, com validação |
| `api/_lib/firebaseAdmin.ts` | Aceitava credenciais de qualquer projeto | **Corrigido.** Só aceita `sigosc-8f529` |
| `scripts/limpar-visitas-in-loco-antigas.mjs` | Script de manutenção pontual do app de origem; só roda contra `sgma-tcrioverde20262` | **Mantido como legado.** Não faz parte do app, não é importado nem executado no build. Não foi apontado para o SIGOSC porque é um script de exclusão de dados |
| `scripts/export-japrendiz-data.mjs` | Backup do projeto `japrendiz-2026`, anterior ao app de origem | **Mantido como legado**, pelo mesmo motivo |
| `scripts/README.md`, `src/index.css` (comentário) | Menções históricas | Mantidas como documentação |
| `BOOTSTRAP_ADMIN_EMAIL` (`src/firebase.ts`, `firestore.rules`, variável do servidor) | E-mail de administrador inicial herdado | **Substituído** por `rodrigues01martins@gmail.com`, confirmado pelo responsável. Os valores do cliente e das regras são conferidos por `firebaseIsolation.test.js` |

Não existiam `firebase.json`, `.firebaserc`, `firestore.indexes.json`, `storage.rules` nem `vercel.json`. Também não havia uma segunda inicialização do Firebase em nenhum lugar do código.

## 3. Segurança

- `firestore.rules`: as regras foram revisadas e **não foram alteradas**. Todas as coleções exigem autenticação e permissão específica, e qualquer caminho não listado é bloqueado (`allow read, write: if false`). Não existe nenhuma regra `if true`.
- As regras são compatíveis com as operações do app: `users` é criado no primeiro login com zero permissões, e `ledger`, `periodos`, `colaboradores_*`, `visitas_inloco_caser`, `verificacao30dias_*`, `pesquisas_*` e `relatorioFinalRascunho` são cobertas.
- Índices: as consultas usam um único campo (`orderBy('createdAt')`, `orderBy('periodo')`, `where('surveyType')`). Os índices automáticos do Firestore bastam, e **nenhum índice composto é necessário**.
- A `apiKey` do app web **não é segredo**: ela vai no bundle público, como em todo app Firebase web. Por isso ela já vem preenchida no `.env.example`. Credenciais de conta de serviço **nunca** vão para o repositório.

## 4. Configuração manual no Firebase Console (pendente)

> Teste feito em 04/11/2026: uma tentativa de login no projeto `sigosc-8f529` retornou `CONFIGURATION_NOT_FOUND`. Isso indica que **o Authentication ainda não foi ativado** nesse projeto. Até essa etapa ser feita, nenhum usuário consegue entrar.

Em https://console.firebase.google.com/project/sigosc-8f529 :

1. **Authentication**
   1. Em *Build → Authentication*, clique em **Get started**.
   2. Na aba *Sign-in method*, ative **E-mail/senha**. Deixe *link de e-mail (login sem senha)* desativado.
   3. Na aba *Settings → Authorized domains*, confira se `localhost` e `sigosc-8f529.firebaseapp.com` aparecem e **adicione o domínio de produção da Vercel** (por exemplo, `sigosc.vercel.app` ou o domínio próprio).
   4. Opcional: em *Templates → Password reset*, ajuste o remetente e o texto. O app usa redefinição de senha na Gestão de Usuários.
2. **Cloud Firestore**
   1. Em *Build → Firestore Database*, clique em **Create database**, escolha o modo **production** e uma região (sugestão: `southamerica-east1`, São Paulo; não dá para mudar depois).
   2. Na aba *Rules*, cole o conteúdo de `firestore.rules` e clique em **Publish**. Antes, confirme o e-mail de bootstrap (passo 4).
3. **Storage**: não precisa ativar, porque o app não usa.
4. **Primeiro administrador**: o e-mail de bootstrap é `rodrigues01martins@gmail.com`, já definido em `src/firebase.ts` e `firestore.rules`. Cadastre o mesmo valor na variável `BOOTSTRAP_ADMIN_EMAIL` da Vercel e crie esse usuário **manualmente** em *Authentication → Users → Add user*. O app não cria usuários automaticamente.
5. **Conta de serviço (para `api/admin/*`)**: em *Configurações do projeto → Contas de serviço → Gerar nova chave privada*, baixe o JSON e **não o commite**.

## 5. Variáveis de ambiente na Vercel

Cadastre em *Project Settings → Environment Variables* (Production, Preview e Development) e faça um novo deploy:

| Variável | Valor |
|---|---|
| `VITE_FIREBASE_API_KEY` … `VITE_FIREBASE_APP_ID` (6 no total) | Copie de `.env.example` |
| `FIREBASE_ADMIN_PROJECT_ID` | `sigosc-8f529` |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | `client_email` do JSON da conta de serviço |
| `FIREBASE_ADMIN_PRIVATE_KEY` | `private_key` do JSON da conta de serviço |
| `BOOTSTRAP_ADMIN_EMAIL` | `rodrigues01martins@gmail.com` |

As variáveis `VITE_*` são lidas **no build**. Se forem cadastradas depois do deploy, é preciso fazer um *Redeploy*.

Para desenvolvimento local:

```bash
cp .env.example .env
```

## 6. Dados

Nenhum dado, usuário ou arquivo foi copiado do projeto de origem, e nenhum dado foi criado no `sigosc-8f529`. O app não precisa de documentos iniciais: `users/{uid}` é criado no primeiro login, e `settings/partnership` e os demais são preenchidos pela própria interface.
