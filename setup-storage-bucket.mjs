import { createClient } from '@supabase/supabase-js';

// Substitua pelos seus valores de Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://arwdnjqbphomkehwkczl.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

async function setupPhotoBucket() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  console.log('🔧 Criando bucket de fotos...');

  try {
    // Listar buckets existentes
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Erro ao listar buckets:', listError);
      return;
    }

    const bucketExists = buckets?.some(b => b.name === 'school-photos');

    if (bucketExists) {
      console.log('✅ Bucket "school-photos" já existe');
    } else {
      // Criar o bucket
      const { data, error } = await supabase.storage.createBucket('school-photos', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        fileSizeLimit: 52428800, // 50MB
      });

      if (error) {
        console.error('❌ Erro ao criar bucket:', error);
        return;
      }

      console.log('✅ Bucket criado com sucesso:', data);
    }

    console.log('✅ Setup concluído!');
  } catch (err) {
    console.error('❌ Erro durante setup:', err);
  }
}

setupPhotoBucket();
