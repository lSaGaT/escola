/**
 * Criar função de deletar usuário no Supabase
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Credenciais do Supabase não encontradas em .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function createDeleteFunction() {
  console.log('🔧 Criando função deletar_usuario...\n');

  try {
    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, 'FUNCTION_DELETE_USER.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Executar via RPC direto (usando service_role)
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Se exec_sql não existe, tentar outra abordagem
      console.log('⚠️  exec_sql não disponível, tentando abordagem alternativa...');

      // Tentar executar diretamente via query
      const { error: queryError } = await supabase
        .from('dummy') // isso vai falhar, mas estamos só testando
        .select('*');

      if (queryError) {
        console.log('⚠️  Não foi possível executar via query SQL direta.');
        console.log('\n📌 Por favor, execute manualmente no SQL Editor do Supabase:');
        console.log('   1. Acesse: https://supabase.com/dashboard');
        console.log('   2. Selecione seu projeto');
        console.log('   3. Vá em "SQL Editor"');
        console.log('   4. Cole o conteúdo de: supabase/FUNCTION_DELETE_USER.sql');
        console.log('   5. Clique em "Run"\n');
      }
    } else {
      console.log('✅ Função deletar_usuario criada com sucesso!');
    }

  } catch (err) {
    console.error('❌ Erro:', err.message);
    console.log('\n📌 Execute manualmente no SQL Editor do Supabase:');
    console.log('   Arquivo: supabase/FUNCTION_DELETE_USER.sql');
  }
}

createDeleteFunction();
