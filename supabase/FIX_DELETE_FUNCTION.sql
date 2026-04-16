-- ============================================================
-- FUNÇÃO PARA DELETAR USUÁRIOS COMPLETAMENTE (Opção B) - CORRIGIDA
-- ============================================================

CREATE OR REPLACE FUNCTION deletar_usuario(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_role TEXT;
    v_user_metadata JSONB;
    v_user_nome TEXT;
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

    -- Buscar informações do usuário antes de deletar
    SELECT role, raw_user_meta_data INTO v_user_role, v_user_metadata
    FROM public.user_roles
    WHERE user_id = p_user_id;

    -- Extrair nome do metadata
    v_user_nome := v_user_metadata->>'nome';

    -- Se o usuário é um pai, buscar e deletar o aluno vinculado
    IF v_user_role = 'parent' AND v_user_nome IS NOT NULL THEN
        -- Buscar e deletar alunos vinculados (pelo nome do pai/mãe)
        DELETE FROM public.alunos
        WHERE LOWER(nome_pai) = LOWER(v_user_nome)
           OR LOWER(nome_mae) = LOWER(v_user_nome);
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
            'aluno', v_user_role = 'parent'
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
    RAISE NOTICE 'Função deletar_usuario CORRIGIDA!';
    RAISE NOTICE 'Deleta: Auth + user_roles + aluno (se for pai)';
    RAISE NOTICE '===========================================================';
END $$;
