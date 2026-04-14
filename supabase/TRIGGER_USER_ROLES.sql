-- ==========================================
-- TRIGGER PARA CRIAR user_roles AUTOMATICAMENTE
-- ==========================================

-- Função para criar registro em user_roles quando novo usuário é criado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'parent');  -- Novos usuários são 'parent' por padrão
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que chama a função quando um usuário é criado no auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- PARA ATRIBUIR ROLE DE teacher A UM USUÁRIO
-- ==========================================
-- Substitua 'user_id_aqui' pelo ID do usuário que você quer promover a teacher

-- Exemplo:
-- UPDATE public.user_roles SET role = 'teacher' WHERE user_id = 'user_id_aqui';

-- Para ver os user_ids disponíveis:
-- SELECT id, email FROM auth.users;
