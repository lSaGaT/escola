-- Função RPC para deletar usuário (apenas para administradores)
-- Esta função usa a service_role key através do postgres para deletar usuários

CREATE OR REPLACE FUNCTION deletar_usuario(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
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

    -- Deletar o registro em user_roles primeiro (foreign key constraint)
    DELETE FROM public.user_roles WHERE user_id = p_user_id;

    -- Retornar sucesso
    -- Nota: O usuário do Auth não é deletado automaticamente por questões de segurança
    -- Ele permanecerá no sistema mas sem permissões (sem registro em user_roles)
    SELECT json_build_object(
        'success', true,
        'message', 'Usuário deletado do sistema de permissões. Para deletar completamente do Auth, use o dashboard do Supabase.',
        'user_id', p_user_id
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- Grant permissão para executar a função
GRANT EXECUTE ON FUNCTION deletar_usuario(UUID) TO authenticated;

-- Comentário para documentação
COMMENT ON FUNCTION deletar_usuario IS 'Deleta um usuário do sistema (remove de user_roles). Apenas professores podem executar. Nota: Não deleta do Auth Supabase por segurança - deve ser feito via dashboard.';
