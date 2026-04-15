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

async function checkPhotosTable() {
  const client = new Client(dbConfig);

  try {
    console.log('🔌 Conectando ao Supabase...');
    await client.connect();
    console.log('✅ Conectado!\n');

    // Verificar estrutura da tabela photos
    console.log('📋 Estrutura da tabela photos:');
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'photos'
      ORDER BY ordinal_position;
    `);

    columnsResult.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    console.log('');

    // Verificar fotos existentes
    console.log('📊 Fotos na tabela:');
    const countResult = await client.query('SELECT COUNT(*) as count FROM photos');
    console.log(`   Total de fotos: ${countResult.rows[0].count}`);
    console.log('');

    // Ver exemplos de fotos
    console.log('📸 Exemplo de fotos:');
    const sampleResult = await client.query(`
      SELECT id, url, created_at
      FROM photos
      ORDER BY created_at DESC
      LIMIT 3
    `);

    sampleResult.rows.forEach(photo => {
      console.log(`   - ID: ${photo.id}`);
      console.log(`     URL: ${photo.url.substring(0, 50)}...`);
      console.log(`     Criada em: ${photo.created_at}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
    console.log('🔌 Conexão encerrada.');
  }
}

checkPhotosTable();
