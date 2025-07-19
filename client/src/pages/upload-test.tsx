import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import ImageUpload from '@/components/image-upload';
import BannerManagement from '@/components/banner-management';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload as UploadIcon } from 'lucide-react';

export default function UploadTest() {
  const { user, loading: authLoading, isLoggingOut } = useAuth();
  const { toast } = useToast();
  const [bannerImages, setBannerImages] = useState<string[]>([]);
  const [serviceImages, setServiceImages] = useState<string[]>([]);
  const [categoryImages, setCategoryImages] = useState<string[]>([]);
  const [providerImages, setProviderImages] = useState<string[]>([]);

  const handleImageUpload = (category: string) => (imageUrl: string) => {
    switch (category) {
      case 'banner':
        setBannerImages(prev => [...prev, imageUrl]);
        break;
      case 'service':
        setServiceImages(prev => [...prev, imageUrl]);
        break;
      case 'category':
        setCategoryImages(prev => [...prev, imageUrl]);
        break;
      case 'provider':
        setProviderImages(prev => [...prev, imageUrl]);
        break;
    }
    toast({
      title: 'Upload realizado com sucesso!',
      description: `Imagem de ${category} foi carregada e processada.`,
    });
  };

  const handleImageRemove = (category: string) => (imageUrl: string) => {
    switch (category) {
      case 'banner':
        setBannerImages(prev => prev.filter(img => img !== imageUrl));
        break;
      case 'service':
        setServiceImages(prev => prev.filter(img => img !== imageUrl));
        break;
      case 'category':
        setCategoryImages(prev => prev.filter(img => img !== imageUrl));
        break;
      case 'provider':
        setProviderImages(prev => prev.filter(img => img !== imageUrl));
        break;
    }
    toast({
      title: 'Imagem removida',
      description: `Imagem de ${category} foi removida.`,
    });
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

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Acesso Negado
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Você precisa fazer login para acessar esta página.
          </p>
          <Link href="/login">
            <Button>Fazer Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Sistema de Upload de Imagens
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Teste as funcionalidades de upload e processamento de imagens
          </p>
        </div>
      </div>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Upload de Imagens</TabsTrigger>
          <TabsTrigger value="banners">Gerenciamento de Banners</TabsTrigger>
          <TabsTrigger value="media">Galeria de Mídia</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UploadIcon className="h-5 w-5" />
                  Upload de Banner
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ImageUpload
                  category="banner"
                  onUpload={handleImageUpload('banner')}
                  onRemove={handleImageRemove('banner')}
                  currentImages={bannerImages}
                  multiple={false}
                  maxFiles={1}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UploadIcon className="h-5 w-5" />
                  Upload de Serviços
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ImageUpload
                  category="service"
                  onUpload={handleImageUpload('service')}
                  onRemove={handleImageRemove('service')}
                  currentImages={serviceImages}
                  multiple={true}
                  maxFiles={5}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UploadIcon className="h-5 w-5" />
                  Upload de Categoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ImageUpload
                  category="category"
                  onUpload={handleImageUpload('category')}
                  onRemove={handleImageRemove('category')}
                  currentImages={categoryImages}
                  multiple={false}
                  maxFiles={1}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UploadIcon className="h-5 w-5" />
                  Upload de Prestador
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ImageUpload
                  category="provider"
                  onUpload={handleImageUpload('provider')}
                  onRemove={handleImageRemove('provider')}
                  currentImages={providerImages}
                  multiple={false}
                  maxFiles={1}
                />
              </CardContent>
            </Card>
          </div>

          {/* Upload Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas de Upload</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{bannerImages.length}</div>
                  <div className="text-sm text-gray-600">Banners</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{serviceImages.length}</div>
                  <div className="text-sm text-gray-600">Serviços</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{categoryImages.length}</div>
                  <div className="text-sm text-gray-600">Categorias</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{providerImages.length}</div>
                  <div className="text-sm text-gray-600">Prestadores</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="banners" className="space-y-6">
          {user.userType === 'admin' ? (
            <BannerManagement />
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Acesso Restrito
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Apenas administradores podem gerenciar banners.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="media" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Galeria de Mídia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Funcionalidade de galeria de mídia será implementada em breve.
                </p>
                <Link href="/media-management">
                  <Button variant="outline">
                    Acessar Gerenciamento de Mídia
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}