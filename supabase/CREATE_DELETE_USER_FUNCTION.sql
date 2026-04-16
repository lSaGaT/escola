-- ============================================================
-- FUNÇÃO PARA DELETAR USUÁRIOS (Execute no SQL Editor)
-- ============================================================
--
-- Instruções:
-- 1. Acesse: https://supabase.com/dashboard
-- 2. Selecione o projeto: arwdnjqbphomkehwkczl
-- 3. Vá em "SQL Editor" no menu lateral
-- 4. Cole este código inteiro
-- 5. Clique em "Run" (ou pressione Ctrl+Enter)
-- ============================================================

-- Criar função para deletar usuário
CREATE OR REPLACE FUNCTION deletar_usuario(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSON;
BEGIN
    -- Verificar se o usuário atual é um professor (admin)
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role = 'teacher'
    ) THEN
        RAISE EXCEPTION 'Apenas professores/administradores podem deletar usuários';
    END IF;

    -- Deletar o registro em user_roles
    DELETE FROM public.user_roles WHERE user_id = p_user_id;

    -- Retornar sucesso
    SELECT json_build_object(
        'success', true,
        'message', 'Usuário removido do sistema.',
        'user_id', p_user_id
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- Grant permissão para executar a função
GRANT EXECUTE ON FUNCTION deletar_usuario(UUID) TO authenticated;

-- Mostrar confirmação
DO $$
BEGIN
    RAISE NOTICE '===========================================================';
    RAISE NOTICE 'Função deletar_usuario criada com sucesso!';
    RAISE NOTICE '===========================================================';
END $$;
