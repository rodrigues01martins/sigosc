// Verificação de isolamento Firebase do SIGOSC (SIGOSC-EV-002) — `npm test`.
// Varre o código ativo (src/, api/, arquivos de configuração da raiz) e
// falha se aparecer: identificador de projeto Firebase herdado, segunda
// inicialização do SDK, config web hardcoded, divergência entre cliente e
// servidor ou regra Firestore pública. Ficam de fora docs/ (histórico) e
// scripts/ (scripts legados de migração do app de origem, documentados em
// scripts/README.md — não fazem parte do runtime do app).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  EXPECTED_FIREBASE_PROJECT_ID,
  LEGACY_FIREBASE_PROJECT_IDS,
  resolveFirebaseConfig,
} from './firebaseConfig.js'

const RAIZ = fileURLToPath(new URL('../../', import.meta.url))
const EXTENSOES = /\.(ts|tsx|js|jsx|mjs|cjs|json|html|rules)$/
const ESTE_ARQUIVO = relative(RAIZ, fileURLToPath(import.meta.url))
// Arquivos que citam os IDs herdados de propósito (lista de bloqueio e testes).
const PERMITIDOS_LEGADO = new Set([
  join('src', 'config', 'firebaseConfig.js'),
  join('src', 'config', 'firebaseConfig.test.js'),
  ESTE_ARQUIVO,
])

function listar(dir) {
  const abs = join(RAIZ, dir)
  if (!existsSync(abs)) return []
  return readdirSync(abs).flatMap((nome) => {
    const caminho = join(dir, nome)
    return statSync(join(RAIZ, caminho)).isDirectory() ? listar(caminho) : [caminho]
  })
}

const ARQUIVOS_ATIVOS = [
  ...listar('src'),
  ...listar('api'),
  'index.html', 'vite.config.ts', 'package.json', 'firestore.rules',
  'firebase-blueprint.json', '.env.example',
  'firebase.json', '.firebaserc', 'vercel.json', 'storage.rules', 'firestore.indexes.json',
].filter((f) => existsSync(join(RAIZ, f)) && (EXTENSOES.test(f) || f === '.env.example' || f === '.firebaserc'))

const ler = (f) => readFileSync(join(RAIZ, f), 'utf8')
// Remove comentários para que menções em texto não contem como chamadas.
const semComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')

test('nenhum identificador de projeto Firebase herdado no código ativo', () => {
  const ocorrencias = []
  for (const arquivo of ARQUIVOS_ATIVOS) {
    if (PERMITIDOS_LEGADO.has(arquivo)) continue
    const conteudo = ler(arquivo)
    for (const id of LEGACY_FIREBASE_PROJECT_IDS) {
      if (conteudo.includes(id)) ocorrencias.push(`${arquivo}: ${id}`)
    }
  }
  assert.deepEqual(ocorrencias, [])
})

test('Firebase é inicializado só em src/firebase.ts (cliente) e api/_lib/firebaseAdmin.ts (servidor)', () => {
  const permitidos = new Set([join('src', 'firebase.ts'), join('api', '_lib', 'firebaseAdmin.ts')])
  const chamadas = /\b(initializeApp|getAuth|getFirestore|getStorage)\s*\(/
  const infratores = ARQUIVOS_ATIVOS.filter(
    (f) => !permitidos.has(f) && f !== ESTE_ARQUIVO && chamadas.test(semComentarios(ler(f)))
  )
  assert.deepEqual(infratores, [])
})

test('src/firebase.ts usa configuração validada e inicialização idempotente', () => {
  const fonte = ler(join('src', 'firebase.ts'))
  assert.match(fonte, /resolveFirebaseConfig\(import\.meta\.env\)/)
  assert.match(fonte, /getApps\(\)\.length \? getApp\(\) : initializeApp\(/)
  assert.equal((fonte.match(/initializeApp\(/g) || []).length, 1)
  assert.doesNotMatch(fonte, /AIza[0-9A-Za-z_-]{20,}/, 'config web não pode ficar hardcoded')
})

test('nenhuma chave web Firebase hardcoded em src/ ou api/', () => {
  const infratores = ARQUIVOS_ATIVOS.filter(
    (f) => (f.startsWith('src' + sep) || f.startsWith('api' + sep)) && /AIza[0-9A-Za-z_-]{20,}/.test(ler(f))
  )
  assert.deepEqual(infratores, [])
})

test('Admin SDK (servidor) exige o mesmo projeto do cliente', () => {
  const fonte = ler(join('api', '_lib', 'firebaseAdmin.ts'))
  const m = fonte.match(/EXPECTED_ADMIN_PROJECT_ID = '([^']+)'/)
  assert.ok(m, 'constante EXPECTED_ADMIN_PROJECT_ID não encontrada')
  assert.equal(m[1], EXPECTED_FIREBASE_PROJECT_ID)
  assert.match(fonte, /projectId !== EXPECTED_ADMIN_PROJECT_ID/)
})

test('.env.example documenta uma configuração cliente válida para sigosc-8f529', () => {
  const env = Object.fromEntries(
    ler('.env.example').split('\n')
      .filter((l) => /^VITE_FIREBASE_[A-Z_]+=/.test(l))
      .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)])
  )
  assert.equal(resolveFirebaseConfig(env).projectId, EXPECTED_FIREBASE_PROJECT_ID)
})

test('firestore.rules não tem acesso público irrestrito', () => {
  const regras = ler('firestore.rules')
  assert.doesNotMatch(regras, /allow\s+[a-z, ]+:\s*if\s+true\s*;/)
  assert.match(regras, /match \/\{document=\*\*\}\s*\{\s*allow read, write: if false;/)
})
