-- ==========================================
-- FUNÇÃO RPC PARA CRIAR USER_ROLE
-- Resolve o erro 403 ao tentar inserir em user_roles durante cadastro
-- ==========================================

-- Função RPC que pode ser chamada durante o cadastro
CREATE OR REPLACE FUNCTION criar_user_role(
    p_user_id UUID,
    p_role TEXT,
    p_assigned_class TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSON;
BEGIN
    -- Verificar se já existe
    IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p_user_id) THEN
        v_result := json_build_object(
            'success', false,
            'message', 'User role já existe',
            'data', NULL::JSON
        );
        RETURN v_result;
    END IF;

    -- Inserir o user_role
    INSERT INTO public.user_roles (user_id, role, assigned_class)
    VALUES (p_user_id, p_role, p_assigned_class);

    v_result := json_build_object(
        'success', true,
        'message', 'User role criado com sucesso',
        'data', json_build_object(
            'user_id', p_user_id,
            'role', p_role,
            'assigned_class', p_assigned_class
        )
    );

    RETURN v_result;
END;
$$;

-- Grant permissão para executar a função (autenticados)
GRANT EXECUTE ON FUNCTION public.criar_user_role TO authenticated;

-- Grant permissão para anon (necessário para cadastro)
GRANT EXECUTE ON FUNCTION public.criar_user_role TO anon;
