import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, GraduationCap, Trash2, Plus, Search, UserPlus, Baby, Mail, Calendar } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface Professor {
  user_id: string;
  email: string;
  created_at: string;
  nome_metadata: string;
}

interface PaiComAluno {
  user_id: string;
  email: string;
  nome_aluno: string;
  nome_pai?: string;
  nome_mae?: string;
  sala: string;
  created_at: string;
}

export function AdminProfessoresPage() {
  const [activeTab, setActiveTab] = useState<'professores' | 'pais'>('professores');
  const [loading, setLoading] = useState(true);

  // Professores
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [searchProfessores, setSearchProfessores] = useState('');

  // Pais
  const [pais, setPais] = useState<PaiComAluno[]>([]);
  const [searchPais, setSearchPais] = useState('');

  // Dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'professor' | 'pai';
    id: string;
    nome?: string;
    email?: string;
  } | null>(null);

  useEffect(() => {
    if (activeTab === 'professores') {
      fetchProfessores();
    } else {
      fetchPais();
    }
  }, [activeTab]);

  const fetchProfessores = async () => {
    setLoading(true);
    try {
      // Usar a função RPC que tem permissão para ver emails
      const { data, error } = await supabase.rpc('listar_usuarios_com_email');

      if (error) throw error;

      const professorsList = (data || []).filter((u: any) => u.role === 'teacher');
      setProfessores(professorsList);
    } catch (err) {
      console.error('Error fetching professors:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPais = async () => {
    setLoading(true);
    try {
      // Usar a função RPC que já retorna todos os dados necessários
      const { data: usersData, error: usersError } = await supabase.rpc('listar_usuarios_com_email');

      if (usersError) throw usersError;

      // Filtrar apenas pais da função RPC
      const paisFromRPC = (usersData || []).filter((u: any) => u.role === 'parent');

      // Combinar com dados da tabela alunos para mostrar o vínculo com a criança
      const paisComDados = await Promise.all(
        paisFromRPC.map(async (pai: any) => {
          // Buscar alunos vinculados a este pai (pelo email ou pela sala)
          const { data: alunoData } = await supabase
            .from('alunos')
            .select('*')
            .eq('sala', pai.assigned_class)
            .limit(1);

          // Tenta encontrar o aluno pelo nome da mãe/pai que corresponde ao metadata do usuário
          const alunoVinculado = alunoData?.find((aluno: any) =>
            aluno.nome_mae?.toLowerCase() === pai.nome_metadata?.toLowerCase() ||
            aluno.nome_pai?.toLowerCase() === pai.nome_metadata?.toLowerCase()
          );

          return {
            user_id: pai.user_id,
            email: pai.email,
            nome_aluno: alunoVinculado?.nome_aluno || 'Criança não encontrada',
            nome_pai: alunoVinculado?.nome_pai || null,
            nome_mae: alunoVinculado?.nome_mae || null,
            sala: pai.assigned_class || 'N/A',
            created_at: pai.created_at
          };
        })
      );

      setPais(paisComDados);
    } catch (err) {
      console.error('Error fetching pais:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.type === 'professor') {
        // Deletar usuário do Supabase Auth
        await supabase.auth.admin.deleteUser(itemToDelete.id);

        // Deletar registro em user_roles
        await supabase.from('user_roles').delete().eq('user_id', itemToDelete.id);

        fetchProfessores();
      } else {
        // Deletar pai
        await supabase.auth.admin.deleteUser(itemToDelete.id);
        await supabase.from('user_roles').delete().eq('user_id', itemToDelete.id);

        fetchPais();
      }

      setDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (err) {
      console.error('Error deleting:', err);
      alert('Erro ao excluir: ' + (err as any).message);
    }
  };

  const openDeleteDialog = (item: typeof itemToDelete) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const filteredProfessores = professores.filter(p =>
    p.email.toLowerCase().includes(searchProfessores.toLowerCase()) ||
    p.nome_metadata?.toLowerCase().includes(searchProfessores.toLowerCase())
  );

  const filteredPais = pais.filter(p =>
    p.email.toLowerCase().includes(searchPais.toLowerCase()) ||
    p.nome_aluno.toLowerCase().includes(searchPais.toLowerCase()) ||
    p.nome_pai?.toLowerCase().includes(searchPais.toLowerCase()) ||
    p.nome_mae?.toLowerCase().includes(searchPais.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-red-500" />
            Administração de Usuários
          </h2>
          <p className="text-slate-500 text-sm">
            Gerencie professores e pais cadastrados no sistema
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'professores' | 'pais')}>
        <TabsList className="bg-white border border-slate-100 p-1 rounded-2xl w-full sm:w-auto">
          <TabsTrigger
            value="professores"
            className="rounded-xl gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white"
          >
            <Users className="h-4 w-4" />
            Professores ({professores.length})
          </TabsTrigger>
          <TabsTrigger
            value="pais"
            className="rounded-xl gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-orange-500 data-[state=active]:text-white"
          >
            <Baby className="h-4 w-4" />
            Pais ({pais.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab Professores */}
        <TabsContent value="professores" className="mt-6">
          <Card className="shadow-sm">
            <CardContent className="p-6">
              {/* Header com busca e botão adicionar */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    value={searchProfessores}
                    onChange={(e) => setSearchProfessores(e.target.value)}
                    placeholder="Buscar por nome ou email..."
                    className="pl-10 rounded-xl"
                  />
                </div>
                <Button
                  onClick={() => window.open('/professor-cadastro.html', '_blank')}
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Incluir Professor
                </Button>
              </div>

              {/* Lista de Professores */}
              {loading ? (
                <div className="text-center py-12 text-slate-400">
                  <div className="animate-pulse">Carregando professores...</div>
                </div>
              ) : filteredProfessores.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-500">
                    {searchProfessores ? 'Nenhum professor encontrado' : 'Nenhum professor cadastrado'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredProfessores.map((professor) => (
                    <motion.div
                      key={professor.user_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {professor.nome_metadata?.charAt(0)?.toUpperCase() || professor.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{professor.nome_metadata || 'Professor'}</p>
                          <p className="text-sm text-slate-600">{professor.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Cadastrado em</p>
                          <p className="text-sm font-medium text-slate-700">{formatDate(professor.created_at)}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog({
                            type: 'professor',
                            id: professor.user_id,
                            nome: professor.nome_metadata || 'Professor',
                            email: professor.email
                          })}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Pais */}
        <TabsContent value="pais" className="mt-6">
          <Card className="shadow-sm">
            <CardContent className="p-6">
              {/* Header com busca e botão adicionar */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    value={searchPais}
                    onChange={(e) => setSearchPais(e.target.value)}
                    placeholder="Buscar por nome do filho, responsável ou email..."
                    className="pl-10 rounded-xl"
                  />
                </div>
                <Button
                  onClick={() => window.open('/matricula.html', '_blank')}
                  className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-xl gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Incluir Pai
                </Button>
              </div>

              {/* Lista de Pais */}
              {loading ? (
                <div className="text-center py-12 text-slate-400">
                  <div className="animate-pulse">Carregando pais...</div>
                </div>
              ) : filteredPais.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-500">
                    {searchPais ? 'Nenhum pai encontrado' : 'Nenhum pai cadastrado'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredPais.map((pai) => (
                    <motion.div
                      key={pai.user_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                          <Baby className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-slate-800">{pai.nome_aluno}</p>
                          <div className="flex items-center gap-3 text-sm text-slate-600">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {pai.nome_mae || pai.nome_pai || 'Responsável'}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {pai.email}
                            </span>
                          </div>
                        </div>
                        <Badge className="bg-red-100 text-red-600">
                          {pai.sala}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Cadastrado em</p>
                          <p className="text-sm font-medium text-slate-700">{formatDate(pai.created_at)}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog({
                            type: 'pai',
                            id: pai.user_id,
                            nome: pai.nome_aluno,
                            email: pai.email
                          })}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir {itemToDelete?.type === 'professor' ? 'o professor' : 'o pai'}?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-800 mb-2">
                <span className="font-bold">⚠️ Atenção:</span> Esta ação não pode ser desfeita!
              </p>
              {itemToDelete && (
                <div className="text-sm text-red-700">
                  <p><strong>Email:</strong> {itemToDelete.email}</p>
                  {itemToDelete.nome && <p><strong>Nome:</strong> {itemToDelete.nome}</p>}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setItemToDelete(null);
              }}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
