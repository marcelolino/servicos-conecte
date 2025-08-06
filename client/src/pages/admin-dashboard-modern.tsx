import { useQuery } from '@tanstack/react-query';
import { AdminMetrics } from '@/components/admin/AdminMetrics';
import { PendingProviders } from '@/components/admin/PendingProviders';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { ModernAdminLayout } from '@/components/layout/modern-admin-layout';
import { 
  Users, 
  Settings, 
  DollarSign,
  FileText,
  BarChart3,
  Calendar,
  MessageCircle
} from 'lucide-react';

// Import admin components for different sections
import AdminPayments from '@/pages/admin-payments';
import AdminCashPayments from '@/pages/admin-cash-payments';
import AdminEarnings from '@/pages/admin-earnings';
import AdminWithdrawalRequests from '@/pages/admin-withdrawal-requests';
import AdminBookings from '@/pages/admin-bookings';
import AdminSettings from '@/pages/admin-settings';

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || user.userType !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Você não tem permissão para acessar esta página.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ModernAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard Administrativo</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie sua plataforma de serviços Qserviços
            </p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="providers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Prestadores
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Reservas
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Pagamentos
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <AdminMetrics />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PendingProviders />
              
              <Card>
                <CardHeader>
                  <CardTitle>Atividade Recente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    Implementação em desenvolvimento...
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="providers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciamento de Prestadores</CardTitle>
              </CardHeader>
              <CardContent>
                <PendingProviders />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-6">
            <AdminBookings />
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <Tabs defaultValue="payments" className="space-y-4">
              <TabsList>
                <TabsTrigger value="payments">Pagamentos</TabsTrigger>
                <TabsTrigger value="cash">Dinheiro</TabsTrigger>
                <TabsTrigger value="earnings">Ganhos</TabsTrigger>
                <TabsTrigger value="withdrawals">Retiradas</TabsTrigger>
              </TabsList>
              
              <TabsContent value="payments">
                <AdminPayments />
              </TabsContent>
              
              <TabsContent value="cash">
                <AdminCashPayments />
              </TabsContent>
              
              <TabsContent value="earnings">
                <AdminEarnings />
              </TabsContent>
              
              <TabsContent value="withdrawals">
                <AdminWithdrawalRequests />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="chat" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sistema de Chat</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Funcionalidade de chat em desenvolvimento...
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <AdminSettings />
          </TabsContent>
        </Tabs>
      </div>
    </ModernAdminLayout>
  );
}