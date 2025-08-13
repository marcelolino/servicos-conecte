import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Save, Upload, Eye, BarChart3, Palette } from "lucide-react";
import { ModernAdminLayout } from "@/components/layout/modern-admin-layout";

interface PageSettings {
  siteName: string;
  siteDescription: string;
  siteLogo: string;
  primaryColor: string;
  secondaryColor: string;
  footerText: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  analyticsId: string;
  enableAnalytics: boolean;
}

export function AdminPageSettings() {
  const [settings, setSettings] = useState<PageSettings>({
    siteName: "Qserviços",
    siteDescription: "Plataforma de marketplace de serviços",
    siteLogo: "",
    primaryColor: "#0ea5e9",
    secondaryColor: "#64748b",
    footerText: "© 2024 Qserviços. Todos os direitos reservados.",
    seoTitle: "Qserviços - Marketplace de Serviços",
    seoDescription: "Conecte-se com prestadores de serviços qualificados em sua região",
    seoKeywords: "serviços, marketplace, prestadores, profissionais",
    analyticsId: "",
    enableAnalytics: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { apiRequest } = await import("@/lib/queryClient");
      const data = await apiRequest("GET", "/api/admin/page-settings");
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const { apiRequest } = await import("@/lib/queryClient");
      const response = await apiRequest("PUT", "/api/admin/page-settings", settings);

      if (response.success) {
        toast({
          title: "Configurações salvas",
          description: "As configurações da página foram atualizadas com sucesso.",
        });
      } else {
        throw new Error("Erro ao salvar configurações");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof PageSettings, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <ModernAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Configurações da Página</h1>
          <p className="text-muted-foreground">
            Configure informações gerais, SEO, identidade visual e analytics da plataforma.
          </p>
        </div>

        <div className="grid gap-6">
        {/* Informações Gerais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Informações Gerais
            </CardTitle>
            <CardDescription>
              Configure as informações básicas que aparecerão no site.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="siteName">Nome do Site</Label>
                <Input
                  id="siteName"
                  value={settings.siteName}
                  onChange={(e) => handleInputChange("siteName", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="siteLogo">URL do Logo</Label>
                <div className="flex gap-2">
                  <Input
                    id="siteLogo"
                    value={settings.siteLogo}
                    onChange={(e) => handleInputChange("siteLogo", e.target.value)}
                    placeholder="https://exemplo.com/logo.png"
                  />
                  <Button variant="outline" size="icon">
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="siteDescription">Descrição do Site</Label>
              <Textarea
                id="siteDescription"
                value={settings.siteDescription}
                onChange={(e) => handleInputChange("siteDescription", e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Identidade Visual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Identidade Visual
            </CardTitle>
            <CardDescription>
              Configure as cores e elementos visuais da plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="primaryColor">Cor Primária</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => handleInputChange("primaryColor", e.target.value)}
                    className="w-16 h-10"
                  />
                  <Input
                    value={settings.primaryColor}
                    onChange={(e) => handleInputChange("primaryColor", e.target.value)}
                    placeholder="#0ea5e9"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="secondaryColor">Cor Secundária</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={settings.secondaryColor}
                    onChange={(e) => handleInputChange("secondaryColor", e.target.value)}
                    className="w-16 h-10"
                  />
                  <Input
                    value={settings.secondaryColor}
                    onChange={(e) => handleInputChange("secondaryColor", e.target.value)}
                    placeholder="#64748b"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SEO */}
        <Card>
          <CardHeader>
            <CardTitle>SEO e Metadados</CardTitle>
            <CardDescription>
              Configure as informações para otimização de mecanismos de busca.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="seoTitle">Título SEO</Label>
              <Input
                id="seoTitle"
                value={settings.seoTitle}
                onChange={(e) => handleInputChange("seoTitle", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="seoDescription">Descrição SEO</Label>
              <Textarea
                id="seoDescription"
                value={settings.seoDescription}
                onChange={(e) => handleInputChange("seoDescription", e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="seoKeywords">Palavras-chave (separadas por vírgula)</Label>
              <Input
                id="seoKeywords"
                value={settings.seoKeywords}
                onChange={(e) => handleInputChange("seoKeywords", e.target.value)}
                placeholder="serviços, marketplace, profissionais"
              />
            </div>
          </CardContent>
        </Card>

        {/* Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analytics
            </CardTitle>
            <CardDescription>
              Configure o Google Analytics para acompanhar o desempenho do site.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="enableAnalytics"
                checked={settings.enableAnalytics}
                onCheckedChange={(checked) => handleInputChange("enableAnalytics", checked)}
              />
              <Label htmlFor="enableAnalytics">Habilitar Google Analytics</Label>
            </div>
            {settings.enableAnalytics && (
              <div>
                <Label htmlFor="analyticsId">ID do Google Analytics</Label>
                <Input
                  id="analyticsId"
                  value={settings.analyticsId}
                  onChange={(e) => handleInputChange("analyticsId", e.target.value)}
                  placeholder="G-XXXXXXXXXX"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rodapé */}
        <Card>
          <CardHeader>
            <CardTitle>Rodapé</CardTitle>
            <CardDescription>
              Configure o texto que aparecerá no rodapé do site.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="footerText">Texto do Rodapé</Label>
              <Textarea
                id="footerText"
                value={settings.footerText}
                onChange={(e) => handleInputChange("footerText", e.target.value)}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </div>
        </div>
      </div>
    </ModernAdminLayout>
  );
}