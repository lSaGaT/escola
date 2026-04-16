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

async function createContactsFunction() {
  const client = new Client(dbConfig);

  try {
    console.log('🔌 Conectando ao Supabase...');
    await client.connect();
    console.log('✅ Conectado!\n');

    // Criar função RPC para listar contatos
    console.log('📝 Criando função listar_contatos_para_mensagem...');
    await client.query(`
      CREATE OR REPLACE FUNCTION listar_contatos_para_mensagem(
        p_role TEXT,
        p_assigned_class TEXT DEFAULT NULL
      )
      RETURNS TABLE (
        user_id UUID,
        email TEXT,
        nome TEXT,
        contact_role TEXT,
        assigned_class TEXT,
        student_name TEXT
      )
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        v_current_user_id UUID;
      BEGIN
        -- Obter o ID do usuário atual
        v_current_user_id := auth.uid();

        -- Retornar dados baseado no role
        IF p_role = 'teacher' THEN
          -- Professor busca pais dos alunos
          RETURN QUERY
          SELECT
            ur.user_id,
            COALESCE(u.raw_user_meta_data->>'nome', u.email) as email,
            COALESCE(u.raw_user_meta_data->>'nome', 'Responsível') as nome,
            ur.role as contact_role,
            ur.assigned_class,
            a.nome_aluno as student_name
          FROM user_roles ur
          INNER JOIN auth.users u ON u.id = ur.user_id
          INNER JOIN alunos a ON a.sala = ur.assigned_class
          WHERE ur.role = 'parent'
          AND (p_assigned_class IS NULL OR ur.assigned_class = p_assigned_class)
          ORDER BY ur.assigned_class, a.nome_aluno;

        ELSE
          -- Pai busca professores
          RETURN QUERY
          SELECT
            ur.user_id,
            COALESCE(u.raw_user_meta_data->>'nome', u.email) as email,
            COALESCE(u.raw_user_meta_data->>'nome', 'Professor(a)') as nome,
            ur.role as contact_role,
            ur.assigned_class,
            NULL as student_name
          FROM user_roles ur
          INNER JOIN auth.users u ON u.id = ur.user_id
          WHERE ur.role = 'teacher'
          ORDER BY ur.assigned_class;
        END IF;
      END;
      $$;
    `);
    console.log('✅ Função criada!\n');

    // Grant permissões
    console.log('📝 Concedendo permissões...');
    await client.query(`
      GRANT EXECUTE ON FUNCTION listar_contatos_para_mensagem(TEXT, TEXT) TO authenticated;
    `);
    console.log('✅ Permissões concedidas!\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Função RPC criada com sucesso!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📌 Função listar_contatos_para_mensagem:');
    console.log('   • Professores: listam todos os pais com alunos');
    console.log('   • Pais: listam todos os professores');
    console.log('   • Suporta filtro por turma');
    console.log('');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
    console.log('🔌 Conexão encerrada.');
  }
}

createContactsFunction();
