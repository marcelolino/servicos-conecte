import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { getAuthToken } from '@/lib/auth';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Eye, 
  Trash2,
  Download,
  Plus,
  FileImage,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface ImageUploadProps {
  onUpload: (imageUrl: string) => void;
  onRemove?: (imageUrl: string) => void;
  category: 'banner' | 'service' | 'category' | 'provider' | 'profile';
  multiple?: boolean;
  maxFiles?: number;
  currentImages?: string[];
  accept?: string;
  maxSize?: number; // in MB
  disabled?: boolean;
  showPreview?: boolean;
  className?: string;
}

interface UploadedImage {
  url: string;
  name: string;
  size: number;
  uploading: boolean;
  progress: number;
  error?: string;
}

export default function ImageUpload({
  onUpload,
  onRemove,
  category,
  multiple = false,
  maxFiles = 5,
  currentImages = [],
  accept = 'image/*',
  maxSize = 5,
  disabled = false,
  showPreview = true,
  className = ''
}: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList) => {
    if (disabled) return;

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Arquivo inválido',
          description: `${file.name} não é uma imagem válida.`,
          variant: 'destructive'
        });
        return false;
      }
      
      if (file.size > maxSize * 1024 * 1024) {
        toast({
          title: 'Arquivo muito grande',
          description: `${file.name} excede o tamanho máximo de ${maxSize}MB.`,
          variant: 'destructive'
        });
        return false;
      }
      
      return true;
    });

    if (validFiles.length === 0) return;

    if (!multiple && validFiles.length > 1) {
      toast({
        title: 'Múltiplos arquivos',
        description: 'Apenas um arquivo é permitido.',
        variant: 'destructive'
      });
      return;
    }

    if (currentImages.length + validFiles.length > maxFiles) {
      toast({
        title: 'Muitos arquivos',
        description: `Máximo de ${maxFiles} arquivos permitido.`,
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      if (multiple) {
        const formData = new FormData();
        validFiles.forEach(file => {
          formData.append('images', file);
        });
        formData.append('category', category);

        const response = await fetch('/api/upload/multiple', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`
          },
          body: formData
        });

        const data = await response.json();
        
        if (response.ok) {
          data.imageUrls.forEach((url: string) => onUpload(url));
          toast({
            title: 'Upload realizado com sucesso',
            description: `${data.imageUrls.length} imagem(ns) enviada(s).`
          });
        } else {
          throw new Error(data.message || 'Erro no upload');
        }
      } else {
        const formData = new FormData();
        formData.append('image', validFiles[0]);

        const authToken = getAuthToken();
        if (!authToken) {
          throw new Error('Token de autenticação não encontrado. Faça login novamente.');
        }

        // Use advanced endpoint for profile uploads (avatar)
        const endpoint = category === 'profile' ? '/api/upload/advanced/avatar' : `/api/upload/${category}`;
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`
          },
          body: formData
        });

        const data = await response.json();
        
        if (response.ok) {
          onUpload(data.imageUrl);
          toast({
            title: 'Upload realizado com sucesso',
            description: 'Imagem enviada com sucesso.'
          });
        } else {
          if (response.status === 401 || response.status === 403) {
            throw new Error('Sessão expirada. Faça login novamente.');
          }
          throw new Error(data.message || 'Erro no upload');
        }
      }
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
  }, [category, multiple, maxFiles, maxSize, currentImages.length, onUpload, disabled, toast]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = async (imageUrl: string) => {
    if (onRemove) {
      onRemove(imageUrl);
    }
  };

  const getImageDimensions = (category: string) => {
    switch (category) {
      case 'banner':
        return { width: 1200, height: 400 };
      case 'service':
        return { width: 800, height: 600 };
      case 'category':
        return { width: 400, height: 400 };
      case 'provider':
        return { width: 400, height: 400 };
      default:
        return { width: 800, height: 600 };
    }
  };

  const dimensions = getImageDimensions(category);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <Card 
        className={`border-2 border-dashed transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
            : 'border-gray-300 hover:border-gray-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        <CardContent className="p-8 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleInputChange}
            className="hidden"
            disabled={disabled}
          />
          
          <div className="flex flex-col items-center gap-4">
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="text-sm text-gray-600">Enviando...</p>
                <Progress value={uploadProgress} className="w-full max-w-xs" />
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Upload className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    Clique ou arraste para enviar
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {multiple 
                      ? `Máximo ${maxFiles} arquivos, até ${maxSize}MB cada`
                      : `Arquivo único, até ${maxSize}MB`
                    }
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Dimensões recomendadas: {dimensions.width}x{dimensions.height}px
                  </p>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  disabled={disabled}
                  onClick={handleButtonClick}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Selecionar Arquivo{multiple ? 's' : ''}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File Format Info */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <FileImage className="h-4 w-4" />
        <span>Formatos aceitos: JPG, PNG, GIF, WebP</span>
      </div>

      {/* Current Images Preview */}
      {showPreview && currentImages.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">Imagens Atuais</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {currentImages.map((imageUrl, index) => (
              <div key={index} className="relative group">
                <Card className="overflow-hidden">
                  <div className="aspect-square relative">
                    <img
                      src={imageUrl}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/api/placeholder/400/400';
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(imageUrl, '_blank');
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(imageUrl);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Guidelines */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Diretrizes para Upload</p>
              <ul className="space-y-1 text-xs">
                <li>• Use imagens de alta qualidade (mínimo 800x600px)</li>
                <li>• Evite imagens com muita compressão ou pixelizadas</li>
                <li>• Prefira formatos WebP ou PNG para melhor qualidade</li>
                <li>• Imagens serão automaticamente otimizadas após upload</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}