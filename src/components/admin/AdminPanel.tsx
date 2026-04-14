import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { StudentForm } from './StudentForm';
import { KanbanBoard } from './KanbanBoard';
import { Aluno } from '@/src/types';
import { Users, Plus, LayoutGrid } from 'lucide-react';

export function AdminPanel() {
  const [formOpen, setFormOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<Aluno | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleAddStudent = () => {
    setEditStudent(null);
    setFormOpen(true);
  };

  const handleEditStudent = (student: Aluno) => {
    setEditStudent(student);
    setFormOpen(true);
  };

  const handleFormSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gerenciamento</h2>
          <p className="text-slate-500 text-sm">
            Cadastre alunos e organize as turmas
          </p>
        </div>
        <Button
          onClick={handleAddStudent}
          className="bg-school-green hover:bg-school-green/90 text-white rounded-xl gap-2"
        >
          <Plus className="h-4 w-4" />
          Novo Aluno
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="kanban" className="w-full">
        <TabsList className="bg-white border border-slate-100 p-1 rounded-2xl w-full sm:w-auto">
          <TabsTrigger
            value="kanban"
            className="rounded-xl gap-2 data-[state=active]:bg-school-primary data-[state=active]:text-white"
          >
            <LayoutGrid className="h-4 w-4" />
            Kanban de Turmas
          </TabsTrigger>
          <TabsTrigger
            value="list"
            className="rounded-xl gap-2 data-[state=active]:bg-school-primary data-[state=active]:text-white"
          >
            <Users className="h-4 w-4" />
            Lista de Alunos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="mt-6">
          <KanbanBoard
            onEditStudent={handleEditStudent}
            refreshTrigger={refreshTrigger}
          />
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-100">
            <p className="text-slate-500 text-center py-8">
              Lista de alunos em desenvolvimento...
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Form Dialog */}
      <StudentForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={handleFormSuccess}
        editStudent={editStudent}
      />
    </div>
  );
}
