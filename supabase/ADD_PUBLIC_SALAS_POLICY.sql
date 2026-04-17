-- ==========================================
-- CORREÇÃO: Permitir acesso público a salas ativas
-- ==========================================
-- Problema: A página de matrícula é pública, mas a política RLS exigia autenticação
-- Solução: Adicionar política que permite usuários anônimos verem salas ativas

-- Remover política antiga (que exigia autenticação)
DROP POLICY IF EXISTS autenticados_ver_salas_ativas ON public.salas;

-- Criar nova política pública para ver salas ativas
CREATE POLICY public_ver_salas_ativas
ON public.salas FOR SELECT
USING (ativo = true);

-- Confirmar política criada
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'salas';
