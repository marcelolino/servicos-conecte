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
  Plus,
  Search,
  Filter
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
  const [searchTerm, setSearchTerm] = useState('');

  const { data: mediaFiles = [], isLoading } = useQuery({
    queryKey: ['/api/admin/media'],
  });

  const categories: CategoryFolder[] = [
    { name: 'avatars', displayName: 'Avatars', icon: '👤', count: 0, color: 'bg-blue-100 dark:bg-blue-900' },
    { name: 'banners', displayName: 'Banners', icon: '🎨', count: 0, color: 'bg-green-100 dark:bg-green-900' },
    { name: 'categories', displayName: 'Categories', icon: '📂', count: 0, color: 'bg-purple-100 dark:bg-purple-900' },
    { name: 'documents', displayName: 'Documents', icon: '📄', count: 0, color: 'bg-gray-100 dark:bg-gray-800' },
    { name: 'general', displayName: 'General', icon: '📁', count: 0, color: 'bg-yellow-100 dark:bg-yellow-900' },
    { name: 'logos', displayName: 'Logos', icon: '🔧', count: 0, color: 'bg-orange-100 dark:bg-orange-900' },
    { name: 'portfolio', displayName: 'Portfolio', icon: '🖼️', count: 0, color: 'bg-pink-100 dark:bg-pink-900' },
    { name: 'providers', displayName: 'Providers', icon: '👥', count: 0, color: 'bg-indigo-100 dark:bg-indigo-900' },
    { name: 'services', displayName: 'Services', icon: '⚙️', count: 0, color: 'bg-teal-100 dark:bg-teal-900' },
  ];

  // Calculate counts for each category - improved matching logic
  const categoriesWithCounts = categories.map(cat => {
    let count = 0;
    
    if (cat.name === 'avatars') {
      // Count both 'avatar' and 'avatars' categories
      count = mediaFiles.filter((file: MediaFile) => 
        file.category === 'avatar' || file.category === 'avatars'
      ).length;
    } else if (cat.name === 'categories') {
      // Count both 'category' and 'categories' categories  
      count = mediaFiles.filter((file: MediaFile) => 
        file.category === 'category' || file.category === 'categories'
      ).length;
    } else if (cat.name === 'providers') {
      // Count both 'provider' and 'providers' categories
      count = mediaFiles.filter((file: MediaFile) => 
        file.category === 'provider' || file.category === 'providers'
      ).length;
    } else if (cat.name === 'services') {
      // Count both 'service' and 'services' categories
      count = mediaFiles.filter((file: MediaFile) => 
        file.category === 'service' || file.category === 'services'
      ).length;
    } else {
      // For other categories, direct match
      count = mediaFiles.filter((file: MediaFile) => 
        file.category === cat.name
      ).length;
    }
    
    return { ...cat, count };
  });

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
    return mediaFiles.filter((file: MediaFile) => {
      if (category === 'avatars') {
        return file.category === 'avatar' || file.category === 'avatars';
      } else if (category === 'categories') {
        return file.category === 'category' || file.category === 'categories';
      } else if (category === 'providers') {
        return file.category === 'provider' || file.category === 'providers';
      } else if (category === 'services') {
        return file.category === 'service' || file.category === 'services';
      } else if (category === 'banners') {
        return file.category === 'banner' || file.category === 'banners';
      } else {
        return file.category === category;
      }
    });
  };

  const renderFoldersView = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground">Local Storage</span>
        </div>
        <Badge variant="secondary">{mediaFiles.length} items</Badge>
      </div>
      
      {/* Files List */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border">
        <div className="p-4 border-b bg-muted/20">
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Folder className="h-4 w-4" />
              Files
            </h3>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar arquivos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 text-sm border border-input bg-background rounded-md w-64"
              />
            </div>
          </div>
        </div>
        <div className="divide-y divide-border">
          {categoriesWithCounts
            .filter(category => 
              searchTerm === '' || 
              category.displayName.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((category) => (
            <div
              key={category.name}
              className="flex items-center justify-between p-3 hover:bg-muted/30 cursor-pointer transition-colors group"
              onClick={() => setSelectedCategory(category.name)}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 ${category.color} rounded flex items-center justify-center group-hover:scale-105 transition-transform`}>
                  <Folder className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </div>
                <div>
                  <span className="text-sm font-medium text-foreground">
                    {category.displayName.toLowerCase()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium">
                  {category.count} items
                </span>
                <Eye className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {categoriesWithCounts.find(c => c.name === 'avatars')?.count || 0}
              </div>
              <div className="text-xs text-muted-foreground">Avatars</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {categoriesWithCounts.find(c => c.name === 'categories')?.count || 0}
              </div>
              <div className="text-xs text-muted-foreground">Categories</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                {categoriesWithCounts.find(c => c.name === 'services')?.count || 0}
              </div>
              <div className="text-xs text-muted-foreground">Services</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {categoriesWithCounts.find(c => c.name === 'general')?.count || 0}
              </div>
              <div className="text-xs text-muted-foreground">General</div>
            </div>
          </CardContent>
        </Card>
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 p-4">
          {files.map((file: MediaFile) => (
            <div key={file.id} className="group">
              <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                <div className="aspect-square bg-muted flex items-center justify-center relative">
                  {file.type.startsWith('image/') ? (
                    <img 
                      src={file.url} 
                      alt={file.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground text-center px-2">
                        {file.name}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(file.url, '_blank');
                        }}
                      >
                        <Eye className="h-3 w-3 text-gray-700" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-8 w-8 p-0 bg-red-500/90 hover:bg-red-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMediaMutation.mutate(file.id);
                        }}
                        disabled={deleteMediaMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3 text-white" />
                      </Button>
                    </div>
                  </div>
                </div>
                <CardContent className="p-2">
                  <div className="space-y-1">
                    <h3 className="text-xs font-medium truncate" title={file.name}>
                      {file.name.length > 20 ? `${file.name.substring(0, 17)}...` : file.name}
                    </h3>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(file.createdAt), 'dd/MM')}
                      </p>
                    </div>
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