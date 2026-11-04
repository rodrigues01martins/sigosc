import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import './index.css';
import {resolveFirebaseConfig, FirebaseConfigError} from './config/firebaseConfig.js';

const root = createRoot(document.getElementById('root')!);

// Valida a configuração do Firebase ANTES de carregar o App (que importa
// src/firebase.ts). Assim, configuração ausente ou de outro projeto vira
// uma mensagem explícita na tela em vez de uma página em branco.
let configError: string | null = null;
try {
  resolveFirebaseConfig(import.meta.env);
} catch (error) {
  configError = error instanceof FirebaseConfigError ? error.message : String(error);
  console.error(configError);
}

if (configError) {
  root.render(
    <div role="alert" className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="max-w-lg w-full rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        <p className="font-semibold mb-2">O aplicativo não pôde ser iniciado.</p>
        <pre className="whitespace-pre-wrap font-[inherit]">{configError}</pre>
      </div>
    </div>,
  );
} else {
  import('./App.tsx').then(({default: App}) => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  });
}
