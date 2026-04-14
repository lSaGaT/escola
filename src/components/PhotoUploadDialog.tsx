import { useState } from 'react';
import { Loader2, Upload, X, Plus, Check } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';
import { SchoolClass } from '@/src/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

interface PhotoUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  availableClasses: SchoolClass[];
  userId?: string;
}

interface SelectedFile {
  file: File;
  preview: string;
}

export function PhotoUploadDialog({
  open,
  onOpenChange,
  onSuccess,
  availableClasses,
  userId
}: PhotoUploadDialogProps) {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<SchoolClass[]>([]);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files) return;

    const newFiles: SelectedFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const preview = URL.createObjectURL(file);
        newFiles.push({ file, preview });
      }
    }

    setSelectedFiles((prev) => [...prev, ...newFiles]);
    setError(null);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const toggleClass = (className: SchoolClass) => {
    setSelectedClasses((prev) =>
      prev.includes(className)
        ? prev.filter((c) => c !== className)
        : [...prev, className]
    );
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || selectedClasses.length === 0 || !userId) {
      setError('Selecione pelo menos uma foto e uma turma');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Upload cada foto para cada turma selecionada
      for (const selectedFile of selectedFiles) {
        for (const className of selectedClasses) {
          const fileExt = selectedFile.file.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `${className}/${fileName}`;

          // Upload para storage
          const { error: uploadError } = await supabase.storage
            .from('school-photos')
            .upload(filePath, selectedFile.file);

          if (uploadError) throw uploadError;

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('school-photos')
            .getPublicUrl(filePath);

          // Insert no banco
          const { error: dbError } = await supabase
            .from('photos')
            .insert([
              {
                url: publicUrl,
                class_name: className,
                description: description || null,
                uploaded_by: userId
              }
            ]);

          if (dbError) throw dbError;
        }
      }

      // Limpar e fechar
      setSelectedFiles([]);
      setSelectedClasses([]);
      setDescription('');
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Erro ao fazer upload das fotos');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFiles([]);
    setSelectedClasses([]);
    setDescription('');
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Fotos</DialogTitle>
          <DialogDescription>
            Selecione uma ou mais fotos e escolha as turmas onde devem aparecer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Seleção de Fotos */}
          <div className="space-y-2">
            <Label>Fotos</Label>
            <div className="border-2 border-dashed border-red-200 rounded-2xl p-6 text-center hover:border-red-300 transition-colors cursor-pointer relative overflow-hidden">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-red-400" />
                <p className="text-sm font-medium text-slate-700">
                  Clique ou arraste fotos aqui
                </p>
                <p className="text-xs text-slate-500">
                  PNG, JPG ou WEBP
                </p>
              </div>
            </div>

            {/* Preview das fotos selecionadas */}
            {selectedFiles.length > 0 && (
              <div className="grid grid-cols-4 gap-3 mt-4">
                {selectedFiles.map((item, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={item.preview}
                      alt={`Preview ${index}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {selectedFiles.length > 0 && (
              <p className="text-xs text-slate-500 mt-2">
                {selectedFiles.length} foto(s) selecionada(s)
              </p>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição (Opcional)</Label>
            <input
              id="description"
              type="text"
              placeholder="Ex: Atividade de pintura, Dia do brinquedo..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-red-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Seleção de Turmas */}
          <div className="space-y-3">
            <Label>Turmas</Label>
            <p className="text-xs text-slate-500">
              Selecione uma ou mais turmas para que as fotos apareçam
            </p>
            <div className="grid grid-cols-2 gap-2">
              {availableClasses.map((className) => (
                <button
                  key={className}
                  onClick={() => toggleClass(className)}
                  className={`p-3 rounded-xl border-2 transition-all text-sm font-medium text-center flex items-center justify-center gap-2 ${
                    selectedClasses.includes(className)
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-red-200'
                  }`}
                >
                  {selectedClasses.includes(className) && (
                    <Check className="h-4 w-4" />
                  )}
                  {className}
                </button>
              ))}
            </div>

            {selectedClasses.length > 0 && (
              <p className="text-xs text-slate-500">
                Fotos aparecerão em: {selectedClasses.join(', ')}
              </p>
            )}
          </div>

          {/* Erro */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={uploading}
            className="rounded-xl"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleUpload}
            disabled={
              uploading ||
              selectedFiles.length === 0 ||
              selectedClasses.length === 0
            }
            className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-xl gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Enviar Fotos ({selectedFiles.length})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
