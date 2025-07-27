import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ProviderLayout from "@/components/layout/provider-layout";
import { Search, Loader2, UserPlus, UserMinus } from "lucide-react";

interface ServiceCategory {
  id: number;
  name: string;
  description: string;
  icon?: string;
  imageUrl?: string;
  color?: string;
  isActive: boolean;
}

interface ProviderService {
  id: number;
  providerId: number;
  categoryId: number;
  name?: string;
  description?: string;
  price?: string;
  isActive: boolean;
  category: ServiceCategory;
}

export default function ProviderAllServices() {
  const { user, loading: authLoading, isLoggingOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all service categories from admin
  const { data: allCategories, isLoading: categoriesLoading } = useQuery<ServiceCategory[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch provider data
  const { data: provider, isLoading: providerLoading } = useQuery({
    queryKey: ["/api/providers/me"],
    enabled: user?.userType === "provider",
  });

  // Fetch current provider's services
  const { data: providerServices, isLoading: servicesLoading } = useQuery<ProviderService[]>({
    queryKey: ["/api/providers/services"],
    enabled: !!provider,
  });

  // Subscribe to service mutation
  const subscribeToServiceMutation = useMutation({
    mutationFn: (categoryData: { categoryId: number; categoryName: string }) =>
      apiRequest("POST", "/api/provider-services", {
        categoryId: categoryData.categoryId,
        name: `Serviço de ${categoryData.categoryName}`,
        price: "50.00",
        description: `Serviço profissional de ${categoryData.categoryName}`,
        isActive: true,
      }),
    onSuccess: () => {
      toast({
        title: "Inscrição realizada!",
        description: "Você foi inscrito no serviço com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/providers/services"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao se inscrever",
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

  // Combine all categories with provider subscription status
  const servicesData = allCategories?.map(category => {
    const providerService = providerServices?.find(ps => ps.categoryId === category.id);
    return {
      id: category.id,
      name: category.name,
      category: category.name,
      price: providerService?.price || "50.00",
      isSubscribed: !!providerService,
      isActive: providerService?.isActive ?? false,
      providerServiceId: providerService?.id,
    };
  }) || [];

  const filteredServices = servicesData.filter(service => 
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubscribe = (categoryId: number, categoryName: string) => {
    subscribeToServiceMutation.mutate({ categoryId, categoryName });
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

  if (categoriesLoading || providerLoading || servicesLoading) {
    return (
      <ProviderLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando serviços...</p>
          </div>
        </div>
      </ProviderLayout>
    );
  }

  return (
    <ProviderLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gerenciar Serviços</h1>
            <p className="text-muted-foreground">Inscreva-se ou desinscreva-se dos serviços disponíveis</p>
          </div>
        </div>

        {/* Search */}
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
                          R$ {parseFloat(service.price).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {service.isSubscribed ? (
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
                            <Badge variant="outline">Não inscrito</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {service.isSubscribed ? (
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
                              Desinscrever
                            </Button>
                          ) : (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleSubscribe(service.id, service.name)}
                              disabled={subscribeToServiceMutation.isPending}
                            >
                              {subscribeToServiceMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <UserPlus className="h-4 w-4 mr-2" />
                              )}
                              Inscrever
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
    </ProviderLayout>
  );
}