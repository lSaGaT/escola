-- ==========================================
-- MIGRAÇÃO SUPABASE - ESCOLA PEQUENOS PASSOS
-- Script para rodar no SQL Editor do Supabase
-- ==========================================

-- ==========================================
-- 1. CRIAR TABELA DE ALUNOS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.alunos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome_aluno TEXT NOT NULL,
    nome_pai TEXT,
    nome_mae TEXT,
    telefone_contato TEXT,
    sala TEXT NOT NULL, -- Sala/turma atual (ex: 'Maternal 1', 'Berçário')
    data_nascimento DATE,
    data_matricula DATE DEFAULT CURRENT_DATE,
    observacoes TEXT,
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMPTZ DEFAULT now(),
    atualizado_em TIMESTAMPTZ DEFAULT now()
);

-- Índices para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_alunos_sala ON public.alunos(sala);
CREATE INDEX IF NOT EXISTS idx_alunos_ativo ON public.alunos(ativo);

-- ==========================================
-- 2. TRIGGER PARA ATUALIZAR DATA AUTOMATICAMENTE
-- ==========================================
CREATE OR REPLACE FUNCTION atualizar_data_edicao()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS atualizar_alunos_data ON public.alunos;
CREATE TRIGGER atualizar_alunos_data
    BEFORE UPDATE ON public.alunos
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_data_edicao();

-- ==========================================
-- 3. HABILITAR RLS NA TABELA DE ALUNOS
-- ==========================================
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 4. POLÍTICAS DE SEGURANÇA PARA ALUNOS
-- ==========================================

-- PROFESSORES: Podem fazer tudo (criar, ler, editar, deletar)
DROP POLICY IF EXISTS professores_gerenciam_alunos ON public.alunos;
CREATE POLICY professores_gerenciam_alunos
ON public.alunos FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'teacher'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'teacher'
    )
);

-- PAIS: Podem ver apenas os alunos da sua turma
DROP POLICY IF EXISTS pais_ver_alunos_turma ON public.alunos;
CREATE POLICY pais_ver_alunos_turma
ON public.alunos FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role = 'parent'
        AND assigned_class = alunos.sala
    )
);

-- ==========================================
-- 5. FUNÇÕES PARA O KANBAN
-- ==========================================

-- Função para listar todas as salas/turmas
CREATE OR REPLACE FUNCTION listar_salas()
RETURNS TABLE(nome_sala TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT sala
    FROM public.alunos
    WHERE ativo = true
    ORDER BY sala;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para mover aluno entre salas
CREATE OR REPLACE FUNCTION mover_aluno_sala(
    aluno_id UUID,
    nova_sala TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Verificar se o usuário é professor
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'teacher'
    ) THEN
        RAISE EXCEPTION 'Apenas professores podem mover alunos entre salas';
    END IF;

    -- Atualizar a sala do aluno
    UPDATE public.alunos
    SET sala = nova_sala,
        atualizado_em = now()
    WHERE id = aluno_id;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 6. VIEW PARA O KANBAN
-- ==========================================
CREATE OR REPLACE VIEW kanban_turmas AS
SELECT
    sala,
    json_agg(
        json_build_object(
            'id', id,
            'nome_aluno', nome_aluno,
            'nome_pai', nome_pai,
            'nome_mae', nome_mae,
            'telefone_contato', telefone_contato,
            'data_nascimento', data_nascimento,
            'data_matricula', data_matricula,
            'observacoes', observacoes,
            'ativo', ativo
        ) ORDER BY nome_aluno
    ) AS alunos
FROM public.alunos
WHERE ativo = true
GROUP BY sala
ORDER BY sala;

-- ==========================================
-- 7. TABELA DE SALAS/TURMAS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.salas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL UNIQUE,
    descricao TEXT,
    idade_minima INTEGER,
    idade_maxima INTEGER,
    capacidade INTEGER,
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.salas ENABLE ROW LEVEL SECURITY;

-- PROFESSORES: Podem gerenciar salas
DROP POLICY IF EXISTS professores_gerenciam_salas ON public.salas;
CREATE POLICY professores_gerenciam_salas
ON public.salas FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'teacher'
    )
);

-- TODOS AUTENTICADOS: Podem ver salas ativas
DROP POLICY IF EXISTS autenticados_ver_salas_ativas ON public.salas;
CREATE POLICY autenticados_ver_salas_ativas
ON public.salas FOR SELECT
USING (
    ativo = true AND auth.role() = 'authenticated'
);

-- ==========================================
-- 8. DADOS INICIAIS - SALAS EXEMPLO
-- ==========================================
INSERT INTO public.salas (nome, descricao, idade_minima, idade_maxima, capacidade) VALUES
    ('Berçário', 'Bebês de 0 a 1 ano', 0, 1, 15),
    ('Maternal 1', 'Crianças de 1 a 2 anos', 1, 2, 20),
    ('Maternal 2', 'Crianças de 2 a 3 anos', 2, 3, 20),
    ('Pré 1', 'Crianças de 3 a 4 anos', 3, 4, 25),
    ('Pré 2', 'Crianças de 4 a 5 anos', 4, 5, 25)
ON CONFLICT (nome) DO NOTHING;
