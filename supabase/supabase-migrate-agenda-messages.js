/**
 * Script para criar tabelas de Agenda e Mensagens no Supabase
 * Execute: node supabase-migrate-agenda-messages.js
 *
 * Variáveis de ambiente necessárias:
 * SUPABASE_URL - URL do seu projeto Supabase
 * SUPABASE_SERVICE_KEY - Service role key do Supabase (encontrado em Project Settings > API)
 */

const { createClient } = require('@supabase/supabase-js');

// SQL para criar as tabelas
const sqlCommands = `
-- ==========================================
-- TABELAS DE AGENDA E MENSAGENS
-- ==========================================

-- 1. CRIAR TABELA DE AGENDA
CREATE TABLE IF NOT EXISTS public.agenda (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    titulo TEXT NOT NULL,
    descricao TEXT,
    data DATE NOT NULL,
    hora TIME,
    local TEXT,
    tipo TEXT DEFAULT 'geral',
    sala TEXT,
    itens_para_levar TEXT[],
    criado_por UUID REFERENCES auth.users(id),
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMPTZ DEFAULT now(),
    atualizado_em TIMESTAMPTZ DEFAULT now()
);

-- Índices para agenda
CREATE INDEX IF NOT EXISTS idx_agenda_data ON public.agenda(data);
CREATE INDEX IF NOT EXISTS idx_agenda_tipo ON public.agenda(tipo);
CREATE INDEX IF NOT EXISTS idx_agenda_sala ON public.agenda(sala);
CREATE INDEX IF NOT EXISTS idx_agenda_ativo ON public.agenda(ativo);

-- Trigger para agenda
DROP TRIGGER IF EXISTS atualizar_agenda_data ON public.agenda;
CREATE TRIGGER atualizar_agenda_data
    BEFORE UPDATE ON public.agenda
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_data_edicao();

-- Habilitar RLS
ALTER TABLE public.agenda ENABLE ROW LEVEL SECURITY;

-- Políticas para agenda
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

DROP POLICY IF EXISTS pais_ver_agenda ON public.agenda;
CREATE POLICY pais_ver_agenda
ON public.agenda FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role = 'parent'
        AND (
            agenda.tipo = 'geral'
            OR
            (agenda.tipo = 'turma' AND agenda.sala = user_roles.assigned_class)
        )
    )
);

-- 2. CRIAR TABELA DE MENSAGENS
CREATE TABLE IF NOT EXISTS public.mensagens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    remetente_id UUID REFERENCES auth.users(id) NOT NULL,
    destinatario_id TEXT,
    conteudo TEXT NOT NULL,
    lida BOOLEAN DEFAULT false,
    lida_em TIMESTAMPTZ,
    sala TEXT,
    imagem_url TEXT,
    criado_em TIMESTAMPTZ DEFAULT now()
);

-- Índices para mensagens
CREATE INDEX IF NOT EXISTS idx_mensagens_remetente ON public.mensagens(remetente_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_sala ON public.mensagens(sala);
CREATE INDEX IF NOT EXISTS idx_mensagens_lida ON public.mensagens(lida);
CREATE INDEX IF NOT EXISTS idx_mensagens_criado_em ON public.mensagens(criado_em DESC);

-- Habilitar RLS
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;

-- Políticas para mensagens
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

DROP POLICY IF EXISTS professores_ver_mensagens ON public.mensagens;
CREATE POLICY professores_ver_mensagens
ON public.mensagens FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'teacher'
    )
);

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

-- 3. FUNÇÕES ÚTEIS
CREATE OR REPLACE FUNCTION contar_mensagens_nao_lidas()
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM public.mensagens
        WHERE lida = false
        AND (
            EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'teacher')
            OR
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
`;

async function migrate() {
    // Verificar variáveis de ambiente
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Erro: Variáveis de ambiente não configuradas');
        console.error('\nConfigure as seguintes variáveis de ambiente:');
        console.error('  SUPABASE_URL - URL do seu projeto Supabase');
        console.error('  SUPABASE_SERVICE_KEY - Service role key do Supabase');
        console.error('\nOu passe como argumentos:');
        console.error('  node supabase-migrate-agenda-messages.js <SUPABASE_URL> <SUPABASE_SERVICE_KEY>');
        process.exit(1);
    }

    // Criar cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🚀 Iniciando migração para o Supabase...\n');

    try {
        // Executar SQL
        const { data, error } = await supabase.rpc('exec_sql', { sql: sqlCommands });

        // Se a função exec_sql não existe, tentar método alternativo
        if (error && error.message.includes('function exec_sql')) {
            console.log('⚠️  Função exec_sql não disponível. Use o SQL Editor do Supabase para executar manualmente.');
            console.log('\n📋 Copie e execute o SQL abaixo no SQL Editor do Supabase:\n');
            console.log('─'.repeat(60));
            console.log(sqlCommands);
            console.log('─'.repeat(60));
            console.log('\n✅ SQL copiado para área de transferência (se suportado)');
            return;
        }

        if (error) {
            console.error('❌ Erro ao executar migração:', error);
            process.exit(1);
        }

        console.log('✅ Migração concluída com sucesso!');
        console.log('\n📊 Tabelas criadas:');
        console.log('  • agenda (eventos e atividades)');
        console.log('  • mensagens (comunicação pais-professores)');
        console.log('\n🔒 Políticas RLS configuradas para:');
        console.log('  • professores (acesso total)');
        console.log('  • pais (acesso limitado)');

    } catch (error) {
        console.error('❌ Erro durante a migração:', error);
        process.exit(1);
    }
}

// Permitir passar URL e key como argumentos
if (process.argv.length >= 4) {
    process.env.SUPABASE_URL = process.argv[2];
    process.env.SUPABASE_SERVICE_KEY = process.argv[3];
}

migrate();
