import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { resolveFirebaseConfig } from './config/firebaseConfig.js';

// ============================================================
// FIREBASE CLIENT SDK — ponto ÚNICO de inicialização (SIGOSC-EV-002)
// ============================================================
// Todos os componentes e serviços importam `auth`/`db` daqui; nenhum
// outro arquivo de src/ pode chamar initializeApp/getAuth/getFirestore
// (verificado em src/config/firebaseIsolation.test.js).
//
// A configuração vem das variáveis VITE_FIREBASE_* e é validada contra o
// projeto `sigosc-8f529` — valor ausente ou projeto diferente lança
// FirebaseConfigError antes de qualquer conexão (sem fallback).
// Storage não é usado pelo app, por isso não é inicializado.
export const firebaseConfig = resolveFirebaseConfig(import.meta.env);

// Idempotente: reaproveita o app já criado (ex.: HMR do Vite em dev).
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

// E-mail com acesso de administrador mesmo antes de existir um documento
// /users/{uid} com role "admin" (bootstrap do primeiro administrador).
// Precisa corresponder ao valor equivalente em firestore.rules.
export const BOOTSTRAP_ADMIN_EMAIL = 'juliano.mrodrigues@goias.gov.br';
