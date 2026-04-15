-- ==========================================
-- FUNÇÃO RPC PARA LISTAR USUÁRIOS COM EMAIL
-- Resolve o problema 403 ao tentar usar admin API
-- ==========================================

CREATE OR REPLACE FUNCTION listar_usuarios_com_email()
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    role TEXT,
    assigned_class TEXT,
    created_at TIMESTAMPTZ,
    nome_metadata TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ur.user_id,
        COALESCE(u.email, 'N/A') as email,
        ur.role,
        ur.assigned_class,
        ur.created_at,
        COALESCE(u.raw_user_meta_data->>'nome', 'N/A') as nome_metadata
    FROM public.user_roles ur
    LEFT JOIN auth.users u ON u.id = ur.user_id
    ORDER BY ur.created_at DESC;
END;
$$;

-- Grant permissão para executar a função
GRANT EXECUTE ON FUNCTION public.listar_usuarios_com_email TO authenticated;
