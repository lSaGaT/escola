import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, X, UserPlus, GraduationCap, Baby, Users } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';
import { SchoolClass } from '@/src/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Contact {
  id: string;
  name: string;
  type: 'teacher' | 'parent';
  studentName?: string;
  className?: SchoolClass;
  email: string;
}

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
  role: 'teacher' | 'parent';
  assignedClass?: SchoolClass;
  onConversationCreated: (contact: Contact) => void;
}

const CLASSES: SchoolClass[] = ['Maternal 1', 'Maternal 2', 'Maternal 3', '1º Período', '2º Período'];

export function NewConversationDialog({
  open,
  onOpenChange,
  user,
  role,
  assignedClass,
  onConversationCreated
}: NewConversationDialogProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<SchoolClass | ''>('');
  const [creating, setCreating] = useState(false);

  // Buscar contatos quando abre o modal
  useEffect(() => {
    if (open) {
      fetchContacts();
    }
  }, [open, role, selectedClass]);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const { data: contactsData, error } = await supabase.rpc('listar_contatos_para_mensagem', {
        p_role: role,
        p_assigned_class: selectedClass || null
      });

      if (error) {
        console.error('RPC Error:', error);
        throw error;
      }

      if (contactsData) {
        const contactsList: Contact[] = contactsData.map((contact: any) => ({
          id: contact.user_id,
          name: contact.nome,
          type: contact.contact_role === 'teacher' ? 'teacher' : 'parent',
          studentName: contact.student_name,
          className: contact.assigned_class as SchoolClass,
          email: contact.email
        }));

        setContacts(contactsList);
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartConversation = async (contact: Contact) => {
    setCreating(true);
    try {
      // Criar uma mensagem inicial para iniciar a conversa
      const messageData = {
        remetente_id: user.id,
        conteudo: `[Sistema] ${user.user_metadata?.nome || user.email} iniciou uma conversa.`,
        canal_geral: false,
        destinatario_id: contact.id,
        sender_name: user.user_metadata?.nome || user.email,
        lida: false
      };

      const { error } = await supabase
        .from('mensagens')
        .insert(messageData);

      if (error) throw error;

      onConversationCreated(contact);
      onOpenChange(false);
    } catch (err) {
      console.error('Error creating conversation:', err);
      alert('Erro ao iniciar conversa');
    } finally {
      setCreating(false);
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch =
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.studentName && contact.studentName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (contact.className && contact.className.toLowerCase().includes(searchTerm.toLowerCase()));

    if (role === 'teacher') {
      return matchesSearch && (!selectedClass || contact.className === selectedClass);
    } else {
      return matchesSearch;
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-red-500" />
            Nova Conversa
          </DialogTitle>
          <DialogDescription>
            {role === 'teacher'
              ? 'Busque e inicie uma conversa com um responsável'
              : 'Busque e inicie uma conversa com um professor'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 overflow-hidden">
          {/* Busca e Filtro */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 rounded-xl"
              />
            </div>

            {role === 'teacher' && (
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedClass('')}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    !selectedClass
                      ? 'bg-red-500 text-white'
                      : 'bg-red-100 text-red-600 hover:bg-red-200'
                  }`}
                >
                  Todas
                </button>
                {CLASSES.map((cls) => (
                  <button
                    key={cls}
                    onClick={() => setSelectedClass(cls)}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      selectedClass === cls
                        ? 'bg-red-500 text-white'
                        : 'bg-red-100 text-red-600 hover:bg-red-200'
                    }`}
                  >
                    {cls}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Lista de Contatos */}
          <div className="flex-1 overflow-y-auto border-t border-slate-200 pt-4">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-slate-400">
                <div className="animate-pulse">Carregando contatos...</div>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                {role === 'teacher' ? (
                  <Users className="h-12 w-12 mb-2" />
                ) : (
                  <GraduationCap className="h-12 w-12 mb-2" />
                )}
                <p className="text-sm">
                  {searchTerm
                    ? 'Nenhum contato encontrado'
                    : role === 'teacher'
                      ? 'Nenhum responsável encontrado'
                      : 'Nenhum professor encontrado'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredContacts.map((contact) => (
                  <motion.button
                    key={contact.id}
                    onClick={() => !creating && handleStartConversation(contact)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={creating}
                    className="w-full p-3 flex items-center gap-3 bg-white rounded-xl border border-slate-200 hover:border-red-300 hover:shadow-md transition-all text-left"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className={
                        contact.type === 'teacher'
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                          : 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
                      }>
                        {contact.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">
                        {contact.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        {contact.type === 'teacher' && (
                          <span className="flex items-center gap-1">
                            <GraduationCap className="h-3 w-3" />
                            {contact.className}
                          </span>
                        )}
                        {contact.studentName && (
                          <span className="flex items-center gap-1">
                            <Baby className="h-3 w-3" />
                            {contact.studentName}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-slate-400">
                      {contact.email}
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="border-t border-slate-200 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl"
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
