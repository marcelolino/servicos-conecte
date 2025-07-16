import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdvancedUpload from "@/components/advanced-upload";
import { useAuth } from "@/hooks/use-auth";
import { Shield, Gauge, HardDrive, Zap, FileCheck, Trash2, RefreshCw } from "lucide-react";

export default function AdvancedUploadDemo() {
  const { user } = useAuth();
  const [uploadedImages, setUploadedImages] = useState<{ category: string; url: string; id: number }[]>([]);

  const handleUploadSuccess = (category: string) => (imageUrl: string, fileId: number) => {
    setUploadedImages(prev => [...prev, { category, url: imageUrl, id: fileId }]);
  };

  const features = [
    {
      icon: <Shield className="w-8 h-8 text-green-500" />,
      title: "Escaneamento de Vírus",
      description: "Todos os arquivos são verificados automaticamente contra vírus e malware antes do processamento.",
      status: "Ativo"
    },
    {
      icon: <Gauge className="w-8 h-8 text-blue-500" />,
      title: "Limites Inteligentes",
      description: "Sistema de cotas baseado no tipo de usuário, com limites diários, mensais e de armazenamento.",
      status: "Configurado"
    },
    {
      icon: <HardDrive className="w-8 h-8 text-purple-500" />,
      title: "Cache Inteligente",
      description: "Imagens processadas são armazenadas em cache para otimizar performance e reduzir reprocessamento.",
      status: "Otimizado"
    },
    {
      icon: <Zap className="w-8 h-8 text-yellow-500" />,
      title: "Processamento Avançado",
      description: "Redimensionamento automático, compressão inteligente e conversão de formato com otimização WebP.",
      status: "Ativo"
    },
    {
      icon: <FileCheck className="w-8 h-8 text-teal-500" />,
      title: "Rastreamento de Arquivos",
      description: "Monitoramento completo do ciclo de vida dos arquivos com estatísticas de uso e acesso.",
      status: "Monitorando"
    },
    {
      icon: <Trash2 className="w-8 h-8 text-red-500" />,
      title: "Limpeza Automática",
      description: "Remoção automática de arquivos não utilizados há mais de 30 dias, executada diariamente às 2h.",
      status: "Agendado"
    }
  ];

  const userLimits = {
    client: {
      daily: 10,
      monthly: 100,
      maxFileSize: "2MB",
      maxTotalSize: "50MB"
    },
    provider: {
      daily: 50,
      monthly: 500,
      maxFileSize: "5MB",
      maxTotalSize: "200MB"
    },
    admin: {
      daily: 1000,
      monthly: 10000,
      maxFileSize: "10MB",
      maxTotalSize: "1GB"
    }
  };

  const currentLimits = userLimits[user?.userType as keyof typeof userLimits] || userLimits.client;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Sistema Avançado de Upload</h1>
        <p className="text-gray-600">
          Demonstração completa do sistema de upload com recursos avançados de segurança, 
          otimização e gerenciamento de arquivos.
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="limits">Limites</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="results">Resultados</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    {feature.icon}
                    <Badge variant="secondary">{feature.status}</Badge>
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                Fluxo de Processamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <h4 className="font-semibold">Verificação de Limites</h4>
                    <p className="text-sm text-gray-600">Validação dos limites de upload baseados no tipo de usuário</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <div>
                    <h4 className="font-semibold">Escaneamento de Vírus</h4>
                    <p className="text-sm text-gray-600">Análise completa do arquivo para detectar ameaças</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <div>
                    <h4 className="font-semibold">Processamento de Imagem</h4>
                    <p className="text-sm text-gray-600">Otimização, redimensionamento e conversão de formato</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                  <div>
                    <h4 className="font-semibold">Cache e Armazenamento</h4>
                    <p className="text-sm text-gray-600">Armazenamento otimizado com cache inteligente</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-teal-500 text-white rounded-full flex items-center justify-center text-sm font-bold">5</div>
                  <div>
                    <h4 className="font-semibold">Rastreamento</h4>
                    <p className="text-sm text-gray-600">Registro completo no banco de dados para auditoria</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="limits" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Limites por Tipo de Usuário</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(userLimits).map(([userType, limits]) => (
                  <Card key={userType} className={user?.userType === userType ? 'ring-2 ring-blue-500' : ''}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg capitalize">{userType}</CardTitle>
                        {user?.userType === userType && (
                          <Badge variant="default">Seu Plano</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Diário:</span>
                        <span className="font-medium">{limits.daily} uploads</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Mensal:</span>
                        <span className="font-medium">{limits.monthly} uploads</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Tamanho máximo:</span>
                        <span className="font-medium">{limits.maxFileSize}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Armazenamento:</span>
                        <span className="font-medium">{limits.maxTotalSize}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload para Categorias</CardTitle>
              </CardHeader>
              <CardContent>
                <AdvancedUpload
                  category="categories"
                  onUploadSuccess={handleUploadSuccess('categories')}
                  maxWidth={400}
                  maxHeight={300}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upload para Serviços</CardTitle>
              </CardHeader>
              <CardContent>
                <AdvancedUpload
                  category="services"
                  onUploadSuccess={handleUploadSuccess('services')}
                  maxWidth={600}
                  maxHeight={400}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upload para Prestadores</CardTitle>
              </CardHeader>
              <CardContent>
                <AdvancedUpload
                  category="providers"
                  onUploadSuccess={handleUploadSuccess('providers')}
                  maxWidth={300}
                  maxHeight={300}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upload de Avatar</CardTitle>
              </CardHeader>
              <CardContent>
                <AdvancedUpload
                  category="avatars"
                  onUploadSuccess={handleUploadSuccess('avatars')}
                  maxWidth={200}
                  maxHeight={200}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Imagens Enviadas Nesta Sessão</CardTitle>
            </CardHeader>
            <CardContent>
              {uploadedImages.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Nenhuma imagem enviada ainda. Use a aba "Upload" para testar o sistema.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {uploadedImages.map((image, index) => (
                    <Card key={index} className="overflow-hidden">
                      <div className="aspect-video bg-gray-100">
                        <img
                          src={image.url}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <CardContent className="p-4">
                        <Badge variant="outline">{image.category}</Badge>
                        <p className="text-sm text-gray-600 mt-2">
                          ID: {image.id}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}