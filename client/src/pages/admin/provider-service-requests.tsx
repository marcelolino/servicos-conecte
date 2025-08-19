import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ModernAdminLayout } from "@/components/layout/modern-admin-layout";
import { 
  Search, 
  Filter,
  Eye,
  Check,
  X,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  User,
  Calendar
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ServiceCategory } from "@shared/schema";

interface Provider {
  id: number;
  userId: number;
  status: string;
  companyName?: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

interface ProviderServiceRequest {
  id: number;
  providerId: number;
  categoryId: number;
  name: string;
  description: string;
  status: "pending" | "approved" | "rejected";
  adminResponse?: string;
  createdAt: string;
  updatedAt: string;
  category: ServiceCategory;
  provider: Provider;
}

export default function AdminProviderServiceRequestsPage() {
  const [selectedRequest, setSelectedRequest] = useState<ProviderServiceRequest | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [adminResponse, setAdminResponse] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch service categories
  const { data: categories, isLoading: categoriesLoading } = useQuery<ServiceCategory[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch provider service requests
  const { data: serviceRequests = [], isLoading: requestsLoading, refetch } = useQuery<ProviderServiceRequest[]>({
    queryKey: ["/api/admin/provider-service-requests"],
  });

  // Update service request status mutation
  const updateRequestMutation = useMutation({
    mutationFn: ({ requestId, status, adminResponse }: { requestId: number; status: string; adminResponse?: string }) =>
      apiRequest("PUT", `/api/admin/provider-service-requests/${requestId}`, { status, adminResponse }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/provider-service-requests"] });
      toast({
        title: "Solicitação atualizada!",
        description: "O status da solicitação foi atualizado com sucesso.",
      });
      setIsReviewOpen(false);
      setSelectedRequest(null);
      setAdminResponse("");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar solicitação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleApprove = (request: ProviderServiceRequest) => {
    updateRequestMutation.mutate({
      requestId: request.id,
      status: "approved",
      adminResponse: adminResponse || "Solicitação aprovada pelo administrador.",
    });
  };

  const handleReject = (request: ProviderServiceRequest) => {
    if (!adminResponse.trim()) {
      toast({
        title: "Resposta obrigatória",
        description: "Por favor, forneça uma razão para a rejeição.",
        variant: "destructive",
      });
      return;
    }
    
    updateRequestMutation.mutate({
      requestId: request.id,
      status: "rejected",
      adminResponse: adminResponse,
    });
  };

  const openReviewDialog = (request: ProviderServiceRequest) => {
    setSelectedRequest(request);
    setAdminResponse(request.adminResponse || "");
    setIsReviewOpen(true);
  };

  // Filter requests
  const filteredRequests = serviceRequests.filter((request) => {
    const matchesSearch = 
      request.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.category?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.provider?.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.provider?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === "all" || request.status === selectedStatus;
    const matchesCategory = selectedCategory === "all" || request.categoryId === parseInt(selectedCategory);
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" />Pendente</Badge>;
      case "approved":
        return <Badge variant="default" className="flex items-center gap-1 bg-green-500"><CheckCircle className="h-3 w-3" />Aprovado</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" />Rejeitado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedStatus("all");
    setSelectedCategory("all");
  };

  if (!user || user.userType !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Acesso Negado</h1>
          <p className="text-muted-foreground">Você precisa ser um administrador para acessar esta página.</p>
        </div>
      </div>
    );
  }

  if (categoriesLoading || requestsLoading) {
    return (
      <ModernAdminLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando solicitações...</p>
          </div>
        </div>
      </ModernAdminLayout>
    );
  }

  const pendingCount = serviceRequests.filter(r => r.status === "pending").length;
  const approvedCount = serviceRequests.filter(r => r.status === "approved").length;
  const rejectedCount = serviceRequests.filter(r => r.status === "rejected").length;

  return (
    <ModernAdminLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Solicitações de Serviço</h1>
            <p className="text-muted-foreground">
              Gerenciar solicitações de novos serviços enviadas pelos prestadores
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Solicitações</p>
                  <p className="text-3xl font-bold text-foreground">{serviceRequests.length}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                  <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
                </div>
                <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Aprovadas</p>
                  <p className="text-3xl font-bold text-green-600">{approvedCount}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Rejeitadas</p>
                  <p className="text-3xl font-bold text-red-600">{rejectedCount}</p>
                </div>
                <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="search">Pesquisar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="search"
                    placeholder="Pesquisar por prestador, categoria ou nome do serviço..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="w-full lg:w-48">
                <Label htmlFor="category">Categoria</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-full lg:w-48">
                <Label htmlFor="status">Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="approved">Aprovado</SelectItem>
                    <SelectItem value="rejected">Rejeitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                variant="outline"
                onClick={clearFilters}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Service Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>Solicitações de Serviço ({filteredRequests.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prestador</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Nome do Serviço</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="text-muted-foreground">
                          {searchTerm || selectedStatus !== "all" || selectedCategory !== "all"
                            ? "Nenhuma solicitação encontrada com os filtros aplicados." 
                            : "Nenhuma solicitação de serviço encontrada."
                          }
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">
                                {request.provider?.companyName || request.provider?.user?.name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {request.provider?.user?.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{request.category?.name}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{request.name}</div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate" title={request.description}>
                            {request.description}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(request.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openReviewDialog(request)}
                              className="flex items-center gap-1"
                            >
                              <Eye className="h-4 w-4" />
                              {request.status === "pending" ? "Revisar" : "Ver"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Review Dialog */}
        <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedRequest?.status === "pending" ? "Revisar Solicitação" : "Detalhes da Solicitação"}
              </DialogTitle>
            </DialogHeader>
            
            {selectedRequest && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Prestador</Label>
                    <p className="text-sm">{selectedRequest.provider?.companyName || selectedRequest.provider?.user?.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">E-mail</Label>
                    <p className="text-sm">{selectedRequest.provider?.user?.email}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Categoria</Label>
                  <p className="text-sm">{selectedRequest.category?.name}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Nome do Serviço</Label>
                  <p className="text-sm font-medium">{selectedRequest.name}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Descrição</Label>
                  <p className="text-sm whitespace-pre-wrap">{selectedRequest.description}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Status Atual</Label>
                  <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                </div>

                {selectedRequest.status !== "pending" && selectedRequest.adminResponse && (
                  <div>
                    <Label className="text-sm font-medium">Resposta do Administrador</Label>
                    <p className="text-sm whitespace-pre-wrap">{selectedRequest.adminResponse}</p>
                  </div>
                )}

                {selectedRequest.status === "pending" && (
                  <div>
                    <Label htmlFor="admin-response">Resposta do Administrador</Label>
                    <Textarea
                      id="admin-response"
                      placeholder="Adicione uma resposta ou comentário..."
                      value={adminResponse}
                      onChange={(e) => setAdminResponse(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsReviewOpen(false)}
                  >
                    {selectedRequest.status === "pending" ? "Cancelar" : "Fechar"}
                  </Button>
                  
                  {selectedRequest.status === "pending" && (
                    <>
                      <Button
                        variant="destructive"
                        onClick={() => handleReject(selectedRequest)}
                        disabled={updateRequestMutation.isPending}
                        className="flex items-center gap-2"
                      >
                        {updateRequestMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                        Rejeitar
                      </Button>
                      
                      <Button
                        onClick={() => handleApprove(selectedRequest)}
                        disabled={updateRequestMutation.isPending}
                        className="flex items-center gap-2"
                      >
                        {updateRequestMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        Aprovar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ModernAdminLayout>
  );
}