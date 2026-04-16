import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, RefreshCw, Search, Users, ArrowLeft, Plus } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';
import { SchoolClass } from '@/src/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { NewConversationDialog } from '@/src/components/messages/NewConversationDialog';

interface Conversation {
  id: string;
  type: 'general' | 'private';
  name: string;
  studentName: string;
  parentName: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  hasUnread: boolean;
}

interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: string;
  lida: boolean;
  isMine: boolean;
}

const CLASSES: SchoolClass[] = ['Maternal 1', 'Maternal 2', 'Maternal 3', 'Maternal 4', '1ª Série'];

export function MessagesPage({ user, role, assignedClass }: {
  user: any;
  role: 'teacher' | 'parent';
  assignedClass?: SchoolClass;
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showChatList, setShowChatList] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [newConversationOpen, setNewConversationOpen] = useState(false);
  const lastSelectedRef = useRef<string | null>(null);

  // Detectar se é mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Carregar conversas quando componente monta ou quando volta pra aba
  useEffect(() => {
    fetchConversations();
  }, [role, assignedClass]);

  // Auto-refresh quando volta pra aba (detecção de montagem)
  useEffect(() => {
    // Marcar que entrou na aba
    return () => {
      // Quando sair da aba, limpa seleção
      lastSelectedRef.current = selectedConversation?.id || null;
    };
  }, [selectedConversation]);

  // Atualizar mensagens quando seleciona conversa
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  // Função para buscar conversas
  const fetchConversations = async () => {
    setLoading(true);
    try {
      const convs: Conversation[] = [];

      // 1. Adicionar canal GERAL
      convs.push({
        id: 'general',
        type: 'general',
        name: 'GERAL',
        studentName: 'Todos',
        parentName: 'Escola',
        unreadCount: 0,
        hasUnread: false
      });

      // 2. Buscar mensagens do geral para verificar não lidas
      const { data: generalMsgs } = await supabase
        .from('mensagens')
        .select('*')
        .eq('canal_geral', true)
        .order('criado_em', { ascending: false });

      if (generalMsgs && generalMsgs.length > 0) {
        convs[0].lastMessage = generalMsgs[0].conteudo;
        convs[0].lastMessageTime = generalMsgs[0].criado_em;

        // Contar não lidas
        const unreadCount = generalMsgs.filter(m => !m.lida).length;
        convs[0].unreadCount = unreadCount;
        convs[0].hasUnread = unreadCount > 0;
      }

      // 3. Buscar conversas individuais
      if (role === 'teacher') {
        // Professores veem conversas com pais de todas as turmas
        const { data: parentContacts } = await supabase.rpc('listar_contatos_para_mensagem', {
          p_role: 'teacher',
          p_assigned_class: null
        });

        if (parentContacts) {
          for (const contact of parentContacts) {
            const parentId = contact.user_id;
            const parentName = contact.nome;
            const studentName = contact.student_name;
            const className = contact.assigned_class;

            // Buscar última mensagem desta conversa
            const { data: lastMsg } = await supabase
              .from('mensagens')
              .select('*')
              .or(`remetente_id.eq.${parentId},destinatario_id.eq.${parentId}`)
              .order('criado_em', { ascending: false })
              .limit(1)
              .maybeSingle();

            // Buscar mensagens não lidas
            const { data: unreadMsgs } = await supabase
              .from('mensagens')
              .select('*')
              .or(`remetente_id.eq.${parentId},destinatario_id.eq.${parentId}`)
              .eq('lida', false);

            const hasUnread = (unreadMsgs && unreadMsgs.length > 0);

            // Só adicionar se houver mensagens trocadas
            if (lastMsg || unreadMsgs) {
              convs.push({
                id: parentId,
                type: 'private',
                name: `${studentName} - ${parentName}`,
                studentName: studentName,
                parentName: parentName,
                lastMessage: lastMsg?.conteudo,
                lastMessageTime: lastMsg?.criado_em,
                unreadCount: unreadMsgs?.length || 0,
                hasUnread: hasUnread || false
              });
            }
          }
        }
      } else {
        // Pais veem conversas com professores
        const { data: teacherContacts } = await supabase.rpc('listar_contatos_para_mensagem', {
          p_role: 'parent',
          p_assigned_class: null
        });

        if (teacherContacts) {
          for (const contact of teacherContacts) {
            const teacherId = contact.user_id;
            const teacherName = contact.nome;
            const className = contact.assigned_class;

            // Buscar última mensagem desta conversa
            const { data: lastMsg } = await supabase
              .from('mensagens')
              .select('*')
              .or(`remetente_id.eq.${teacherId},destinatario_id.eq.${teacherId}`)
              .order('criado_em', { ascending: false })
              .limit(1)
              .maybeSingle();

            // Buscar mensagens não lidas
            const { data: unreadMsgs } = await supabase
              .from('mensagens')
              .select('*')
              .or(`remetente_id.eq.${teacherId},destinatario_id.eq.${teacherId}`)
              .eq('lida', false);

            const hasUnread = (unreadMsgs && unreadMsgs.length > 0);

            // Só adicionar se houver mensagens trocadas
            if (lastMsg || unreadMsgs) {
              convs.push({
                id: teacherId,
                type: 'private',
                name: `Escola - ${teacherName}`,
                studentName: className,
                parentName: teacherName,
                lastMessage: lastMsg?.conteudo,
                lastMessageTime: lastMsg?.criado_em,
                unreadCount: unreadMsgs?.length || 0,
                hasUnread: hasUnread || false
              });
            }
          }
        }
      }

      setConversations(convs);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  // Função para buscar mensagens de uma conversa
  const fetchMessages = async (conversationId: string) => {
    try {
      let query = supabase
        .from('mensagens')
        .select('*')
        .order('criado_em', { ascending: true });

      if (conversationId === 'general') {
        // Canal GERAL
        query = query.eq('canal_geral', true);
      } else if (conversationId === 'school' && role === 'parent') {
        // Pai vendo mensagens da escola
        query = query.eq('remetente_id', user.id);
      } else {
        // Conversa privada
        query = query.or(`remetente_id.eq.${conversationId},destinatario_id.eq.${conversationId}`);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedMessages: ChatMessage[] = (data || []).map(msg => ({
        id: msg.id,
        conversation_id: conversationId,
        sender_id: msg.remetente_id,
        sender_name: msg.sender_name || 'Usuário',
        content: msg.conteudo,
        created_at: msg.criado_em,
        lida: msg.lida || false,
        isMine: msg.remetente_id === user.id
      }));

      setMessages(formattedMessages);

      // Marcar mensagens como lidas se for professor
      if (role === 'teacher') {
        const unreadIds = formattedMessages
          .filter(m => !m.lida && !m.isMine)
          .map(m => m.id);

        if (unreadIds.length > 0) {
          await supabase
            .from('mensagens')
            .update({ lida: true, lida_em: new Date().toISOString() })
            .in('id', unreadIds);
        }
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending || !selectedConversation) return;

    setSending(true);
    try {
      const messageData: any = {
        remetente_id: user.id,
        conteudo: newMessage.trim(),
        canal_geral: selectedConversation.id === 'general',
        sala: role === 'teacher' ? assignedClass : null,
        destinatario_id: selectedConversation.type === 'private' && selectedConversation.id !== 'school' ? selectedConversation.id : null,
        sender_name: user.user_metadata?.nome || user.email || 'Usuário',
        lida: false
      };

      const { error } = await supabase
        .from('mensagens')
        .insert(messageData);

      if (error) throw error;

      setNewMessage('');
      fetchMessages(selectedConversation.id);
      fetchConversations(); // Atualiza lista de conversas
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  const handleRefresh = () => {
    fetchConversations();
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  };

  const markAsRead = async (conversationId: string) => {
    try {
      let query;

      if (conversationId === 'general') {
        // Canal geral
        query = supabase
          .from('mensagens')
          .select('*')
          .eq('canal_geral', true)
          .eq('lida', false);
      } else if (conversationId === 'school') {
        // Conversa com escola (pai)
        query = supabase
          .from('mensagens')
          .select('*')
          .neq('remetente_id', user.id)
          .eq('lida', false);
      } else {
        // Conversa privada
        query = supabase
          .from('mensagens')
          .select('*')
          .or(`and(remetente_id.eq.${conversationId},lida.eq.false),and(destinatario_id.eq.${conversationId},lida.eq.false)`);
      }

      if (query) {
        const { data: unreadMsgs } = await query;

        if (unreadMsgs && unreadMsgs.length > 0) {
          const unreadIds = unreadMsgs.map(m => m.id);
          await supabase
            .from('mensagens')
            .update({ lida: true, lida_em: new Date().toISOString() })
            .in('id', unreadIds);
        }
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}m`;
    if (date.getDate() === now.getDate()) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const getAvatarInfo = (conv: Conversation) => {
    if (conv.type === 'general') {
      return {
        initials: 'GE',
        bgColor: 'bg-gradient-to-r from-blue-500 to-purple-500'
      };
    }
    const name = conv.studentName || conv.name || 'NA';
    return {
      initials: name.substring(0, 2).toUpperCase(),
      bgColor: 'bg-gradient-to-r from-red-500 to-orange-500'
    };
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.studentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-full bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* LADO ESQUERDO - Lista de Conversas (SEMPRE visível) */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-slate-200 flex flex-col ${!showChatList ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-red-50 to-orange-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-800">Conversas</h3>
            <div className="flex gap-2">
              <Button
                onClick={() => setNewConversationOpen(true)}
                size="icon"
                className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-full"
                title="Nova conversa"
              >
                <Plus className="h-5 w-5" />
              </Button>
              <Button
                onClick={handleRefresh}
                variant="ghost"
                size="icon"
                className="hover:bg-white hover:shadow-md transition-all"
                title="Atualizar conversas"
              >
                <RefreshCw className={`h-5 w-5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Buscar conversas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 rounded-xl bg-white border-slate-200"
            />
          </div>
        </div>

        {/* Lista de Conversas */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-slate-400">
              <div className="animate-pulse">Carregando...</div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400">
              <Users className="h-12 w-12 mb-2" />
              <p className="text-sm">Nenhuma conversa</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={async () => {
                    setSelectedConversation(conv);
                    setShowChatList(false);

                    // Marcar mensagens como lidas
                    await markAsRead(conv.id);

                    // Atualizar lista de conversas
                    fetchConversations();
                  }}
                  className={`w-full p-4 flex items-center gap-3 transition-all relative ${
                    conv.hasUnread
                      ? 'bg-gradient-to-r from-red-100 to-orange-100 border-l-4 border-red-500 shadow-sm'
                      : 'hover:bg-slate-50'
                  } ${selectedConversation?.id === conv.id ? 'bg-red-50' : ''}`}
                >
                  <Avatar className="h-12 w-12 flex-shrink-0">
                    <AvatarFallback className="text-white text-sm font-semibold bg-gradient-to-r from-red-500 to-orange-500">
                      {getAvatarInfo(conv).initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <p className={`font-semibold truncate text-sm ${conv.hasUnread ? 'text-red-700' : 'text-slate-800'}`}>
                        {conv.type === 'general' ? (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-blue-600" />
                            {conv.name}
                          </span>
                        ) : (
                          conv.name
                        )}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center shadow-lg animate-pulse">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs truncate ${conv.hasUnread ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
                      {conv.lastMessage || 'Nenhuma mensagem'}
                    </p>
                  </div>

                  {conv.lastMessageTime && (
                    <span className="text-xs text-slate-400 flex-shrink-0">
                      {formatTime(conv.lastMessageTime)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* LADO DIREITO - Área do Chat */}
      <AnimatePresence mode="wait">
        {selectedConversation && (
          <motion.div
            key="chat-area"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex-1 flex flex-col"
          >
            {/* Header do Chat */}
            <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-red-50 to-orange-50 flex items-center gap-3">
              <button
                onClick={() => setShowChatList(true)}
                className="md:hidden p-2 hover:bg-white rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-slate-600" />
              </button>

              <Avatar className="h-10 w-10">
                <AvatarFallback className="text-white text-sm font-semibold bg-gradient-to-r from-red-500 to-orange-500">
                  {getAvatarInfo(selectedConversation).initials}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <p className="font-semibold text-slate-800 text-sm">
                  {selectedConversation.name}
                </p>
                <p className="text-xs text-slate-500">
                  {selectedConversation.type === 'general' ? 'Todos podem ver' : 'Conversa privada'}
                </p>
              </div>
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-3">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <Send className="h-12 w-12 mb-2" />
                  <p className="text-sm">Nenhuma mensagem ainda</p>
                  <p className="text-xs">Comece a conversa!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${message.isMine ? 'order-1' : ''}`}>
                      {!message.isMine && (
                        <p className="text-xs text-slate-500 mb-1 ml-2">
                          {message.sender_name}
                        </p>
                      )}
                      <div
                        className={`px-4 py-2 rounded-2xl shadow-sm ${
                          message.isMine
                            ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-br-md'
                            : 'bg-white text-slate-800 rounded-bl-md border border-slate-200'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                        <div className={`flex items-center gap-1 mt-1 ${message.isMine ? 'justify-end' : 'justify-start'}`}>
                          <span className={`text-[10px] ${message.isMine ? 'text-white/70' : 'text-slate-400'}`}>
                            {formatTime(message.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-200 bg-white">
              <div className="flex gap-2 items-center">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua mensagem..."
                  disabled={sending}
                  className="flex-1 rounded-full border-red-100 focus:border-red-400 focus:ring-red-50"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-full p-3"
                >
                  {sending ? (
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-slate-400 mt-2 text-center">
                Pressione Enter para enviar, Shift+Enter para nova linha
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Nova Conversa */}
      <NewConversationDialog
        open={newConversationOpen}
        onOpenChange={setNewConversationOpen}
        user={user}
        role={role}
        assignedClass={assignedClass}
        onConversationCreated={(contact) => {
          // Criar nova conversa na lista
          const newConv: Conversation = {
            id: contact.id,
            type: 'private',
            name: contact.type === 'teacher'
              ? `Escola - ${contact.name}`
              : `${contact.studentName} - ${contact.name}`,
            studentName: contact.studentName || 'Escola',
            parentName: contact.name,
            unreadCount: 0,
            hasUnread: false
          };

          setConversations(prev => [newConv, ...prev]);
          setSelectedConversation(newConv);
          setShowChatList(false);
        }}
      />
    </div>
  );
}
