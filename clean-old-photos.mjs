import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import pg from 'pg';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

const { Client } = pg;

const dbConfig = {
  host: 'aws-1-us-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.arwdnjqbphomkehwkczl',
  password: 'H5dMLHGGrfgGKo3S',
  ssl: { rejectUnauthorized: false }
};

async function cleanOldPhotos() {
  const client = new Client(dbConfig);

  try {
    console.log('🔌 Conectando ao Supabase...');
    await client.connect();
    console.log('✅ Conectado!\n');

    // 1. Criar a função de limpeza
    console.log('📝 Criando função de limpeza...');
    await client.query(`
      CREATE OR REPLACE FUNCTION limpar_fotos_antigas()
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
          foto_record RECORD;
          deleted_count INTEGER := 0;
      BEGIN
          -- Buscar e excluir fotos com mais de 30 dias
          FOR foto_record IN
              SELECT id, url
              FROM photos
              WHERE created_at < NOW() - INTERVAL '30 days'
          LOOP
              BEGIN
                  -- Excluir do banco de dados
                  DELETE FROM photos WHERE id = foto_record.id;
                  deleted_count := deleted_count + 1;
              EXCEPTION WHEN OTHERS THEN
                  -- Se falhar excluir uma foto específica, continua com as próximas
                  CONTINUE;
              END;
          END LOOP;

          -- Log da execução
          RAISE NOTICE 'Limpeza concluída: % fotos excluídas', deleted_count;
      END;
      $$;
    `);
    console.log('✅ Função criada!\n');

    // 2. Dar permissão para executar a função
    console.log('🔓 Configurando permissões...');
    await client.query(`
      GRANT EXECUTE ON FUNCTION public.limpar_fotos_antigas TO authenticated;
    `);
    console.log('✅ Permissões configuradas!\n');

    // 3. Verificar fotos antigas antes
    console.log('📊 Verificando fotos antigas...');
    const oldPhotosResult = await client.query(`
      SELECT COUNT(*) as count,
             MIN(created_at) as oldest_photo,
             MAX(created_at) as newest_old_photo
      FROM photos
      WHERE created_at < NOW() - INTERVAL '30 days'
    `);

    const { count, oldest_photo, newest_old_photo } = oldPhotosResult.rows[0];
    console.log(`   Fotos com mais de 30 dias: ${count}`);
    if (oldest_photo) {
      console.log(`   Foto mais antiga: ${new Date(oldest_photo).toLocaleDateString('pt-BR')} às ${new Date(oldest_photo).toLocaleTimeString('pt-BR')}`);
    }
    if (newest_old_photo) {
      console.log(`   Mais recente das antigas: ${new Date(newest_old_photo).toLocaleDateString('pt-BR')} às ${new Date(newest_old_photo).toLocaleTimeString('pt-BR')}`);
    }
    console.log('');

    // 4. Executar a função se houver fotos antigas
    if (parseInt(count) > 0) {
      console.log('🧹 Executando limpeza...');
      await client.query("SELECT limpar_fotos_antigas();");
      console.log('✅ Limpeza executada!\n');

      // Verificar fotos após limpeza
      const afterResult = await client.query('SELECT COUNT(*) as count FROM photos');
      console.log(`📊 Fotos restantes: ${afterResult.rows[0].count}`);
      console.log(`🗑️  Fotos excluídas: ${count}`);
      console.log('');
    } else {
      console.log('✨ Nenhuma foto antiga encontrada! Tudo limpo por aqui.\n');
    }

    // 5. Total de fotos
    const totalResult = await client.query('SELECT COUNT(*) as count FROM photos');
    console.log(`📸 Total de fotos na galeria: ${totalResult.rows[0].count}`);
    console.log('');

    // 6. Agendar execução automática (se pg_cron estiver disponível)
    try {
      console.log('⏰ Configurando agendamento automático...');
      await client.query(`
        SELECT cron.schedule(
          'limpar-fotos-antigas-diario',
          '0 3 * * *',
          'SELECT limpar_fotos_antigas();'
        )
      `);
      console.log('✅ Agendamento configurado! Rodará todos os dias às 3:00 AM\n');
    } catch (err) {
      if (err.message.includes('cron.schedule')) {
        console.log('⚠️ pg_cron não está disponível no seu plano Supabase');
        console.log('💡 A função foi criada e executada, mas para agendamentos automáticos você precisará:');
        console.log('   - Usar um cron job externo (ex: GitHub Actions)');
        console.log('   - Ou executar manualmente quando necessário');
        console.log('');
      } else {
        throw err;
      }
    }

    // 7. Verificar agendamentos
    try {
      console.log('📋 Verificando agendamentos ativos...');
      const jobsResult = await client.query('SELECT * FROM cron.job;');
      console.log('✅ Agendamentos ativos:');
      jobsResult.rows.forEach(job => {
        console.log(`   - ${job.jobname}: ${job.schedule}`);
      });
      console.log('');
    } catch (err) {
      console.log('ℹ️  pg_cron não está disponível (normal em planas gratuitas do Supabase)\n');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Configuração concluída com sucesso!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📌 Resumo:');
    console.log(`   • Função limpar_fotos_antigas() criada`);
    console.log(`   • ${count} ${count === 1 ? 'foto excluída' : 'fotos excluídas'}`);
    console.log(`   • ${totalResult.rows[0].count} fotos restantes na galeria`);
    console.log('');
    console.log('💡 Para executar manualmente no futuro:');
    console.log('   SELECT limpar_fotos_antigas();');
    console.log('');
    console.log('💡 Para verificar fotos antigas:');
    console.log("   SELECT COUNT(*) FROM photos WHERE created_at < NOW() - INTERVAL '30 days';");
    console.log('');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('');
    console.error('💡 Dica: Verifique se as credenciais do Supabase estão corretas');
  } finally {
    await client.end();
    console.log('🔌 Conexão encerrada.');
  }
}

cleanOldPhotos();
