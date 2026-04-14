import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Calendar, MessageSquare, Users, Image as ImageIcon, FileText, LogOut, User, Check, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/src/lib/supabase';

type Page = 'agenda' | 'mensagens' | 'alunos' | 'fotos' | 'matricula' | 'admin';

interface NavigationMenuProps {
  user: any;
  role: 'teacher' | 'parent' | null;
  currentPage: Page;
  onPageChange: (page: Page) => void;
  onLogout: () => void;
  unreadCount?: number;
}

const MENU_ITEMS = [
  { id: 'agenda' as Page, label: 'Agenda', icon: Calendar, description: 'Eventos e atividades da escola' },
  { id: 'mensagens' as Page, label: 'Mensagens', icon: MessageSquare, description: 'Converse com a escola', showUnread: true },
  { id: 'alunos' as Page, label: 'Turmas', icon: Users, description: 'Alunos e turmas', teacherOnly: true },
  { id: 'fotos' as Page, label: 'Fotos', icon: ImageIcon, description: 'Galeria de momentos especiais' },
  { id: 'matricula' as Page, label: 'Matrícula', icon: FileText, description: 'Formulário de matrícula', teacherOnly: true },
  { id: 'admin' as Page, label: 'Gerenciar Usuários', icon: GraduationCap, description: 'Gerenciar professores e pais', teacherOnly: true },
];

export function NavigationMenu({ user, role, currentPage, onPageChange, onLogout, unreadCount = 0 }: NavigationMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (user) {
      setUserName(user.email?.split('@')[0] || 'Usuário');
    }
  }, [user]);

  const filteredMenuItems = MENU_ITEMS.filter(item => {
    if (item.teacherOnly && role !== 'teacher') return false;
    return true;
  });

  const handlePageChange = (page: Page) => {
    onPageChange(page);
    setIsOpen(false);
  };

  return (
    <>
      {/* Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-full hover:bg-red-50"
      >
        {isOpen ? (
          <X className="h-6 w-6 text-red-500" />
        ) : (
          <>
            <Menu className="h-6 w-6 text-slate-600" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 p-0 flex items-center justify-center text-[10px] animate-pulse">
                {unreadCount}
              </Badge>
            )}
          </>
        )}
      </Button>

      {/* Menu Overlay/Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />

            {/* Menu Sidebar */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 overflow-y-auto"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Menu</h2>
                    <p className="text-sm text-slate-500">O que você quer fazer?</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* User Info */}
                <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-4 mb-6 text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-medium">{userName}</p>
                      <p className="text-sm opacity-90">
                        {role === 'teacher' ? 'Professor' : 'Família'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <nav className="space-y-2">
                  {filteredMenuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPage === item.id;
                    const showBadge = item.showUnread && unreadCount > 0;

                    return (
                      <button
                        key={item.id}
                        onClick={() => handlePageChange(item.id)}
                        className={`
                          w-full flex items-center gap-3 p-4 rounded-xl transition-all
                          ${isActive
                            ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg'
                            : 'hover:bg-red-50 text-slate-700'
                          }
                        `}
                      >
                        <div className="relative">
                          <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                          {showBadge && (
                            <Badge className="absolute -top-2 -right-2 h-4 w-4 bg-red-500 p-0 flex items-center justify-center text-[8px] border-2 border-white">
                              {unreadCount}
                            </Badge>
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium">{item.label}</p>
                          <p className={`text-xs ${isActive ? 'text-white/80' : 'text-slate-400'}`}>
                            {item.description}
                          </p>
                        </div>
                        {isActive && <Check className="h-4 w-4" />}
                      </button>
                    );
                  })}
                </nav>

                {/* Logout Button */}
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <button
                    onClick={() => {
                      onLogout();
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-red-50 text-red-600 transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium">Sair do sistema</span>
                  </button>
                </div>

                {/* Footer */}
                <div className="mt-6 pt-6 border-t border-slate-100 text-center text-xs text-slate-400">
                  <p>Escolinha Recanto Alegre</p>
                  <p className="mt-1">Sistema desenvolvido por</p>
                  <a
                    href="https://nodoprime.com.br"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-500 hover:underline font-medium"
                  >
                    Nodo Prime
                  </a>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
