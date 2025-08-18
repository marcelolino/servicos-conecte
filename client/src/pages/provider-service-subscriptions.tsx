import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ModernProviderLayout } from "@/components/layout/modern-provider-layout";
import { 
  Search, 
  Filter,
  Eye,
  Edit,
  Settings,
  CheckCircle,
  XCircle,
  DollarSign,
  Loader2,
  Image as ImageIcon,
  Clock,
  ShieldCheck,
  MapPin,
  User
} from "lucide-react";
import type { ServiceCategory, ProviderService } from "@shared/schema";

interface ProviderServiceWithCategory extends ProviderService {
  category: ServiceCategory;
  service?: {
    id: number;
    name: string;
    description?: string;
    category: ServiceCategory;
    imageUrl?: string;
    estimatedDuration?: string;
    materialsIncluded?: boolean;
    materialsDescription?: string;
    requirements?: string;
    suggestedMinPrice?: string;
    suggestedMaxPrice?: string;
  };
  chargingTypes?: any[];
}

export default function ProviderServiceSubscriptionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedService, setSelectedService] = useState<ProviderServiceWithCategory | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch service categories
  const { data: categories, isLoading: categoriesLoading } = useQuery<ServiceCategory[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch provider's subscribed services
  const { data: providerServices = [], isLoading: servicesLoading } = useQuery<ProviderServiceWithCategory[]>({
    queryKey: ["/api/providers/services"],
  });

  // Toggle service status mutation
  const toggleServiceStatusMutation = useMutation({
    mutationFn: ({ serviceId, isActive }: { serviceId: number; isActive: boolean }) =>
      apiRequest("PUT", `/api/provider-services/${serviceId}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/providers/services"] });
      toast({
        title: "Status atualizado!",
        description: "O status do serviço foi atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleToggleStatus = (serviceId: number, currentStatus: boolean) => {
    toggleServiceStatusMutation.mutate({ 
      serviceId, 
      isActive: !currentStatus 
    });
  };

  // Filter services
  const filteredServices = providerServices.filter((service) => {
    const matchesSearch = service.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.category?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || 
      service.categoryId === parseInt(selectedCategory);
    
    const matchesStatus = selectedStatus === "all" || 
      (selectedStatus === "active" && service.isActive) ||
      (selectedStatus === "inactive" && !service.isActive);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="default" className="flex items-center gap-1 bg-green-500">
        <CheckCircle className="h-3 w-3" />Ativo
      </Badge>
    ) : (
      <Badge variant="secondary" className="flex items-center gap-1">
        <XCircle className="h-3 w-3" />Inativo
      </Badge>
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedStatus("all");
  };

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

  if (categoriesLoading || servicesLoading) {
    return (
      <ModernProviderLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando suas inscrições...</p>
          </div>
        </div>
      </ModernProviderLayout>
    );
  }

  return (
    <ModernProviderLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Meus Serviços</h1>
            <p className="text-muted-foreground">
              Gerencie seus serviços e tipos de cobrança
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Serviços</p>
                  <p className="text-3xl font-bold text-foreground">{providerServices.length}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Settings className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Serviços Ativos</p>
                  <p className="text-3xl font-bold text-green-600">
                    {providerServices.filter(s => s.isActive).length}
                  </p>
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
                  <p className="text-sm font-medium text-muted-foreground">Serviços Inativos</p>
                  <p className="text-3xl font-bold text-red-600">
                    {providerServices.filter(s => !s.isActive).length}
                  </p>
                </div>
                <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Categorias</p>
                  <p className="text-3xl font-bold text-foreground">
                    {new Set(providerServices.map(s => s.categoryId)).size}
                  </p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Eye className="h-6 w-6 text-purple-600" />
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
                    placeholder="Pesquisar por categoria ou nome do serviço..."
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
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
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

        {/* Services Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredServices.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="text-muted-foreground">
                {searchTerm || selectedCategory !== "all" || selectedStatus !== "all"
                  ? "Nenhum serviço encontrado com os filtros aplicados." 
                  : "Você ainda não possui nenhum serviço. Vá para 'Todos De Serviços' para adicionar serviços."
                }
              </div>
            </div>
          ) : (
            filteredServices.map((service) => {
              // Parse images from JSON string
              let serviceImages: string[] = [];
              try {
                serviceImages = service.images ? JSON.parse(service.images) : [];
              } catch (e) {
                serviceImages = [];
              }
              
              const firstImage = serviceImages[0] || service.service?.imageUrl || '/uploads/services/limpeza_residencial.png';
              
              return (
                <Card key={service.id} className="group hover:shadow-lg transition-all duration-300">
                  <div className="relative overflow-hidden rounded-t-lg">
                    <img
                      src={firstImage}
                      alt={service.name || service.service?.name || 'Serviço'}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/uploads/services/limpeza_residencial.png';
                      }}
                    />
                    <div className="absolute top-2 right-2">
                      {getStatusBadge(service.isActive ?? false)}
                    </div>
                    <div className="absolute top-2 left-2">
                      <Badge variant="secondary" className="text-xs">
                        {service.category?.name}
                      </Badge>
                    </div>
                    {serviceImages.length > 1 && (
                      <div className="absolute bottom-2 right-2">
                        <Badge variant="outline" className="text-xs bg-white/80">
                          <ImageIcon className="h-3 w-3 mr-1" />
                          +{serviceImages.length - 1}
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg line-clamp-2">
                      {service.name || service.service?.name || 'Nome não definido'}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {service.description || service.service?.description || 'Descrição não disponível'}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Service Details (Read-only) */}
                    <div className="space-y-2 text-sm">
                      {service.service?.estimatedDuration && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>Duração: {service.service.estimatedDuration}</span>
                        </div>
                      )}
                      
                      {service.service?.materialsIncluded && (
                        <div className="flex items-center gap-2 text-green-600">
                          <ShieldCheck className="h-4 w-4" />
                          <span>Materiais incluídos</span>
                        </div>
                      )}
                      
                      {service.serviceZone && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span className="line-clamp-1">Zona: {service.serviceZone}</span>
                        </div>
                      )}
                      
                      {service.service?.requirements && (
                        <div className="text-gray-600">
                          <span className="font-medium">Requisitos:</span>
                          <p className="line-clamp-2 text-xs mt-1">{service.service.requirements}</p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`status-${service.id}`}
                          checked={service.isActive ?? false}
                          onCheckedChange={() => handleToggleStatus(service.id, service.isActive ?? false)}
                          disabled={toggleServiceStatusMutation.isPending}
                        />
                        <Label htmlFor={`status-${service.id}`} className="text-sm">
                          {(service.isActive ?? false) ? "Ativo" : "Inativo"}
                        </Label>
                      </div>
                      
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedService(service)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Detalhes
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>{service.name || service.service?.name}</DialogTitle>
                              <DialogDescription>
                                Detalhes completos do serviço e tipos de cobrança
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              {/* Service Images */}
                              <div className="space-y-4">
                                <h3 className="font-semibold">Imagens do Serviço</h3>
                                <div className="grid grid-cols-2 gap-2">
                                  {serviceImages.length > 0 ? serviceImages.map((image, index) => (
                                    <img
                                      key={index}
                                      src={image}
                                      alt={`${service.name} - ${index + 1}`}
                                      className="w-full h-24 object-cover rounded-lg border"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/uploads/services/limpeza_residencial.png';
                                      }}
                                    />
                                  )) : (
                                    <img
                                      src={service.service?.imageUrl || '/uploads/services/limpeza_residencial.png'}
                                      alt={service.name || 'Serviço'}
                                      className="w-full h-24 object-cover rounded-lg border"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/uploads/services/limpeza_residencial.png';
                                      }}
                                    />
                                  )}
                                </div>
                              </div>
                              
                              {/* Service Details */}
                              <div className="space-y-4">
                                <h3 className="font-semibold">Informações do Serviço</h3>
                                <div className="space-y-3 text-sm">
                                  <div>
                                    <Label className="font-medium">Categoria:</Label>
                                    <p className="text-gray-600">{service.category?.name}</p>
                                  </div>
                                  
                                  <div>
                                    <Label className="font-medium">Descrição:</Label>
                                    <p className="text-gray-600">{service.description || service.service?.description}</p>
                                  </div>
                                  
                                  {service.service?.estimatedDuration && (
                                    <div>
                                      <Label className="font-medium">Duração Estimada:</Label>
                                      <p className="text-gray-600">{service.service.estimatedDuration}</p>
                                    </div>
                                  )}
                                  
                                  {service.service?.materialsDescription && (
                                    <div>
                                      <Label className="font-medium">Materiais:</Label>
                                      <p className="text-gray-600">{service.service.materialsDescription}</p>
                                    </div>
                                  )}
                                  
                                  {service.service?.requirements && (
                                    <div>
                                      <Label className="font-medium">Requisitos:</Label>
                                      <p className="text-gray-600">{service.service.requirements}</p>
                                    </div>
                                  )}
                                  
                                  {service.serviceZone && (
                                    <div>
                                      <Label className="font-medium">Zona de Atendimento:</Label>
                                      <p className="text-gray-600">{service.serviceZone}</p>
                                    </div>
                                  )}
                                  
                                  {service.service?.suggestedMinPrice && service.service?.suggestedMaxPrice && (
                                    <div>
                                      <Label className="font-medium">Faixa de Preço Sugerida:</Label>
                                      <p className="text-gray-600">
                                        R$ {service.service.suggestedMinPrice} - R$ {service.service.suggestedMaxPrice}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Charging Types Section */}
                            <div className="mt-6 space-y-4">
                              <div className="flex items-center justify-between">
                                <h3 className="font-semibold">Tipos de Cobrança</h3>
                                <Badge variant="outline">Editável pelo prestador</Badge>
                              </div>
                              
                              {service.chargingTypes && service.chargingTypes.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {service.chargingTypes.map((ct: any, index: number) => (
                                    <Card key={index} className="p-4">
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                          <Label className="font-medium">Tipo:</Label>
                                          <Badge variant="secondary">{ct.chargingType}</Badge>
                                        </div>
                                        
                                        <div className="flex items-center justify-between">
                                          <Label className="font-medium">Preço:</Label>
                                          <span className="font-semibold text-green-600">
                                            {ct.price ? `R$ ${ct.price}` : 'Sob consulta'}
                                          </span>
                                        </div>
                                        
                                        {ct.description && (
                                          <div>
                                            <Label className="font-medium">Descrição:</Label>
                                            <p className="text-sm text-gray-600">{ct.description}</p>
                                          </div>
                                        )}
                                        
                                        {ct.minimumQuantity && (
                                          <div className="flex items-center justify-between">
                                            <Label className="font-medium">Quantidade Mínima:</Label>
                                            <span>{ct.minimumQuantity}</span>
                                          </div>
                                        )}
                                      </div>
                                    </Card>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-4 text-gray-500">
                                  Nenhum tipo de cobrança configurado
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => window.location.href = `/meus-servicos?service=${service.id}`}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Preços
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </ModernProviderLayout>
  );
}