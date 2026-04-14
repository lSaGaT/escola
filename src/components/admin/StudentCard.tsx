import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Aluno } from '@/src/types';
import { GripVertical, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StudentCardProps {
  student: Aluno;
  onEdit: () => void;
}

export function StudentCard({ student, onEdit }: StudentCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: student.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group"
    >
      <div className="flex items-start gap-3">
        {/* Drag handle */}
        <button
          className="flex-shrink-0 text-slate-300 hover:text-slate-400 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-slate-800 text-sm leading-tight">
            {student.nome_aluno}
          </h4>

          {student.nome_mae && (
            <p className="text-xs text-slate-500 mt-1">
              {student.nome_mae}
            </p>
          )}
        </div>

        {/* Botão editar */}
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0 h-7 w-7 text-slate-400 hover:text-school-primary opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={onEdit}
        >
          <Edit className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
