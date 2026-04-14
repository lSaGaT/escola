import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://arwdnjqbphomkehwkczl.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyd2RuanFicGhvbWtlaHdrY3psIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjExNjU0NiwiZXhwIjoyMDkxNjkyNTQ2fQ.ZBIk9qk9WPqyK84MYpX3vs0-fPTZFILToS5LQDuwohA';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Iniciando migração...\n');

  // SQL dividido em blocos para execução sequencial
  const sqlBlocks = [
    // Bloco 1: Criar tabela agenda
    `
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
    `,

    // Bloco 2: Índices agenda
    `
    CREATE INDEX IF NOT EXISTS idx_agenda_data ON public.agenda(data);
    CREATE INDEX IF NOT EXISTS idx_agenda_tipo ON public.agenda(tipo);
    CREATE INDEX IF NOT EXISTS idx_agenda_sala ON public.agenda(sala);
    CREATE INDEX IF NOT EXISTS idx_agenda_ativo ON public.agenda(ativo);
    `,

    // Bloco 3: Trigger agenda
    `
    DROP TRIGGER IF EXISTS atualizar_agenda_data ON public.agenda;
    CREATE TRIGGER atualizar_agenda_data
        BEFORE UPDATE ON public.agenda
        FOR EACH ROW
        EXECUTE FUNCTION atualizar_data_edicao();
    `,

    // Bloco 4: RLS agenda
    `
    ALTER TABLE public.agenda ENABLE ROW LEVEL SECURITY;
    `,

    // Bloco 5: Políticas agenda - professores
    `
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
    `,

    // Bloco 6: Políticas agenda - pais
    `
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
    `,

    // Bloco 7: Criar tabela mensagens
    `
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
    `,

    // Bloco 8: Índices mensagens
    `
    CREATE INDEX IF NOT EXISTS idx_mensagens_remetente ON public.mensagens(remetente_id);
    CREATE INDEX IF NOT EXISTS idx_mensagens_sala ON public.mensagens(sala);
    CREATE INDEX IF NOT EXISTS idx_mensagens_lida ON public.mensagens(lida);
    CREATE INDEX IF NOT EXISTS idx_mensagens_criado_em ON public.mensagens(criado_em DESC);
    `,

    // Bloco 9: RLS mensagens
    `
    ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;
    `,

    // Bloco 10: Políticas mensagens - pais
    `
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
    `,

    // Bloco 11: Políticas mensagens - professores SELECT
    `
    DROP POLICY IF EXISTS professores_ver_mensagens ON public.mensagens;
    CREATE POLICY professores_ver_mensagens
    ON public.mensagens FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'teacher'
        )
    );
    `,

    // Bloco 12: Políticas mensagens - professores UPDATE
    `
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
    `,

    // Bloco 13: Função contar mensagens
    `
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
    `,

    // Bloco 14: View agenda_dia
    `
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
    `
  ];

  let successCount = 0;

  for (let i = 0; i < sqlBlocks.length; i++) {
    const sql = sqlBlocks[i].trim();
    if (!sql) continue;

    try {
      // Usar RPC para executar SQL raw
      const { data, error } = await supabase.rpc('exec_sql', { sql: sql });

      if (error) {
        // Se exec_sql não existe, tentar método alternativo via HTTP
        console.log(`⚠️  Bloco ${i + 1}: exec_sql não disponível`);
      } else {
        successCount++;
        console.log(`✅ Bloco ${i + 1} executado`);
      }
    } catch (err) {
      console.log(`⚠️  Bloco ${i + 1}: ${err.message}`);
    }
  }

  console.log(`\n📊 Resumo: ${successCount}/${sqlBlocks.length} blocos executados`);
  console.log('\n⚠️  Se a RPC exec_sql não está disponível, use o SQL Editor do Supabase:');
  console.log('   https://supabase.com/dashboard/project/arwdnjqbphomkehwkczl/sql');
  console.log('\n   Execute o arquivo: MIGRATE_AGENDA_MESSAGES.sql\n');
}

runMigration().catch(console.error);
