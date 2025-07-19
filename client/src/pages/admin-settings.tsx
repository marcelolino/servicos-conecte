import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Settings, Percent, Save, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

interface SystemSetting {
  id: number;
  key: string;
  value: string;
  type: string;
  description?: string;
  isSystem: boolean;
  updatedAt: string;
}

export default function AdminSettings() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [commissionRate, setCommissionRate] = useState('');

  // Query to fetch system settings - must be called before any conditional returns
  const { data: settings = [], isLoading: settingsLoading } = useQuery({
    queryKey: ['/api/admin/settings'],
    enabled: !!user && user.userType === 'admin'
  });

  // Mutation to save settings
  const saveSettingMutation = useMutation({
    mutationFn: async (data: { key: string; value: string; description?: string }) => {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          key: data.key,
          value: data.value,
          type: 'number',
          description: data.description
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save setting');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      toast({
        title: "Configuração salva",
        description: "As configurações foram atualizadas com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive"
      });
      console.error('Error saving setting:', error);
    }
  });

  // Get commission rate from settings
  const commissionSetting = settings.find((s: SystemSetting) => s.key === 'commission_rate');
  
  // Initialize commission rate value
  useEffect(() => {
    if (commissionSetting) {
      setCommissionRate(commissionSetting.value);
    }
  }, [commissionSetting]);

  const handleSaveCommission = () => {
    const rate = parseFloat(commissionRate);
    
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast({
        title: "Valor inválido",
        description: "A taxa de comissão deve ser um número entre 0 e 100.",
        variant: "destructive"
      });
      return;
    }

    saveSettingMutation.mutate({
      key: 'commission_rate',
      value: rate.toString(),
      description: 'Taxa de comissão padrão no pedido em porcentagem (%)'
    });
  };

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Redirect if not admin
  if (!user || user.userType !== 'admin') {
    window.location.href = '/';
    return null;
  }

  if (settingsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
            <p className="text-muted-foreground">Carregando configurações...</p>
          </div>
        </div>
        <div className="flex items-center justify-center min-h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
            <p className="text-muted-foreground">
              Gerencie as configurações gerais da plataforma
            </p>
          </div>
        </div>

        <Tabs defaultValue="commission" className="w-full">
          <TabsList>
            <TabsTrigger value="commission">Comissão</TabsTrigger>
            <TabsTrigger value="general">Gerais</TabsTrigger>
          </TabsList>

          <TabsContent value="commission" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="h-5 w-5" />
                  Taxa de Comissão
                </CardTitle>
                <CardDescription>
                  Configure a taxa de comissão padrão que será descontada dos prestadores de serviço em cada pedido
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="commission-rate">
                    Taxa de comissão padrão no pedido em porcentagem (%)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="commission-rate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={commissionRate}
                      onChange={(e) => setCommissionRate(e.target.value)}
                      placeholder="Ex: 5.0"
                      className="max-w-[200px]"
                    />
                    <span className="flex items-center text-muted-foreground">%</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Insira um valor entre 0 e 100. Esta porcentagem será descontada do valor que o prestador recebe.
                  </p>
                </div>

                {commissionSetting && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Valor atual:</strong> {commissionSetting.value}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Última atualização: {new Date(commissionSetting.updatedAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    onClick={handleSaveCommission}
                    disabled={saveSettingMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    {saveSettingMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Salvar Taxa de Comissão
                  </Button>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Como funciona:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• A taxa é aplicada automaticamente em todos os novos pedidos</li>
                    <li>• O valor é descontado do pagamento ao prestador</li>
                    <li>• Exemplo: Serviço de R$ 100 com taxa de 5% = Prestador recebe R$ 95</li>
                    <li>• A plataforma fica com R$ 5 de comissão</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações Gerais</CardTitle>
                <CardDescription>
                  Outras configurações do sistema serão adicionadas aqui conforme necessário
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Outras configurações serão adicionadas aqui em futuras versões</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}