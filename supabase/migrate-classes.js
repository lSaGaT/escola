/**
 * MIGRAÇÃO AUTOMÁTICA: Atualizar salas/turmas
 * De: Maternal 1, Maternal 2, Maternal 3, Maternal 4, 1ª Série
 * Para: Maternal 1, Maternal 2, Maternal 3, 1º Período, 2º Período
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Credenciais do Supabase não encontradas em .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runMigration() {
  console.log('🚀 Iniciando migração das salas/turmas...\n');

  try {
    // 1. Atualizar tabela de salas
    console.log('📝 Atualizando tabela salas...');

    // Remover salas antigas
    await supabase
      .from('salas')
      .delete()
      .in('nome', ['Berçário', 'Pré 1', 'Pré 2', 'Maternal 4', '1ª Série']);

    // Inserir novas salas
    const { error: salasError } = await supabase
      .from('salas')
      .upsert([
        { nome: 'Maternal 1', descricao: 'Crianças de 1 a 2 anos', idade_minima: 1, idade_maxima: 2, capacidade: 20 },
        { nome: 'Maternal 2', descricao: 'Crianças de 2 a 3 anos', idade_minima: 2, idade_maxima: 3, capacidade: 20 },
        { nome: 'Maternal 3', descricao: 'Crianças de 3 a 4 anos', idade_minima: 3, idade_maxima: 4, capacidade: 20 },
        { nome: '1º Período', descricao: 'Crianças de 4 a 5 anos', idade_minima: 4, idade_maxima: 5, capacidade: 25 },
        { nome: '2º Período', descricao: 'Crianças de 5 a 6 anos', idade_minima: 5, idade_maxima: 6, capacidade: 25 }
      ], { onConflict: 'nome' });

    if (salasError) throw salasError;
    console.log('  ✓ Tabela salas atualizada');

    // 2. Atualizar alunos
    console.log('📝 Atualizando alunos...');

    const { error: alunosError } = await supabase.rpc('exec_sql', {
      sql_query: `
        UPDATE public.alunos SET sala = '1º Período' WHERE sala = 'Maternal 4';
        UPDATE public.alunos SET sala = '2º Período' WHERE sala = '1ª Série';
      `
    });

    // Fallback se rpc não funcionar, tentar direto
    if (alunosError) {
      await supabase
        .from('alunos')
        .update({ sala: '1º Período' })
        .eq('sala', 'Maternal 4');

      await supabase
        .from('alunos')
        .update({ sala: '2º Período' })
        .eq('sala', '1ª Série');
    }
    console.log('  ✓ Alunos atualizados');

    // 3. Atualizar user_roles
    console.log('📝 Atualizando user_roles...');

    await supabase
      .from('user_roles')
      .update({ assigned_class: '1º Período' })
      .eq('assigned_class', 'Maternal 4');

    await supabase
      .from('user_roles')
      .update({ assigned_class: '2º Período' })
      .eq('assigned_class', '1ª Série');

    console.log('  ✓ User_roles atualizados');

    // 4. Atualizar fotos
    console.log('📝 Atualizando fotos...');

    await supabase
      .from('photos')
      .update({ class_name: '1º Período' })
      .eq('class_name', 'Maternal 4');

    await supabase
      .from('photos')
      .update({ class_name: '2º Período' })
      .eq('class_name', '1ª Série');

    console.log('  ✓ Fotos atualizadas');

    // 5. Atualizar agenda
    console.log('📝 Atualizando agenda...');

    await supabase
      .from('agenda')
      .update({ sala: '1º Período' })
      .eq('sala', 'Maternal 4');

    await supabase
      .from('agenda')
      .update({ sala: '2º Período' })
      .eq('sala', '1ª Série');

    console.log('  ✓ Agenda atualizada');

    // 6. Atualizar mensagens
    console.log('📝 Atualizando mensagens...');

    await supabase
      .from('mensagens')
      .update({ sala: '1º Período' })
      .eq('sala', 'Maternal 4');

    await supabase
      .from('mensagens')
      .update({ sala: '2º Período' })
      .eq('sala', '1ª Série');

    console.log('  ✓ Mensagens atualizadas');

    // 7. Verificar resultado
    const { data: salas } = await supabase
      .from('salas')
      .select('nome')
      .order('nome');

    console.log('\n✅ Migração concluída com sucesso!\n');
    console.log('📋 Salas atuais:');
    salas?.forEach(s => console.log(`  • ${s.nome}`));

  } catch (err) {
    console.error('\n❌ Erro na migração:', err.message);
    process.exit(1);
  }
}

runMigration();
