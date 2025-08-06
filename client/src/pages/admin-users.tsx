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
  UserCheck, 
  Shield,
  Eye,
  Ban,
  CheckCircle
} from 'lucide-react';
import type { User } from '@shared/schema';

export default function AdminUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['/api/admin/users'],
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: ({ userId, action }: { userId: number; action: 'activate' | 'deactivate' }) =>
      apiRequest(`/api/admin/users/${userId}/${action}`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: 'Sucesso',
        description: 'Status do usuário atualizado com sucesso',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar status do usuário',
        variant: 'destructive',
      });
    },
  });

  const clients = users.filter((u: User) => u.userType === 'client');
  const providers = users.filter((u: User) => u.userType === 'provider');
  const admins = users.filter((u: User) => u.userType === 'admin');

  const renderUserTable = (userList: User[], showActions = true) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Último Acesso</TableHead>
          {showActions && <TableHead>Ações</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {userList.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">
              {user.name || 'Nome não informado'}
            </TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>
              <Badge variant={
                user.userType === 'admin' ? 'default' :
                user.userType === 'provider' ? 'secondary' : 'outline'
              }>
                {user.userType === 'admin' ? 'Admin' :
                 user.userType === 'provider' ? 'Prestador' : 'Cliente'}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant={user.isActive ? 'default' : 'destructive'}>
                {user.isActive ? 'Ativo' : 'Inativo'}
              </Badge>
            </TableCell>
            <TableCell>
              {user.lastLoginAt ? format(new Date(user.lastLoginAt), 'dd/MM/yyyy HH:mm') : 'Nunca'}
            </TableCell>
            {showActions && user.userType !== 'admin' && (
              <TableCell>
                <div className="flex gap-2">
                  {user.isActive ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => toggleUserStatusMutation.mutate({
                        userId: user.id,
                        action: 'deactivate'
                      })}
                      disabled={toggleUserStatusMutation.isPending}
                    >
                      <Ban className="h-4 w-4 mr-1" />
                      Desativar
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => toggleUserStatusMutation.mutate({
                        userId: user.id,
                        action: 'activate'
                      })}
                      disabled={toggleUserStatusMutation.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Ativar
                    </Button>
                  )}
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
            <h1 className="text-3xl font-bold text-foreground">Gestão de Usuários</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie todos os usuários da plataforma
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clients.length}</div>
              <p className="text-xs text-muted-foreground">
                Usuários clientes
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prestadores</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{providers.length}</div>
              <p className="text-xs text-muted-foreground">
                Prestadores de serviços
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Administradores</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{admins.length}</div>
              <p className="text-xs text-muted-foreground">
                Usuários admin
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="clients" className="space-y-4">
          <TabsList>
            <TabsTrigger value="clients">
              Clientes ({clients.length})
            </TabsTrigger>
            <TabsTrigger value="providers">
              Prestadores ({providers.length})
            </TabsTrigger>
            <TabsTrigger value="admins">
              Administradores ({admins.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="clients">
            <Card>
              <CardHeader>
                <CardTitle>Usuários Clientes</CardTitle>
              </CardHeader>
              <CardContent>
                {clients.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum cliente cadastrado
                  </div>
                ) : (
                  renderUserTable(clients)
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="providers">
            <Card>
              <CardHeader>
                <CardTitle>Usuários Prestadores</CardTitle>
              </CardHeader>
              <CardContent>
                {providers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum prestador cadastrado
                  </div>
                ) : (
                  renderUserTable(providers)
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="admins">
            <Card>
              <CardHeader>
                <CardTitle>Usuários Administradores</CardTitle>
              </CardHeader>
              <CardContent>
                {admins.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum administrador cadastrado
                  </div>
                ) : (
                  renderUserTable(admins, false)
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ModernAdminLayout>
  );
}