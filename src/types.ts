export type SchoolClass = 'Maternal 1' | 'Maternal 2' | 'Maternal 3' | '1º Período' | '2º Período' | 'Geral';

export interface Photo {
  id: string;
  url: string;
  class_name: SchoolClass | SchoolClass[];
  description?: string;
  uploaded_by?: string;
  created_at: string;
}

export interface UserRole {
  user_id: string;
  role: 'teacher' | 'parent';
  assigned_class?: SchoolClass;
}

// Tipos para Admin/Alunos
export interface Aluno {
  id: string;
  nome_aluno: string;
  nome_pai?: string;
  nome_mae?: string;
  telefone_contato?: string;
  sala: string;
  data_nascimento?: string;
  data_matricula?: string;
  observacoes?: string;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface Sala {
  id: string;
  nome: string;
  descricao?: string;
  idade_minima?: number;
  idade_maxima?: number;
  capacidade?: number;
  ativo: boolean;
  criado_em: string;
}
