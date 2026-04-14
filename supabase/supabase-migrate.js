/**
 * SCRIPT PARA RODAR MIGRAÇÃO NO SUPABASE
 *
 * Opção 1 - Via SQL Editor (Mais simples):
 * 1. Acesse https://supabase.com/dashboard
 * 2. Selecione seu projeto
 * 3. Vá em SQL Editor
 * 4. Copie o conteúdo do arquivo SUPABASE_SETUP.sql
 * 5. Cole e clique em "Run"
 *
 * Opção 2 - Via CLI (Este script):
 * npm install @supabase/supabase-js
 * node supabase-migrate.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// CONFIGURAÇÃO - Preencha com seus dados
// ==========================================
const SUPABASE_URL = 'https://SEU-PROJETO.supabase.co';
const SUPABASE_KEY = 'SUA-SERVICE-ROLE-KEY'; // ⚠️ Use service_role key (não a anon key)

// ==========================================
// NÃO PRECISA EDITAR ABAIXO
// ==========================================

function lerSQL() {
    const caminho = path.join(__dirname, 'SUPABASE_SETUP.sql');
    return fs.readFileSync(caminho, 'utf8');
}

async function executarMigracao() {
    const sql = lerSQL();

    console.log('🚀 Iniciando migração para o Supabase...\n');

    try {
        const { createClient } = await import('@supabase/supabase-js');

        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

        // Executar o SQL
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
            console.error('❌ Erro na migração:');
            console.error(error);
            process.exit(1);
        }

        console.log('✅ Migração concluída com sucesso!');
        console.log('\n📋 Tabelas/Itens criados:');
        console.log('  ✓ tabela alunos');
        console.log('  ✓ tabela salas');
        console.log('  ✓ view kanban_turmas');
        console.log('  ✓ função listar_salas()');
        console.log('  ✓ função mover_aluno_sala()');
        console.log('  ✓ políticas RLS configuradas');
        console.log('  ✓ salas exemplo inseridas\n');

    } catch (err) {
        // Se @supabase/supabase-js não estiver instalado
        if (err.code === 'ERR_MODULE_NOT_FOUND') {
            console.log('⚠️  @supabase/supabase-js não instalado\n');
            console.log('📌 RECOMENDO: Use o SQL Editor do Supabase:\n');
            console.log('   1. Acesse: https://supabase.com/dashboard');
            console.log('   2. Selecione seu projeto');
            console.log('   3. Vá em "SQL Editor" no menu lateral');
            console.log('   4. Copie o conteúdo do arquivo SUPABASE_SETUP.sql');
            console.log('   5. Cole e clique em "Run"\n');
            console.log('💡 Ou instale o pacote: npm install @supabase/supabase-js\n');
        } else {
            console.error('❌ Erro:', err.message);
        }
        process.exit(1);
    }
}

executarMigracao();
