import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Save, Bell, Mail, MessageSquare, Phone } from "lucide-react";

interface NotificationSettings {
  emailNewBooking: boolean;
  emailBookingCancelled: boolean;
  emailPaymentReceived: boolean;
  emailNewUser: boolean;
  emailNewProvider: boolean;
  smsNewBooking: boolean;
  smsBookingReminder: boolean;
  smsPaymentConfirmed: boolean;
  pushNewBooking: boolean;
  pushBookingUpdates: boolean;
  pushPaymentAlerts: boolean;
  pushSystemNotifications: boolean;
}

export function AdminNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNewBooking: true,
    emailBookingCancelled: true,
    emailPaymentReceived: true,
    emailNewUser: true,
    emailNewProvider: true,
    smsNewBooking: false,
    smsBookingReminder: true,
    smsPaymentConfirmed: false,
    pushNewBooking: true,
    pushBookingUpdates: true,
    pushPaymentAlerts: true,
    pushSystemNotifications: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/admin/notification-settings");
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error("Erro ao carregar configurações de notificação:", error);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/notification-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast({
          title: "Configurações salvas",
          description: "As configurações de notificação foram atualizadas com sucesso.",
        });
      } else {
        throw new Error("Erro ao salvar configurações de notificação");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações de notificação.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (field: keyof NotificationSettings) => {
    setSettings(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const notificationGroups = [
    {
      title: "Notificações por E-mail",
      icon: Mail,
      description: "Receba notificações importantes por e-mail",
      settings: [
        {
          key: "emailNewBooking" as keyof NotificationSettings,
          label: "Nova reserva",
          description: "Quando uma nova reserva for criada",
        },
        {
          key: "emailBookingCancelled" as keyof NotificationSettings,
          label: "Reserva cancelada",
          description: "Quando uma reserva for cancelada",
        },
        {
          key: "emailPaymentReceived" as keyof NotificationSettings,
          label: "Pagamento recebido",
          description: "Quando um pagamento for processado",
        },
        {
          key: "emailNewUser" as keyof NotificationSettings,
          label: "Novo usuário",
          description: "Quando um novo usuário se cadastrar",
        },
        {
          key: "emailNewProvider" as keyof NotificationSettings,
          label: "Novo prestador",
          description: "Quando um novo prestador se cadastrar",
        },
      ],
    },
    {
      title: "Notificações por SMS",
      icon: MessageSquare,
      description: "Receba alertas importantes por SMS (requer configuração Twilio)",
      settings: [
        {
          key: "smsNewBooking" as keyof NotificationSettings,
          label: "Nova reserva",
          description: "Notificação imediata de nova reserva",
        },
        {
          key: "smsBookingReminder" as keyof NotificationSettings,
          label: "Lembrete de reserva",
          description: "Lembrete 1 hora antes da reserva",
        },
        {
          key: "smsPaymentConfirmed" as keyof NotificationSettings,
          label: "Pagamento confirmado",
          description: "Confirmação de pagamento por SMS",
        },
      ],
    },
    {
      title: "Notificações Push",
      icon: Bell,
      description: "Notificações em tempo real no navegador",
      settings: [
        {
          key: "pushNewBooking" as keyof NotificationSettings,
          label: "Nova reserva",
          description: "Alerta instantâneo de nova reserva",
        },
        {
          key: "pushBookingUpdates" as keyof NotificationSettings,
          label: "Atualizações de reserva",
          description: "Mudanças no status das reservas",
        },
        {
          key: "pushPaymentAlerts" as keyof NotificationSettings,
          label: "Alertas de pagamento",
          description: "Notificações sobre pagamentos e cobranças",
        },
        {
          key: "pushSystemNotifications" as keyof NotificationSettings,
          label: "Notificações do sistema",
          description: "Alertas sobre manutenção e atualizações",
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações de Notificação</h1>
        <p className="text-muted-foreground">
          Configure como e quando receber notificações sobre eventos importantes da plataforma.
        </p>
      </div>

      <div className="grid gap-6">
        {notificationGroups.map((group) => {
          const Icon = group.icon;
          return (
            <Card key={group.title}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  {group.title}
                </CardTitle>
                <CardDescription>{group.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {group.settings.map((setting) => (
                    <div key={setting.key} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base font-medium">{setting.label}</Label>
                        <p className="text-sm text-muted-foreground">
                          {setting.description}
                        </p>
                      </div>
                      <Switch
                        checked={settings[setting.key]}
                        onCheckedChange={() => handleToggle(setting.key)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Resumo das configurações */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo das Configurações</CardTitle>
            <CardDescription>
              Visão geral das suas configurações de notificação ativas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">E-mail</p>
                  <p className="text-sm text-muted-foreground">
                    {Object.entries(settings)
                      .filter(([key, value]) => key.startsWith('email') && value)
                      .length} ativas
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <MessageSquare className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">SMS</p>
                  <p className="text-sm text-muted-foreground">
                    {Object.entries(settings)
                      .filter(([key, value]) => key.startsWith('sms') && value)
                      .length} ativas
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Bell className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Push</p>
                  <p className="text-sm text-muted-foreground">
                    {Object.entries(settings)
                      .filter(([key, value]) => key.startsWith('push') && value)
                      .length} ativas
                  </p>
                </div>
              </div>
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
  );
}