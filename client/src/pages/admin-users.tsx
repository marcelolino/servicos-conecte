import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ModernAdminLayout } from "@/components/layout/modern-admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { User, Edit, Eye, History, Mail, Phone, Calendar, Shield, Ban, Check, RefreshCw, Search } from "lucide-react";
import { getAuthToken } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";

interface UserData {
  id: number;
  email: string;
  name: string;
  phone?: string;
  userType: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserBooking {
  id: number;
  status: string;
  totalAmount: string;
  scheduledAt: string;
  createdAt: string;
  category: { name: string };
  provider?: { businessName: string };
}

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [editUserData, setEditUserData] = useState({
    name: "",
    email: "",
    phone: "",
    userType: "",
    isActive: true
  });

  const { toast } = useToast();

  // Query para buscar usuários
  const { data: users, isLoading, refetch } = useQuery<UserData[]>({
    queryKey: ["/api/admin/users"],
  });

  // Query para buscar histórico de reservas do usuário
  const { data: userBookings } = useQuery<UserBooking[]>({
    queryKey: ["/api/admin/users", selectedUser?.id, "bookings"],
    enabled: !!selectedUser && isHistoryOpen,
  });

  // Mutation para editar usuário
  const editUserMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: number; data: any }) => {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }
      
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        if (response.status === 403 && error.message === 'Invalid token') {
          localStorage.removeItem('authToken');
          window.location.href = '/login';
          throw new Error('Sessão expirada. Redirecionando para login...');
        }
        throw new Error(error.message || 'Erro ao editar usuário');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Usuário atualizado",
        description: "O usuário foi atualizado com sucesso.",
      });
      setIsEditOpen(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao editar usuário",
        description: error.message || "Ocorreu um erro ao editar o usuário.",
        variant: "destructive",
      });
    },
  });

  // Mutation para ativar/desativar usuário
  const toggleUserMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: number; isActive: boolean }) => {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }
      
      const response = await fetch(`/api/admin/users/${userId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive })
      });
      
      if (!response.ok) {
        const error = await response.json();
        if (response.status === 403 && error.message === 'Invalid token') {
          localStorage.removeItem('authToken');
          window.location.href = '/login';
          throw new Error('Sessão expirada. Redirecionando para login...');
        }
        throw new Error(error.message || 'Erro ao alterar status do usuário');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Status alterado",
        description: "O status do usuário foi alterado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao alterar status",
        description: error.message || "Ocorreu um erro ao alterar o status do usuário.",
        variant: "destructive",
      });
    },
  });

  const openDetails = (user: UserData) => {
    setSelectedUser(user);
    setIsDetailsOpen(true);
  };

  const openEdit = (user: UserData) => {
    setSelectedUser(user);
    setEditUserData({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      userType: user.userType,
      isActive: user.isActive
    });
    setIsEditOpen(true);
  };

  const openHistory = (user: UserData) => {
    setSelectedUser(user);
    setIsHistoryOpen(true);
  };

  const handleEditUser = () => {
    if (!selectedUser) return;
    
    if (!editUserData.name || !editUserData.email) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e email são obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    
    editUserMutation.mutate({
      userId: selectedUser.id,
      data: editUserData
    });
  };

  const handleToggleUser = (user: UserData) => {
    const action = user.isActive ? 'desativar' : 'ativar';
    if (confirm(`Tem certeza que deseja ${action} o usuário ${user.name}?`)) {
      toggleUserMutation.mutate({
        userId: user.id,
        isActive: !user.isActive
      });
    }
  };

  const getUserTypeBadge = (userType: string) => {
    const typeConfig = {
      admin: { label: "Admin", color: "bg-purple-100 text-purple-800" },
      client: { label: "Cliente", color: "bg-blue-100 text-blue-800" },
      provider: { label: "Prestador", color: "bg-green-100 text-green-800" },
      employee: { label: "Funcionário", color: "bg-orange-100 text-orange-800" },
    };

    const config = typeConfig[userType as keyof typeof typeConfig] || {
      label: userType,
      color: "bg-gray-100 text-gray-800",
    };

    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge className={isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
        {isActive ? "Ativo" : "Inativo"}
      </Badge>
    );
  };

  const getBookingStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
      accepted: { label: "Aceito", color: "bg-blue-100 text-blue-800" },
      in_progress: { label: "Em Andamento", color: "bg-orange-100 text-orange-800" },
      completed: { label: "Concluído", color: "bg-green-100 text-green-800" },
      cancelled: { label: "Cancelado", color: "bg-red-100 text-red-800" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      color: "bg-gray-100 text-gray-800",
    };

    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const filteredUsers = users?.filter(user => {
    // Filter by status tab
    if (selectedTab !== "all") {
      if (selectedTab === "active" && !user.isActive) return false;
      if (selectedTab === "inactive" && user.isActive) return false;
      if (selectedTab === "admins" && user.userType !== "admin") return false;
      if (selectedTab === "clients" && user.userType !== "client") return false;
      if (selectedTab === "providers" && user.userType !== "provider") return false;
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        user.id.toString().includes(searchLower) ||
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        (user.phone && user.phone.toLowerCase().includes(searchLower))
      );
    }

    return true;
  }) || [];

  if (isLoading) {
    return (
      <ModernAdminLayout>
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </ModernAdminLayout>
    );
  }

  return (
    <ModernAdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Gerenciar Usuários</h1>
          <p className="text-muted-foreground">
            Visualize, edite e gerencie todos os usuários da plataforma
          </p>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar usuários..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                {filteredUsers.length} usuário{filteredUsers.length !== 1 ? 's' : ''} encontrado{filteredUsers.length !== 1 ? 's' : ''}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs and Users List */}
        <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="active">Ativos</TabsTrigger>
            <TabsTrigger value="inactive">Inativos</TabsTrigger>
            <TabsTrigger value="admins">Admins</TabsTrigger>
            <TabsTrigger value="clients">Clientes</TabsTrigger>
            <TabsTrigger value="providers">Prestadores</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Lista de Usuários
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{user.name}</p>
                            {getUserTypeBadge(user.userType)}
                            {getStatusBadge(user.isActive)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </span>
                            {user.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {user.phone}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDetails(user)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(user)}
                          className="text-orange-600 hover:text-orange-700"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openHistory(user)}
                          className="text-purple-600 hover:text-purple-700"
                        >
                          <History className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleUser(user)}
                          className={user.isActive ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                          disabled={toggleUserMutation.isPending}
                        >
                          {user.isActive ? <Ban className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {filteredUsers.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum usuário encontrado</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal de Detalhes */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Detalhes do Usuário
              </DialogTitle>
              <DialogDescription>
                Usuário #{selectedUser?.id} - {selectedUser?.name}
              </DialogDescription>
            </DialogHeader>
            
            {selectedUser && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Informações Básicas */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Informações Básicas
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Nome</Label>
                        <p className="font-semibold">{selectedUser.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                        <p className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {selectedUser.email}
                        </p>
                      </div>
                      {selectedUser.phone && (
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Telefone</Label>
                          <p className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {selectedUser.phone}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Status e Tipo */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Status e Permissões
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Tipo de Usuário</Label>
                        <div className="mt-1">{getUserTypeBadge(selectedUser.userType)}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Status da Conta</Label>
                        <div className="mt-1">{getStatusBadge(selectedUser.isActive)}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Data de Criação</Label>
                        <p>{new Date(selectedUser.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Última Atualização</Label>
                        <p>{new Date(selectedUser.updatedAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Edição */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5" />
                Editar Usuário
              </DialogTitle>
              <DialogDescription>
                Usuário #{selectedUser?.id} - Edite as informações
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={editUserData.name}
                  onChange={(e) => setEditUserData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome completo"
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={editUserData.email}
                  onChange={(e) => setEditUserData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={editUserData.phone}
                  onChange={(e) => setEditUserData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(00) 00000-0000"
                />
              </div>
              
              <div>
                <Label htmlFor="userType">Tipo de Usuário</Label>
                <Select value={editUserData.userType} onValueChange={(value) => setEditUserData(prev => ({ ...prev, userType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="client">Cliente</SelectItem>
                    <SelectItem value="provider">Prestador</SelectItem>
                    <SelectItem value="employee">Funcionário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editUserData.isActive}
                  onChange={(e) => setEditUserData(prev => ({ ...prev, isActive: e.target.checked }))}
                />
                <Label htmlFor="isActive">Conta ativa</Label>
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsEditOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleEditUser}
                disabled={editUserMutation.isPending}
              >
                {editUserMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Histórico */}
        <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Histórico de Reservas
              </DialogTitle>
              <DialogDescription>
                Usuário: {selectedUser?.name} - Todas as reservas realizadas
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {userBookings && userBookings.length > 0 ? (
                userBookings.map((booking) => (
                  <Card key={booking.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h4 className="font-semibold">Reserva #{booking.id.toString().padStart(6, '0')}</h4>
                            {getBookingStatusBadge(booking.status)}
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p><strong>Categoria:</strong> {booking.category.name}</p>
                            {booking.provider && <p><strong>Prestador:</strong> {booking.provider.businessName}</p>}
                            <p><strong>Agendado para:</strong> {new Date(booking.scheduledAt).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</p>
                            <p><strong>Criado em:</strong> {new Date(booking.createdAt).toLocaleDateString('pt-BR')}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">
                            {parseFloat(booking.totalAmount).toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma reserva encontrada para este usuário</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ModernAdminLayout>
  );
}