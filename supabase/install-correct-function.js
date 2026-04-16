/**
 * Instalar função deletar_usuario CORRIGIDA
 * Baseado na estrutura REAL das tabelas
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

async function installCorrectFunction() {
  console.log('🔧 Instalando função deletar_usuario CORRIGIDA...\n');
  console.log('📋 Baseado na estrutura REAL das tabelas:\n');
  console.log('   user_roles: id, user_id, role, assigned_class, created_at');
  console.log('   alunos: id, nome_aluno, nome_pai, nome_mae, ...\n');

  try {
    await client.connect();
    console.log('✅ Conectado!\n');

    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, 'CORRECT_DELETE_FUNCTION.sql');
    let sql = fs.readFileSync(sqlPath, 'utf8');

    // Limpar o SQL (remover comentários)
    const sqlLines = sql.split('\n').filter(line => {
      const trimmed = line.trim();
      return !trimmed.startsWith('--') && trimmed !== '';
    });

    const cleanSQL = sqlLines.join('\n');

    console.log('📝 Executando SQL...\n');

    await client.query(cleanSQL);

    console.log('\n✅ Função deletar_usuario instalada com sucesso!');
    console.log('📋 Funciona assim:');
    console.log('   1. Busca email e nome em auth.users');
    console.log('   2. Se for pai, deleta alunos pelo nome do pai/mãe');
    console.log('   3. Deleta de user_roles');
    console.log('   4. Deleta de auth.users\n');

  } catch (err) {
    console.error('❌ Erro:', err.message);
    console.error('\nDetalhes:', err);
  } finally {
    await client.end();
  }
}

installCorrectFunction();
