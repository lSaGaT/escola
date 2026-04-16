/**
 * Corrigir função deletar_usuario (erro: coluna email não existe)
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

async function fixFunction() {
  console.log('🔧 Corrigindo função deletar_usuario...\n');

  try {
    await client.connect();
    console.log('✅ Conectado!\n');

    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, 'FIX_DELETE_FUNCTION.sql');
    let sql = fs.readFileSync(sqlPath, 'utf8');

    // Limpar o SQL
    const sqlLines = sql.split('\n').filter(line => {
      const trimmed = line.trim();
      return !trimmed.startsWith('--') && trimmed !== '';
    });

    const cleanSQL = sqlLines.join('\n');

    console.log('📝 Executando SQL corrigido...\n');

    await client.query(cleanSQL);

    console.log('\n✅ Função deletar_usuario corrigida com sucesso!');
    console.log('📋 Erro corrigido: Não tenta mais acessar coluna inexistente "email"\n');

  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await client.end();
  }
}

fixFunction();
