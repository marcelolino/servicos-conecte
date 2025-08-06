import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Search, Plus, Edit, Trash2, MapPin, DollarSign, User, Star } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import { ModernAdminLayout } from "@/components/layout/modern-admin-layout";

interface Service {
  id: number;
  title: string;
  description: string;
  categoryId: number;
  providerId: number;
  basePrice: string;
  minPrice: string;
  maxPrice: string;
  pricingType: 'fixed' | 'hourly' | 'negotiable';
  serviceArea: string;
  isActive: boolean;
  createdAt: string;
  category: {
    id: number;
    name: string;
  };
  provider: {
    id: number;
    user: {
      name: string;
      email: string;
    };
  };
  _count?: {
    serviceRequests: number;
    reviews: number;
  };
  averageRating?: number;
}

interface Category {
  id: number;
  name: string;
}

export default function AdminServicesPage() {
  const { data: services, isLoading } = useQuery<Service[]>({
    queryKey: ["/api/admin/services"],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const toggleServiceStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      return apiRequest("PUT", `/api/admin/services/${id}/status`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/services"] });
      toast({
        title: "Status atualizado",
        description: "O status do serviço foi atualizado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao atualizar o status do serviço.",
        variant: "destructive",
      });
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/admin/services/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/services"] });
      toast({
        title: "Serviço excluído",
        description: "O serviço foi excluído com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao excluir o serviço.",
        variant: "destructive",
      });
    },
  });

  const handleToggleStatus = (id: number, currentStatus: boolean) => {
    toggleServiceStatusMutation.mutate({ id, isActive: !currentStatus });
  };

  const handleDeleteService = (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir este serviço?")) {
      deleteServiceMutation.mutate(id);
    }
  };

  const getPricingTypeText = (type: string) => {
    switch (type) {
      case 'fixed':
        return 'Preço Fixo';
      case 'hourly':
        return 'Por Hora';
      case 'negotiable':
        return 'Negociável';
      default:
        return type;
    }
  };

  const getPricingTypeColor = (type: string) => {
    switch (type) {
      case 'fixed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'hourly':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'negotiable':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  };

  // Filter services
  const filteredServices = services?.filter(service => {
    const matchesSearch = service.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.provider?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.category?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || service.categoryId?.toString() === selectedCategory;
    const matchesStatus = selectedStatus === "all" || 
                         (selectedStatus === "active" && service.isActive) ||
                         (selectedStatus === "inactive" && !service.isActive);
    
    return matchesSearch && matchesCategory && matchesStatus;
  }) || [];

  if (isLoading) {
    return (
      <ModernAdminLayout>
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
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

  const totalServices = services?.length || 0;
  const activeServices = services?.filter(s => s.isActive).length || 0;
  const inactiveServices = totalServices - activeServices;
  const totalRequests = services?.reduce((sum, service) => sum + (service._count?.serviceRequests || 0), 0) || 0;

  return (
    <ModernAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gerenciamento de Serviços</h1>
            <p className="text-muted-foreground mt-1">
              Todos os serviços oferecidos pelos prestadores
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Serviço
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Serviços</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalServices}</div>
              <p className="text-xs text-muted-foreground">
                Serviços cadastrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Serviços Ativos</CardTitle>
              <Star className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeServices}</div>
              <p className="text-xs text-muted-foreground">
                Disponíveis para contratação
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Serviços Inativos</CardTitle>
              <Star className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{inactiveServices}</div>
              <p className="text-xs text-muted-foreground">
                Desabilitados temporariamente
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Solicitações</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{totalRequests}</div>
              <p className="text-xs text-muted-foreground">
                Solicitações de serviços
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar serviços..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Todas as Categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Categorias</SelectItem>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              Mostrando {filteredServices.length} de {totalServices} serviços
            </div>
          </CardContent>
        </Card>

        {/* Services Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Serviços</CardTitle>
            <CardDescription>
              Gerencie todos os serviços oferecidos na plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredServices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum serviço encontrado
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SL</TableHead>
                    <TableHead>Nome do Serviço</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Prestador</TableHead>
                    <TableHead>Zona de Atendimento</TableHead>
                    <TableHead>Preço Mínimo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.map((service, index) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{service.title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {service.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{service.category?.name || "Sem categoria"}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{service.provider?.user?.name || "Prestador não encontrado"}</p>
                          <p className="text-sm text-muted-foreground">
                            {service.provider?.user?.email || "Email não disponível"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">
                            {service.serviceArea || "Não especificado"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold">R$ {parseFloat(service.minPrice || "0").toFixed(2)}</p>
                          <Badge className={getPricingTypeColor(service.pricingType)} variant="outline">
                            {getPricingTypeText(service.pricingType)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(service.isActive)}>
                          {service.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(service.id, service.isActive)}
                          >
                            {service.isActive ? "Desativar" : "Ativar"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteService(service.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </ModernAdminLayout>
  );
}