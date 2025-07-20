import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Settings, Percent, Save, RefreshCw, DollarSign, Clock, Shield, Building, Palette, Users, BarChart3, FileText, ImageIcon, Home, Cog } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useLocation } from 'wouter';

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
  const [, setLocation] = useLocation();
  const [commissionRate, setCommissionRate] = useState('');
  const [companySettings, setCompanySettings] = useState({
    name: "Qserviços",
    description: "Plataforma de serviços sob demanda",
    address: "",
    city: "",
    state: "",
    cep: "",
    phone: "",
    email: "",
    website: "",
    logo: "",
    primaryColor: "#3B82F6",
    secondaryColor: "#6B7280",
    currency: "BRL",
    timezone: "America/Sao_Paulo",
    workingHours: {
      monday: { start: "08:00", end: "18:00", active: true },
      tuesday: { start: "08:00", end: "18:00", active: true },
      wednesday: { start: "08:00", end: "18:00", active: true },
      thursday: { start: "08:00", end: "18:00", active: true },
      friday: { start: "08:00", end: "18:00", active: true },
      saturday: { start: "08:00", end: "12:00", active: true },
      sunday: { start: "08:00", end: "12:00", active: false },
    },
    features: {
      emailNotifications: true,
      smsNotifications: false,
      automaticApproval: false,
      requireVerification: true,
      allowCancellation: true,
      allowReschedule: true,
    },
    paymentMethods: {
      creditCard: true,
      debitCard: true,
      pix: true,
      cash: true,
      bankTransfer: false,
    },
    cancellationPolicy: "24",
    reschedulePolicy: "12",
  });

  // Query to fetch system settings - must be called before any conditional returns
  const { data: settings = [], isLoading: settingsLoading } = useQuery({
    queryKey: ['/api/admin/settings'],
    enabled: !!user && user.userType === 'admin'
  });

  // Mutation to save settings
  const saveSettingMutation = useMutation({
    mutationFn: async (data: { key: string; value: string; description?: string }) => {
      // Get token from the correct localStorage key
      const token = localStorage.getItem('authToken');
      
      console.log('Token status:', token ? 'found' : 'not found');
      
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          key: data.key,
          value: data.value,
          type: 'number',
          description: data.description
        })
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
        console.error('Error response:', errorData);
        throw new Error(errorData.message || 'Failed to save setting');
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
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r border-gray-200 fixed h-full overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Admin Panel</h2>
              <p className="text-sm text-gray-500">Painel</p>
            </div>
          </div>
        </div>
        
        <nav className="p-4 space-y-2">
          <Button 
            variant="ghost" 
            className="w-full justify-start"
            onClick={() => setLocation('/admin-dashboard')}
          >
            <Home className="h-4 w-4 mr-3" />
            Dashboard
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start text-gray-500"
            onClick={() => setLocation('/admin-dashboard?section=providers')}
          >
            <Users className="h-4 w-4 mr-3" />
            Prestadores
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start text-gray-500"
            onClick={() => setLocation('/admin-dashboard?section=services')}
          >
            <FileText className="h-4 w-4 mr-3" />
            Serviços
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start text-gray-500"
            onClick={() => setLocation('/admin-dashboard?section=bookings')}
          >
            <BarChart3 className="h-4 w-4 mr-3" />
            Agendamentos
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start text-gray-500"
            onClick={() => setLocation('/admin-dashboard?section=categories')}
          >
            <Users className="h-4 w-4 mr-3" />
            Categorias
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start text-gray-500"
            onClick={() => setLocation('/admin-dashboard?section=media')}
          >
            <ImageIcon className="h-4 w-4 mr-3" />
            Mídia
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start text-gray-500"
            onClick={() => setLocation('/admin-dashboard?section=users')}
          >
            <Users className="h-4 w-4 mr-3" />
            Usuários
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start text-gray-500"
            onClick={() => setLocation('/admin-dashboard?section=reports')}
          >
            <BarChart3 className="h-4 w-4 mr-3" />
            Relatórios
          </Button>
          
          <Button variant="ghost" className="w-full justify-start bg-blue-50 text-blue-600">
            <Cog className="h-4 w-4 mr-3" />
            Configurações
          </Button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64">
        <div className="p-6">
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

        <Tabs defaultValue="comissao" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="comissao">Comissão</TabsTrigger>
            <TabsTrigger value="empresa">Empresa</TabsTrigger>
            <TabsTrigger value="aparencia">Aparência</TabsTrigger>
            <TabsTrigger value="horarios">Horários</TabsTrigger>
            <TabsTrigger value="funcionalidades">Funcionalidades</TabsTrigger>
            <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
          </TabsList>

          <TabsContent value="comissao" className="space-y-6">
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

              <TabsContent value="empresa" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Empresa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company-name">Nome da Empresa</Label>
                    <Input
                      id="company-name"
                      value={companySettings.name}
                      onChange={(e) => setCompanySettings({ ...companySettings, name: e.target.value })}
                      placeholder="Ex: Qserviços Ltda"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company-email">Email</Label>
                    <Input
                      id="company-email"
                      type="email"
                      value={companySettings.email}
                      onChange={(e) => setCompanySettings({ ...companySettings, email: e.target.value })}
                      placeholder="contato@qservicos.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company-phone">Telefone</Label>
                    <Input
                      id="company-phone"
                      value={companySettings.phone}
                      onChange={(e) => setCompanySettings({ ...companySettings, phone: e.target.value })}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company-website">Website</Label>
                    <Input
                      id="company-website"
                      value={companySettings.website}
                      onChange={(e) => setCompanySettings({ ...companySettings, website: e.target.value })}
                      placeholder="https://qservicos.com"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="company-description">Descrição da Empresa</Label>
                  <Textarea
                    id="company-description"
                    value={companySettings.description}
                    onChange={(e) => setCompanySettings({ ...companySettings, description: e.target.value })}
                    placeholder="Descreva sua empresa..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="company-address">Endereço</Label>
                    <Input
                      id="company-address"
                      value={companySettings.address}
                      onChange={(e) => setCompanySettings({ ...companySettings, address: e.target.value })}
                      placeholder="Rua da Empresa, 123"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company-city">Cidade</Label>
                    <Input
                      id="company-city"
                      value={companySettings.city}
                      onChange={(e) => setCompanySettings({ ...companySettings, city: e.target.value })}
                      placeholder="São Paulo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company-state">Estado</Label>
                    <Input
                      id="company-state"
                      value={companySettings.state}
                      onChange={(e) => setCompanySettings({ ...companySettings, state: e.target.value })}
                      placeholder="SP"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company-cep">CEP</Label>
                    <Input
                      id="company-cep"
                      value={companySettings.cep}
                      onChange={(e) => setCompanySettings({ ...companySettings, cep: e.target.value })}
                      placeholder="01234-567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="commission-rate">Taxa de Comissão (%)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="commission-rate"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={commissionRate}
                        onChange={(e) => setCommissionRate(e.target.value)}
                        placeholder="5"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company-currency">Moeda</Label>
                    <Input
                      id="company-currency"
                      value={companySettings.currency}
                      onChange={(e) => setCompanySettings({ ...companySettings, currency: e.target.value })}
                      placeholder="Real (BRL)"
                    />
                  </div>
                </div>

                <Button className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Configurações da Empresa
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="aparencia" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Aparência e Branding</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primary-color">Cor Primária</Label>
                    <div className="flex gap-2">
                      <div 
                        className="w-10 h-10 rounded border"
                        style={{ backgroundColor: companySettings.primaryColor }}
                      />
                      <Input
                        id="primary-color"
                        type="color"
                        value={companySettings.primaryColor}
                        onChange={(e) => setCompanySettings({ ...companySettings, primaryColor: e.target.value })}
                        className="w-20"
                      />
                      <span className="flex items-center text-sm text-muted-foreground">
                        {companySettings.primaryColor}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="secondary-color">Cor Secundária</Label>
                    <div className="flex gap-2">
                      <div 
                        className="w-10 h-10 rounded border"
                        style={{ backgroundColor: companySettings.secondaryColor }}
                      />
                      <Input
                        id="secondary-color"
                        type="color"
                        value={companySettings.secondaryColor}
                        onChange={(e) => setCompanySettings({ ...companySettings, secondaryColor: e.target.value })}
                        className="w-20"
                      />
                      <span className="flex items-center text-sm text-muted-foreground">
                        {companySettings.secondaryColor}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="logo-url">URL do Logo</Label>
                  <Input
                    id="logo-url"
                    value={companySettings.logo}
                    onChange={(e) => setCompanySettings({ ...companySettings, logo: e.target.value })}
                    placeholder="https://exemplo.com/logo.png"
                  />
                </div>

                <div>
                  <Label htmlFor="timezone">Fuso Horário</Label>
                  <Input
                    id="timezone"
                    value={companySettings.timezone}
                    onChange={(e) => setCompanySettings({ ...companySettings, timezone: e.target.value })}
                    placeholder="São Paulo (UTC-3)"
                  />
                </div>

                <Button className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Configurações de Aparência
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="horarios" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Horários de Funcionamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(companySettings.workingHours).map(([day, hours]) => (
                  <div key={day} className="flex items-center space-x-4 p-3 border rounded-lg">
                    <div className="flex items-center space-x-2 flex-1">
                      <Switch
                        checked={hours.active}
                        onCheckedChange={(checked) => setCompanySettings({
                          ...companySettings,
                          workingHours: {
                            ...companySettings.workingHours,
                            [day]: { ...hours, active: checked }
                          }
                        })}
                      />
                      <Label className="min-w-[80px]">
                        {day === 'monday' ? 'Segunda' :
                         day === 'tuesday' ? 'Terça' :
                         day === 'wednesday' ? 'Quarta' :
                         day === 'thursday' ? 'Quinta' :
                         day === 'friday' ? 'Sexta' :
                         day === 'saturday' ? 'Sábado' :
                         'Domingo'}
                      </Label>
                    </div>
                    
                    {hours.active && (
                      <div className="flex items-center space-x-2">
                        <Input
                          type="time"
                          value={hours.start}
                          onChange={(e) => setCompanySettings({
                            ...companySettings,
                            workingHours: {
                              ...companySettings.workingHours,
                              [day]: { ...hours, start: e.target.value }
                            }
                          })}
                          className="w-24"
                        />
                        <span>até</span>
                        <Input
                          type="time"
                          value={hours.end}
                          onChange={(e) => setCompanySettings({
                            ...companySettings,
                            workingHours: {
                              ...companySettings.workingHours,
                              [day]: { ...hours, end: e.target.value }
                            }
                          })}
                          className="w-24"
                        />
                      </div>
                    )}
                  </div>
                ))}

                <Button className="w-full">
                  <Clock className="h-4 w-4 mr-2" />
                  Salvar Horários de Funcionamento
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="funcionalidades" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Funcionalidades do Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(companySettings.features).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2 p-3 border rounded-lg">
                      <Switch
                        checked={value}
                        onCheckedChange={(checked) => setCompanySettings({
                          ...companySettings,
                          features: {
                            ...companySettings.features,
                            [key]: checked
                          }
                        })}
                      />
                      <Label className="flex-1">
                        {key === 'emailNotifications' ? 'Notificações por Email' :
                         key === 'smsNotifications' ? 'Notificações por SMS' :
                         key === 'automaticApproval' ? 'Aprovação Automática' :
                         key === 'requireVerification' ? 'Verificação Obrigatória' :
                         key === 'allowCancellation' ? 'Permitir Cancelamento' :
                         key === 'allowReschedule' ? 'Permitir Reagendamento' : key}
                      </Label>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cancellation-policy">Política de Cancelamento (horas)</Label>
                    <Input
                      id="cancellation-policy"
                      value={companySettings.cancellationPolicy}
                      onChange={(e) => setCompanySettings({ ...companySettings, cancellationPolicy: e.target.value })}
                      placeholder="24"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reschedule-policy">Política de Reagendamento (horas)</Label>
                    <Input
                      id="reschedule-policy"
                      value={companySettings.reschedulePolicy}
                      onChange={(e) => setCompanySettings({ ...companySettings, reschedulePolicy: e.target.value })}
                      placeholder="12"
                    />
                  </div>
                </div>

                <Button className="w-full">
                  <Shield className="h-4 w-4 mr-2" />
                  Salvar Configurações de Funcionalidades
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pagamentos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Métodos de Pagamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(companySettings.paymentMethods).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2 p-3 border rounded-lg">
                      <Switch
                        checked={value}
                        onCheckedChange={(checked) => setCompanySettings({
                          ...companySettings,
                          paymentMethods: {
                            ...companySettings.paymentMethods,
                            [key]: checked
                          }
                        })}
                      />
                      <Label className="flex-1">
                        {key === 'creditCard' ? 'Cartão de Crédito' :
                         key === 'debitCard' ? 'Cartão de Débito' :
                         key === 'pix' ? 'PIX' :
                         key === 'cash' ? 'Dinheiro' :
                         key === 'bankTransfer' ? 'Transferência Bancária' : key}
                      </Label>
                    </div>
                  ))}
                </div>

                <Button className="w-full">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Salvar Configurações de Pagamento
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}