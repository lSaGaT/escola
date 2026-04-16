import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Image as ImageIcon, Loader2, AlertCircle, Plus, Trash2, Check, X } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';
import { SchoolClass, Photo } from '@/src/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { PhotoUploadDialog } from '@/src/components/PhotoUploadDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';

const CLASSES: SchoolClass[] = ['Maternal 1', 'Maternal 2', 'Maternal 3', '1º Período', '2º Período', 'Geral'];

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
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<Photo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      // Pais só podem ver fotos da turma deles ou fotos marcadas como "Geral"
      if (role === 'parent' && assignedClass && currentClass !== assignedClass && currentClass !== 'Geral') {
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

  const handleDeletePhoto = async (photo: Photo) => {
    setPhotoToDelete(photo);
    setDeleteDialogOpen(true);
  };

  const handleDeleteSelected = async () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (photoToDelete) {
        // Excluir uma foto individual
        await deletePhoto(photoToDelete);
        setPhotoToDelete(null);
      } else {
        // Excluir múltiplas fotos
        for (const photoId of selectedPhotos) {
          const photo = photos.find(p => p.id === photoId);
          if (photo) {
            await deletePhoto(photo);
          }
        }
        setSelectedPhotos(new Set());
      }

      fetchPhotos();
      setDeleteDialogOpen(false);
    } catch (err: any) {
      console.error('Erro ao excluir fotos:', err);
      alert('Erro ao excluir fotos: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const deletePhoto = async (photo: Photo) => {
    try {
      // Excluir do storage
      const fileName = photo.url.split('/').pop();
      if (fileName) {
        const { error: storageError } = await supabase.storage
          .from('photos')
          .remove([fileName]);

        if (storageError) {
          console.warn('Erro ao excluir do storage:', storageError);
        }
      }

      // Excluir do banco
      const { error: dbError } = await supabase
        .from('photos')
        .delete()
        .eq('id', photo.id);

      if (dbError) throw dbError;
    } catch (err) {
      console.error('Erro ao excluir foto:', err);
      throw err;
    }
  };

  const togglePhotoSelection = (photoId: string) => {
    const newSelection = new Set(selectedPhotos);
    if (newSelection.has(photoId)) {
      newSelection.delete(photoId);
    } else {
      newSelection.add(photoId);
    }
    setSelectedPhotos(newSelection);
  };

  const handleUploadSuccess = () => {
    fetchPhotos();
  };

  const isSelectedAll = photos.length > 0 && selectedPhotos.size === photos.length;
  const selectedCount = selectedPhotos.size;

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
          <div className="flex gap-2">
            {selectedCount > 0 && (
              <Button
                onClick={handleDeleteSelected}
                variant="destructive"
                className="bg-red-500 hover:bg-red-600 text-white rounded-full gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Excluir ({selectedCount})
              </Button>
            )}
            <Button
              onClick={() => setUploadDialogOpen(true)}
              className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-full gap-2"
            >
              <Plus className="h-4 w-4" />
              Nova Foto
            </Button>
          </div>
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
            <>
              {/* Select All - apenas para professores */}
              {role === 'teacher' && photos.length > 0 && (
                <div className="mb-4 flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (isSelectedAll) {
                        setSelectedPhotos(new Set());
                      } else {
                        setSelectedPhotos(new Set(photos.map(p => p.id)));
                      }
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-slate-200 hover:border-red-300 transition-colors"
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      isSelectedAll
                        ? 'bg-red-500 border-red-500'
                        : 'border-slate-300'
                    }`}>
                      {isSelectedAll && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <span className="text-sm text-slate-600">
                      {isSelectedAll ? 'Desmarcar todas' : 'Selecionar todas'}
                    </span>
                  </button>
                  <span className="text-sm text-slate-500">
                    {selectedCount > 0 && `${selectedCount} selecionada${selectedCount > 1 ? 's' : ''}`}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {photos.map((photo, index) => (
                  <motion.div
                    key={photo.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative"
                  >
                    {/* Checkbox de seleção - apenas para professores */}
                    {role === 'teacher' && (
                      <button
                        onClick={() => togglePhotoSelection(photo.id)}
                        className={`absolute top-3 left-3 z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                          selectedPhotos.has(photo.id)
                            ? 'bg-red-500 border-red-500 scale-110'
                            : 'bg-white/80 border-white hover:scale-110'
                        }`}
                      >
                        {selectedPhotos.has(photo.id) ? (
                          <Check className="h-4 w-4 text-white" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-slate-400" />
                        )}
                      </button>
                    )}

                    <Card className={`overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group rounded-2xl ${
                      selectedPhotos.has(photo.id) ? 'ring-4 ring-red-500' : ''
                    }`}>
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
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleDownloadPhoto(photo)}
                            className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-xl gap-2 h-9 text-sm"
                          >
                            <Download className="h-4 w-4" />
                            Baixar
                          </Button>
                          {role === 'teacher' && (
                            <Button
                              onClick={() => handleDeletePhoto(photo)}
                              variant="destructive"
                              className="bg-red-500 hover:bg-red-600 text-white rounded-xl p-0 h-9 w-9"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              {photoToDelete
                ? 'Tem certeza que deseja excluir esta foto? Esta ação não pode ser desfeita.'
                : `Tem certeza que deseja excluir ${selectedCount} foto${selectedCount > 1 ? 's' : ''}? Esta ação não pode ser desfeita.`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-800 mb-2">
                <span className="font-bold">⚠️ Atenção:</span> Esta ação não pode ser desfeita!
              </p>
              <p className="text-sm text-red-700">
                As fotos serão excluídas permanentemente do banco de dados e do storage.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setPhotoToDelete(null);
              }}
              className="rounded-xl"
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
