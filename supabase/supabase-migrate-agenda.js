/**
 * SCRIPT PARA RODAR MIGRAÇÃO NO SUPABASE - AGENDA E MENSAGENS
 * Usa conexão PostgreSQL direta (pacote pg já instalado no projeto)
 *
 * Execute: node supabase-migrate-agenda.js
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

// ==========================================
// CONFIGURAÇÃO - Connection String do Supabase
// ==========================================
// Carregado do .env.local (já configurado)
const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL || '';

if (!SUPABASE_DB_URL) {
    console.error('❌ SUPABASE_DB_URL não encontrado no .env.local!\n');
    process.exit(1);
}

// ==========================================
// NÃO PRECISA EDITAR ABAIXO
// ==========================================

function lerSQL() {
    const caminho = path.join(__dirname, 'MIGRATE_AGENDA_MESSAGES.sql');
    if (!fs.existsSync(caminho)) {
        console.error('❌ Arquivo MIGRATE_AGENDA_MESSAGES.sql não encontrado!');
        process.exit(1);
    }
    return fs.readFileSync(caminho, 'utf8');
}

async function executarMigracao() {
    const sql = lerSQL();

    console.log('🚀 Iniciando migração para o Supabase...\n');
    console.log('📡 Conectando ao banco de dados...');

    const client = new pg.Client({
        connectionString: SUPABASE_DB_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('✅ Conectado ao Supabase!\n');

        // Executar o SQL
        console.log('⏳ Executando SQL...');
        await client.query(sql);

        console.log('\n✅ Migração concluída com sucesso!');
        console.log('\n📋 Tabelas/Itens criados:');
        console.log('  ✓ tabela agenda (eventos e atividades)');
        console.log('  ✓ tabela mensagens (comunicação pais-professores)');
        console.log('  ✓ índices otimizados');
        console.log('  ✓ políticas RLS configuradas');
        console.log('  ✓ função contar_mensagens_nao_lidas()');
        console.log('  ✓ view agenda_dia\n');

        // Verificar tabelas criadas
        const result = await client.query(`
            SELECT
                'agenda' as tabela,
                COUNT(*) as total_registros
            FROM public.agenda
            UNION ALL
            SELECT
                'mensagens' as tabela,
                COUNT(*) as total_registros
            FROM public.mensagens
        `);

        console.log('📊 Verificação:');
        result.rows.forEach(row => {
            console.log(`  • ${row.tabela}: ${row.total_registros} registros`);
        });
        console.log();

    } catch (err) {
        console.error('\n❌ Erro na migração:');
        console.error(err.message);
        console.error('\n💡 Dica: Verifique se a connection string está correta\n');
        process.exit(1);
    } finally {
        await client.end();
        console.log('🔌 Conexão encerrada.\n');
    }
}

executarMigracao();
