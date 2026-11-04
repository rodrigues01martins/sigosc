# Scripts de migração — monitora-japrendiz → ptrenapsi

> **Legado (SIGOSC-EV-002).** Estes scripts foram herdados do aplicativo de
> origem e operam sobre projetos Firebase **externos ao SIGOSC**
> (`japrendiz-2026`, `sgma-tcrioverde20262`). Não fazem parte do app, não
> devem ser executados no contexto do SIGOSC e foram mantidos só como
> histórico. O SIGOSC usa exclusivamente `sigosc-8f529` — ver
> `docs/FIREBASE_SIGOSC.md`.

Scripts de uso único ligados à Fase 0/1 do roteiro de integração (ver a página
publicada compartilhada com o time). Não fazem parte do app em produção.

## `export-japrendiz-data.mjs` — Fase 0 (backup)

Exporta as coleções `periodos` e `colaboradores_AAAA_MM` do projeto Firebase
`japrendiz-2026` para arquivos JSON locais, antes de qualquer migração.

**Pré-requisitos:**

1. No [Firebase Console](https://console.firebase.google.com/) do projeto
   `japrendiz-2026`: **Configurações do projeto → Contas de serviço → Gerar
   nova chave privada**. Salve o arquivo baixado nesta pasta (raiz do repo)
   como `japrendiz-serviceAccountKey.json` — esse padrão de nome já está no
   `.gitignore`, então nunca será commitado.
2. Instalar a dependência (já está em `devDependencies`):
   ```
   npm install
   ```

**Executar:**

```bash
GOOGLE_APPLICATION_CREDENTIALS=./japrendiz-serviceAccountKey.json \
  node scripts/export-japrendiz-data.mjs
```

O resultado fica em `./backups/japrendiz-<timestamp>/` (pasta ignorada pelo
git — contém dados pessoais de aprendizes, nunca deve ser versionada).
Copie essa pasta para um local seguro fora do repositório antes de seguir
para a Fase 1 (importação no projeto `ptrenapsi`).

## `limpar-visitas-in-loco-antigas.mjs` — exclusão da Visita In Loco Teórica/Prática

Apaga os registros históricos dos dois instrumentos substituídos pela Visita
In Loco única. Critério determinístico: apaga **somente** as coleções
`visitas_inloco` (Teórica) e `visitas_inloco_pratica` (Prática), inteiras,
por nome exato. A coleção nova `visitas_inloco_caser` e todas as demais não
são tocadas. Recusa rodar se a chave não for do projeto `sgma-tcrioverde20262`.

1. Gere a chave da conta de serviço do projeto `sgma-tcrioverde20262` e salve
   como `./sgma-serviceAccountKey.json` (ignorado pelo git).
2. Contagem (não apaga nada):
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=./sgma-serviceAccountKey.json \
     node scripts/limpar-visitas-in-loco-antigas.mjs
   ```
3. Exclusão (gera backup JSON em `./backups/` antes):
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=./sgma-serviceAccountKey.json \
     node scripts/limpar-visitas-in-loco-antigas.mjs --executar
   ```

Alternativa sem script: Firebase Console → Firestore Database → coleção
`visitas_inloco` → ⋮ → **Excluir coleção** (repetir para
`visitas_inloco_pratica`).
