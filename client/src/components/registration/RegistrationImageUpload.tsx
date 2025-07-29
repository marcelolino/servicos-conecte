import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, X, FileImage } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RegistrationImageUploadProps {
  value: string;
  onChange: (value: string) => void;
  folder: string;
  acceptedFormats?: string[];
  maxSizeMB?: number;
  placeholder?: string;
}

export function RegistrationImageUpload({
  value,
  onChange,
  folder,
  acceptedFormats = ['.jpg', '.jpeg', '.png'],
  maxSizeMB = 5,
  placeholder = 'Clique ou arraste para enviar'
}: RegistrationImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const { toast } = useToast();

  const validateFile = (file: File): boolean => {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!acceptedFormats.includes(fileExtension)) {
      toast({
        title: 'Formato não aceito',
        description: `Apenas ${acceptedFormats.join(', ')} são permitidos.`,
        variant: 'destructive'
      });
      return false;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: `O arquivo deve ter no máximo ${maxSizeMB}MB.`,
        variant: 'destructive'
      });
      return false;
    }

    return true;
  };

  const uploadFile = async (file: File) => {
    if (!validateFile(file)) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('image', file);

      // Use a simple upload endpoint that doesn't require authentication
      const response = await fetch(`/api/upload/public/${folder}`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Erro no upload da imagem');
      }

      const data = await response.json();
      onChange(data.imageUrl);
      
      toast({
        title: 'Upload realizado com sucesso',
        description: 'Imagem enviada com sucesso.'
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Erro no upload',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const removeImage = () => {
    onChange('');
  };

  return (
    <div className="space-y-4">
      {value ? (
        <div className="relative">
          <img
            src={value}
            alt="Upload preview"
            className="w-full h-32 object-cover rounded-lg border"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={removeImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="space-y-2">
            <FileImage className="h-8 w-8 mx-auto text-gray-400" />
            <p className="text-sm text-gray-600">{placeholder}</p>
            <p className="text-xs text-gray-500">
              Formatos aceitos: {acceptedFormats.join(', ')} | Máximo: {maxSizeMB}MB
            </p>
            <input
              type="file"
              accept={acceptedFormats.join(',')}
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
              id={`file-upload-${folder}`}
              disabled={uploading}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById(`file-upload-${folder}`)?.click()}
              disabled={uploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Selecionar Arquivo
            </Button>
          </div>
        </div>
      )}

      {uploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} />
          <p className="text-sm text-gray-600 text-center">Enviando imagem...</p>
        </div>
      )}
    </div>
  );
}