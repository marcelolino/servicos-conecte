import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Share2, Save, RefreshCw, Facebook, Twitter, Instagram, Linkedin, Youtube, MessageCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Switch } from '@/components/ui/switch';
import { ModernAdminLayout } from '@/components/layout/modern-admin-layout';
import { SiFacebook, SiX, SiInstagram, SiLinkedin, SiYoutube, SiWhatsapp, SiTelegram, SiTiktok } from 'react-icons/si';

interface SocialSetting {
  id: number;
  key: string;
  value: string;
  type: string;
  description?: string;
  isSystem: boolean;
  updatedAt: string;
}

export default function AdminSocialSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [socialSettings, setSocialSettings] = useState({
    facebook: "",
    twitter: "",
    instagram: "",
    linkedin: "",
    youtube: "",
    whatsapp: "",
    telegram: "",
    tiktok: "",
    enableSocialShare: true,
    showInFooter: true,
    showInHeader: false,
    socialMessage: "Siga-nos nas redes sociais",
    footerMessage: "Conecte-se conosco"
  });

  // Query to fetch social settings
  const { data: settings = [], isLoading: settingsLoading } = useQuery({
    queryKey: ['/api/admin/social-settings'],
    enabled: !!user && user.userType === 'admin'
  });

  // Mutation to save social settings
  const saveSocialSettingMutation = useMutation({
    mutationFn: async (data: { key: string; value: string; description?: string }) => {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      const response = await fetch('/api/admin/social-settings', {
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
        throw new Error(errorData.message || 'Failed to save social setting');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/social-settings'] });
      toast({
        title: "Configurações salvas",
        description: "As configurações de redes sociais foram atualizadas com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar",
        description: error?.message || "Ocorreu um erro ao salvar as configurações de redes sociais.",
        variant: "destructive",
      });
    }
  });

  const handleSaveSocialSettings = () => {
    // Save all social settings
    Object.entries(socialSettings).forEach(([key, value]) => {
      if (typeof value === 'object') {
        saveSocialSettingMutation.mutate({
          key,
          value: JSON.stringify(value),
          description: `Configuração de redes sociais: ${key}`
        });
      } else {
        saveSocialSettingMutation.mutate({
          key,
          value: value.toString(),
          description: `Configuração de redes sociais: ${key}`
        });
      }
    });
  };

  const socialPlatforms = [
    { key: 'facebook', label: 'Facebook', icon: SiFacebook, placeholder: 'https://facebook.com/suaempresa', color: '#1877F2' },
    { key: 'twitter', label: 'Twitter/X', icon: SiX, placeholder: 'https://twitter.com/suaempresa', color: '#1DA1F2' },
    { key: 'instagram', label: 'Instagram', icon: SiInstagram, placeholder: 'https://instagram.com/suaempresa', color: '#E4405F' },
    { key: 'linkedin', label: 'LinkedIn', icon: SiLinkedin, placeholder: 'https://linkedin.com/company/suaempresa', color: '#0077B5' },
    { key: 'youtube', label: 'YouTube', icon: SiYoutube, placeholder: 'https://youtube.com/suaempresa', color: '#FF0000' },
    { key: 'whatsapp', label: 'WhatsApp', icon: SiWhatsapp, placeholder: 'https://wa.me/5511999999999', color: '#25D366' },
    { key: 'telegram', label: 'Telegram', icon: SiTelegram, placeholder: 'https://t.me/suaempresa', color: '#0088CC' },
    { key: 'tiktok', label: 'TikTok', icon: SiTiktok, placeholder: 'https://tiktok.com/@suaempresa', color: '#000000' }
  ];

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
          <Share2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Configurações de Redes Sociais</h1>
            <p className="text-muted-foreground">Configure os links das redes sociais para o rodapé e outras áreas do site</p>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Social Media Links */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Links das Redes Sociais
              </CardTitle>
              <CardDescription>
                Configure os URLs das suas redes sociais. Deixe em branco para ocultar a rede social.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {socialPlatforms.map((platform) => {
                  const IconComponent = platform.icon;
                  return (
                    <div key={platform.key} className="space-y-2">
                      <Label htmlFor={platform.key} className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" style={{ color: platform.color }} />
                        {platform.label}
                      </Label>
                      <Input
                        id={platform.key}
                        type="url"
                        value={socialSettings[platform.key as keyof typeof socialSettings] as string}
                        onChange={(e) => setSocialSettings({ 
                          ...socialSettings, 
                          [platform.key]: e.target.value 
                        })}
                        placeholder={platform.placeholder}
                        className="w-full"
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Display Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Configurações de Exibição
              </CardTitle>
              <CardDescription>
                Configure onde e como as redes sociais serão exibidas no site
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="show-footer"
                    checked={socialSettings.showInFooter}
                    onCheckedChange={(checked) => setSocialSettings({ ...socialSettings, showInFooter: checked })}
                  />
                  <Label htmlFor="show-footer">Exibir ícones das redes sociais no rodapé</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch 
                    id="show-header"
                    checked={socialSettings.showInHeader}
                    onCheckedChange={(checked) => setSocialSettings({ ...socialSettings, showInHeader: checked })}
                  />
                  <Label htmlFor="show-header">Exibir ícones das redes sociais no cabeçalho</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch 
                    id="enable-social-share"
                    checked={socialSettings.enableSocialShare}
                    onCheckedChange={(checked) => setSocialSettings({ ...socialSettings, enableSocialShare: checked })}
                  />
                  <Label htmlFor="enable-social-share">Habilitar botões de compartilhamento social</Label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="social-message">Mensagem das redes sociais</Label>
                  <Input
                    id="social-message"
                    value={socialSettings.socialMessage}
                    onChange={(e) => setSocialSettings({ ...socialSettings, socialMessage: e.target.value })}
                    placeholder="Siga-nos nas redes sociais"
                  />
                </div>
                <div>
                  <Label htmlFor="footer-message">Mensagem do rodapé</Label>
                  <Input
                    id="footer-message"
                    value={socialSettings.footerMessage}
                    onChange={(e) => setSocialSettings({ ...socialSettings, footerMessage: e.target.value })}
                    placeholder="Conecte-se conosco"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Prévia do Rodapé</CardTitle>
              <CardDescription>
                Veja como os ícones das redes sociais aparecerão no rodapé
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                <div className="text-center space-y-3">
                  <p className="text-sm text-muted-foreground">{socialSettings.footerMessage}</p>
                  <div className="flex justify-center gap-3">
                    {socialPlatforms.map((platform) => {
                      const IconComponent = platform.icon;
                      const hasLink = socialSettings[platform.key as keyof typeof socialSettings];
                      
                      if (!hasLink) return null;
                      
                      return (
                        <div 
                          key={platform.key}
                          className="p-2 rounded-full bg-white dark:bg-gray-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        >
                          <IconComponent 
                            className="h-5 w-5" 
                            style={{ color: platform.color }} 
                          />
                        </div>
                      );
                    })}
                  </div>
                  {!socialPlatforms.some(platform => socialSettings[platform.key as keyof typeof socialSettings]) && (
                    <p className="text-xs text-muted-foreground italic">
                      Nenhuma rede social configurada
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleSaveSocialSettings}
            disabled={saveSocialSettingMutation.isPending}
            className="flex items-center gap-2"
          >
            {saveSocialSettingMutation.isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar Configurações de Redes Sociais
          </Button>
        </div>
      </div>
    </ModernAdminLayout>
  );
}