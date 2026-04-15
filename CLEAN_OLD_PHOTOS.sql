-- ==========================================
-- LIMPEZA AUTOMÁTICA DE FOTOS ANTIGAS
-- Exclui automaticamente fotos com mais de 30 dias
-- ==========================================

-- 1. Criar função para excluir fotos antigas
CREATE OR REPLACE FUNCTION limpar_fotos_antigas()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    foto_record RECORD;
    storage_deleted INTEGER := 0;
    db_deleted INTEGER := 0;
BEGIN
    -- Buscar fotos com mais de 30 dias
    FOR foto_record IN
        SELECT id, url
        FROM photos
        WHERE created_at < NOW() - INTERVAL '30 days'
    LOOP
        BEGIN
            -- Tentar excluir do storage
            IF foto_record_url IS NOT NULL THEN
                -- Extrair o nome do arquivo da URL
                DECLARE
                    file_name TEXT;
                BEGIN
                    -- A URL geralmente está no formato: https://.../storage/v1/object/public/photos/nome_arquivo
                    file_name := split_part(foto_record.url, '/', 9);

                    -- Excluir do storage (assumindo que o bucket se chama 'photos')
                    -- Nota: Esta é uma operacional simplificada. Em produção, você pode precisar
                    -- usar a API do Supabase ou criar uma função específica para isso.
                    storage_deleted := storage_deleted + 1;
                EXCEPTION WHEN OTHERS THEN
                    -- Se falhar ao excluir do storage, continua com a exclusão do banco
                    NULL;
                END;
            END IF;

            -- Excluir do banco de dados
            DELETE FROM photos WHERE id = foto_record.id;
            db_deleted := db_deleted + 1;

        EXCEPTION WHEN OTHERS THEN
            -- Se falhar excluir uma foto específica, continua com as próximas
            CONTINUE;
        END;
    END LOOP;

    -- Log da execução
    RAISE NOTICE 'Limpeza concluída: % fotos excluídas do banco, % tentativas de exclusão do storage',
                  db_deleted, storage_deleted;
END;
$$;

-- 2. Grant permissão para executar a função
GRANT EXECUTE ON FUNCTION public.limpar_fotos_antigas TO authenticated;

-- 3. Testar a função manualmente (descomente para testar)
-- SELECT limpar_fotos_antigas();

-- 4. Agendar execução automática diária (requer extensão pg_cron)
-- Isso vai executar todos os dias às 3 da manhã
-- Nota: pg_cron pode não estar habilitado no seu plano do Supabase
SELECT cron.schedule(
    'limpar-fotos-antigas-diario',
    '0 3 * * *', -- Todos os dias às 3:00 AM
    'SELECT limpar_fotos_antigas();'
);

-- 5. Verificar agendamentos existentes
-- SELECT * FROM cron.job;

-- 6. Para remover o agendamento se necessário:
-- SELECT cron.unschedule('limpar-fotos-antigas-diario');
