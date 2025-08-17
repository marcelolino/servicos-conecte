import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ModernAdminLayout } from '@/components/layout/modern-admin-layout';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { useState } from 'react';
import { 
  Image as ImageIcon, 
  FileText, 
  Download,
  Trash2,
  Upload,
  Eye,
  HardDrive,
  Folder,
  ArrowLeft,
  Plus
} from 'lucide-react';

interface MediaFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  createdAt: string;
  category: 'provider' | 'banner' | 'service' | 'category' | 'avatar' | 'general' | 'portfolio';
}

interface CategoryFolder {
  name: string;
  displayName: string;
  icon: string;
  count: number;
  color: string;
}

export default function AdminMedia() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<string>('general');

  const { data: mediaFiles = [], isLoading } = useQuery({
    queryKey: ['/api/admin/media'],
  });

  const categories: CategoryFolder[] = [
    { name: 'avatars', displayName: 'Avatars', icon: '👤', count: 0, color: 'bg-blue-100' },
    { name: 'banners', displayName: 'Banners', icon: '🎨', count: 0, color: 'bg-green-100' },
    { name: 'categories', displayName: 'Categories', icon: '📂', count: 0, color: 'bg-purple-100' },
    { name: 'documents', displayName: 'Documents', icon: '📄', count: 0, color: 'bg-gray-100' },
    { name: 'general', displayName: 'General', icon: '📁', count: 0, color: 'bg-yellow-100' },
    { name: 'logos', displayName: 'Logos', icon: '🔧', count: 0, color: 'bg-orange-100' },
    { name: 'portfolio', displayName: 'Portfolio', icon: '🖼️', count: 0, color: 'bg-pink-100' },
    { name: 'providers', displayName: 'Providers', icon: '👥', count: 0, color: 'bg-indigo-100' },
    { name: 'services', displayName: 'Services', icon: '⚙️', count: 0, color: 'bg-teal-100' },
  ];

  // Calculate counts for each category
  const categoriesWithCounts = categories.map(cat => ({
    ...cat,
    count: mediaFiles.filter((file: MediaFile) => file.category === cat.name || (cat.name === 'avatars' && file.category === 'avatar')).length
  }));

  const deleteMediaMutation = useMutation({
    mutationFn: (fileId: string) => {
      const parts = fileId.split('_');
      const category = parts[0];
      const filename = parts.slice(1).join('_');
      return apiRequest(`/api/media/files/${category}/${filename}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/media'] });
      toast({
        title: 'Sucesso',
        description: 'Arquivo excluído com sucesso',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir arquivo',
        variant: 'destructive',
      });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, category }: { file: File, category: string }) => {
      const formData = new FormData();
      formData.append('image', file);
      
      return fetch(`/api/upload/advanced/${category}`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/media'] });
      setIsUploadDialogOpen(false);
      toast({
        title: 'Sucesso',
        description: 'Arquivo enviado com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao enviar arquivo',
        variant: 'destructive',
      });
    },
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filterByCategory = (category: string) => {
    if (category === 'avatars') {
      return mediaFiles.filter((file: MediaFile) => file.category === 'avatar' || file.category === 'avatars');
    }
    return mediaFiles.filter((file: MediaFile) => file.category === category);
  };

  const renderFoldersView = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground">Local Storage</span>
        </div>
        <Badge variant="secondary">{mediaFiles.length} items</Badge>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4 p-4">
        {categoriesWithCounts.map((category) => (
          <div
            key={category.name}
            className="flex flex-col items-center p-4 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group"
            onClick={() => setSelectedCategory(category.name)}
          >
            <div className={`w-16 h-16 ${category.color} rounded-lg flex items-center justify-center mb-2 group-hover:scale-105 transition-transform`}>
              <Folder className="h-8 w-8 text-yellow-600" />
            </div>
            <span className="text-sm font-medium text-center truncate w-full">
              {category.displayName}
            </span>
            <span className="text-xs text-muted-foreground">
              {category.count} items
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCategoryFiles = (files: MediaFile[]) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Folder className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground capitalize">
              {selectedCategory} ({files.length} files)
            </span>
          </div>
        </div>
        <Button
          onClick={() => {
            setUploadCategory(selectedCategory || 'general');
            setIsUploadDialogOpen(true);
          }}
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New
        </Button>
      </div>

      {files.length === 0 ? (
        <div className="text-center py-12">
          <ImageIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Pasta vazia
          </h3>
          <p className="text-muted-foreground mb-4">
            Nenhum arquivo foi encontrado nesta categoria.
          </p>
          <Button
            onClick={() => {
              setUploadCategory(selectedCategory || 'general');
              setIsUploadDialogOpen(true);
            }}
          >
            <Upload className="h-4 w-4 mr-2" />
            Fazer Upload
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 p-4">
          {files.map((file: MediaFile) => (
            <div key={file.id} className="group">
              <Card className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-square bg-muted flex items-center justify-center relative">
                  {file.type.startsWith('image/') ? (
                    <img 
                      src={file.url} 
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground text-center px-2">
                        {file.name}
                      </span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-6 w-6 p-0"
                      onClick={() => deleteMediaMutation.mutate(file.id)}
                      disabled={deleteMediaMutation.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-2">
                  <div className="space-y-1">
                    <h3 className="text-xs font-medium truncate" title={file.name}>
                      {file.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <ModernAdminLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </ModernAdminLayout>
    );
  }

  return (
    <ModernAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gerenciamento de Mídia</h1>
            <p className="text-muted-foreground mt-1">
              Organize e gerencie todos os arquivos de mídia da plataforma
            </p>
          </div>
          
          {selectedCategory && (
            <Button onClick={() => setIsUploadDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload de Arquivo
            </Button>
          )}
        </div>

        {selectedCategory ? (
          renderCategoryFiles(filterByCategory(selectedCategory))
        ) : (
          renderFoldersView()
        )}

        {/* Upload Dialog */}
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload de Arquivo - {uploadCategory}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      uploadMutation.mutate({ file, category: uploadCategory });
                    }
                  }}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">Clique para selecionar arquivo</p>
                  <p className="text-sm text-muted-foreground">
                    Apenas imagens são aceitas (PNG, JPG, JPEG, WebP)
                  </p>
                </label>
              </div>
              
              {uploadMutation.isPending && (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2"></div>
                  <span>Enviando arquivo...</span>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ModernAdminLayout>
  );
}