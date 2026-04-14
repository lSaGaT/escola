import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do banco
const dbConfig = {
  host: 'aws-1-us-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.arwdnjqbphomkehwkczl',
  password: 'H5dMLHGGrfgGKo3S',
  ssl: { rejectUnauthorized: false }
};

// Ler o SQL
const sqlPath = path.join(__dirname, 'SUPABASE_SETUP.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

async function runMigration() {
  const client = new Client(dbConfig);

  try {
    console.log('🔌 Conectando ao Supabase PostgreSQL...');
    await client.connect();
    console.log('✅ Conectado!\n');

    console.log('🚀 Executando migração...\n');

    // Executar o SQL
    await client.query(sql);

    console.log('✅ Migração concluída com sucesso!\n');
    console.log('📋 Tabelas/Itens criados:');
    console.log('  ✓ tabela alunos');
    console.log('  ✓ tabela salas');
    console.log('  ✓ view kanban_turmas');
    console.log('  ✓ função listar_salas()');
    console.log('  ✓ função mover_aluno_sala()');
    console.log('  ✓ políticas RLS configuradas');
    console.log('  ✓ salas exemplo inseridas\n');

    // Verificar tabelas criadas
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('alunos', 'salas')
      ORDER BY table_name;
    `);

    console.log('📊 Tabelas verificadas no banco:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });

  } catch (error) {
    console.error('❌ Erro na migração:', error.message);
    if (error.detail) console.error('Detalhes:', error.detail);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Conexão encerrada.');
  }
}

runMigration();
