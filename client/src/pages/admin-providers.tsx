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
import { Building2, Edit, Eye, History, Mail, Phone, Calendar, Shield, Ban, Check, RefreshCw, Search, MapPin, Star, DollarSign, User } from "lucide-react";
import { getAuthToken } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";

interface ProviderData {
  id: number;
  businessName: string;
  description?: string;
  cnpj?: string;
  address?: string;
  city?: string;
  state?: string;
  cep?: string;
  status: string;
  rating?: string;
  totalReviews?: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    name: string;
    email: string;
    phone?: string;
    isActive: boolean;
  };
}

interface ProviderBooking {
  id: number;
  status: string;
  totalAmount: string;
  scheduledAt: string;
  createdAt: string;
  category: { name: string };
  client: { name: string };
}

export default function AdminProvidersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const [selectedProvider, setSelectedProvider] = useState<ProviderData | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [editProviderData, setEditProviderData] = useState({
    businessName: "",
    description: "",
    cnpj: "",
    address: "",
    city: "",
    state: "",
    cep: "",
    status: "",
    userName: "",
    userEmail: "",
    userPhone: "",
    userIsActive: true
  });

  const { toast } = useToast();

  // Query para buscar prestadores
  const { data: providers, isLoading } = useQuery<ProviderData[]>({
    queryKey: ["/api/admin/providers"],
  });

  // Query para buscar histórico de reservas do prestador
  const { data: providerBookings } = useQuery<ProviderBooking[]>({
    queryKey: ["/api/admin/providers", selectedProvider?.id, "bookings"],
    enabled: !!selectedProvider && isHistoryOpen,
  });

  // Mutation para editar prestador
  const editProviderMutation = useMutation({
    mutationFn: async ({ providerId, data }: { providerId: number; data: any }) => {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }
      
      const response = await fetch(`/api/admin/providers/${providerId}`, {
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
        throw new Error(error.message || 'Erro ao editar prestador');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/providers"] });
      toast({
        title: "Prestador atualizado",
        description: "O prestador foi atualizado com sucesso.",
      });
      setIsEditOpen(false);
      setSelectedProvider(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao editar prestador",
        description: error.message || "Ocorreu um erro ao editar o prestador.",
        variant: "destructive",
      });
    },
  });

  // Mutation para alterar status do prestador
  const updateStatusMutation = useMutation({
    mutationFn: async ({ providerId, status }: { providerId: number; status: string }) => {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }
      
      const response = await fetch(`/api/admin/providers/${providerId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) {
        const error = await response.json();
        if (response.status === 403 && error.message === 'Invalid token') {
          localStorage.removeItem('authToken');
          window.location.href = '/login';
          throw new Error('Sessão expirada. Redirecionando para login...');
        }
        throw new Error(error.message || 'Erro ao alterar status do prestador');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/providers"] });
      toast({
        title: "Status alterado",
        description: "O status do prestador foi alterado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao alterar status",
        description: error.message || "Ocorreu um erro ao alterar o status do prestador.",
        variant: "destructive",
      });
    },
  });

  const openDetails = (provider: ProviderData) => {
    setSelectedProvider(provider);
    setIsDetailsOpen(true);
  };

  const openEdit = (provider: ProviderData) => {
    setSelectedProvider(provider);
    setEditProviderData({
      businessName: provider.businessName,
      description: provider.description || "",
      cnpj: provider.cnpj || "",
      address: provider.address || "",
      city: provider.city || "",
      state: provider.state || "",
      cep: provider.cep || "",
      status: provider.status,
      userName: provider.user.name,
      userEmail: provider.user.email,
      userPhone: provider.user.phone || "",
      userIsActive: provider.user.isActive
    });
    setIsEditOpen(true);
  };

  const openHistory = (provider: ProviderData) => {
    setSelectedProvider(provider);
    setIsHistoryOpen(true);
  };

  const handleEditProvider = () => {
    if (!selectedProvider) return;
    
    if (!editProviderData.businessName || !editProviderData.userName || !editProviderData.userEmail) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome da empresa, nome do responsável e email são obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    
    editProviderMutation.mutate({
      providerId: selectedProvider.id,
      data: editProviderData
    });
  };

  const handleUpdateStatus = (provider: ProviderData, newStatus: string) => {
    const statusLabels = {
      pending: 'pendente',
      approved: 'aprovado',
      rejected: 'rejeitado',
      suspended: 'suspenso'
    };
    
    const statusLabel = statusLabels[newStatus as keyof typeof statusLabels] || newStatus;
    if (confirm(`Tem certeza que deseja alterar o status do prestador ${provider.businessName} para ${statusLabel}?`)) {
      updateStatusMutation.mutate({
        providerId: provider.id,
        status: newStatus
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
      approved: { label: "Aprovado", color: "bg-green-100 text-green-800" },
      rejected: { label: "Rejeitado", color: "bg-red-100 text-red-800" },
      suspended: { label: "Suspenso", color: "bg-gray-100 text-gray-800" },
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

  const filteredProviders = providers?.filter(provider => {
    // Filter by status tab
    if (selectedTab !== "all") {
      if (selectedTab === "pending" && provider.status !== "pending") return false;
      if (selectedTab === "approved" && provider.status !== "approved") return false;
      if (selectedTab === "rejected" && provider.status !== "rejected") return false;
      if (selectedTab === "suspended" && provider.status !== "suspended") return false;
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        provider.id.toString().includes(searchLower) ||
        provider.businessName.toLowerCase().includes(searchLower) ||
        provider.user.name.toLowerCase().includes(searchLower) ||
        provider.user.email.toLowerCase().includes(searchLower) ||
        (provider.cnpj && provider.cnpj.toLowerCase().includes(searchLower)) ||
        (provider.city && provider.city.toLowerCase().includes(searchLower))
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
          <h1 className="text-3xl font-bold tracking-tight">Gerenciar Prestadores</h1>
          <p className="text-muted-foreground">
            Visualize, edite e gerencie todos os prestadores de serviços
          </p>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar prestadores..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                {filteredProviders.length} prestador{filteredProviders.length !== 1 ? 'es' : ''} encontrado{filteredProviders.length !== 1 ? 's' : ''}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs and Providers List */}
        <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
            <TabsTrigger value="approved">Aprovados</TabsTrigger>
            <TabsTrigger value="rejected">Rejeitados</TabsTrigger>
            <TabsTrigger value="suspended">Suspensos</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Lista de Prestadores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredProviders.map((provider) => (
                    <div key={provider.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{provider.businessName}</p>
                            {getStatusBadge(provider.status)}
                            {provider.rating && (
                              <div className="flex items-center gap-1 text-sm">
                                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                <span>{provider.rating}</span>
                                <span className="text-muted-foreground">
                                  ({provider.totalReviews || 0} avaliações)
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {provider.user.name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {provider.user.email}
                            </span>
                            {provider.user.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {provider.user.phone}
                              </span>
                            )}
                            {provider.city && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {provider.city}, {provider.state}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(provider.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDetails(provider)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(provider)}
                          className="text-orange-600 hover:text-orange-700"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openHistory(provider)}
                          className="text-purple-600 hover:text-purple-700"
                        >
                          <History className="w-4 h-4" />
                        </Button>
                        
                        {/* Action buttons based on status */}
                        {provider.status === 'pending' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateStatus(provider, 'approved')}
                              className="text-green-600 hover:text-green-700"
                              disabled={updateStatusMutation.isPending}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateStatus(provider, 'rejected')}
                              className="text-red-600 hover:text-red-700"
                              disabled={updateStatusMutation.isPending}
                            >
                              <Ban className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        
                        {provider.status === 'approved' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(provider, 'suspended')}
                            className="text-red-600 hover:text-red-700"
                            disabled={updateStatusMutation.isPending}
                          >
                            <Ban className="w-4 h-4" />
                          </Button>
                        )}
                        
                        {(provider.status === 'rejected' || provider.status === 'suspended') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(provider, 'approved')}
                            className="text-green-600 hover:text-green-700"
                            disabled={updateStatusMutation.isPending}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {filteredProviders.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum prestador encontrado</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal de Detalhes */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Detalhes do Prestador
              </DialogTitle>
              <DialogDescription>
                Prestador #{selectedProvider?.id} - {selectedProvider?.businessName}
              </DialogDescription>
            </DialogHeader>
            
            {selectedProvider && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Informações da Empresa */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        Informações da Empresa
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Nome da Empresa</Label>
                        <p className="font-semibold">{selectedProvider.businessName}</p>
                      </div>
                      {selectedProvider.cnpj && (
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">CNPJ</Label>
                          <p>{selectedProvider.cnpj}</p>
                        </div>
                      )}
                      {selectedProvider.description && (
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Descrição</Label>
                          <p className="text-sm">{selectedProvider.description}</p>
                        </div>
                      )}
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                        <div className="mt-1">{getStatusBadge(selectedProvider.status)}</div>
                      </div>
                      {selectedProvider.rating && (
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Avaliação</Label>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="font-semibold">{selectedProvider.rating}</span>
                            <span className="text-muted-foreground">
                              ({selectedProvider.totalReviews || 0} avaliações)
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Informações do Responsável */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Responsável
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Nome</Label>
                        <p className="font-semibold">{selectedProvider.user.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                        <p className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {selectedProvider.user.email}
                        </p>
                      </div>
                      {selectedProvider.user.phone && (
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Telefone</Label>
                          <p className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {selectedProvider.user.phone}
                          </p>
                        </div>
                      )}
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Status da Conta</Label>
                        <div className="mt-1">
                          <Badge className={selectedProvider.user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                            {selectedProvider.user.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Endereço */}
                  {(selectedProvider.address || selectedProvider.city) && (
                    <Card className="md:col-span-2">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <MapPin className="w-5 h-5" />
                          Endereço
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {selectedProvider.address && (
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Endereço</Label>
                            <p>{selectedProvider.address}</p>
                          </div>
                        )}
                        {selectedProvider.city && (
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Cidade</Label>
                            <p>{selectedProvider.city}</p>
                          </div>
                        )}
                        {selectedProvider.state && (
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Estado</Label>
                            <p>{selectedProvider.state}</p>
                          </div>
                        )}
                        {selectedProvider.cep && (
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">CEP</Label>
                            <p>{selectedProvider.cep}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Datas */}
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Informações de Data
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Data de Criação</Label>
                        <p>{new Date(selectedProvider.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Última Atualização</Label>
                        <p>{new Date(selectedProvider.updatedAt).toLocaleDateString('pt-BR', {
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5" />
                Editar Prestador
              </DialogTitle>
              <DialogDescription>
                Prestador #{selectedProvider?.id} - Edite as informações
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Informações da Empresa */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações da Empresa</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="businessName">Nome da Empresa *</Label>
                    <Input
                      id="businessName"
                      value={editProviderData.businessName}
                      onChange={(e) => setEditProviderData(prev => ({ ...prev, businessName: e.target.value }))}
                      placeholder="Nome da empresa"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                      id="cnpj"
                      value={editProviderData.cnpj}
                      onChange={(e) => setEditProviderData(prev => ({ ...prev, cnpj: e.target.value }))}
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={editProviderData.description}
                      onChange={(e) => setEditProviderData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descrição dos serviços oferecidos"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={editProviderData.status} onValueChange={(value) => setEditProviderData(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="approved">Aprovado</SelectItem>
                        <SelectItem value="rejected">Rejeitado</SelectItem>
                        <SelectItem value="suspended">Suspenso</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
              
              {/* Endereço */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Endereço</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="address">Endereço</Label>
                    <Input
                      id="address"
                      value={editProviderData.address}
                      onChange={(e) => setEditProviderData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Rua, número, complemento"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="cep">CEP</Label>
                      <Input
                        id="cep"
                        value={editProviderData.cep}
                        onChange={(e) => setEditProviderData(prev => ({ ...prev, cep: e.target.value }))}
                        placeholder="00000-000"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="city">Cidade</Label>
                      <Input
                        id="city"
                        value={editProviderData.city}
                        onChange={(e) => setEditProviderData(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="Nome da cidade"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="state">Estado</Label>
                      <Input
                        id="state"
                        value={editProviderData.state}
                        onChange={(e) => setEditProviderData(prev => ({ ...prev, state: e.target.value }))}
                        placeholder="UF"
                        maxLength={2}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Informações do Responsável */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Responsável</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="userName">Nome do Responsável *</Label>
                    <Input
                      id="userName"
                      value={editProviderData.userName}
                      onChange={(e) => setEditProviderData(prev => ({ ...prev, userName: e.target.value }))}
                      placeholder="Nome completo"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="userEmail">Email *</Label>
                    <Input
                      id="userEmail"
                      type="email"
                      value={editProviderData.userEmail}
                      onChange={(e) => setEditProviderData(prev => ({ ...prev, userEmail: e.target.value }))}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="userPhone">Telefone</Label>
                    <Input
                      id="userPhone"
                      value={editProviderData.userPhone}
                      onChange={(e) => setEditProviderData(prev => ({ ...prev, userPhone: e.target.value }))}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="userIsActive"
                      checked={editProviderData.userIsActive}
                      onChange={(e) => setEditProviderData(prev => ({ ...prev, userIsActive: e.target.checked }))}
                    />
                    <Label htmlFor="userIsActive">Conta do responsável ativa</Label>
                  </div>
                </CardContent>
              </Card>
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsEditOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleEditProvider}
                disabled={editProviderMutation.isPending}
              >
                {editProviderMutation.isPending ? (
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
                Prestador: {selectedProvider?.businessName} - Todas as reservas recebidas
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {providerBookings && providerBookings.length > 0 ? (
                providerBookings.map((booking) => (
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
                            <p><strong>Cliente:</strong> {booking.client.name}</p>
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
                  <p>Nenhuma reserva encontrada para este prestador</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ModernAdminLayout>
  );
}