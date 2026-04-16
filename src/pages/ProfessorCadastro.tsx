import { useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle, Loader2, User, Mail, Lock, GraduationCap, Sparkles, Phone } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';

const LOGO_URL = "/logo.png";
const CHILDREN_IMAGE = "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&auto=format&fit=crop";

interface FormData {
  nome: string;
  email: string;
  senha: string;
  confirmar_senha: string;
}

export default function ProfessorCadastro() {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    nome: '',
    email: '',
    senha: '',
    confirmar_senha: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validar senhas
    if (formData.senha !== formData.confirmar_senha) {
      setError('As senhas não coincidem!');
      return;
    }

    if (formData.senha.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres!');
      return;
    }

    setLoading(true);

    try {
      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.senha,
        options: {
          data: {
            nome: formData.nome,
            tipo: 'teacher'
          }
        }
      });

      if (authError) {
        // Se já existe usuário com este email
        if (authError.message.includes('already registered') || authError.message.includes('User already registered')) {
          setError('Este e-mail já está cadastrado. Por favor, use outro e-mail ou faça login.');
          setLoading(false);
          return;
        }

        // Se atingiu o limite de tentativas (429)
        if (authError.message.includes('rate limit') || authError.status === 429) {
          setError('⏳ Muitas tentativas recentes! Por favor, aguarde alguns minutos antes de tentar novamente, ou use outro e-mail.');
          setLoading(false);
          return;
        }

        throw authError;
      }

      if (!authData.user) {
        throw new Error('Erro ao criar usuário');
      }

      // 2. Criar registro em user_roles usando a função RPC
      const { data: roleData, error: roleError } = await supabase.rpc('criar_user_role', {
        p_user_id: authData.user.id,
        p_role: 'teacher',
        p_assigned_class: null
      });

      if (roleError) {
        console.error('Erro ao criar user_role:', roleError);
        throw new Error('Erro ao configurar permissões: ' + roleError.message);
      }

      console.log('User role criado:', roleData);

      setStep('success');
    } catch (error: any) {
      console.error('Erro completo:', error);
      setError('Erro ao criar conta: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNewCadastro = () => {
    setFormData({
      nome: '',
      email: '',
      senha: '',
      confirmar_senha: '',
    });
    setError(null);
    setStep('form');
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[2rem] shadow-2xl p-12 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-3xl font-bold text-blue-600 mb-4">
            Conta Criada!
          </h1>

          <p className="text-slate-600 mb-6">
            Bem-vindo(a), <span className="font-bold text-blue-500">{formData.nome}</span>!
          </p>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-green-800 mb-2">
              <span className="font-bold">✅ Conta de professor criada!</span>
            </p>
            <p className="text-sm text-green-700">
              Seu login: <span className="font-bold">{formData.email}</span>
            </p>
            <p className="text-xs text-green-600 mt-2">
              Acesse o sistema em: <a href="/" className="underline font-medium">localhost:3000</a>
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-800">
              <span className="font-bold">🎓 Privilégios de Professor:</span>
            </p>
            <ul className="text-xs text-blue-700 mt-2 text-left">
              <li>• Criar e gerenciar eventos na agenda</li>
              <li>• Enviar e receber mensagens dos pais</li>
              <li>• Upload de fotos das turmas</li>
              <li>• Gerenciar alunos e turmas</li>
            </ul>
          </div>

          <button
            onClick={handleNewCadastro}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl px-8 py-3 font-semibold transition-all shadow-lg"
          >
            Cadastrar Outro Professor
          </button>

          <a
            href="/"
            className="block mt-4 text-blue-500 hover:underline font-medium text-sm"
          >
            Ir para o login
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Lado Esquerdo - Imagem com Gradiente Azul */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        {/* Gradiente de fundo */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-indigo-400 to-purple-400" />

        {/* Imagem das crianças */}
        <img
          src={CHILDREN_IMAGE}
          alt="Crianças brincando"
          className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-40"
          referrerPolicy="no-referrer"
        />

        {/* Overlay com logo e frase */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

        <div className="absolute inset-0 flex flex-col justify-between p-12 text-white">
          {/* Topo - Logo */}
          <div>
            <img src={LOGO_URL} alt="Logo" className="w-16 h-16 rounded-xl shadow-lg mb-4" referrerPolicy="no-referrer" />
            <h1 className="text-3xl font-bold">Escola Recanto Alegre</h1>
          </div>

          {/* Centro - Frase inspiradora */}
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-4xl font-bold mb-4 leading-tight">
                Educadores que transformam vidas!
              </h2>
              <p className="text-xl opacity-90">
                Junte-se à nossa equipe de professores
              </p>
            </motion.div>
          </div>

          {/* Baixo - Decoracoes */}
          <div className="flex justify-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-full backdrop-blur-sm" />
            <div className="w-8 h-8 bg-white/20 rounded-full backdrop-blur-sm" />
            <div className="w-10 h-10 bg-white/20 rounded-full backdrop-blur-sm" />
          </div>
        </div>
      </div>

      {/* Lado Direito - Formulário */}
      <div className="w-full lg:w-1/2 min-h-screen bg-[#F0F4FF] flex flex-col">
        {/* Header Mobile */}
        <div className="lg:hidden bg-gradient-to-r from-blue-500 to-indigo-400 p-4">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="Logo" className="w-12 h-12 rounded-xl" referrerPolicy="no-referrer" />
            <div className="text-white">
              <h1 className="text-xl font-bold">Escola Recanto Alegre</h1>
              <p className="text-sm opacity-90">Cadastro de Professores</p>
            </div>
          </div>
        </div>

        {/* Conteúdo do Formulário */}
        <div className="flex-1 p-6 md:p-12 overflow-y-auto">
          {/* Header Desktop */}
          <div className="hidden lg:flex items-center gap-4 mb-8">
            <img src={LOGO_URL} alt="Logo" className="w-14 h-14 rounded-xl shadow-md" referrerPolicy="no-referrer" />
            <div>
              <h1 className="text-2xl font-bold text-blue-600">Escola Recanto Alegre</h1>
              <p className="text-slate-600">Cadastro de Professores</p>
            </div>
          </div>

          {/* Título Principal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
              Criar Conta de Professor
            </h2>
            <p className="text-slate-600">
              Preencha seus dados para acessar o sistema como professor.
            </p>
          </motion.div>

          {/* Mensagem de erro */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dados Pessoais */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-blue-600">Dados Pessoais</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nome Completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Seu nome completo"
                    className="w-full px-4 py-3 rounded-xl border-2 border-blue-100 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* Dados de Acesso */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-sm border-2 border-blue-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-blue-600">Dados de Acesso</h3>
                  <p className="text-sm text-slate-500">Crie suas credenciais de login</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    E-mail <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="seu@email.com"
                    className="w-full px-4 py-3 rounded-xl border-2 border-blue-100 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Senha <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={formData.senha}
                      onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full px-4 py-3 rounded-xl border-2 border-blue-100 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Confirmar Senha <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={formData.confirmar_senha}
                      onChange={(e) => setFormData({ ...formData, confirmar_senha: e.target.value })}
                      placeholder="Digite a senha novamente"
                      className="w-full px-4 py-3 rounded-xl border-2 border-blue-100 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition"
                    />
                  </div>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                  <p className="text-sm text-indigo-800">
                    <span className="font-bold">🎓 Ao criar sua conta de professor:</span>
                  </p>
                  <ul className="text-xs text-indigo-700 mt-2 space-y-1">
                    <li>• Você poderá gerenciar a agenda da escola</li>
                    <li>• Enviar e receber mensagens dos pais</li>
                    <li>• Fazer upload de fotos das atividades</li>
                    <li>• Gerenciar alunos e suas turmas</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Botão Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 disabled:from-slate-300 disabled:to-slate-400 text-white rounded-xl py-4 font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl disabled:shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Criando conta...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Criar Conta de Professor
                </>
              )}
            </button>

            <p className="text-center text-sm text-slate-500">
              Já tem conta? <a href="/" className="text-blue-500 hover:underline font-medium">Faça login</a>
            </p>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-blue-100 text-center text-sm text-slate-600">
            <p>© {new Date().getFullYear()} Escola Recanto Alegre</p>
            <p className="mt-2">
              Serra dos Orgãos, 586 - Ribeiro de Abreu - Belo Horizonte - MG - CEP: 31872-300
            </p>
            <p className="mt-1 flex items-center justify-center gap-4">
              <a
                href="https://wa.me/5531975741515"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-slate-600 hover:text-green-600 transition-colors"
              >
                <Phone className="w-3 h-3" />
                (31) 97574-1515
              </a>
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3" />
                contato@recantoalegre.com.br
              </span>
            </p>
            <p className="mt-1">
              Sistema desenvolvido por{' '}
              <a href="https://nodoprime.com.br" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline font-medium">
                Nodo Prime
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
