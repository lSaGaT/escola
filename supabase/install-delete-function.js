/**
 * Executar SQL para criar função de deletar usuário
 * Via conexão PostgreSQL direta
 */

import dotenv from 'dotenv';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: '.env.local' });

const DB_URL = process.env.SUPABASE_DB_URL;

if (!DB_URL) {
  console.error('❌ SUPABASE_DB_URL não encontrada em .env.local');
  process.exit(1);
}

const client = new pg.Client({ connectionString: DB_URL });

async function installFunction() {
  console.log('🔧 Conectando ao PostgreSQL...\n');

  try {
    await client.connect();
    console.log('✅ Conectado!\n');

    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, 'CREATE_DELETE_USER_FUNCTION.sql');
    let sql = fs.readFileSync(sqlPath, 'utf8');

    // Remover os comentários iniciais para executar apenas o SQL
    const sqlLines = sql.split('\n').filter(line => {
      const trimmed = line.trim();
      return !trimmed.startsWith('--') && trimmed !== '';
    });

    const cleanSQL = sqlLines.join('\n');

    console.log('📝 Executando SQL...\n');

    await client.query(cleanSQL);

    console.log('\n✅ Função deletar_usuario criada com sucesso!');
    console.log('📋 A função está pronta para uso.\n');

  } catch (err) {
    console.error('❌ Erro:', err.message);
    console.log('\n📌 Se o erro persistir, execute manualmente no SQL Editor do Supabase:');
    console.log('   Arquivo: supabase/CREATE_DELETE_USER_FUNCTION.sql\n');
  } finally {
    await client.end();
  }
}

installFunction();
