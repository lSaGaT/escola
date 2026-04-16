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

async function migrateMessagesSchema() {
  const client = new Client(dbConfig);

  try {
    console.log('🔌 Conectando ao Supabase...');
    await client.connect();
    console.log('✅ Conectado!\n');

    // 1. Adicionar coluna canal_geral
    console.log('📝 Adicionando coluna canal_geral...');
    await client.query(`
      ALTER TABLE mensagens
      ADD COLUMN IF NOT EXISTS canal_geral BOOLEAN DEFAULT false;
    `);
    console.log('✅ Coluna canal_geral adicionada!\n');

    // 2. Adicionar coluna sender_name
    console.log('📝 Adicionando coluna sender_name...');
    await client.query(`
      ALTER TABLE mensagens
      ADD COLUMN IF NOT EXISTS sender_name TEXT;
    `);
    console.log('✅ Coluna sender_name adicionada!\n');

    // 3. Adicionar coluna sender_email
    console.log('📝 Adicionando coluna sender_email...');
    await client.query(`
      ALTER TABLE mensagens
      ADD COLUMN IF NOT EXISTS sender_email TEXT;
    `);
    console.log('✅ Coluna sender_email adicionada!\n');

    // 4. Adicionar coluna destinatario_id
    console.log('📝 Adicionando coluna destinatario_id...');
    await client.query(`
      ALTER TABLE mensagens
      ADD COLUMN IF NOT EXISTS destinatario_id UUID;
    `);
    console.log('✅ Coluna destinatario_id adicionada!\n');

    // 5. Atualizar registros existentes
    console.log('🔄 Atualizando registros existentes...');
    const updateResult = await client.query(`
      UPDATE mensagens m
      SET
        sender_name = COALESCE(
          u.raw_user_meta_data->>'nome',
          u.email,
          'Usuário'
        ),
        sender_email = u.email
      FROM auth.users u
      WHERE m.remetente_id = u.id
      AND m.sender_name IS NULL
      RETURNING COUNT(*) as updated;
    `);
    console.log(`✅ ${updateResult.rows[0].updated} registros atualizados!\n`);

    // 6. Estatísticas finais
    console.log('📊 Estatísticas finais:');
    const statsResult = await client.query(`
      SELECT
        COUNT(*) as total_mensagens,
        COUNT(*) FILTER (WHERE canal_geral = true) as mensagens_geral,
        COUNT(*) FILTER (WHERE sender_name IS NOT NULL) as com_nome_remetente
      FROM mensagens
    `);

    const stats = statsResult.rows[0];
    console.log(`   Total de mensagens: ${stats.total_mensagens}`);
    console.log(`   Mensagens do geral: ${stats.mensagens_geral}`);
    console.log(`   Com nome de remetente: ${stats.com_nome_remetente}`);
    console.log('');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Migração concluída com sucesso!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📌 Tabela mensagens agora suporta:');
    console.log('   • Canal geral (todos veem)');
    console.log('   • Nome do remetente');
    console.log('   • Email do remetente');
    console.log('   • Destinatário (para mensagens direcionadas)');
    console.log('');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (error.message.includes('column') && error.message.includes('already exists')) {
      console.log('');
      console.log('ℹ️  Algumas colunas já existem. Isso é normal!');
    }
  } finally {
    await client.end();
    console.log('🔌 Conexão encerrada.');
  }
}

migrateMessagesSchema();
