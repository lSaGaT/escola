/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Loader2,
  AlertCircle,
  LogOut,
  User
} from 'lucide-react';
import { supabase } from '@/src/lib/supabase';
import { SchoolClass } from '@/src/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AgendaPage } from '@/src/components/agenda/AgendaPage';
import { MessagesPage } from '@/src/components/messages/MessagesPage';
import { StudentsPage } from '@/src/components/students/StudentsPage';
import { PhotosPage } from '@/src/components/photos/PhotosPage';
import { NavigationMenu } from '@/src/components/navigation/NavigationMenu';
import { AdminProfessoresPage } from '@/src/components/admin/AdminProfessoresPage';
import { PasswordReset } from '@/src/components/PasswordReset';
import { PasswordResetForm } from '@/src/components/PasswordResetForm';

const LOGO_URL = "/logo.png";
const CHILDREN_IMAGE = "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&auto=format&fit=crop";

// Frases inspiradoras para cada página
const PAGE_QUOTES = {
  agenda: {
    title: "Cada dia é uma nova oportunidade de aprender e crescer juntos!",
    subtitle: "Agenda de eventos e atividades"
  },
  mensagens: {
    title: "A comunicação é a ponte entre o lar e a escola.",
    subtitle: "Juntos construindo o futuro das nossas crianças"
  },
  alunos: {
    title: "Cada criança é única, especial e cheia de potencial!",
    subtitle: "Acompanhando o crescimento de cada pequeno"
  },
  fotos: {
    title: "Os momentos mais preciosos são aqueles que compartilhamos juntos.",
    subtitle: "Memórias que duram para sempre"
  },
  matricula: {
    title: "Onde cada pequeno passo se torna uma grande aventura!",
    subtitle: "Bem-vindo à nossa família"
  },
  admin: {
    title: "Gerenciando com carinho toda nossa comunidade escolar.",
    subtitle: "Professores e Pais unidos pela educação"
  }
};

