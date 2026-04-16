-- ==========================================
-- FUNÇÃO PARA INSERIR ALUNO (com bypass de RLS)
-- Usada pelo formulário de matrícula pública
-- ==========================================

CREATE OR REPLACE FUNCTION inserir_aluno_matricula(
  p_nome_aluno TEXT,
  p_nome_pai TEXT DEFAULT NULL,
  p_nome_mae TEXT DEFAULT NULL,
  p_telefone_contato TEXT DEFAULT NULL,
  p_sala TEXT,
  p_data_nascimento TEXT DEFAULT NULL,
  p_observacoes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_aluno_id UUID;
  v_sala_id UUID;
BEGIN
  -- Buscar o ID da sala pelo nome
  SELECT id INTO v_sala_id
  FROM salas
  WHERE nome = p_sala AND ativo = true
  LIMIT 1;

  IF v_sala_id IS NULL THEN
    RAISE EXCEPTION 'Sala não encontrada: %', p_sala;
  END IF;

  -- Inserir o aluno
  INSERT INTO alunos (
    nome_aluno,
    nome_pai,
    nome_mae,
    telefone_contato,
    sala_id,
    sala,
    data_nascimento,
    observacoes,
    criado_em
  ) VALUES (
    p_nome_aluno,
    p_nome_pai,
    p_nome_mae,
    p_telefone_contato,
    v_sala_id,
    p_sala,
    p_data_nascimento,
    p_observacoes,
    NOW()
  ) RETURNING id INTO v_aluno_id;

  RETURN v_aluno_id;
END;
$$;

-- Grant permissões
GRANT EXECUTE ON FUNCTION inserir_aluno_matricula(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION inserir_aluno_matricula(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon;

-- Adicionar comentário
COMMENT ON FUNCTION inserir_aluno_matricula IS 'Insere um novo aluno no sistema, usada pelo formulário de matrícula pública. Permite inserção com bypass de RLS.';
