import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Settings, Save, RefreshCw, FileText, Home, Globe, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { ModernAdminLayout } from '@/components/layout/modern-admin-layout';

interface PageSetting {
  id: number;
  key: string;
  value: string;
  type: string;
  description?: string;
  isSystem: boolean;
  updatedAt: string;
}

export default function AdminPageSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [pageSettings, setPageSettings] = useState({
    homeTitle: "Qserviços - Sua Plataforma de Serviços",
    homeDescription: "Encontre os melhores profissionais para seus serviços",
    homeKeywords: "serviços, profissionais, manutenção, limpeza, beleza",
    aboutTitle: "Sobre Nós - Qserviços",
    aboutDescription: "Conheça a história da Qserviços e nossa missão",
    contactTitle: "Contato - Qserviços", 
    contactDescription: "Entre em contato conosco através dos nossos canais",
    privacyTitle: "Política de Privacidade - Qserviços",
    termsTitle: "Termos de Uso - Qserviços",
    favicon: "",
    logo: "",
    ogImage: "",
    enableSEO: true,
    enableAnalytics: false,
    analyticsId: "",
    footerText: "© 2024 Qserviços. Todos os direitos reservados.",
    footerLinks: {
      about: "/sobre",
      contact: "/contato", 
      privacy: "/privacidade",
      terms: "/termos"
    }
  });

  // Query to fetch page settings
  const { data: settings = [], isLoading: settingsLoading } = useQuery({
    queryKey: ['/api/admin/page-settings'],
    enabled: !!user && user.userType === 'admin'
  });

  // Mutation to save page settings
  const savePageSettingMutation = useMutation({
    mutationFn: async (data: { key: string; value: string; description?: string }) => {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      const response = await fetch('/api/admin/page-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          key: data.key,
          value: data.value,
          type: 'string',
          description: data.description
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
        throw new Error(errorData.message || 'Failed to save page setting');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/page-settings'] });
      toast({
        title: "Configurações salvas",
        description: "As configurações da página foram atualizadas com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar",
        description: error?.message || "Ocorreu um erro ao salvar as configurações da página.",
        variant: "destructive",
      });
    }
  });

  const handleSavePageSettings = () => {
    // Save all page settings
    Object.entries(pageSettings).forEach(([key, value]) => {
      if (typeof value === 'object') {
        savePageSettingMutation.mutate({
          key,
          value: JSON.stringify(value),
          description: `Configuração de ${key}`
        });
      } else {
        savePageSettingMutation.mutate({
          key,
          value: value.toString(),
          description: `Configuração de ${key}`
        });
      }
    });
  };

  if (!user || user.userType !== 'admin') {
    window.location.href = '/';
    return null;
  }

  if (settingsLoading) {
    return (
      <ModernAdminLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando configurações...</p>
          </div>
        </div>
      </ModernAdminLayout>
    );
  }

  return (
    <ModernAdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Configuração da Página</h1>
            <p className="text-muted-foreground">Configure as informações das páginas do site</p>
          </div>
        </div>

        <Tabs defaultValue="seo" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="seo">SEO & Meta Tags</TabsTrigger>
            <TabsTrigger value="branding">Marca & Identidade</TabsTrigger>
            <TabsTrigger value="footer">Rodapé</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="seo" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Configurações de SEO
                </CardTitle>
                <CardDescription>
                  Configure as meta tags e informações para otimização em mecanismos de busca
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="home-title">Título da Página Inicial</Label>
                    <Input
                      id="home-title"
                      value={pageSettings.homeTitle}
                      onChange={(e) => setPageSettings({ ...pageSettings, homeTitle: e.target.value })}
                      placeholder="Qserviços - Sua Plataforma de Serviços"
                    />
                  </div>
                  <div>
                    <Label htmlFor="home-description">Descrição da Página Inicial</Label>
                    <Textarea
                      id="home-description"
                      value={pageSettings.homeDescription}
                      onChange={(e) => setPageSettings({ ...pageSettings, homeDescription: e.target.value })}
                      placeholder="Encontre os melhores profissionais para seus serviços"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="home-keywords">Palavras-chave (separadas por vírgula)</Label>
                    <Input
                      id="home-keywords"
                      value={pageSettings.homeKeywords}
                      onChange={(e) => setPageSettings({ ...pageSettings, homeKeywords: e.target.value })}
                      placeholder="serviços, profissionais, manutenção, limpeza, beleza"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="about-title">Título da Página Sobre</Label>
                    <Input
                      id="about-title"
                      value={pageSettings.aboutTitle}
                      onChange={(e) => setPageSettings({ ...pageSettings, aboutTitle: e.target.value })}
                      placeholder="Sobre Nós - Qserviços"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact-title">Título da Página Contato</Label>
                    <Input
                      id="contact-title"
                      value={pageSettings.contactTitle}
                      onChange={(e) => setPageSettings({ ...pageSettings, contactTitle: e.target.value })}
                      placeholder="Contato - Qserviços"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch 
                    id="enable-seo"
                    checked={pageSettings.enableSEO}
                    onCheckedChange={(checked) => setPageSettings({ ...pageSettings, enableSEO: checked })}
                  />
                  <Label htmlFor="enable-seo">Habilitar otimizações de SEO</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branding" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Marca e Identidade Visual
                </CardTitle>
                <CardDescription>
                  Configure logo, favicon e imagens da sua plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="logo">URL do Logo</Label>
                  <Input
                    id="logo"
                    value={pageSettings.logo}
                    onChange={(e) => setPageSettings({ ...pageSettings, logo: e.target.value })}
                    placeholder="/assets/logo.png"
                  />
                </div>
                <div>
                  <Label htmlFor="favicon">URL do Favicon</Label>
                  <Input
                    id="favicon"
                    value={pageSettings.favicon}
                    onChange={(e) => setPageSettings({ ...pageSettings, favicon: e.target.value })}
                    placeholder="/assets/favicon.ico"
                  />
                </div>
                <div>
                  <Label htmlFor="og-image">Imagem para Compartilhamento (Open Graph)</Label>
                  <Input
                    id="og-image"
                    value={pageSettings.ogImage}
                    onChange={(e) => setPageSettings({ ...pageSettings, ogImage: e.target.value })}
                    placeholder="/assets/og-image.png"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Imagem exibida ao compartilhar links nas redes sociais (recomendado: 1200x630px)
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="footer" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Configurações do Rodapé
                </CardTitle>
                <CardDescription>
                  Configure o texto e links do rodapé do site
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="footer-text">Texto do Rodapé</Label>
                  <Input
                    id="footer-text"
                    value={pageSettings.footerText}
                    onChange={(e) => setPageSettings({ ...pageSettings, footerText: e.target.value })}
                    placeholder="© 2024 Qserviços. Todos os direitos reservados."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="about-link">Link da Página Sobre</Label>
                    <Input
                      id="about-link"
                      value={pageSettings.footerLinks.about}
                      onChange={(e) => setPageSettings({ 
                        ...pageSettings, 
                        footerLinks: { ...pageSettings.footerLinks, about: e.target.value }
                      })}
                      placeholder="/sobre"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact-link">Link da Página Contato</Label>
                    <Input
                      id="contact-link"
                      value={pageSettings.footerLinks.contact}
                      onChange={(e) => setPageSettings({ 
                        ...pageSettings, 
                        footerLinks: { ...pageSettings.footerLinks, contact: e.target.value }
                      })}
                      placeholder="/contato"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="privacy-link">Link Política de Privacidade</Label>
                    <Input
                      id="privacy-link"
                      value={pageSettings.footerLinks.privacy}
                      onChange={(e) => setPageSettings({ 
                        ...pageSettings, 
                        footerLinks: { ...pageSettings.footerLinks, privacy: e.target.value }
                      })}
                      placeholder="/privacidade"
                    />
                  </div>
                  <div>
                    <Label htmlFor="terms-link">Link Termos de Uso</Label>
                    <Input
                      id="terms-link"
                      value={pageSettings.footerLinks.terms}
                      onChange={(e) => setPageSettings({ 
                        ...pageSettings, 
                        footerLinks: { ...pageSettings.footerLinks, terms: e.target.value }
                      })}
                      placeholder="/termos"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Analytics e Monitoramento
                </CardTitle>
                <CardDescription>
                  Configure ferramentas de análise e monitoramento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="enable-analytics"
                    checked={pageSettings.enableAnalytics}
                    onCheckedChange={(checked) => setPageSettings({ ...pageSettings, enableAnalytics: checked })}
                  />
                  <Label htmlFor="enable-analytics">Habilitar Google Analytics</Label>
                </div>

                {pageSettings.enableAnalytics && (
                  <div>
                    <Label htmlFor="analytics-id">ID do Google Analytics</Label>
                    <Input
                      id="analytics-id"
                      value={pageSettings.analyticsId}
                      onChange={(e) => setPageSettings({ ...pageSettings, analyticsId: e.target.value })}
                      placeholder="GA-XXXXXXXXX-X"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2">
          <Button 
            onClick={handleSavePageSettings}
            disabled={savePageSettingMutation.isPending}
            className="flex items-center gap-2"
          >
            {savePageSettingMutation.isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar Configurações da Página
          </Button>
        </div>
      </div>
    </ModernAdminLayout>
  );
}