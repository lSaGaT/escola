-- ==========================================
-- ATUALIZAÇÃO DA TABELA MENSAGENS
-- Adiciona campos para suportar o novo sistema estilo WhatsApp
-- ==========================================

-- 1. Adicionar coluna para canal geral
ALTER TABLE mensagens
ADD COLUMN IF NOT EXISTS canal_geral BOOLEAN DEFAULT false;

-- 2. Adicionar coluna para nome do remetente
ALTER TABLE mensagens
ADD COLUMN IF NOT EXISTS sender_name TEXT;

-- 3. Adicionar coluna para email do remetente
ALTER TABLE mensagens
ADD COLUMN IF NOT EXISTS sender_email TEXT;

-- 4. Adicionar coluna para destinatário (mensagens direcionadas)
ALTER TABLE mensagens
ADD COLUMN IF NOT EXISTS destinatario_id UUID;

-- 5. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_mensagens_canal_geral ON mensagens(canal_geral);
CREATE INDEX IF NOT EXISTS idx_mensagens_destinatario ON mensagens(destinatario_id);

-- 6. Atualizar registros existentes (opcional)
-- Define sender_name e sender_email baseado em dados antigos
UPDATE mensagens m
SET
    sender_name = COALESCE(
        u.raw_user_meta_data->>'nome',
        u.email,
        'Usuário'
    ),
    sender_email = u.email
FROM auth.users u
WHERE m.remetente_id = u.id
AND m.sender_name IS NULL;

-- 7. Adicionar comentários na tabela
COMMENT ON COLUMN mensagens.canal_geral IS 'Indica se a mensagem é do canal geral (todos veem)';
COMMENT ON COLUMN mensagens.sender_name IS 'Nome do remetente para exibição';
COMMENT ON COLUMN mensagens.sender_email IS 'Email do remetente para exibição';
COMMENT ON COLUMN mensagens.destinatario_id IS 'ID do destinatário (para mensagens direcionadas)';

-- 8. Mostrar estatísticas
SELECT
    'Migração concluída!' as status,
    COUNT(*) as total_mensagens,
    COUNT(*) FILTER (WHERE canal_geral = true) as mensagens_geral,
    COUNT(*) FILTER (WHERE sender_name IS NOT NULL) as com_nome_remetente
FROM mensagens;
