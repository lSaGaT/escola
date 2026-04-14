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

async function promoteToTeacher() {
  const client = new Client(dbConfig);

  try {
    console.log('🔌 Conectando ao Supabase...');
    await client.connect();
    console.log('✅ Conectado!\n');

    // Promover lucas@teste.com a teacher
    const userId = '8b2a163d-4e35-4698-891d-172d39deecf9';

    await client.query(`
      UPDATE public.user_roles
      SET role = 'teacher'
      WHERE user_id = $1
    `, [userId]);

    console.log('✅ lucas@teste.com promovido a TEACHER!\n');

    // Verificar resultado
    const { rows } = await client.query(`
      SELECT u.email, r.role
      FROM auth.users u
      JOIN public.user_roles r ON u.id = r.user_id
      WHERE u.id = $1
    `, [userId]);

    console.log('📋 Usuário atualizado:');
    console.log(`   Email: ${rows[0].email}`);
    console.log(`   Role: ${rows[0].role}\n`);

    console.log('🎯 Agora você pode fazer login e acessar o painel Admin!\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
    console.log('🔌 Conexão encerrada.');
  }
}

promoteToTeacher();
