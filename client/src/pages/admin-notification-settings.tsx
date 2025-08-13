import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Bell, Save, RefreshCw, Mail, MessageCircle, Phone, Users, Calendar, Wrench, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ModernAdminLayout } from '@/components/layout/modern-admin-layout';

interface NotificationSetting {
  id: number;
  key: string;
  value: string;
  type: string;
  description?: string;
  isSystem: boolean;
  updatedAt: string;
}

export default function AdminNotificationSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [notificationSettings, setNotificationSettings] = useState({
    // Email notifications
    emailNotificationsEnabled: true,
    adminEmail: "admin@qservicos.com",
    smtpHost: "",
    smtpPort: "587",
    smtpUser: "",
    smtpPassword: "",
    smtpSecure: true,
    
    // New bookings notifications
    newBookingNotification: true,
    newBookingEmail: true,
    newBookingSms: false,
    newBookingSound: true,
    
    // New providers notifications  
    newProviderNotification: true,
    newProviderEmail: true,
    newProviderSms: false,
    newProviderSound: true,
    
    // Service requests notifications
    newServiceRequestNotification: true,
    newServiceRequestEmail: true,
    newServiceRequestSms: false,
    newServiceRequestSound: true,
    
    // Messages notifications
    newMessageNotification: true,
    newMessageEmail: false,
    newMessageSms: false,
    newMessageSound: true,
    
    // Payment notifications
    paymentNotification: true,
    paymentEmail: true,
    paymentSms: false,
    
    // System notifications
    systemErrorNotification: true,
    systemErrorEmail: true,
    
    // Notification frequency
    notificationFrequency: "immediate", // immediate, hourly, daily
    quietHoursEnabled: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "08:00",
    
    // Templates
    templates: {
      newBooking: {
        subject: "Nova Reserva Recebida - #{bookingId}",
        body: "Uma nova reserva foi realizada no sistema.\n\nDetalhes:\n- Cliente: {clientName}\n- Serviço: {serviceName}\n- Data: {date}\n- Valor: {amount}"
      },
      newProvider: {
        subject: "Novo Prestador Cadastrado - {providerName}",
        body: "Um novo prestador se cadastrou na plataforma.\n\nDetalhes:\n- Nome: {providerName}\n- Email: {providerEmail}\n- Telefone: {providerPhone}"
      },
      newServiceRequest: {
        subject: "Nova Solicitação de Serviço - {serviceName}",
        body: "Uma nova solicitação de serviço foi enviada.\n\nDetalhes:\n- Prestador: {providerName}\n- Serviço: {serviceName}\n- Status: Pendente"
      },
      newMessage: {
        subject: "Nova Mensagem no Sistema",
        body: "Uma nova mensagem foi recebida no sistema de chat.\n\nRemetente: {senderName}\nDestinatário: {recipientName}"
      }
    }
  });

  // Query to fetch notification settings
  const { data: settings = [], isLoading: settingsLoading } = useQuery({
    queryKey: ['/api/admin/notification-settings'],
    enabled: !!user && user.userType === 'admin'
  });

  // Mutation to save notification settings
  const saveNotificationSettingMutation = useMutation({
    mutationFn: async (data: { key: string; value: string; description?: string }) => {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      const response = await fetch('/api/admin/notification-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          key: data.key,
          value: data.value,
          type: typeof data.value === 'boolean' ? 'boolean' : 'string',
          description: data.description
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
        throw new Error(errorData.message || 'Failed to save notification setting');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/notification-settings'] });
      toast({
        title: "Configurações salvas",
        description: "As configurações de notificações foram atualizadas com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar",
        description: error?.message || "Ocorreu um erro ao salvar as configurações de notificações.",
        variant: "destructive",
      });
    }
  });

  const handleSaveNotificationSettings = () => {
    // Save all notification settings
    Object.entries(notificationSettings).forEach(([key, value]) => {
      if (typeof value === 'object') {
        saveNotificationSettingMutation.mutate({
          key,
          value: JSON.stringify(value),
          description: `Template de notificação: ${key}`
        });
      } else {
        saveNotificationSettingMutation.mutate({
          key,
          value: value.toString(),
          description: `Configuração de notificação: ${key}`
        });
      }
    });
  };

  const testNotification = async (type: string) => {
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('/api/admin/test-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ type })
      });

      if (response.ok) {
        toast({
          title: "Teste enviado",
          description: `Notificação de teste do tipo "${type}" foi enviada.`,
        });
      } else {
        throw new Error('Erro ao enviar teste');
      }
    } catch (error) {
      toast({
        title: "Erro no teste",
        description: "Não foi possível enviar a notificação de teste.",
        variant: "destructive",
      });
    }
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
          <Bell className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Configurações de Notificações</h1>
            <p className="text-muted-foreground">Configure como receber notificações de novas reservas, prestadores, solicitações de serviços e mensagens</p>
          </div>
        </div>

        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="events">Eventos</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="schedule">Horários</TabsTrigger>
            <TabsTrigger value="test">Teste</TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Configurações de Email
                </CardTitle>
                <CardDescription>
                  Configure o servidor SMTP para envio de notificações por email
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="email-notifications"
                    checked={notificationSettings.emailNotificationsEnabled}
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, emailNotificationsEnabled: checked })}
                  />
                  <Label htmlFor="email-notifications">Habilitar notificações por email</Label>
                </div>

                {notificationSettings.emailNotificationsEnabled && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="admin-email">Email do Administrador</Label>
                      <Input
                        id="admin-email"
                        type="email"
                        value={notificationSettings.adminEmail}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, adminEmail: e.target.value })}
                        placeholder="admin@qservicos.com"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="smtp-host">Servidor SMTP</Label>
                        <Input
                          id="smtp-host"
                          value={notificationSettings.smtpHost}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, smtpHost: e.target.value })}
                          placeholder="smtp.gmail.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="smtp-port">Porta SMTP</Label>
                        <Input
                          id="smtp-port"
                          value={notificationSettings.smtpPort}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, smtpPort: e.target.value })}
                          placeholder="587"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="smtp-user">Usuário SMTP</Label>
                        <Input
                          id="smtp-user"
                          value={notificationSettings.smtpUser}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, smtpUser: e.target.value })}
                          placeholder="seu-email@gmail.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="smtp-password">Senha SMTP</Label>
                        <Input
                          id="smtp-password"
                          type="password"
                          value={notificationSettings.smtpPassword}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, smtpPassword: e.target.value })}
                          placeholder="sua-senha-do-app"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="smtp-secure"
                        checked={notificationSettings.smtpSecure}
                        onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, smtpSecure: checked })}
                      />
                      <Label htmlFor="smtp-secure">Usar conexão segura (TLS/SSL)</Label>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            {/* New Bookings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Novas Reservas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="new-booking"
                    checked={notificationSettings.newBookingNotification}
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, newBookingNotification: checked })}
                  />
                  <Label htmlFor="new-booking">Receber notificações de novas reservas</Label>
                </div>
                {notificationSettings.newBookingNotification && (
                  <div className="ml-6 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="new-booking-email"
                        checked={notificationSettings.newBookingEmail}
                        onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, newBookingEmail: checked })}
                      />
                      <Label htmlFor="new-booking-email">Por email</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="new-booking-sound"
                        checked={notificationSettings.newBookingSound}
                        onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, newBookingSound: checked })}
                      />
                      <Label htmlFor="new-booking-sound">Som no navegador</Label>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* New Providers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Novos Prestadores
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="new-provider"
                    checked={notificationSettings.newProviderNotification}
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, newProviderNotification: checked })}
                  />
                  <Label htmlFor="new-provider">Receber notificações de novos prestadores</Label>
                </div>
                {notificationSettings.newProviderNotification && (
                  <div className="ml-6 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="new-provider-email"
                        checked={notificationSettings.newProviderEmail}
                        onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, newProviderEmail: checked })}
                      />
                      <Label htmlFor="new-provider-email">Por email</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="new-provider-sound"
                        checked={notificationSettings.newProviderSound}
                        onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, newProviderSound: checked })}
                      />
                      <Label htmlFor="new-provider-sound">Som no navegador</Label>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Service Requests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Solicitações de Serviço
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="new-service-request"
                    checked={notificationSettings.newServiceRequestNotification}
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, newServiceRequestNotification: checked })}
                  />
                  <Label htmlFor="new-service-request">Receber notificações de novas solicitações de serviço</Label>
                </div>
                {notificationSettings.newServiceRequestNotification && (
                  <div className="ml-6 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="new-service-request-email"
                        checked={notificationSettings.newServiceRequestEmail}
                        onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, newServiceRequestEmail: checked })}
                      />
                      <Label htmlFor="new-service-request-email">Por email</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="new-service-request-sound"
                        checked={notificationSettings.newServiceRequestSound}
                        onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, newServiceRequestSound: checked })}
                      />
                      <Label htmlFor="new-service-request-sound">Som no navegador</Label>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Messages */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Mensagens
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="new-message"
                    checked={notificationSettings.newMessageNotification}
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, newMessageNotification: checked })}
                  />
                  <Label htmlFor="new-message">Receber notificações de novas mensagens</Label>
                </div>
                {notificationSettings.newMessageNotification && (
                  <div className="ml-6 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="new-message-sound"
                        checked={notificationSettings.newMessageSound}
                        onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, newMessageSound: checked })}
                      />
                      <Label htmlFor="new-message-sound">Som no navegador</Label>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Templates de Email</CardTitle>
                <CardDescription>
                  Configure os templates das notificações por email. Use variáveis como {'{clientName}'}, {'{serviceName}'}, {'{amount}'} etc.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="booking-subject">Assunto - Nova Reserva</Label>
                    <Input
                      id="booking-subject"
                      value={notificationSettings.templates.newBooking.subject}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        templates: {
                          ...notificationSettings.templates,
                          newBooking: {
                            ...notificationSettings.templates.newBooking,
                            subject: e.target.value
                          }
                        }
                      })}
                      placeholder="Nova Reserva Recebida - #{bookingId}"
                    />
                  </div>
                  <div>
                    <Label htmlFor="booking-body">Corpo do email - Nova Reserva</Label>
                    <Textarea
                      id="booking-body"
                      value={notificationSettings.templates.newBooking.body}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        templates: {
                          ...notificationSettings.templates,
                          newBooking: {
                            ...notificationSettings.templates.newBooking,
                            body: e.target.value
                          }
                        }
                      })}
                      rows={4}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="provider-subject">Assunto - Novo Prestador</Label>
                    <Input
                      id="provider-subject"
                      value={notificationSettings.templates.newProvider.subject}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        templates: {
                          ...notificationSettings.templates,
                          newProvider: {
                            ...notificationSettings.templates.newProvider,
                            subject: e.target.value
                          }
                        }
                      })}
                      placeholder="Novo Prestador Cadastrado - {providerName}"
                    />
                  </div>
                  <div>
                    <Label htmlFor="provider-body">Corpo do email - Novo Prestador</Label>
                    <Textarea
                      id="provider-body"
                      value={notificationSettings.templates.newProvider.body}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        templates: {
                          ...notificationSettings.templates,
                          newProvider: {
                            ...notificationSettings.templates.newProvider,
                            body: e.target.value
                          }
                        }
                      })}
                      rows={4}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Horário</CardTitle>
                <CardDescription>
                  Configure quando e com que frequência receber notificações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="notification-frequency">Frequência das notificações</Label>
                  <Select 
                    value={notificationSettings.notificationFrequency}
                    onValueChange={(value) => setNotificationSettings({ ...notificationSettings, notificationFrequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a frequência" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Imediata</SelectItem>
                      <SelectItem value="hourly">A cada hora</SelectItem>
                      <SelectItem value="daily">Diária (resumo)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch 
                    id="quiet-hours"
                    checked={notificationSettings.quietHoursEnabled}
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, quietHoursEnabled: checked })}
                  />
                  <Label htmlFor="quiet-hours">Habilitar horário silencioso</Label>
                </div>

                {notificationSettings.quietHoursEnabled && (
                  <div className="ml-6 grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="quiet-start">Início do silêncio</Label>
                      <Input
                        id="quiet-start"
                        type="time"
                        value={notificationSettings.quietHoursStart}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, quietHoursStart: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="quiet-end">Fim do silêncio</Label>
                      <Input
                        id="quiet-end"
                        type="time"
                        value={notificationSettings.quietHoursEnd}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, quietHoursEnd: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="test" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Testar Notificações</CardTitle>
                <CardDescription>
                  Envie notificações de teste para verificar se as configurações estão funcionando
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    onClick={() => testNotification('booking')}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Calendar className="h-4 w-4" />
                    Testar Nova Reserva
                  </Button>
                  <Button 
                    onClick={() => testNotification('provider')}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Users className="h-4 w-4" />
                    Testar Novo Prestador
                  </Button>
                  <Button 
                    onClick={() => testNotification('service')}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Wrench className="h-4 w-4" />
                    Testar Solicitação de Serviço
                  </Button>
                  <Button 
                    onClick={() => testNotification('message')}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Testar Nova Mensagem
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2">
          <Button 
            onClick={handleSaveNotificationSettings}
            disabled={saveNotificationSettingMutation.isPending}
            className="flex items-center gap-2"
          >
            {saveNotificationSettingMutation.isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar Configurações de Notificações
          </Button>
        </div>
      </div>
    </ModernAdminLayout>
  );
}