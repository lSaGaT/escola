import { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const LOGO_URL = "/logo.png";

interface PasswordResetProps {
  onBack: () => void;
}

export function PasswordReset({ onBack }: PasswordResetProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) throw resetError;

      setSuccess(true);
    } catch (err: any) {
      console.error('Error sending reset email:', err);
      setError(err.message || 'Erro ao enviar email de recuperação');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-pink-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[2rem] shadow-2xl p-12 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-3xl font-bold text-green-600 mb-4">
            Email Enviado!
          </h1>

          <p className="text-slate-600 mb-6">
            Enviamos um email de recuperação para:
          </p>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-green-800 font-medium">
              {email}
            </p>
          </div>

          <p className="text-sm text-slate-500 mb-6">
            Acesse seu email e clique no link para criar uma nova senha. O link expira em 1 hora.
          </p>

          <div className="space-y-3">
            <Button
              onClick={() => {
                setSuccess(false);
                setEmail('');
                onBack();
              }}
              className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-xl"
            >
              Voltar para o Login
            </Button>

            <button
              onClick={() => setSuccess(false)}
              className="w-full text-sm text-slate-500 hover:text-red-500 font-medium"
            >
              Enviar outro email
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-pink-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2rem] shadow-2xl p-12 max-w-md w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <img src={LOGO_URL} alt="Logo" className="w-16 h-16 mx-auto mb-4 rounded-xl shadow-md" referrerPolicy="no-referrer" />
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Recuperar Senha
          </h1>
          <p className="text-slate-600">
            Digite seu email para receber um link de recuperação
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="reset-email">E-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <Input
                id="reset-email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10 rounded-xl border-red-100 focus:border-red-400 focus:ring-red-50"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800">
              <span className="font-bold">📧 Você receberá um email</span> com um link seguro para criar uma nova senha.
            </p>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-xl h-12 font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar Email de Recuperação'
            )}
          </Button>

          <button
            type="button"
            onClick={onBack}
            className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-red-500 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para o Login
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-red-100 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Escolinha Recanto Alegre</p>
          <p className="mt-1">
            Serra dos Orgãos, 586 - Ribeiro de Abreu - Belo Horizonte - MG
          </p>
          <p className="mt-1">
            <a
              href="https://wa.me/5531975741515"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-green-600 transition-colors"
            >
              (31) 97574-1515
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
