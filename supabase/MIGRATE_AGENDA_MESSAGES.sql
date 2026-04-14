-- ==========================================
-- MIGRAÇÃO: TABELAS DE AGENDA E MENSAGENS
-- Escolinha Recanto Alegre
--
-- INSTRUÇÕES:
-- 1. Abra o SQL Editor no seu dashboard do Supabase
-- 2. Copie todo este código
-- 3. Cole e execute (clique em "Run" ou pressione Ctrl+Enter)
-- ==========================================

-- ==========================================
-- 1. CRIAR TABELA DE AGENDA
-- ==========================================
CREATE TABLE IF NOT EXISTS public.agenda (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    titulo TEXT NOT NULL,
    descricao TEXT,
    data DATE NOT NULL,
    hora TIME,
    local TEXT,
    tipo TEXT DEFAULT 'geral', -- 'geral' ou 'turma'
    sala TEXT, -- Se tipo='turma', define qual sala
    itens_para_levar TEXT[], -- Lista de itens que as crianças precisam levar
    criado_por UUID REFERENCES auth.users(id),
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMPTZ DEFAULT now(),
    atualizado_em TIMESTAMPTZ DEFAULT now()
);

-- Índices para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_agenda_data ON public.agenda(data);
CREATE INDEX IF NOT EXISTS idx_agenda_tipo ON public.agenda(tipo);
CREATE INDEX IF NOT EXISTS idx_agenda_sala ON public.agenda(sala);
CREATE INDEX IF NOT EXISTS idx_agenda_ativo ON public.agenda(ativo);

-- Trigger para atualizar data automaticamente
DROP TRIGGER IF EXISTS atualizar_agenda_data ON public.agenda;
CREATE TRIGGER atualizar_agenda_data
    BEFORE UPDATE ON public.agenda
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_data_edicao();

-- ==========================================
-- 2. HABILITAR RLS NA TABELA DE AGENDA
-- ==========================================
ALTER TABLE public.agenda ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 3. POLÍTICAS DE SEGURANÇA PARA AGENDA
-- ==========================================

-- PROFESSORES: Podem fazer tudo (criar, ler, editar, deletar)
DROP POLICY IF EXISTS professores_gerenciam_agenda ON public.agenda;
CREATE POLICY professores_gerenciam_agenda
ON public.agenda FOR ALL
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

-- PAIS: Podem ver eventos gerais e da turma deles
DROP POLICY IF EXISTS pais_ver_agenda ON public.agenda;
CREATE POLICY pais_ver_agenda
ON public.agenda FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role = 'parent'
        AND (
            -- Eventos gerais
            agenda.tipo = 'geral'
            OR
            -- Eventos da turma do pai
            (agenda.tipo = 'turma' AND agenda.sala = user_roles.assigned_class)
        )
    )
);

-- ==========================================
-- 4. CRIAR TABELA DE MENSAGENS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.mensagens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    remetente_id UUID REFERENCES auth.users(id) NOT NULL,
    destinatario_id TEXT, -- NULL = todos os professores, ou ID específico
    conteudo TEXT NOT NULL,
    lida BOOLEAN DEFAULT false,
    lida_em TIMESTAMPTZ,
    sala TEXT, -- Sala/turma relacionada (contexto da mensagem)
    imagem_url TEXT, -- Opcional: imagem anexada
    criado_em TIMESTAMPTZ DEFAULT now()
);

-- Índices para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_mensagens_remetente ON public.mensagens(remetente_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_sala ON public.mensagens(sala);
CREATE INDEX IF NOT EXISTS idx_mensagens_lida ON public.mensagens(lida);
CREATE INDEX IF NOT EXISTS idx_mensagens_criado_em ON public.mensagens(criado_em DESC);

-- ==========================================
-- 5. HABILITAR RLS NA TABELA DE MENSAGENS
-- ==========================================
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 6. POLÍTICAS DE SEGURANÇA PARA MENSAGENS
-- ==========================================

-- PAIS: Podem criar mensagens e ver apenas as suas
DROP POLICY IF EXISTS pais_gerenciam_mensagens ON public.mensagens;
CREATE POLICY pais_gerenciam_mensagens
ON public.mensagens FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'parent'
        AND mensagens.remetente_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'parent'
    )
);

-- PROFESSORES: Podem ver todas as mensagens e marcar como lidas
DROP POLICY IF EXISTS professores_ver_mensagens ON public.mensagens;
CREATE POLICY professores_ver_mensagens
ON public.mensagens FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'teacher'
    )
);

-- PROFESSORES: Podem atualizar mensagens (marcar como lida)
DROP POLICY IF EXISTS professores_atualizar_mensagens ON public.mensagens;
CREATE POLICY professores_atualizar_mensagens
ON public.mensagens FOR UPDATE
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

-- ==========================================
-- 7. FUNÇÕES ÚTEIS
-- ==========================================

-- Função para contar mensagens não lidas
CREATE OR REPLACE FUNCTION contar_mensagens_nao_lidas()
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM public.mensagens
        WHERE lida = false
        AND (
            -- Se for professor, conta todas
            EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'teacher')
            OR
            -- Se for pai, conta apenas as não lidas enviadas por ele
            (remetente_id = auth.uid() AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'parent'))
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View para agenda do dia
CREATE OR REPLACE VIEW agenda_dia AS
SELECT
    a.*,
    CASE
        WHEN a.tipo = 'geral' THEN 'Todos'
        ELSE a.sala
    END as destinatarios,
    u.email as criado_por_email
FROM public.agenda a
LEFT JOIN auth.users u ON a.criado_por = u.id
WHERE a.ativo = true
ORDER BY a.data, a.hora;

-- ==========================================
-- FIM DA MIGRAÇÃO
-- ==========================================

-- Verificação: Confirme que as tabelas foram criadas
SELECT
    'agenda' as tabela,
    COUNT(*) as total_registros
FROM public.agenda
UNION ALL
SELECT
    'mensagens' as tabela,
    COUNT(*) as total_registros
FROM public.mensagens;
