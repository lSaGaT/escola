/**
 * Corrigir duplicidade de salas (maiúsculo/minúsculo)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function fixDuplicates() {
  console.log('🔧 Corrigindo duplicidade de salas...\n');

  try {
    // Remover salas com nome minúsculo duplicado
    await supabase
      .from('salas')
      .delete()
      .in('nome', ['1º período', '2º período']);

    // Atualizar alunos que ainda podem ter o nome antigo
    await supabase
      .from('alunos')
      .update({ sala: '1º Período' })
      .eq('sala', '1º período');

    await supabase
      .from('alunos')
      .update({ sala: '2º Período' })
      .eq('sala', '2º período');

    // Atualizar user_roles
    await supabase
      .from('user_roles')
      .update({ assigned_class: '1º Período' })
      .eq('assigned_class', '1º período');

    await supabase
      .from('user_roles')
      .update({ assigned_class: '2º Período' })
      .eq('assigned_class', '2º período');

    // Atualizar fotos
    await supabase
      .from('photos')
      .update({ class_name: '1º Período' })
      .eq('class_name', '1º período');

    await supabase
      .from('photos')
      .update({ class_name: '2º Período' })
      .eq('class_name', '2º período');

    // Atualizar agenda
    await supabase
      .from('agenda')
      .update({ sala: '1º Período' })
      .eq('sala', '1º período');

    await supabase
      .from('agenda')
      .update({ sala: '2º Período' })
      .eq('sala', '2º período');

    // Atualizar mensagens
    await supabase
      .from('mensagens')
      .update({ sala: '1º Período' })
      .eq('sala', '1º período');

    await supabase
      .from('mensagens')
      .update({ sala: '2º Período' })
      .eq('sala', '2º período');

    // Verificar resultado
    const { data: salas } = await supabase
      .from('salas')
      .select('nome')
      .order('nome');

    console.log('✅ Correção concluída!\n');
    console.log('📋 Salas atuais:');
    salas?.forEach(s => console.log(`  • ${s.nome}`));

  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

fixDuplicates();
