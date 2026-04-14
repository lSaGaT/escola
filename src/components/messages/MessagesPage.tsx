import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Smile, Paperclip, MoreVertical, Reply } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface Message {
  id: string;
  remetente_id: string;
  conteudo: string;
  lida: boolean;
  imagem_url?: string;
  criado_em: string;
  remetente_email?: string;
  sala?: string;
  isMine: boolean;
}

export function MessagesPage({ user, role, assignedClass }: {
  user: any;
  role: 'teacher' | 'parent';
  assignedClass?: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [userEmail, setUserEmail] = useState('');
  const [parentClass, setParentClass] = useState(assignedClass || '');

  useEffect(() => {
    if (user) {
      fetchUserEmail();
    }
  }, [user]);

  useEffect(() => {
    fetchMessages();
    // Poll for new messages every 5 seconds
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [role, parentClass]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchUserEmail = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      setUserEmail(userData.user?.email || '');
    } catch (err) {
      console.error('Error fetching user email:', err);
    }
  };

  const fetchMessages = async () => {
    try {
      let query = supabase
        .from('mensagens')
        .select('*')
        .order('criado_em', { ascending: true });

      if (role === 'parent') {
        // Pais veem apenas suas mensagens
        query = query.eq('remetente_id', user.id);
      } else if (role === 'teacher' && parentClass) {
        // Professores podem filtrar por turma se selecionada
        query = query.eq('sala', parentClass);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedMessages: Message[] = (data || []).map(msg => ({
        ...msg,
        isMine: msg.remetente_id === user.id
      }));

      setMessages(formattedMessages);

      // Count unread messages
      const unread = formattedMessages.filter(m => !m.lida && !m.isMine).length;
      setUnreadCount(unread);

      // Mark messages as read if teacher
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
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const messageData: any = {
        remetente_id: user.id,
        conteudo: newMessage.trim(),
        sala: parentClass || null
      };

      if (role === 'parent') {
        // Pai enviando para professores
        messageData.destinatario_id = null; // Null = todos os professores
      }

      const { error } = await supabase
        .from('mensagens')
        .insert(messageData);

      if (error) throw error;

      setNewMessage('');
      fetchMessages();
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Erro ao enviar mensagem');
    } finally {
      setSending(false);
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
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return date.toLocaleDateString('pt-BR', { weekday: 'short' });
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <Card className="shadow-sm h-full flex flex-col">
      <CardContent className="p-6 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center">
              <Reply className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {role === 'teacher' ? 'Mensagens dos Pais' : 'Converse com a Escola'}
              </h2>
              <p className="text-sm text-slate-500">
                {role === 'teacher'
                  ? `Respondendo aos pais${parentClass ? ` de ${parentClass}` : ''}`
                  : 'Envie mensagens para os professores'
                }
              </p>
            </div>
          </div>

          {role === 'teacher' && unreadCount > 0 && (
            <Badge className="bg-red-500 text-white px-3 py-1 rounded-full animate-pulse">
              {unreadCount} nova{unreadCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {/* Filtro de turma para professores */}
        {role === 'teacher' && (
          <div className="mb-4">
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={!parentClass ? 'default' : 'outline'}
                onClick={() => setParentClass('')}
                size="sm"
                className="rounded-full"
              >
                Todas as turmas
              </Button>
              {['Maternal 1', 'Maternal 2', 'Maternal 3', 'Maternal 4', '1ª Série'].map((cls) => (
                <Button
                  key={cls}
                  variant={parentClass === cls ? 'default' : 'outline'}
                  onClick={() => setParentClass(cls)}
                  size="sm"
                  className="rounded-full"
                >
                  {cls}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto bg-slate-50 rounded-2xl p-4 space-y-4 mb-4">
          {loading ? (
            <div className="flex items-center justify-center h-full text-slate-400">
              <div className="animate-pulse">Carregando mensagens...</div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Reply className="h-16 w-16 mb-4 text-slate-200" />
              <p className="font-medium">Nenhuma mensagem ainda</p>
              <p className="text-sm">
                {role === 'teacher'
                  ? 'Os pais podem enviar mensagens para você aqui'
                  : 'Envie uma mensagem para os professores'
                }
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${message.isMine ? 'justify-end' : 'justify-start'}`}
                >
                  {!message.isMine && (
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs">
                        {message.remetente_email?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div className={`max-w-[70%] ${message.isMine ? 'order-1' : ''}`}>
                    {!message.isMine && message.remetente_email && (
                      <p className="text-xs text-slate-500 mb-1 ml-1">
                        {message.remetente_email.split('@')[0]}
                      </p>
                    )}
                    <div
                      className={`
                        relative px-4 py-2 rounded-2xl shadow-sm
                        ${message.isMine
                          ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-br-md'
                          : 'bg-white text-slate-800 rounded-bl-md border border-slate-200'
                        }
                        ${!message.lida && !message.isMine ? 'ring-2 ring-red-500 ring-offset-2 shadow-[0_0_20px_rgba(239,68,68,0.5)]' : ''}
                      `}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{message.conteudo}</p>
                      <div className={`flex items-center gap-2 mt-1 ${message.isMine ? 'justify-end' : 'justify-start'}`}>
                        <span className={`text-[10px] ${message.isMine ? 'text-white/70' : 'text-slate-400'}`}>
                          {formatTime(message.criado_em)}
                        </span>
                        {!message.lida && !message.isMine && (
                          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        )}
                      </div>
                    </div>
                  </div>

                  {message.isMine && (
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs">
                        EU
                      </AvatarFallback>
                    </Avatar>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex gap-3">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            disabled={sending}
            className="rounded-full flex-1 border-red-100 focus:border-red-400 focus:ring-red-50"
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
      </CardContent>
    </Card>
  );
}
