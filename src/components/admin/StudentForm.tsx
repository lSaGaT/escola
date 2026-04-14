import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/src/lib/supabase';
import { Aluno, Sala } from '@/src/types';
import { Loader2, Save, X } from 'lucide-react';

interface StudentFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editStudent?: Aluno | null;
}

export function StudentForm({ open, onClose, onSuccess, editStudent }: StudentFormProps) {
  const [loading, setLoading] = useState(false);
  const [salas, setSalas] = useState<Sala[]>([]);

  const [formData, setFormData] = useState({
    nome_aluno: '',
    nome_pai: '',
    nome_mae: '',
    telefone_contato: '',
    sala: '',
    data_nascimento: '',
    observacoes: '',
  });

  useEffect(() => {
    if (open) {
      fetchSalas();
      if (editStudent) {
        setFormData({
          nome_aluno: editStudent.nome_aluno,
          nome_pai: editStudent.nome_pai || '',
          nome_mae: editStudent.nome_mae || '',
          telefone_contato: editStudent.telefone_contato || '',
          sala: editStudent.sala,
          data_nascimento: editStudent.data_nascimento || '',
          observacoes: editStudent.observacoes || '',
        });
      } else {
        setFormData({
          nome_aluno: '',
          nome_pai: '',
          nome_mae: '',
          telefone_contato: '',
          sala: '',
          data_nascimento: '',
          observacoes: '',
        });
      }
    }
  }, [open, editStudent]);

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
    setLoading(true);

    try {
      if (editStudent) {
        // Editar aluno existente
        const { error } = await supabase
          .from('alunos')
          .update({
            nome_aluno: formData.nome_aluno,
            nome_pai: formData.nome_pai || null,
            nome_mae: formData.nome_mae || null,
            telefone_contato: formData.telefone_contato || null,
            sala: formData.sala,
            data_nascimento: formData.data_nascimento || null,
            observacoes: formData.observacoes || null,
          })
          .eq('id', editStudent.id);

        if (error) throw error;
      } else {
        // Criar novo aluno
        const { error } = await supabase.from('alunos').insert([
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

        if (error) throw error;
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      alert('Erro ao salvar aluno: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {editStudent ? 'Editar Aluno' : 'Novo Aluno'}
          </DialogTitle>
          <DialogDescription>
            {editStudent
              ? 'Atualize os dados do aluno.'
              : 'Preencha os dados para cadastrar um novo aluno.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nome_aluno">
              Nome do Aluno <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nome_aluno"
              value={formData.nome_aluno}
              onChange={(e) =>
                setFormData({ ...formData, nome_aluno: e.target.value })
              }
              placeholder="Nome completo da criança"
              className="rounded-xl"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome_pai">Nome do Pai</Label>
              <Input
                id="nome_pai"
                value={formData.nome_pai}
                onChange={(e) =>
                  setFormData({ ...formData, nome_pai: e.target.value })
                }
                placeholder="Nome do pai"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nome_mae">Nome da Mãe</Label>
              <Input
                id="nome_mae"
                value={formData.nome_mae}
                onChange={(e) =>
                  setFormData({ ...formData, nome_mae: e.target.value })
                }
                placeholder="Nome da mãe"
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefone_contato">Telefone</Label>
              <Input
                id="telefone_contato"
                value={formData.telefone_contato}
                onChange={(e) =>
                  setFormData({ ...formData, telefone_contato: e.target.value })
                }
                placeholder="(00) 00000-0000"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_nascimento">Data de Nascimento</Label>
              <Input
                id="data_nascimento"
                type="date"
                value={formData.data_nascimento}
                onChange={(e) =>
                  setFormData({ ...formData, data_nascimento: e.target.value })
                }
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sala">
              Sala/Turma <span className="text-red-500">*</span>
            </Label>
            <select
              id="sala"
              value={formData.sala}
              onChange={(e) =>
                setFormData({ ...formData, sala: e.target.value })
              }
              className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-school-primary"
              required
            >
              <option value="">Selecione a sala</option>
              {salas.map((sala) => (
                <option key={sala.id} value={sala.nome}>
                  {sala.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) =>
                setFormData({ ...formData, observacoes: e.target.value })
              }
              placeholder="Alguma observação importante..."
              rows={3}
              className="rounded-xl resize-none"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl"
            >
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-school-primary hover:bg-school-primary/90 text-white rounded-xl"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {editStudent ? 'Salvar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
