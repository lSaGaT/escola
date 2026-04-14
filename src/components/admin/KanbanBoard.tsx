import { useState, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Aluno } from '@/src/types';
import { supabase } from '@/src/lib/supabase';
import { KanbanColumn } from './KanbanColumn';
import { StudentCard } from './StudentCard';
import { Users, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface KanbanBoardProps {
  onEditStudent: (student: Aluno) => void;
  refreshTrigger?: number;
}

interface KanbanData {
  [key: string]: Aluno[];
}

export function KanbanBoard({ onEditStudent, refreshTrigger }: KanbanBoardProps) {
  // Ordem correta das turmas
  const CLASS_ORDER = ['Berçário', 'Maternal 1', 'Maternal 2', 'Pré 1', 'Pré 2', '1ª Série'];
  
  const [kanbanData, setKanbanData] = useState<KanbanData>({});
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeStudent, setActiveStudent] = useState<Aluno | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    fetchKanbanData();
  }, [refreshTrigger]);

  const fetchKanbanData = async () => {
    setLoading(true);
    try {
      // Buscar dados da tabela alunos
      const { data, error } = await supabase
        .from('alunos')
        .select('*')
        .eq('ativo', true)
        .order('sala');

      if (error) throw error;

      // Agrupar por sala
      const dataMap: KanbanData = {};
      const cols: string[] = [];

      data?.forEach((aluno: Aluno) => {
        const sala = aluno.sala;
        if (!dataMap[sala]) {
          dataMap[sala] = [];
          cols.push(sala);
        }
        dataMap[sala].push(aluno);
      });

      // Ordenar colunas de acordo com CLASS_ORDER
      const sortedCols = cols.sort((a, b) => {
        const indexA = CLASS_ORDER.indexOf(a);
        const indexB = CLASS_ORDER.indexOf(b);
        return indexA - indexB;
      });

      setColumns(sortedCols);
      setKanbanData(dataMap);
    } catch (error) {
      console.error('Erro ao buscar dados do kanban:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);

    // Encontrar o aluno ativo
    for (const sala in kanbanData) {
      const student = kanbanData[sala].find((s) => s.id === active.id);
      if (student) {
        setActiveStudent(student);
        break;
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveStudent(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Encontrar a sala de origem e destino
    let sourceSala: string | null = null;
    let targetSala: string | null = null;

    for (const sala in kanbanData) {
      if (kanbanData[sala].find((s) => s.id === activeId)) {
        sourceSala = sala;
      }
      if (kanbanData[sala].find((s) => s.id === overId)) {
        targetSala = sala;
      }
    }

    // Se over.id é uma coluna (sala)
    if (columns.includes(overId)) {
      targetSala = overId;
    }

    if (!sourceSala || !targetSala) return;

    // Se é a mesma sala, apenas reordenar
    if (sourceSala === targetSala) {
      const sourceColumn = kanbanData[sourceSala];
      const oldIndex = sourceColumn.findIndex((s) => s.id === activeId);
      const newIndex = sourceColumn.findIndex((s) => s.id === overId);

      if (oldIndex !== newIndex) {
        setKanbanData({
          ...kanbanData,
          [sourceSala]: arrayMove(sourceColumn, oldIndex, newIndex),
        });
      }
    } else {
      // Mover entre salas
      const student = kanbanData[sourceSala].find((s) => s.id === activeId);
      if (!student) return;

      // Atualizar localmente
      const newKanbanData = { ...kanbanData };
      newKanbanData[sourceSala] = newKanbanData[sourceSala].filter(
        (s) => s.id !== activeId
      );
      newKanbanData[targetSala] = [
        ...newKanbanData[targetSala],
        { ...student, sala: targetSala },
      ];

      setKanbanData(newKanbanData);

      // Atualizar no banco
      try {
        const { error } = await supabase.rpc('mover_aluno_sala', {
          aluno_id: activeId,
          nova_sala: targetSala,
        });

        if (error) throw error;
      } catch (error) {
        console.error('Erro ao mover aluno:', error);
        // Reverter em caso de erro
        setKanbanData(kanbanData);
        alert('Erro ao mover aluno. Tente novamente.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Loader2 className="h-12 w-12 animate-spin mb-4 text-school-primary" />
        <p className="font-medium">Carregando turmas...</p>
      </div>
    );
  }

  if (columns.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
        <Users className="h-16 w-16 text-slate-200 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-slate-600">
          Nenhuma turma encontrada
        </h3>
        <p className="text-slate-400">Cadastre alunos para ver as turmas aqui.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-school-primary" />
          <h3 className="text-lg font-semibold text-slate-800">
            {columns.length} {columns.length === 1 ? 'turma' : 'turmas'}
          </h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchKanbanData}
          className="rounded-xl gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((column) => (
            <KanbanColumn
              key={column}
              id={column}
              title={column}
              students={kanbanData[column] || []}
              onEditStudent={onEditStudent}
            />
          ))}
        </div>

        <DragOverlay>
          {activeStudent && (
            <div className="rotate-3 opacity-90">
              <StudentCard student={activeStudent} onEdit={() => {}} />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
