import pg from 'pg';

const { Client } = pg;

// Configuração do banco
const dbConfig = {
  host: 'aws-1-us-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.arwdnjqbphomkehwkczl',
  password: 'H5dMLHGGrfgGKo3S',
  ssl: { rejectUnauthorized: false }
};

const sql = `
-- Função para criar registro em user_roles quando novo usuário é criado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'parent');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que chama a função quando um usuário é criado no auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
`;

async function runTrigger() {
  const client = new Client(dbConfig);

  try {
    console.log('🔌 Conectando ao Supabase...');
    await client.connect();
    console.log('✅ Conectado!\n');

    console.log('🚀 Criando trigger...\n');

    await client.query(sql);

    console.log('✅ Trigger criado com sucesso!');
    console.log('\n📋 O que foi feito:');
    console.log('  ✓ Função handle_new_user() criada');
    console.log('  ✓ Trigger on_auth_user_created criado');
    console.log('\n🎯 Agora todo novo usuário será automaticamente:');
    console.log('  • Adicionado à tabela user_roles');
    console.log('  • Com role "parent" por padrão\n');

    // Mostrar usuários existentes
    const { rows } = await client.query(`
      SELECT id, email, created_at
      FROM auth.users
      ORDER BY created_at DESC
      LIMIT 10
    `);

    if (rows.length > 0) {
      console.log('👥 Usuários existentes (que precisam de role):');
      rows.forEach((user, i) => {
        const hasRole = false; // Vamos verificar
        console.log(`  ${i + 1}. ${user.email}`);
        console.log(`     ID: ${user.id}`);
      });
      console.log('\n💡 Para atribuir role de teacher, use:');
      console.log(`   UPDATE public.user_roles SET role = 'teacher' WHERE user_id = 'ID_DO_USUARIO';`);
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 Conexão encerrada.');
  }
}

runTrigger();
