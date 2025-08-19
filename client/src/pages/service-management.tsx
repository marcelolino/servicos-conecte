import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Search, CheckCircle, XCircle, Edit, Trash2, Eye, DollarSign, Clock, MapPin } from "lucide-react";
import { ServiceCategory, ServiceWithCategory } from "@shared/schema";

export default function ServiceManagement() {
  const { user, loading: authLoading, isLoggingOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("list");
  const [isNewServiceOpen, setIsNewServiceOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedService, setSelectedService] = useState<ServiceWithCategory | null>(null);

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Fetch provider services
  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ["/api/providers/services"],
    enabled: !!user,
  });

  // Fetch available services from catalog for adoption
  const { data: availableServices, isLoading: availableServicesLoading } = useQuery({
    queryKey: ["/api/provider/available-services"],
    enabled: !!user && user.userType === "provider",
  });

  // Adopt service mutation
  const adoptServiceMutation = useMutation({
    mutationFn: (data: { serviceId: number; price?: string; minimumPrice?: string; customDescription?: string }) => 
      apiRequest("POST", "/api/provider/adopt-service", data),
    onSuccess: () => {
      toast({
        title: "Serviço adotado com sucesso!",
        description: "O serviço foi adicionado aos seus serviços oferecidos.",
      });
      setIsNewServiceOpen(false);
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

  const filteredServices = services?.filter((service: ServiceWithCategory) => {
    const matchesSearch = searchTerm === "" || 
                         service.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || service.categoryId.toString() === filterCategory;
    const matchesStatus = filterStatus === "all" || 
                         (filterStatus === "active" && service.isActive) ||
                         (filterStatus === "inactive" && !service.isActive);
    return matchesSearch && matchesCategory && matchesStatus;
  }) || [];

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
        <CheckCircle className="h-3 w-3 mr-1" />
        Ativo
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
        <XCircle className="h-3 w-3 mr-1" />
        Inativo
      </Badge>
    );
  };

  const renderServiceList = () => (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gerenciamento de Serviços</h2>
          <p className="text-muted-foreground">Gerencie seus serviços disponíveis</p>
        </div>
        <Button onClick={() => setIsNewServiceOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Adotar Serviço
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar serviços..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Categorias</SelectItem>
            {categories?.map((category: ServiceCategory) => (
              <SelectItem key={category.id} value={category.id.toString()}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Services Table */}
      <Card>
        <CardContent className="p-0">
          {servicesLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[150px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>Nenhum serviço encontrado.</p>
              <p className="text-sm mt-2">
                {searchTerm || filterCategory !== "all" || filterStatus !== "all" 
                  ? "Tente ajustar os filtros ou criar um novo serviço."
                  : "Comece adotando serviços do catálogo."}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredServices.map((service: ServiceWithCategory) => (
                <div key={service.id} className="p-6 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{service.name}</h3>
                        {getStatusBadge(service.isActive || false)}
                        {service.serviceId && (
                          <Badge variant="outline" className="text-xs">
                            Catálogo
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                        {service.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-2 py-1 rounded text-xs">
                          {service.category?.name}
                        </span>
                        {service.price && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            R$ {Number(service.price).toFixed(2)}
                          </span>
                        )}
                        {service.estimatedDuration && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {service.estimatedDuration}
                          </span>
                        )}
                        {service.serviceZone && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {service.serviceZone}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedService(service)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  if (authLoading || isLoggingOut) {
    return <div>Loading...</div>;
  }

  if (!user || user.userType !== "provider") {
    return <div>Access denied. Provider access required.</div>;
  }

  return (
    <div className="min-h-screen bg-muted/30 p-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">Meus Serviços</TabsTrigger>
          <TabsTrigger value="requests">Solicitações</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          {renderServiceList()}
        </TabsContent>

        <TabsContent value="requests" className="space-y-6">
          <div className="text-center py-8">
            <p>Solicitações de serviços em desenvolvimento...</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Adopt Service Dialog */}
      <Dialog open={isNewServiceOpen} onOpenChange={setIsNewServiceOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adotar Serviço do Catálogo</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Escolha um serviço do catálogo para adicionar aos seus serviços oferecidos
            </p>
          </DialogHeader>
          <div className="space-y-4">
            {availableServicesLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <Skeleton className="h-12 w-12" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[150px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : availableServices && availableServices.length > 0 ? (
              <div className="grid gap-4 max-h-[400px] overflow-y-auto">
                {availableServices.map((service: any) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold">{service.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {service.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          {service.category?.name}
                        </span>
                        {service.estimatedDuration && (
                          <span>⏱️ {service.estimatedDuration}</span>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        adoptServiceMutation.mutate({ 
                          serviceId: service.id,
                          price: service.suggestedPrice || "",
                        });
                      }}
                      disabled={adoptServiceMutation.isPending}
                      size="sm"
                    >
                      {adoptServiceMutation.isPending ? "Adotando..." : "Adotar"}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Não há serviços disponíveis para adoção no momento.</p>
                <p className="text-sm mt-2">
                  Você já adotou todos os serviços disponíveis no catálogo.
                </p>
              </div>
            )}
            
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground mb-3">
                Não encontrou o serviço que procura? Solicite um novo serviço:
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  toast({
                    title: "Em desenvolvimento",
                    description: "Funcionalidade de solicitação de novos serviços será implementada em breve.",
                  });
                }}
                className="w-full"
              >
                Solicitar Novo Serviço
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Service Details Modal */}
      {selectedService && (
        <Dialog open={!!selectedService} onOpenChange={() => setSelectedService(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Detalhes do Serviço</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">Categoria</p>
                <p className="text-sm text-muted-foreground">{selectedService.category?.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Descrição</p>
                <p className="text-sm text-muted-foreground">{selectedService.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Preço</p>
                  <p className="text-sm text-muted-foreground">
                    R$ {Number(selectedService.price || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <div className="mt-1">
                    {getStatusBadge(selectedService.isActive || false)}
                  </div>
                </div>
              </div>
              {selectedService.serviceId && (
                <div>
                  <p className="text-sm font-medium">Origem</p>
                  <Badge variant="outline" className="text-xs">
                    Adotado do catálogo (ID: {selectedService.serviceId})
                  </Badge>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}