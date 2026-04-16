import pg from 'pg';

const { Client } = pg;

const dbConfig = {
  host: 'aws-1-us-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.arwdnjqbphomkehwkczl',
  password: 'H5dMLHGGrfgGKo3S',
  ssl: { rejectUnauthorized: false }
};

async function createAlunoFunction() {
  const client = new Client(dbConfig);

  try {
    console.log('🔌 Conectando ao Supabase...');
    await client.connect();
    console.log('✅ Conectado!\n');

    // Criar função RPC para inserir aluno
    console.log('📝 Criando função inserir_aluno_matricula...');
    await client.query(`
      CREATE OR REPLACE FUNCTION inserir_aluno_matricula(
        p_nome_aluno TEXT,
        p_sala TEXT,
        p_nome_pai TEXT DEFAULT NULL,
        p_nome_mae TEXT DEFAULT NULL,
        p_telefone_contato TEXT DEFAULT NULL,
        p_data_nascimento TEXT DEFAULT NULL,
        p_observacoes TEXT DEFAULT NULL
      )
      RETURNS UUID
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        v_aluno_id UUID;
      BEGIN
        -- Inserir o aluno
        INSERT INTO alunos (
          nome_aluno,
          nome_pai,
          nome_mae,
          telefone_contato,
          sala,
          data_nascimento,
          observacoes,
          criado_em
        ) VALUES (
          p_nome_aluno,
          p_nome_pai,
          p_nome_mae,
          p_telefone_contato,
          p_sala,
          CASE WHEN p_data_nascimento IS NOT NULL AND p_data_nascimento != '' THEN p_data_nascimento::date ELSE NULL END,
          p_observacoes,
          NOW()
        ) RETURNING id INTO v_aluno_id;

        RETURN v_aluno_id;
      END;
      $$;
    `);
    console.log('✅ Função criada!\n');

    // Grant permissões
    console.log('📝 Concedendo permissões...');
    await client.query(`
      GRANT EXECUTE ON FUNCTION inserir_aluno_matricula(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
      GRANT EXECUTE ON FUNCTION inserir_aluno_matricula(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon;
    `);
    console.log('✅ Permissões concedidas!\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Função RPC criada com sucesso!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📌 Função inserir_aluno_matricula:');
    console.log('   • Insere alunos no sistema com bypass de RLS');
    console.log('   • Usada pelo formulário de matrícula pública');
    console.log('   • Permite inserção por usuários anônimos');
    console.log('');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
    console.log('🔌 Conexão encerrada.');
  }
}

createAlunoFunction();
