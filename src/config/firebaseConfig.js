// ============================================================
// CONFIGURAÇÃO FIREBASE — SIGOSC (SIGOSC-EV-002)
// ============================================================
// Fonte única da configuração do Client SDK. Os valores vêm das
// variáveis VITE_FIREBASE_* (ver .env.example) e são validados ANTES de
// qualquer initializeApp(): se faltar algum valor ou se eles apontarem
// para um projeto diferente de `sigosc-8f529`, a aplicação não inicia e
// mostra o motivo. Não existe fallback: nenhum valor padrão, muito menos
// o do projeto Firebase do aplicativo de origem.
//
// Módulo em JS puro e sem import do SDK, para ser testável com
// `npm test` (node --test) e reutilizável pelo main.tsx.

/** Único projeto Firebase autorizado para o SIGOSC. */
export const EXPECTED_FIREBASE_PROJECT_ID = 'sigosc-8f529';
export const EXPECTED_AUTH_DOMAIN = `${EXPECTED_FIREBASE_PROJECT_ID}.firebaseapp.com`;
export const EXPECTED_STORAGE_BUCKET = `${EXPECTED_FIREBASE_PROJECT_ID}.firebasestorage.app`;

/**
 * Projetos Firebase herdados do código de origem. Servem apenas como
 * lista de bloqueio (mensagem de erro mais clara e verificação de
 * isolamento no teste), nunca como configuração.
 */
export const LEGACY_FIREBASE_PROJECT_IDS = Object.freeze([
  'sgma-tcrioverde20262',
  'japrendiz-2026',
]);

/** Campo do firebaseConfig → variável de ambiente correspondente. */
export const FIREBASE_ENV_VARS = Object.freeze({
  apiKey: 'VITE_FIREBASE_API_KEY',
  authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
  projectId: 'VITE_FIREBASE_PROJECT_ID',
  storageBucket: 'VITE_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'VITE_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'VITE_FIREBASE_APP_ID',
});

export class FirebaseConfigError extends Error {
  /** @param {string[]} problemas */
  constructor(problemas) {
    super(
      'Configuração do Firebase inválida para o SIGOSC:\n- ' +
        problemas.join('\n- ') +
        '\nConfira as variáveis VITE_FIREBASE_* (ver .env.example).'
    );
    this.name = 'FirebaseConfigError';
    this.problemas = problemas;
  }
}

/**
 * Monta e valida o firebaseConfig a partir de um objeto de ambiente
 * (no app: import.meta.env). Lança FirebaseConfigError com todos os
 * problemas encontrados de uma vez.
 *
 * @param {Record<string, string | undefined>} env
 * @returns {{apiKey: string, authDomain: string, projectId: string,
 *   storageBucket: string, messagingSenderId: string, appId: string}}
 */
export function resolveFirebaseConfig(env) {
  const problemas = [];
  /** @type {Record<string, string>} */
  const config = {};

  for (const [campo, variavel] of Object.entries(FIREBASE_ENV_VARS)) {
    const valor = typeof env?.[variavel] === 'string' ? env[variavel].trim() : '';
    if (!valor) problemas.push(`${variavel} não definida.`);
    config[campo] = valor;
  }

  const { projectId, authDomain, storageBucket } = config;

  if (projectId && projectId !== EXPECTED_FIREBASE_PROJECT_ID) {
    const herdado = LEGACY_FIREBASE_PROJECT_IDS.includes(projectId)
      ? ' (projeto do aplicativo de origem — uso proibido no SIGOSC)'
      : '';
    problemas.push(
      `projectId "${projectId}" inesperado${herdado}; esperado "${EXPECTED_FIREBASE_PROJECT_ID}".`
    );
  }
  if (authDomain && authDomain !== EXPECTED_AUTH_DOMAIN) {
    problemas.push(`authDomain "${authDomain}" inesperado; esperado "${EXPECTED_AUTH_DOMAIN}".`);
  }
  if (storageBucket && storageBucket !== EXPECTED_STORAGE_BUCKET) {
    problemas.push(
      `storageBucket "${storageBucket}" inesperado; esperado "${EXPECTED_STORAGE_BUCKET}".`
    );
  }

  if (problemas.length > 0) throw new FirebaseConfigError(problemas);
  return /** @type {any} */ (config);
}
