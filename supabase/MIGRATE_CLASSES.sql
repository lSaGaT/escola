-- ==========================================
-- MIGRAÇÃO: Atualizar nomes das salas/turmas
-- ==========================================
-- De: Maternal 1, Maternal 2, Maternal 3, Maternal 4, 1ª Série
-- Para: Maternal 1, Maternal 2, Maternal 3, 1º Período, 2º Período
-- ==========================================

-- 1. Atualizar tabela de salas (salas)
-- Remover salas antigas e adicionar novas
DELETE FROM public.salas WHERE nome IN ('Berçário', 'Pré 1', 'Pré 2', 'Maternal 4', '1ª Série');

INSERT INTO public.salas (nome, descricao, idade_minima, idade_maxima, capacidade) VALUES
    ('Maternal 1', 'Crianças de 1 a 2 anos', 1, 2, 20),
    ('Maternal 2', 'Crianças de 2 a 3 anos', 2, 3, 20),
    ('Maternal 3', 'Crianças de 3 a 4 anos', 3, 4, 20),
    ('1º Período', 'Crianças de 4 a 5 anos', 4, 5, 25),
    ('2º Período', 'Crianças de 5 a 6 anos', 5, 6, 25)
ON CONFLICT (nome) DO NOTHING;

-- 2. Atualizar alunos com as novas salas
UPDATE public.alunos SET sala = '1º Período' WHERE sala = 'Maternal 4';
UPDATE public.alunos SET sala = '2º Período' WHERE sala = '1ª Série';

-- 3. Atualizar user_roles com as novas salas
UPDATE public.user_roles SET assigned_class = '1º Período' WHERE assigned_class = 'Maternal 4';
UPDATE public.user_roles SET assigned_class = '2º Período' WHERE assigned_class = '1ª Série';

-- 4. Atualizar fotos com as novas salas
UPDATE public.photos SET class_name = '1º Período' WHERE class_name = 'Maternal 4';
UPDATE public.photos SET class_name = '2º Período' WHERE class_name = '1ª Série';

-- 5. Atualizar agenda com as novas salas
UPDATE public.agenda SET sala = '1º Período' WHERE sala = 'Maternal 4';
UPDATE public.agenda SET sala = '2º Período' WHERE sala = '1ª Série';

-- 6. Atualizar mensagens com as novas salas
UPDATE public.mensagens SET sala = '1º Período' WHERE sala = 'Maternal 4';
UPDATE public.mensagens SET sala = '2º Período' WHERE sala = '1ª Série';

-- 7. Confirmar as mudanças
SELECT 'Migração concluída!' as status;
SELECT nome as sala_nova FROM public.salas ORDER BY nome;
