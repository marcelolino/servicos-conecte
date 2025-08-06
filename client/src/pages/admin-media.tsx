import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ModernAdminLayout } from '@/components/layout/modern-admin-layout';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { 
  Image as ImageIcon, 
  FileText, 
  Download,
  Trash2,
  Upload,
  Eye,
  HardDrive
} from 'lucide-react';

interface MediaFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: string;
  category: 'provider' | 'banner' | 'service' | 'category' | 'profile';
}

export default function AdminMedia() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: mediaFiles = [], isLoading } = useQuery({
    queryKey: ['/api/admin/media'],
  });

  const deleteMediaMutation = useMutation({
    mutationFn: (fileId: string) =>
      apiRequest(`/api/admin/media/${fileId}`, {
        method: 'DELETE',
      }),
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const getCategoryBadge = (category: string) => {
    const variants: Record<string, any> = {
      provider: 'default',
      banner: 'secondary',
      service: 'outline',
      category: 'destructive',
      profile: 'default',
    };
    
    const labels: Record<string, string> = {
      provider: 'Prestador',
      banner: 'Banner',
      service: 'Serviço',
      category: 'Categoria',
      profile: 'Perfil',
    };
    
    return (
      <Badge variant={variants[category] || 'outline'}>
        {labels[category] || category}
      </Badge>
    );
  };

  const filterByCategory = (category: string) => {
    return mediaFiles.filter((file: MediaFile) => file.category === category);
  };

  const renderMediaGrid = (files: MediaFile[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {files.map((file: MediaFile) => (
        <Card key={file.id} className="overflow-hidden">
          <div className="aspect-square bg-muted flex items-center justify-center">
            {file.type.startsWith('image/') ? (
              <img 
                src={file.url} 
                alt={file.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-2">
                {getFileTypeIcon(file.type)}
                <span className="text-sm text-muted-foreground">
                  {file.type}
                </span>
              </div>
            )}
          </div>
          <CardContent className="p-4">
            <div className="space-y-2">
              <h3 className="font-medium truncate" title={file.name}>
                {file.name}
              </h3>
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>{formatFileSize(file.size)}</span>
                {getCategoryBadge(file.category)}
              </div>
              <p className="text-xs text-muted-foreground">
                {format(new Date(file.uploadedAt), 'dd/MM/yyyy HH:mm')}
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1">
                  <Eye className="h-3 w-3 mr-1" />
                  Ver
                </Button>
                <Button size="sm" variant="outline">
                  <Download className="h-3 w-3" />
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => deleteMediaMutation.mutate(file.id)}
                  disabled={deleteMediaMutation.isPending}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
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

  const totalSize = mediaFiles.reduce((total: number, file: MediaFile) => total + file.size, 0);

  return (
    <ModernAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gerenciamento de Mídia</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie todos os arquivos de mídia da plataforma
            </p>
          </div>
          
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Upload de Arquivo
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Arquivos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mediaFiles.length}</div>
              <p className="text-xs text-muted-foreground">
                Arquivos armazenados
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Imagens</CardTitle>
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mediaFiles.filter((f: MediaFile) => f.type.startsWith('image/')).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Arquivos de imagem
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tamanho Total</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatFileSize(totalSize)}</div>
              <p className="text-xs text-muted-foreground">
                Espaço utilizado
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prestadores</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filterByCategory('provider').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Arquivos de prestadores
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">
              Todos ({mediaFiles.length})
            </TabsTrigger>
            <TabsTrigger value="provider">
              Prestadores ({filterByCategory('provider').length})
            </TabsTrigger>
            <TabsTrigger value="banner">
              Banners ({filterByCategory('banner').length})
            </TabsTrigger>
            <TabsTrigger value="service">
              Serviços ({filterByCategory('service').length})
            </TabsTrigger>
            <TabsTrigger value="profile">
              Perfis ({filterByCategory('profile').length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            {mediaFiles.length === 0 ? (
              <div className="text-center py-12">
                <ImageIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Nenhum arquivo encontrado
                </h3>
                <p className="text-muted-foreground">
                  Nenhum arquivo de mídia foi carregado ainda.
                </p>
              </div>
            ) : (
              renderMediaGrid(mediaFiles)
            )}
          </TabsContent>
          
          <TabsContent value="provider">
            {renderMediaGrid(filterByCategory('provider'))}
          </TabsContent>
          
          <TabsContent value="banner">
            {renderMediaGrid(filterByCategory('banner'))}
          </TabsContent>
          
          <TabsContent value="service">
            {renderMediaGrid(filterByCategory('service'))}
          </TabsContent>
          
          <TabsContent value="profile">
            {renderMediaGrid(filterByCategory('profile'))}
          </TabsContent>
        </Tabs>
      </div>
    </ModernAdminLayout>
  );
}