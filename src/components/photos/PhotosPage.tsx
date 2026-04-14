import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Image as ImageIcon, Loader2, AlertCircle, Plus } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';
import { SchoolClass, Photo } from '@/src/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { PhotoUploadDialog } from '@/src/components/PhotoUploadDialog';

const CLASSES: SchoolClass[] = ['Maternal 1', 'Maternal 2', 'Maternal 3', 'Maternal 4', '1ª Série'];

export function PhotosPage({ user, role, assignedClass }: {
  user: any;
  role: 'teacher' | 'parent';
  assignedClass?: SchoolClass;
}) {
  const [currentClass, setCurrentClass] = useState<SchoolClass>(assignedClass || CLASSES[0]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  useEffect(() => {
    if (role === 'parent' && assignedClass) {
      setCurrentClass(assignedClass);
    }
  }, [role, assignedClass]);

  useEffect(() => {
    fetchPhotos();
  }, [currentClass]);

  const fetchPhotos = async () => {
    setLoading(true);
    setError(null);
    try {
      if (role === 'parent' && assignedClass && currentClass !== assignedClass) {
        setPhotos([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('class_name', currentClass)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPhotos(data || []);
    } catch (err: any) {
      console.error('Error fetching photos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPhoto = async (photo: Photo) => {
    try {
      const response = await fetch(photo.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `foto-${photo.class_name}-${new Date(photo.created_at).getTime()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erro ao baixar foto:', err);
      alert('Erro ao baixar a foto');
    }
  };

  const handleUploadSuccess = () => {
    fetchPhotos();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ImageIcon className="h-6 w-6 text-red-500" />
            Galeria de Fotos
          </h2>
          <p className="text-slate-500 text-sm">
            {role === 'teacher'
              ? 'Compartilhe os momentos especiais das nossas crianças'
              : 'Acompanhe as descobertas e o crescimento do seu pequeno'
            }
          </p>
        </div>

        {role === 'teacher' && (
          <Button
            onClick={() => setUploadDialogOpen(true)}
            className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-full gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Foto
          </Button>
        )}
      </div>

      {/* Class Selection */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
        <Tabs value={currentClass} onValueChange={(v) => setCurrentClass(v as SchoolClass)}>
          <TabsList className="bg-red-50 border border-red-100 p-1 h-auto flex-wrap justify-start gap-2 rounded-xl">
            {CLASSES.map((cls) => (
              <TabsTrigger
                key={cls}
                value={cls}
                className="rounded-xl px-4 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-orange-500 data-[state=active]:text-white transition-all font-medium text-sm"
              >
                {cls}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Photo Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentClass}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="h-12 w-12 animate-spin mb-4 text-red-500" />
              <p className="font-medium">Carregando momentos especiais...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-900 mb-2">Ops! Algo deu errado</h3>
              <p className="text-red-700 mb-6">{error}</p>
            </div>
          ) : photos.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-red-100">
              <ImageIcon className="h-16 w-16 text-red-200 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-slate-600">Nenhuma foto ainda</h3>
              <p className="text-slate-400">Logo teremos novidades da turma {currentClass}.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {photos.map((photo, index) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group rounded-2xl">
                    <AspectRatio ratio={4 / 3}>
                      <img
                        src={photo.url}
                        alt={photo.description || 'Foto da escola'}
                        className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                        <p className="text-white text-sm font-medium line-clamp-2">
                          {photo.description}
                        </p>
                      </div>
                    </AspectRatio>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-slate-400">
                          {new Date(photo.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short'
                          })}
                        </p>
                        <div className="bg-gradient-to-r from-red-100 to-orange-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded-full">
                          {photo.class_name}
                        </div>
                      </div>
                      <Button
                        onClick={() => handleDownloadPhoto(photo)}
                        className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-xl gap-2 h-9 text-sm"
                      >
                        <Download className="h-4 w-4" />
                        Baixar
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Photo Upload Dialog */}
      {role === 'teacher' && (
        <PhotoUploadDialog
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
          onSuccess={handleUploadSuccess}
          availableClasses={CLASSES}
          userId={user?.id}
        />
      )}
    </div>
  );
}
