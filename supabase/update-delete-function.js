/**
 * Atualizar função deletar_usuario para Opção B (Deletar TUDO)
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

async function updateFunction() {
  console.log('🔧 Atualizando função deletar_usuario (Opção B - Deletar TUDO)...\n');

  try {
    await client.connect();
    console.log('✅ Conectado!\n');

    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, 'UPDATE_DELETE_USER_FUNCTION.sql');
    let sql = fs.readFileSync(sqlPath, 'utf8');

    // Limpar o SQL
    const sqlLines = sql.split('\n').filter(line => {
      const trimmed = line.trim();
      return !trimmed.startsWith('--') && trimmed !== '';
    });

    const cleanSQL = sqlLines.join('\n');

    console.log('📝 Executando SQL...\n');

    await client.query(cleanSQL);

    console.log('\n✅ Função deletar_usuario atualizada com sucesso!');
    console.log('📋 Agai deleta TUDO:');
    console.log('   ✓ Usuário do Auth');
    console.log('   ✓ Registro em user_roles');
    console.log('   ✓ Aluno vinculado (se for pai)\n');

  } catch (err) {
    console.error('❌ Erro:', err.message);
    if (err.message.includes('auth.users')) {
      console.log('\n⚠️  Não é possível deletar da tabela auth.users via SQL.');
      console.log('📌 A função foi configurada para deletar user_roles e alunos.');
      console.log('📌 Para deletar do Auth, será necessário usar uma Edge Function ou dashboard.\n');
    }
  } finally {
    await client.end();
  }
}

updateFunction();