type Page = 'agenda' | 'mensagens' | 'alunos' | 'fotos' | 'matricula' | 'admin';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('agenda');
  const [unreadCount, setUnreadCount] = useState(0);

  // Auth state
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<'teacher' | 'parent' | null>(null);
  const [assignedClass, setAssignedClass] = useState<SchoolClass | undefined>();
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [isPasswordResetFlow, setIsPasswordResetFlow] = useState(false);

  useEffect(() => {
    // Verificar se há um token de reset na URL
    const hash = window.location.hash;
    if (hash && hash.includes('access_token') && hash.includes('type=recovery')) {
      setIsPasswordResetFlow(true);
    }

    // Verificar se está na rota de matrícula ou cadastro de professor
    const path = window.location.pathname;
    if (path === '/matricula') {
      // Redirecionar para a página de matrícula
      window.location.href = '/matricula.html';
    } else if (path === '/professor-cadastro') {
      // Redirecionar para a página de cadastro de professor
      window.location.href = '/professor-cadastro.html';
    }
  }, []);

  useEffect(() => {
    checkUser();
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setRole(null);
      }
      setAuthLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user && role === 'teacher') {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 10000);
      return () => clearInterval(interval);
    }
  }, [user, role]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
    if (session?.user) {
      fetchUserRole(session.user.id);
    }
    setAuthLoading(false);
  };

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role, assigned_class')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setRole(data?.role as 'teacher' | 'parent');
      if (data?.assigned_class) {
        setAssignedClass(data.assigned_class as SchoolClass);
      }
    } catch (err) {
      console.error('Error fetching role:', err);
      setRole('parent');
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const { data, error } = await supabase
        .from('mensagens')
        .select('id')
        .eq('lida', false);

      if (error) throw error;
      setUnreadCount(data?.length || 0);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setLoginModalOpen(false);
    } catch (err: any) {
      setLoginError(err.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <Loader2 className="h-12 w-12 animate-spin text-red-500" />
      </div>
    );
  }

  // Tela de recuperação de senha (fluxo de email)
  if (showPasswordReset) {
    return <PasswordReset onBack={() => setShowPasswordReset(false)} />;
  }

  // Tela de reset de senha (quando vem do link do email)
  if (isPasswordResetFlow) {
    return <PasswordResetForm />;
  }

  // Tela de login
  if (!user) {
    return (
      <div className="min-h-screen flex">
        {/* Lado Esquerdo - Imagem com Gradiente Vermelho */}
        <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-orange-400 to-pink-400" />
          <img
            src={CHILDREN_IMAGE}
            alt="Crianças brincando"
            className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-40"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-between p-12 text-white">
            <img src={LOGO_URL} alt="Logo" className="w-16 h-16 rounded-xl shadow-lg" referrerPolicy="no-referrer" />
            <div className="text-center">
              <h2 className="text-4xl font-bold mb-4">Onde cada pequeno passo se torna uma grande aventura!</h2>
              <p className="text-xl opacity-90">Portal de fotos e momentos especiais</p>
            </div>
            <div className="flex justify-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-full backdrop-blur-sm" />
              <div className="w-8 h-8 bg-white/20 rounded-full backdrop-blur-sm" />
              <div className="w-10 h-10 bg-white/20 rounded-full backdrop-blur-sm" />
            </div>
          </div>
        </div>

        {/* Lado Direito - Login */}
        <div className="w-full lg:w-1/2 min-h-screen bg-[#FFF5F5] flex flex-col justify-center p-8">
          <div className="max-w-md w-full mx-auto">
            <div className="lg:hidden text-center mb-8">
              <img src={LOGO_URL} alt="Logo" className="w-20 h-20 mx-auto mb-4 rounded-2xl shadow-lg" referrerPolicy="no-referrer" />
              <h1 className="text-3xl font-bold text-red-600 mb-2">Escolinha Recanto Alegre</h1>
              <p className="text-slate-600">Portal da Família</p>
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Bem-vindo!</h2>
                <p className="text-slate-600">Faça login para acessar o sistema</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="rounded-xl border-red-100 focus:border-red-400 focus:ring-red-50"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="rounded-xl border-red-100 focus:border-red-400 focus:ring-red-50"
                  />
                </div>
                {loginError && (
                  <div className="text-red-500 text-sm flex items-center gap-2 bg-red-50 p-3 rounded-lg">
                    <AlertCircle size={16} />
                    {loginError}
                  </div>
                )}
                <Button type="submit" className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-xl h-12 font-semibold">
                  Entrar no Portal
                </Button>
              </form>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setShowPasswordReset(true)}
                  className="text-sm text-red-500 hover:text-red-600 font-medium underline"
                >
                  Esqueci minha senha
                </button>
              </div>

              <div className="mt-6 text-center text-xs text-slate-500">
                Sistema desenvolvido por{' '}
                <a href="https://nodoprime.com.br" target="_blank" rel="noopener noreferrer" className="text-red-500 hover:underline font-medium">
                  Nodo Prime
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Lado Esquerdo - Imagem com Gradiente Vermelho - 20% da tela */}
      <div className="hidden lg:block lg:w-[20%] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-orange-400 to-pink-400" />
        <img
          src={CHILDREN_IMAGE}
          alt="Crianças brincando"
          className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-40"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-between p-8 text-white">
          <img src={LOGO_URL} alt="Logo" className="w-10 h-10 rounded-xl shadow-lg" referrerPolicy="no-referrer" />
          <div className="text-center">
            <h2 className="text-2xl font-bold leading-tight mb-2">{PAGE_QUOTES[currentPage].title}</h2>
            <p className="text-sm opacity-90">{PAGE_QUOTES[currentPage].subtitle}</p>
          </div>
          <div className="flex justify-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full backdrop-blur-sm" />
            <div className="w-6 h-6 bg-white/20 rounded-full backdrop-blur-sm" />
            <div className="w-7 h-7 bg-white/20 rounded-full backdrop-blur-sm" />
          </div>
        </div>
      </div>

      {/* Lado Direito - Conteúdo - 80% da tela */}
      <div className="w-full lg:w-[80%] min-h-screen bg-[#FFF5F5] flex flex-col">
        {/* Header Mobile */}
        <div className="lg:hidden bg-gradient-to-r from-red-500 to-orange-400 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={LOGO_URL} alt="Logo" className="w-10 h-10 rounded-xl" referrerPolicy="no-referrer" />
              <div className="text-white">
                <h1 className="text-lg font-bold">Recanto Alegre</h1>
                <p className="text-xs opacity-90">{role === 'teacher' ? 'Portal do Professor' : 'Portal da Família'}</p>
              </div>
            </div>
            <NavigationMenu
              user={user}
              role={role}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onLogout={handleLogout}
              unreadCount={unreadCount}
            />
          </div>
        </div>

        {/* Header Desktop */}
        <div className="hidden lg:flex items-center justify-between p-4 border-b border-red-100">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="Logo" className="w-8 h-8 rounded-xl shadow-sm" referrerPolicy="no-referrer" />
            <div>
              <h1 className="text-base font-bold text-red-600">Recanto Alegre</h1>
              <p className="text-xs text-slate-500">
                {role === 'teacher' ? 'Portal do Professor' : 'Portal da Família'}
              </p>
            </div>
          </div>

          <NavigationMenu
            user={user}
            role={role}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onLogout={handleLogout}
            unreadCount={unreadCount}
          />
        </div>

        {/* Conteúdo Principal */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {currentPage === 'agenda' && role && (
                <AgendaPage role={role} />
              )}

              {currentPage === 'mensagens' && user && (
                <MessagesPage
                  user={user}
                  role={role!}
                  assignedClass={assignedClass}
                />
              )}

              {currentPage === 'alunos' && (
                <StudentsPage
                  role={role!}
                  assignedClass={assignedClass}
                />
              )}

              {currentPage === 'fotos' && user && (
                <PhotosPage
                  user={user}
                  role={role!}
                  assignedClass={assignedClass}
                />
              )}

              {currentPage === 'matricula' && role === 'teacher' && (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">Formulário de Matrícula</h2>
                    <p className="text-slate-600 mb-6">
                      O formulário público está disponível em: <br />
                      <a href="/matricula" target="_blank" className="text-red-500 hover:underline font-medium">
                        /matricula
                      </a>
                    </p>
                    <Button
                      onClick={() => window.open('/matricula', '_blank')}
                      className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-xl"
                    >
                      Abrir Formulário
                    </Button>
                  </div>
                </div>
              )}

              {currentPage === 'admin' && role === 'teacher' && (
                <AdminProfessoresPage />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-red-100 text-center text-xs text-slate-500">
          <p className="mb-1">© {new Date().getFullYear()} Escolinha Recanto Alegre</p>
          <p>
            Sistema desenvolvido por{' '}
            <a href="https://nodoprime.com.br" target="_blank" rel="noopener noreferrer" className="text-red-500 hover:underline font-medium">
              Nodo Prime
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
