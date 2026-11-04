// Validação da configuração Firebase do SIGOSC (SIGOSC-EV-002) — `npm test`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  resolveFirebaseConfig,
  FirebaseConfigError,
  FIREBASE_ENV_VARS,
  EXPECTED_FIREBASE_PROJECT_ID,
} from './firebaseConfig.js'

const ENV_VALIDO = {
  VITE_FIREBASE_API_KEY: 'chave-web-de-teste',
  VITE_FIREBASE_AUTH_DOMAIN: 'sigosc-8f529.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'sigosc-8f529',
  VITE_FIREBASE_STORAGE_BUCKET: 'sigosc-8f529.firebasestorage.app',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '559907813043',
  VITE_FIREBASE_APP_ID: '1:559907813043:web:f744dfb215dc900e84e2c6',
}

test('aceita a configuração do projeto sigosc-8f529', () => {
  const config = resolveFirebaseConfig(ENV_VALIDO)
  assert.equal(config.projectId, 'sigosc-8f529')
  assert.equal(config.authDomain, 'sigosc-8f529.firebaseapp.com')
  assert.equal(config.storageBucket, 'sigosc-8f529.firebasestorage.app')
  assert.equal(EXPECTED_FIREBASE_PROJECT_ID, 'sigosc-8f529')
})

test('falha de forma explícita quando não há nenhuma variável (sem fallback)', () => {
  assert.throws(() => resolveFirebaseConfig({}), (err) => {
    assert.ok(err instanceof FirebaseConfigError)
    for (const variavel of Object.values(FIREBASE_ENV_VARS)) {
      assert.match(err.message, new RegExp(variavel))
    }
    return true
  })
})

test('falha quando uma variável obrigatória está vazia', () => {
  assert.throws(
    () => resolveFirebaseConfig({ ...ENV_VALIDO, VITE_FIREBASE_APP_ID: '  ' }),
    /VITE_FIREBASE_APP_ID não definida/
  )
})

test('recusa o projeto do aplicativo de origem', () => {
  assert.throws(
    () => resolveFirebaseConfig({
      ...ENV_VALIDO,
      VITE_FIREBASE_PROJECT_ID: 'sgma-tcrioverde20262',
      VITE_FIREBASE_AUTH_DOMAIN: 'sgma-tcrioverde20262.firebaseapp.com',
      VITE_FIREBASE_STORAGE_BUCKET: 'sgma-tcrioverde20262.firebasestorage.app',
    }),
    (err) => {
      assert.match(err.message, /aplicativo de origem/)
      assert.equal(err.problemas.length, 3) // projectId, authDomain e bucket
      return true
    }
  )
})

test('recusa qualquer outro projeto, authDomain ou bucket divergente', () => {
  assert.throws(() => resolveFirebaseConfig({ ...ENV_VALIDO, VITE_FIREBASE_PROJECT_ID: 'outro' }), /projectId "outro" inesperado/)
  assert.throws(() => resolveFirebaseConfig({ ...ENV_VALIDO, VITE_FIREBASE_AUTH_DOMAIN: 'x.firebaseapp.com' }), /authDomain/)
  assert.throws(() => resolveFirebaseConfig({ ...ENV_VALIDO, VITE_FIREBASE_STORAGE_BUCKET: 'sigosc-8f529.appspot.com' }), /storageBucket/)
})
