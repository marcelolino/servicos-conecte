import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Save, Facebook, Instagram, Twitter, Linkedin, Youtube, MessageCircle } from "lucide-react";
import { ModernAdminLayout } from "@/components/layout/modern-admin-layout";

interface SocialSettings {
  facebook: string;
  instagram: string;
  twitter: string;
  linkedin: string;
  youtube: string;
  whatsapp: string;
}

export function AdminSocialSettings() {
  const [settings, setSettings] = useState<SocialSettings>({
    facebook: "",
    instagram: "",
    twitter: "",
    linkedin: "",
    youtube: "",
    whatsapp: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/admin/social-settings");
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error("Erro ao carregar configurações sociais:", error);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/social-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast({
          title: "Configurações salvas",
          description: "Os links das redes sociais foram atualizados com sucesso.",
        });
      } else {
        throw new Error("Erro ao salvar configurações sociais");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações das redes sociais.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof SocialSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const socialNetworks = [
    {
      key: "facebook" as keyof SocialSettings,
      label: "Facebook",
      icon: Facebook,
      placeholder: "https://facebook.com/suapagina",
      description: "Link para a página do Facebook da empresa",
    },
    {
      key: "instagram" as keyof SocialSettings,
      label: "Instagram",
      icon: Instagram,
      placeholder: "https://instagram.com/seuinstagram",
      description: "Link para o perfil do Instagram da empresa",
    },
    {
      key: "twitter" as keyof SocialSettings,
      label: "Twitter/X",
      icon: Twitter,
      placeholder: "https://twitter.com/seutwitter",
      description: "Link para o perfil do Twitter/X da empresa",
    },
    {
      key: "linkedin" as keyof SocialSettings,
      label: "LinkedIn",
      icon: Linkedin,
      placeholder: "https://linkedin.com/company/suaempresa",
      description: "Link para a página da empresa no LinkedIn",
    },
    {
      key: "youtube" as keyof SocialSettings,
      label: "YouTube",
      icon: Youtube,
      placeholder: "https://youtube.com/@seucanal",
      description: "Link para o canal do YouTube da empresa",
    },
    {
      key: "whatsapp" as keyof SocialSettings,
      label: "WhatsApp",
      icon: MessageCircle,
      placeholder: "https://wa.me/5511999999999",
      description: "Link do WhatsApp Business para contato direto",
    },
  ];

  return (
    <ModernAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Configurações de Redes Sociais</h1>
          <p className="text-muted-foreground">
            Configure os links das redes sociais que aparecerão no site e rodapé.
          </p>
        </div>

        <Card>
        <CardHeader>
          <CardTitle>Links das Redes Sociais</CardTitle>
          <CardDescription>
            Adicione os links das redes sociais da sua empresa. Deixe em branco para não exibir.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6">
            {socialNetworks.map((network) => {
              const Icon = network.icon;
              return (
                <div key={network.key} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <Label htmlFor={network.key} className="text-base font-medium">
                      {network.label}
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {network.description}
                  </p>
                  <Input
                    id={network.key}
                    type="url"
                    value={settings[network.key]}
                    onChange={(e) => handleInputChange(network.key, e.target.value)}
                    placeholder={network.placeholder}
                    className="max-w-lg"
                  />
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Pré-visualização</h3>
                <p className="text-sm text-muted-foreground">
                  Redes sociais configuradas aparecerão como ícones clicáveis no site.
                </p>
              </div>
              <div className="flex gap-3">
                {socialNetworks.map((network) => {
                  const Icon = network.icon;
                  const isActive = settings[network.key].trim() !== "";
                  return (
                    <div
                      key={network.key}
                      className={`p-2 rounded-full transition-colors ${
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                      title={isActive ? `${network.label}: Configurado` : `${network.label}: Não configurado`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </ModernAdminLayout>
  );
}