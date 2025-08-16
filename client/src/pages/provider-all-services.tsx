import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ModernProviderLayout } from "@/components/layout/modern-provider-layout";
import { Search, Loader2, UserPlus, UserMinus, Filter, X } from "lucide-react";

interface ServiceCategory {
  id: number;
  name: string;
  description: string;
  icon?: string;
  imageUrl?: string;
  color?: string;
  isActive: boolean;
}

interface Service {
  id: number;
  categoryId: number;
  name: string;
  description: string;
  shortDescription?: string;
  estimatedDuration?: string;
  durationType?: string;
  materialsIncluded: boolean;
  materialsDescription?: string;
  defaultChargingType: string;
  suggestedMinPrice?: string;
  suggestedMaxPrice?: string;
  tags?: string;
  requirements?: string;
  imageUrl?: string;
  isActive: boolean;
  category: ServiceCategory;
}

interface ProviderService {
  id: number;
  providerId: number;
  serviceId: number;
  customName?: string;
  customDescription?: string;
  price?: string;
  minimumPrice?: string;
  serviceRadius: number;
  serviceZones?: string;
  availableHours?: string;
  customRequirements?: string;
  portfolioImages?: string;
  specialNotes?: string;
  isActive: boolean;
  service: Service;
}

export default function ProviderAllServices() {
  const { user, loading: authLoading, isLoggingOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Fetch provider data first
  const { data: provider, isLoading: providerLoading } = useQuery({
    queryKey: ["/api/providers/me"],
    enabled: user?.userType === "provider",
  });

  // Fetch services catalog available for adoption
  const { data: servicesCatalog, isLoading: catalogLoading } = useQuery<Service[]>({
    queryKey: ["/api/admin/services-catalog"],
  });

  // Fetch services available for this provider to adopt
  const { data: availableServices, isLoading: availableLoading } = useQuery<Service[]>({
    queryKey: ["/api/provider/available-services"],
    enabled: !!provider,
  });

  // Fetch current provider's services
  const { data: providerServices, isLoading: servicesLoading } = useQuery<ProviderService[]>({
    queryKey: ["/api/providers/services"],
    enabled: !!provider,
  });

  // Fetch service categories
  const { data: categories, isLoading: categoriesLoading } = useQuery<ServiceCategory[]>({
    queryKey: ["/api/categories"],
  });

  // Adopt service from catalog mutation
  const adoptServiceMutation = useMutation({
    mutationFn: (serviceData: { 
      serviceId: number; 
      customName?: string; 
      customDescription?: string; 
      price: string;
      minimumPrice?: string;
      serviceRadius: number;
      serviceZones?: string;
      availableHours?: string;
      customRequirements?: string;
      specialNotes?: string;
    }) =>
      apiRequest("POST", "/api/provider/adopt-service", serviceData),
    onSuccess: () => {
      toast({
        title: "Serviço adotado!",
        description: "Serviço do catálogo adotado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/providers/services"] });
      queryClient.invalidateQueries({ queryKey: ["/api/provider/available-services"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adotar serviço",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Unsubscribe from service mutation
  const unsubscribeFromServiceMutation = useMutation({
    mutationFn: (serviceId: number) =>
      apiRequest("DELETE", `/api/provider-services/${serviceId}`),
    onSuccess: () => {
      toast({
        title: "Desinscrição realizada!",
        description: "Você foi desinscrito do serviço com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/providers/services"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao se desinscrever",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle service status mutation
  const toggleServiceStatusMutation = useMutation({
    mutationFn: ({ serviceId, isActive }: { serviceId: number; isActive: boolean }) =>
      apiRequest("PUT", `/api/provider-services/${serviceId}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/providers/services"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao alterar status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Combine services catalog with provider adoption status
  const servicesData = (servicesCatalog as any[])?.map((catalogService: any) => {
    const providerService = (providerServices as any[])?.find((ps: any) => 
      ps.serviceId === catalogService.id
    );
    return {
      id: catalogService.id,
      name: catalogService.name,
      description: catalogService.description,
      category: catalogService.category?.name || "Sem Categoria",
      categoryId: catalogService.categoryId,
      suggestedMinPrice: catalogService.suggestedMinPrice,
      suggestedMaxPrice: catalogService.suggestedMaxPrice,
      defaultChargingType: catalogService.defaultChargingType,
      isAdopted: !!providerService,
      isActive: providerService?.isActive ?? false,
      providerServiceId: providerService?.id,
      customPrice: providerService?.price,
      serviceRadius: providerService?.serviceRadius,
    };
  }) || [];

  const filteredServices = servicesData.filter((service: any) => {
    const matchesSearch = service.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || 
      service.categoryId === parseInt(selectedCategory);
    
    return matchesSearch && matchesCategory;
  });

  const handleAdoptService = (service: any) => {
    // Use suggested minimum price as default
    const defaultPrice = service.suggestedMinPrice || "50.00";
    const defaultRadius = 10; // 10km default radius
    
    adoptServiceMutation.mutate({
      serviceId: service.id,
      price: defaultPrice,
      serviceRadius: defaultRadius,
      customName: service.name, // Use catalog name as default
    });
  };

  const handleUnsubscribe = (serviceId: number) => {
    unsubscribeFromServiceMutation.mutate(serviceId);
  };

  const handleToggleStatus = (serviceId: number, currentStatus: boolean) => {
    toggleServiceStatusMutation.mutate({ 
      serviceId, 
      isActive: !currentStatus 
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
  };

  // Show loading while checking authentication or logging out
  if (authLoading || isLoggingOut) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{isLoggingOut ? "Saindo..." : "Carregando..."}</p>
        </div>
      </div>
    );
  }

  if (!user || user.userType !== "provider") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Acesso Negado</h1>
          <p className="text-muted-foreground">Você precisa ser um prestador para acessar esta página.</p>
        </div>
      </div>
    );
  }

  if (catalogLoading || providerLoading || servicesLoading || categoriesLoading) {
    return (
      <ModernProviderLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando serviços...</p>
          </div>
        </div>
      </ModernProviderLayout>
    );
  }

  return (
    <ModernProviderLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Catálogo de Serviços</h1>
            <p className="text-muted-foreground">Adote serviços do catálogo global e ofereça aos seus clientes</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar serviços..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(searchTerm || selectedCategory !== "all") && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                Limpar
              </Button>
            )}
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {filteredServices.length} de {servicesData.length} serviços
            {selectedCategory !== "all" && categories && (
              <span className="ml-1">
                na categoria "{categories.find(c => c.id.toString() === selectedCategory)?.name}"
              </span>
            )}
          </p>
        </div>

        {/* Services Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary hover:bg-primary">
                    <TableHead className="text-primary-foreground font-medium">Nome</TableHead>
                    <TableHead className="text-primary-foreground font-medium">Categoria</TableHead>
                    <TableHead className="text-primary-foreground font-medium">Preço</TableHead>
                    <TableHead className="text-primary-foreground font-medium">Status</TableHead>
                    <TableHead className="text-primary-foreground font-medium">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.length > 0 ? (
                    filteredServices.map((service) => (
                      <TableRow key={service.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{service.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{service.category}</Badge>
                        </TableCell>
                        <TableCell className="font-medium text-green-600">
                          {service.isAdopted && service.customPrice ? (
                            <span>R$ {parseFloat(service.customPrice).toFixed(2)}</span>
                          ) : service.suggestedMinPrice ? (
                            <span className="text-muted-foreground">R$ {service.suggestedMinPrice}+</span>
                          ) : (
                            <span className="text-muted-foreground">A definir</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {service.isAdopted ? (
                            <div className="flex items-center gap-2">
                              <Badge variant={service.isActive ? "default" : "secondary"}>
                                {service.isActive ? "Ativo" : "Inativo"}
                              </Badge>
                              <Switch
                                checked={service.isActive}
                                onCheckedChange={() => service.providerServiceId && handleToggleStatus(service.providerServiceId, service.isActive)}
                                disabled={toggleServiceStatusMutation.isPending}
                                className="data-[state=checked]:bg-primary"
                              />
                            </div>
                          ) : (
                            <Badge variant="outline">Não adotado</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {service.isAdopted ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => service.providerServiceId && handleUnsubscribe(service.providerServiceId)}
                              disabled={unsubscribeFromServiceMutation.isPending}
                              className="text-red-600 hover:text-red-700"
                            >
                              {unsubscribeFromServiceMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <UserMinus className="h-4 w-4 mr-2" />
                              )}
                              Remover
                            </Button>
                          ) : (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleAdoptService(service)}
                              disabled={adoptServiceMutation.isPending}
                            >
                              {adoptServiceMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <UserPlus className="h-4 w-4 mr-2" />
                              )}
                              Adotar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhum serviço encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </ModernProviderLayout>
  );
}