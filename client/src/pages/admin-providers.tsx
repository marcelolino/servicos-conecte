import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ModernAdminLayout } from '@/components/layout/modern-admin-layout';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock,
  Eye,
  UserCheck,
  UserX
} from 'lucide-react';
import type { Provider } from '@shared/schema';

export default function AdminProviders() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['/api/admin/providers'],
  });

  const approveProviderMutation = useMutation({
    mutationFn: (providerId: number) =>
      apiRequest(`/api/admin/providers/${providerId}/approve`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/providers'] });
      toast({
        title: 'Sucesso',
        description: 'Prestador aprovado com sucesso',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Erro ao aprovar prestador',
        variant: 'destructive',
      });
    },
  });

  const rejectProviderMutation = useMutation({
    mutationFn: (providerId: number) =>
      apiRequest(`/api/admin/providers/${providerId}/reject`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/providers'] });
      toast({
        title: 'Sucesso',
        description: 'Prestador rejeitado com sucesso',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Erro ao rejeitar prestador',
        variant: 'destructive',
      });
    },
  });

  const pendingProviders = providers.filter((p: Provider) => p.status === 'pending');
  const approvedProviders = providers.filter((p: Provider) => p.status === 'approved');
  const rejectedProviders = providers.filter((p: Provider) => p.status === 'rejected');

  const renderProviderTable = (providerList: Provider[], showActions = false) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Data de Registro</TableHead>
          {showActions && <TableHead>Ações</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {providerList.map((provider) => (
          <TableRow key={provider.id}>
            <TableCell className="font-medium">
              {provider.businessName || 'Nome não informado'}
            </TableCell>
            <TableCell>{provider.user?.email}</TableCell>
            <TableCell>
              <Badge variant={
                provider.status === 'approved' ? 'default' :
                provider.status === 'rejected' ? 'destructive' : 'secondary'
              }>
                {provider.status === 'approved' ? 'Aprovado' :
                 provider.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
              </Badge>
            </TableCell>
            <TableCell>
              {provider.createdAt ? format(new Date(provider.createdAt), 'dd/MM/yyyy') : '-'}
            </TableCell>
            {showActions && (
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => approveProviderMutation.mutate(provider.id)}
                    disabled={approveProviderMutation.isPending}
                  >
                    <UserCheck className="h-4 w-4 mr-1" />
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => rejectProviderMutation.mutate(provider.id)}
                    disabled={rejectProviderMutation.isPending}
                  >
                    <UserX className="h-4 w-4 mr-1" />
                    Rejeitar
                  </Button>
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  if (isLoading) {
    return (
      <ModernAdminLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </ModernAdminLayout>
    );
  }

  return (
    <ModernAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestão de Prestadores</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie aprovações e status dos prestadores de serviços
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingProviders.length}</div>
              <p className="text-xs text-muted-foreground">
                Aguardando aprovação
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedProviders.length}</div>
              <p className="text-xs text-muted-foreground">
                Prestadores ativos
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejeitados</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rejectedProviders.length}</div>
              <p className="text-xs text-muted-foreground">
                Não aprovados
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">
              Pendentes ({pendingProviders.length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Aprovados ({approvedProviders.length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejeitados ({rejectedProviders.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Prestadores Pendentes</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingProviders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum prestador pendente de aprovação
                  </div>
                ) : (
                  renderProviderTable(pendingProviders, true)
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="approved">
            <Card>
              <CardHeader>
                <CardTitle>Prestadores Aprovados</CardTitle>
              </CardHeader>
              <CardContent>
                {approvedProviders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum prestador aprovado
                  </div>
                ) : (
                  renderProviderTable(approvedProviders)
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="rejected">
            <Card>
              <CardHeader>
                <CardTitle>Prestadores Rejeitados</CardTitle>
              </CardHeader>
              <CardContent>
                {rejectedProviders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum prestador rejeitado
                  </div>
                ) : (
                  renderProviderTable(rejectedProviders)
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ModernAdminLayout>
  );
}