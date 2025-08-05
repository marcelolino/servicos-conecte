import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, X, FileImage } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StepImageUploadProps {
  onUpload: (url: string) => void;
  category: string;
  className?: string;
  currentImage?: string;
  acceptedFormats?: string[];
  maxSizeMB?: number;
  placeholder?: string;
}

export function StepImageUpload({
  onUpload,
  category,
  className = '',
  currentImage = '',
  acceptedFormats = ['.jpg', '.jpeg', '.png'],
  maxSizeMB = 5,
  placeholder = 'Clique ou arraste para enviar'
}: StepImageUploadProps) {
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

      // Use the correct upload endpoint with proper category
      const response = await fetch(`/api/upload/public/${category}`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Upload response error:', errorData);
        throw new Error('Erro no upload da imagem');
      }

      const data = await response.json();
      onUpload(data.imageUrl);
      
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
    onUpload('');
  };

  if (currentImage) {
    return (
      <div className="relative">
        <img 
          src={currentImage} 
          alt="Uploaded" 
          className="w-full max-w-xs h-48 object-cover rounded-lg border"
        />
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="absolute -top-2 -right-2 h-8 w-8 rounded-full p-0"
          onClick={removeImage}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`relative border-2 border-dashed rounded-lg transition-colors ${
        dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
      } ${className}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        type="file"
        accept={acceptedFormats.join(',')}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={uploading}
      />
      
      <div className="flex flex-col items-center justify-center p-8 text-center">
        {uploading ? (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-sm text-gray-600 mb-2">Enviando arquivo...</p>
            <Progress value={uploadProgress} className="w-full max-w-xs" />
          </>
        ) : (
          <>
            <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FileImage className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 mb-2">{placeholder}</p>
            <p className="text-xs text-gray-400">
              {acceptedFormats.join(', ')} até {maxSizeMB}MB
            </p>
          </>
        )}
      </div>
    </div>
  );
}