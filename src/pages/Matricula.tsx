import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle, Loader2, Users, Phone, Baby, Sparkles, Mail } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';

const LOGO_URL = "https://i.postimg.cc/5yFN2tQq/Gemini-Generated-Image-fr4eslfr4eslfr4e-(1).png";
// Imagem de crianças - pode substituir por uma foto real da escola depois
const CHILDREN_IMAGE = "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&auto=format&fit=crop";

interface FormData {
  nome_aluno: string;
  nome_pai: string;
  nome_mae: string;
  telefone_contato: string;
  sala: string;
  data_nascimento: string;
  observacoes: string;
  email: string;
  senha: string;
  confirmar_senha: string;
}

interface Sala {
  id: string;
  nome: string;
}

export default function Matricula() {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [loading, setLoading] = useState(false);
  const [salas, setSalas] = useState<Sala[]>([]);

  const [formData, setFormData] = useState<FormData>({
    nome_aluno: '',
    nome_pai: '',
    nome_mae: '',
    telefone_contato: '',
    sala: '',
    data_nascimento: '',
    observacoes: '',
    email: '',
    senha: '',
    confirmar_senha: '',
  });

  useEffect(() => {
    fetchSalas();
  }, []);

  const fetchSalas = async () => {
    const { data } = await supabase
      .from('salas')
      .select('*')
      .eq('ativo', true)
      .order('nome');
    if (data) setSalas(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar senhas
    if (formData.senha !== formData.confirmar_senha) {
      alert('As senhas não coincidem!');
      return;
    }

    if (formData.senha.length < 6) {
      alert('A senha deve ter pelo menos 6 caracteres!');
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
            nome: formData.nome_mae || formData.nome_pai,
            tipo: 'parent'
          }
        }
      });

      if (authError) {
        // Se já existe usuário com este email, tenta fazer login
        if (authError.message.includes('already registered')) {
          alert('Este e-mail já está cadastrado. Por favor, faça login.');
          return;
        }

        // Se atingiu o limite de tentativas (429)
        if (authError.message.includes('rate limit') || authError.status === 429) {
          alert('⏳ Muitas tentativas recentes! Por favor, aguarde alguns minutos antes de tentar novamente, ou use outro e-mail.');
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
        p_role: 'parent',
        p_assigned_class: formData.sala
      });

      if (roleError) {
        console.error('Erro ao criar user_role:', roleError);
        throw new Error('Erro ao configurar permissões: ' + roleError.message);
      }

      console.log('User role criado:', roleData);

      // 3. Criar registro do aluno
      const { error: alunoError } = await supabase.from('alunos').insert([
        {
          nome_aluno: formData.nome_aluno,
          nome_pai: formData.nome_pai || null,
          nome_mae: formData.nome_mae || null,
          telefone_contato: formData.telefone_contato || null,
          sala: formData.sala,
          data_nascimento: formData.data_nascimento || null,
          observacoes: formData.observacoes || null,
        },
      ]);

      if (alunoError) throw alunoError;

      setStep('success');
    } catch (error: any) {
      console.error('Erro completo:', error);
      alert('Erro ao enviar matrícula: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNewMatricula = () => {
    setFormData({
      nome_aluno: '',
      nome_pai: '',
      nome_mae: '',
      telefone_contato: '',
      sala: '',
      data_nascimento: '',
      observacoes: '',
      email: '',
      senha: '',
      confirmar_senha: '',
    });
    setStep('form');
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-pink-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[2rem] shadow-2xl p-12 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-orange-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-3xl font-bold text-red-600 mb-4">
            Matrícula Enviada!
          </h1>

          <p className="text-slate-600 mb-6">
            Os dados de <span className="font-bold text-red-500">{formData.nome_aluno}</span> foram
            enviados com sucesso!
          </p>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-green-800 mb-2">
              <span className="font-bold">✅ Conta criada!</span>
            </p>
            <p className="text-sm text-green-700">
              Seu login: <span className="font-bold">{formData.email}</span>
            </p>
            <p className="text-xs text-green-600 mt-2">
              Acesse o sistema em: <a href="/" className="underline font-medium">localhost:3000</a>
            </p>
          </div>

          <p className="text-sm text-slate-500 mb-6">
            A escola entrará em contato em breve para confirmar a matrícula!
          </p>

          <button
            onClick={handleNewMatricula}
            className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-xl px-8 py-3 font-semibold transition-all shadow-lg"
          >
            Nova Matrícula
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Lado Esquerdo - Imagem com Gradiente Vermelho */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        {/* Gradiente de fundo */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-orange-400 to-pink-400" />

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
                Onde cada pequeno passo se torna uma grande aventura!
              </h2>
              <p className="text-xl opacity-90">
                Matrículas abertas para o ano letivo
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
      <div className="w-full lg:w-1/2 min-h-screen bg-[#FFF5F5] flex flex-col">
        {/* Header Mobile */}
        <div className="lg:hidden bg-gradient-to-r from-red-500 to-orange-400 p-4">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="Logo" className="w-12 h-12 rounded-xl" referrerPolicy="no-referrer" />
            <div className="text-white">
              <h1 className="text-xl font-bold">Escola Recanto Alegre</h1>
              <p className="text-sm opacity-90">Formulário de Matrícula</p>
            </div>
          </div>
        </div>

        {/* Conteúdo do Formulário */}
        <div className="flex-1 p-6 md:p-12 overflow-y-auto">
          {/* Header Desktop */}
          <div className="hidden lg:flex items-center gap-4 mb-8">
            <img src={LOGO_URL} alt="Logo" className="w-14 h-14 rounded-xl shadow-md" referrerPolicy="no-referrer" />
            <div>
              <h1 className="text-2xl font-bold text-red-600">Escola Recanto Alegre</h1>
              <p className="text-slate-600">Formulário de Matrícula</p>
            </div>
          </div>

          {/* Título Principal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
              Matrícula Online
            </h2>
            <p className="text-slate-600">
              Preencha os dados abaixo para iniciar a matrícula. Entraremos em contato em breve!
            </p>
          </motion.div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dados da Criança */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-orange-400 rounded-xl flex items-center justify-center">
                  <Baby className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-red-600">Dados da Criança</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nome Completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nome_aluno}
                    onChange={(e) => setFormData({ ...formData, nome_aluno: e.target.value })}
                    placeholder="Nome completo da criança"
                    className="w-full px-4 py-3 rounded-xl border-2 border-red-100 focus:border-red-400 focus:ring-4 focus:ring-red-50 outline-none transition"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Data de Nascimento <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.data_nascimento}
                      onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-orange-100 focus:border-orange-400 focus:ring-4 focus:ring-orange-50 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Sala/Turma <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.sala}
                      onChange={(e) => setFormData({ ...formData, sala: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-pink-100 focus:border-pink-400 focus:ring-4 focus:ring-pink-50 outline-none transition"
                    >
                      <option value="">Selecione a sala</option>
                      {salas.map((sala) => (
                        <option key={sala.id} value={sala.nome}>
                          {sala.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Dados dos Responsáveis */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-400 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-orange-600">Responsáveis</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nome da Mãe <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nome_mae}
                    onChange={(e) => setFormData({ ...formData, nome_mae: e.target.value })}
                    placeholder="Nome completo da mãe"
                    className="w-full px-4 py-3 rounded-xl border-2 border-red-100 focus:border-red-400 focus:ring-4 focus:ring-red-50 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nome do Pai
                  </label>
                  <input
                    type="text"
                    value={formData.nome_pai}
                    onChange={(e) => setFormData({ ...formData, nome_pai: e.target.value })}
                    placeholder="Nome completo do pai"
                    className="w-full px-4 py-3 rounded-xl border-2 border-red-100 focus:border-red-400 focus:ring-4 focus:ring-red-50 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Telefone para Contato <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.telefone_contato}
                    onChange={(e) => setFormData({ ...formData, telefone_contato: e.target.value })}
                    placeholder="(00) 00000-0000"
                    className="w-full px-4 py-3 rounded-xl border-2 border-orange-100 focus:border-orange-400 focus:ring-4 focus:ring-orange-50 outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* Observações */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Observações
              </label>
              <textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Alguma informação importante? Alergias, restrições alimentares, etc..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border-2 border-pink-100 focus:border-pink-400 focus:ring-4 focus:ring-pink-50 outline-none transition resize-none"
              />
            </div>

            {/* Dados de Acesso */}
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-6 shadow-sm border-2 border-red-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-orange-400 rounded-xl flex items-center justify-center">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-600">Dados de Acesso</h3>
                  <p className="text-sm text-slate-500">Crie seu login para acessar o sistema</p>
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
                    className="w-full px-4 py-3 rounded-xl border-2 border-red-100 focus:border-red-400 focus:ring-4 focus:ring-red-50 outline-none transition"
                  />
                  <p className="text-xs text-slate-500 mt-1">Você usará este e-mail para fazer login no sistema</p>
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
                      className="w-full px-4 py-3 rounded-xl border-2 border-red-100 focus:border-red-400 focus:ring-4 focus:ring-red-50 outline-none transition"
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
                      className="w-full px-4 py-3 rounded-xl border-2 border-red-100 focus:border-red-400 focus:ring-4 focus:ring-red-50 outline-none transition"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-sm text-blue-800">
                    <span className="font-bold">🔐 Após criar sua conta:</span> Você poderá acessar o sistema para ver fotos, agenda, enviar mensagens e acompanhar o desenvolvimento do seu filho!
                  </p>
                </div>
              </div>
            </div>

            {/* Botão Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 disabled:from-slate-300 disabled:to-slate-400 text-white rounded-xl py-4 font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl disabled:shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Enviar Matrícula
                </>
              )}
            </button>

            <p className="text-center text-sm text-slate-500">
              Ao enviar, você confirma que os dados estão corretos
            </p>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-red-100 text-center text-sm text-slate-600">
            <p>© {new Date().getFullYear()} Escola Recanto Alegre</p>
            <p className="mt-1 flex items-center justify-center gap-4">
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                (11) 98765-4321
              </span>
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3" />
                contato@recantoalegre.com.br
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
