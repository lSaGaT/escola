import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Aluno } from '@/src/types';
import { StudentCard } from './StudentCard';

interface KanbanColumnProps {
  id: string;
  title: string;
  students: Aluno[];
  onEditStudent: (student: Aluno) => void;
}

export function KanbanColumn({ id, title, students, onEditStudent }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div className="flex-shrink-0 w-72">
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
        {/* Header da coluna */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-700">{title}</h3>
          <span className="bg-school-primary/10 text-school-primary text-xs font-bold px-2 py-1 rounded-full">
            {students.length}
          </span>
        </div>

        {/* Lista de alunos */}
        <SortableContext
          id={id}
          items={students.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div ref={setNodeRef} className="space-y-2 min-h-[200px]">
            {students.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                Vazio
              </div>
            ) : (
              students.map((student) => (
                <StudentCard
                  key={student.id}
                  student={student}
                  onEdit={() => onEditStudent(student)}
                />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
