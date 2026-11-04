import React, { useState } from 'react';
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { auth } from '../firebase';
import { Mail, Key } from 'lucide-react';
import { TextInput } from './ui/FormField';
import { Button } from './ui/Button';
import { BrandWordmark } from './ui/BrandWordmark';

interface LoginProps {
  showToast: (message: string) => void;
  onDemoMode: () => void;
}

export const Login: React.FC<LoginProps> = ({ showToast }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Define a persistência para a sessão do navegador
      // Isso força o logout quando a aba ou o browser é fechado
      await setPersistence(auth, browserSessionPersistence);

      await signInWithEmailAndPassword(auth, email, password);

      showToast("Acesso autorizado! Bem-vindo.");
    } catch (error: any) {
      console.error("Erro de login:", error);
      showToast("E-mail ou senha incorretos. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">

      {/* ── Formulário ── */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-12">
        <div className="w-full max-w-sm mx-auto flex-1 flex flex-col justify-center">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Mail size={12} /> E-mail Institucional
              </label>
              <TextInput
                type="email"
                required
                variant="filled"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="p-4"
                placeholder="email registrado"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Key size={12} /> Senha
              </label>
              <TextInput
                type="password"
                required
                variant="filled"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="p-4"
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              loading={loading}
              size="lg"
              className="w-full rounded-2xl shadow-[#007770]/20"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </div>

        {/* ── Marcas ── */}
        <div className="w-full max-w-sm mx-auto flex items-center justify-center pt-10">
          <BrandWordmark size="md" />
        </div>
      </div>
    </div>
  );
};
