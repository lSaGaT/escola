-- ==========================================
-- TRIGGER: Atualizar assigned_class dos pais quando aluno muda de sala
-- ==========================================
-- Problema: Quando professor muda a sala de um aluno, o assigned_class do pai não era atualizado
-- Solução: Trigger que atualiza automaticamente user_roles quando sala do aluno muda

-- Função que atualiza o assigned_class dos pais
CREATE OR REPLACE FUNCTION atualizar_pai_assigned_class()
RETURNS TRIGGER AS $$
BEGIN
    -- Quando a sala do aluno muda, atualizar todos os pais user_roles vinculados
    UPDATE public.user_roles
    SET assigned_class = NEW.sala
    WHERE role = 'parent'
    AND (
        -- Verificar se o nome do pai/mãe no user_role corresponde ao aluno
        -- O user_metadata.nome contém o nome do pai/mãe
        EXISTS (
            SELECT 1
            FROM auth.users
            WHERE auth.users.id = user_roles.user_id
            AND (
                -- Comparar com nome_pai ou nome_mae do aluno (ignorando maiúsculas/minúsculas e espaços)
                LOWER(TRIM(auth.users.raw_user_meta_data->>'nome')) = LOWER(TRIM(NEW.nome_pai))
                OR LOWER(TRIM(auth.users.raw_user_meta_data->>'nome')) = LOWER(TRIM(NEW.nome_mae))
            )
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS trigger_atualizar_pai_assigned_class ON public.alunos;

-- Criar o trigger
CREATE TRIGGER trigger_atualizar_pai_assigned_class
    AFTER UPDATE OF sala ON public.alunos
    FOR EACH ROW
    WHEN (OLD.sala IS DISTINCT FROM NEW.sala)  -- Só executa se a sala realmente mudou
    EXECUTE FUNCTION atualizar_pai_assigned_class();

-- ==========================================
-- TRIGGER: Atualizar assigned_class quando aluno é inserido (matrícula)
-- ==========================================
-- Este trigger garante que quando um novo aluno é matriculado,
-- o assigned_class do pai já seja definido corretamente

-- Reutilizar a mesma função, mas criar trigger para INSERT
CREATE TRIGGER trigger_atualizar_pai_assigned_class_insert
    AFTER INSERT ON public.alunos
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_pai_assigned_class();

-- Confirmar triggers criados
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing
FROM information_schema.triggers
WHERE trigger_name LIKE '%atualizar_pai_assigned_class%'
ORDER BY trigger_name;
