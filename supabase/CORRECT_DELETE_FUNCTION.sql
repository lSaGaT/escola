-- ============================================================
-- FUNÇÃO PARA DELETAR USUÁRIOS - VERSÃO CORRETA
-- Baseado na estrutura REAL das tabelas
-- ============================================================

CREATE OR REPLACE FUNCTION deletar_usuario(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_role TEXT;
    v_user_email TEXT;
    v_user_nome TEXT;
    v_deleted_alunos_count INTEGER;
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

    -- Buscar role do usuário
    SELECT role INTO v_user_role
    FROM public.user_roles
    WHERE user_id = p_user_id;

    -- Buscar email e nome do auth.users
    SELECT email, raw_user_meta_data->>'nome' INTO v_user_email, v_user_nome
    FROM auth.users
    WHERE id = p_user_id;

    -- Se o usuário é um pai, deletar alunos vinculados pelo nome do pai/mãe
    IF v_user_role = 'parent' AND v_user_nome IS NOT NULL THEN
        DELETE FROM public.alunos
        WHERE LOWER(nome_pai) = LOWER(v_user_nome)
           OR LOWER(nome_mae) = LOWER(v_user_nome);

        GET DIAGNOSTICS v_deleted_alunos_count = ROW_COUNT;
    END IF;

    -- Deletar o registro em user_roles
    DELETE FROM public.user_roles WHERE user_id = p_user_id;

    -- Deletar o usuário do Auth
    DELETE FROM auth.users WHERE id = p_user_id;

    -- Retornar sucesso
    SELECT json_build_object(
        'success', true,
        'message', 'Usuário deletado completamente.',
        'user_id', p_user_id,
        'deleted_items', json_build_object(
            'auth_user', true,
            'user_roles', true,
            'alunos_count', COALESCE(v_deleted_alunos_count, 0)
        )
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
    RAISE NOTICE 'Função deletar_usuario criada corretamente!';
    RAISE NOTICE 'Baseado na estrutura REAL das tabelas';
    RAISE NOTICE '===========================================================';
END $$;
