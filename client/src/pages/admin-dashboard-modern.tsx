import { AdminMetrics } from '@/components/admin/AdminMetrics';
import { PendingProviders } from '@/components/admin/PendingProviders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { ModernAdminLayout } from '@/components/layout/modern-admin-layout';

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

        {/* Métricas do Dashboard */}
        <AdminMetrics />
        
        {/* Prestadores Pendentes */}
        <PendingProviders />
      </div>
    </ModernAdminLayout>
  );
}