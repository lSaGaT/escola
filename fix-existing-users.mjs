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

async function fixExistingUsers() {
  const client = new Client(dbConfig);

  try {
    console.log('🔌 Conectando ao Supabase...');
    await client.connect();
    console.log('✅ Conectado!\n');

    // Buscar usuários que não têm user_role
    const { rows: usersWithoutRole } = await client.query(`
      SELECT u.id, u.email
      FROM auth.users u
      LEFT JOIN public.user_roles r ON u.id = r.user_id
      WHERE r.user_id IS NULL
    `);

    console.log(`👥 Usuários sem role: ${usersWithoutRole.length}\n`);

    if (usersWithoutRole.length > 0) {
      // Criar roles para usuários existentes
      for (const user of usersWithoutRole) {
        await client.query(`
          INSERT INTO public.user_roles (user_id, role)
          VALUES ($1, 'parent')
        `, [user.id]);
        console.log(`  ✓ ${user.email} → role: parent`);
      }
      console.log('\n✅ Roles criadas para usuários existentes!\n');
    } else {
      console.log('  Todos os usuários já têm role.\n');
    }

    // Mostrar todos os usuários com suas roles
    const { rows: allUsers } = await client.query(`
      SELECT u.id, u.email, r.role, r.assigned_class
      FROM auth.users u
      LEFT JOIN public.user_roles r ON u.id = r.user_id
      ORDER BY u.created_at DESC
    `);

    console.log('📋 Todos os usuários:\n');
    allUsers.forEach((user, i) => {
      console.log(`  ${i + 1}. ${user.email}`);
      console.log(`     Role: ${user.role || 'SEM ROLE'}`);
      console.log(`     Turma: ${user.assigned_class || 'Não atribuída'}`);
      console.log(`     ID: ${user.id}\n`);
    });

    console.log('💡 Para promover um usuário a teacher, rode no SQL Editor:\n');
    console.log(`   UPDATE public.user_roles SET role = 'teacher' WHERE user_id = 'ID_DO_USUARIO';\n`);

    // Se existe o lucas@teste.com, sugerir promover
    const lucasUser = allUsers.find(u => u.email === 'lucas@teste.com');
    if (lucasUser) {
      console.log(`🔥 Para promover lucas@teste.com a teacher, rode:\n`);
      console.log(`   UPDATE public.user_roles SET role = 'teacher' WHERE user_id = '${lucasUser.id}';\n`);
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
    console.log('🔌 Conexão encerrada.');
  }
}

fixExistingUsers();
