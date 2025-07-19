import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import ImageUpload from '@/components/image-upload';
import { 
  Image as ImageIcon, 
  Upload, 
  Trash2, 
  Edit, 
  Eye,
  Download,
  Filter,
  Search,
  Grid,
  List,
  Plus,
  Settings,
  FolderOpen,
  Tag,
  Calendar,
  FileImage,
  BarChart3
} from 'lucide-react';

interface MediaFile {
  id: string;
  url: string;
  name: string;
  size: number;
  type: string;
  category: string;
  createdAt: string;
  width?: number;
  height?: number;
  usedIn?: string[];
}

export default function MediaManagement() {
  const { user, loading: authLoading, isLoggingOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<'banner' | 'service' | 'category' | 'provider'>('service');

  // Mock data - in real app, this would come from API
  const mediaFiles: MediaFile[] = [
    {
      id: '1',
      url: '/uploads/banners/banner1.webp',
      name: 'banner1.webp',
      size: 245760,
      type: 'image/webp',
      category: 'banner',
      createdAt: '2025-01-16T10:00:00Z',
      width: 1200,
      height: 400,
      usedIn: ['Banner promocional de encanamento']
    },
    {
      id: '2',
      url: '/uploads/services/service1.webp',
      name: 'service1.webp',
      size: 189440,
      type: 'image/webp',
      category: 'service',
      createdAt: '2025-01-16T09:30:00Z',
      width: 800,
      height: 600,
      usedIn: ['Serviço de limpeza residencial']
    },
    {
      id: '3',
      url: '/uploads/categories/category1.webp',
      name: 'category1.webp',
      size: 156672,
      type: 'image/webp',
      category: 'category',
      createdAt: '2025-01-16T09:00:00Z',
      width: 400,
      height: 400,
      usedIn: ['Categoria Jardinagem']
    },
    {
      id: '4',
      url: '/uploads/providers/provider1.webp',
      name: 'provider1.webp',
      size: 178176,
      type: 'image/webp',
      category: 'provider',
      createdAt: '2025-01-16T08:30:00Z',
      width: 400,
      height: 400,
      usedIn: ['Perfil do prestador João Silva']
    }
  ];

  const filteredFiles = mediaFiles.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || file.category === selectedCategory;
    const matchesTab = activeTab === 'all' || file.category === activeTab;
    return matchesSearch && matchesCategory && matchesTab;
  });

  const getFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'banner':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'service':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'category':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'provider':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'banner':
        return 'Banner';
      case 'service':
        return 'Serviço';
      case 'category':
        return 'Categoria';
      case 'provider':
        return 'Prestador';
      default:
        return category;
    }
  };

  const handleImageUpload = (imageUrl: string) => {
    toast({
      title: 'Imagem enviada com sucesso!',
      description: 'A imagem foi processada e está pronta para uso.',
    });
    // In real app, refresh the media list
    queryClient.invalidateQueries({ queryKey: ['media-files'] });
    setIsUploadDialogOpen(false);
  };

  const handleDeleteFile = async (file: MediaFile) => {
    if (file.usedIn && file.usedIn.length > 0) {
      toast({
        title: 'Não é possível excluir',
        description: 'Esta imagem está sendo usada em outros locais.',
        variant: 'destructive'
      });
      return;
    }

    if (confirm(`Tem certeza que deseja excluir ${file.name}?`)) {
      try {
        await apiRequest('/api/upload/image', {
          method: 'DELETE',
          body: { imagePath: file.url }
        });
        
        toast({
          title: 'Imagem excluída',
          description: 'A imagem foi removida com sucesso.',
        });
        
        queryClient.invalidateQueries({ queryKey: ['media-files'] });
      } catch (error) {
        toast({
          title: 'Erro ao excluir',
          description: 'Não foi possível excluir a imagem.',
          variant: 'destructive'
        });
      }
    }
  };

  // Show loading while checking authentication or logging out
  if (authLoading || isLoggingOut) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{isLoggingOut ? "Saindo..." : "Carregando..."}</p>
        </div>
      </div>
    );
  }

  if (user?.userType !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Acesso Negado
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Apenas administradores podem acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Gerenciamento de Mídia
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Gerencie todas as imagens do sistema
          </p>
        </div>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Enviar Imagem
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Enviar Nova Imagem</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="category">Categoria</Label>
                <Select value={uploadCategory} onValueChange={(value: any) => setUploadCategory(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="banner">Banner Promocional</SelectItem>
                    <SelectItem value="service">Serviço</SelectItem>
                    <SelectItem value="category">Categoria</SelectItem>
                    <SelectItem value="provider">Prestador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <ImageUpload
                category={uploadCategory}
                onUpload={handleImageUpload}
                multiple={false}
                maxFiles={1}
                showPreview={false}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Imagens</CardTitle>
            <FileImage className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mediaFiles.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Banners</CardTitle>
            <Tag className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {mediaFiles.filter(f => f.category === 'banner').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Serviços</CardTitle>
            <Settings className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {mediaFiles.filter(f => f.category === 'service').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Espaço Usado</CardTitle>
            <BarChart3 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {getFileSize(mediaFiles.reduce((total, file) => total + file.size, 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Pesquisar por nome do arquivo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todas as categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            <SelectItem value="banner">Banners</SelectItem>
            <SelectItem value="service">Serviços</SelectItem>
            <SelectItem value="category">Categorias</SelectItem>
            <SelectItem value="provider">Prestadores</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Media Files */}
      <div className="space-y-4">
        {filteredFiles.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Nenhuma imagem encontrada
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'Tente ajustar os filtros de pesquisa.'
                  : 'Comece enviando suas primeiras imagens.'}
              </p>
              <Button onClick={() => setIsUploadDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Enviar Primeira Imagem
              </Button>
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredFiles.map((file) => (
              <Card key={file.id} className="group hover:shadow-lg transition-shadow">
                <div className="aspect-square relative overflow-hidden rounded-t-lg">
                  <img
                    src={file.url}
                    alt={file.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
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
                        onClick={() => window.open(file.url, '_blank')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = file.url;
                          link.download = file.name;
                          link.click();
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteFile(file)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge className={getCategoryColor(file.category)}>
                        {getCategoryName(file.category)}
                      </Badge>
                      <span className="text-xs text-gray-500">{getFileSize(file.size)}</span>
                    </div>
                    <p className="font-medium text-sm truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {file.width} × {file.height}px
                    </p>
                    {file.usedIn && file.usedIn.length > 0 && (
                      <div className="text-xs text-gray-600">
                        <p className="font-medium">Usado em:</p>
                        <ul className="list-disc list-inside mt-1">
                          {file.usedIn.map((usage, index) => (
                            <li key={index} className="truncate" title={usage}>{usage}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Imagem
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nome
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Categoria
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tamanho
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dimensões
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredFiles.map((file) => (
                      <tr key={file.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <img
                            src={file.url}
                            alt={file.name}
                            className="h-12 w-12 rounded-lg object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/api/placeholder/48/48';
                            }}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {file.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={getCategoryColor(file.category)}>
                            {getCategoryName(file.category)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getFileSize(file.size)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {file.width} × {file.height}px
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(file.url, '_blank')}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = file.url;
                                link.download = file.name;
                                link.click();
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteFile(file)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}