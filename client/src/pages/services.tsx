import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Search, Filter, ShoppingCart, Plus, Star, MapPin, Clock, Shield, DollarSign } from "lucide-react";

interface ServiceCategory {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  imageUrl?: string;
  color?: string;
}

interface Provider {
  id: number;
  userId: number;
  rating: string;
  totalReviews: number;
  user: {
    id: number;
    name: string;
    avatar?: string;
    city?: string;
    state?: string;
  };
}

interface Service {
  id: number;
  categoryId: number;
  name: string;
  description: string;
  shortDescription?: string;
  estimatedDuration?: string;
  durationType?: string;
  materialsIncluded?: boolean;
  materialsDescription?: string;
  defaultChargingType?: 'visit' | 'hour' | 'daily' | 'package' | 'quote';
  price?: string;
  suggestedMinPrice?: string;
  suggestedMaxPrice?: string;
  tags?: string;
  requirements?: string;
  imageUrl?: string;
  isActive: boolean;
}

// Catalog service interface (services without provider)
interface CatalogService {
  id: number;
  categoryId: number;
  name: string;
  description: string;
  shortDescription?: string;
  estimatedDuration?: string;
  durationType?: string;
  materialsIncluded?: boolean;
  materialsDescription?: string;
  defaultChargingType?: 'visit' | 'hour' | 'daily' | 'package' | 'quote';
  price?: string;
  suggestedMinPrice?: string;
  suggestedMaxPrice?: string;
  tags?: string;
  requirements?: string;
  imageUrl?: string;
  isActive: boolean;
  category: ServiceCategory;
  type: 'catalog'; // To distinguish from provider services
}

// Combined service type
type CombinedService = ProviderService | CatalogService;

interface ChargingType {
  id: number;
  providerServiceId: number;
  chargingType: string;
  price: string;
  description?: string;
  isActive: boolean;
}

interface ProviderService {
  id: number;
  providerId: number;
  serviceId: number;
  categoryId: number;
  name?: string;
  description?: string;
  price?: string;
  minimumPrice?: string;
  estimatedDuration?: string;
  requirements?: string;
  serviceZone?: string;
  images?: string;
  isActive: boolean;
  category: ServiceCategory;
  provider: Provider;
  service?: Service;
  chargingTypes: ChargingType[];
}

export default function ServicesPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("price");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("");

  // Read URL parameters to set initial category
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, []);

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Fetch all provider services
  const { data: providerServices, isLoading: providerServicesLoading } = useQuery({
    queryKey: ["/api/services/all", selectedCity, selectedState],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedCity) params.append('city', selectedCity);
      if (selectedState) params.append('state', selectedState);
      const queryString = params.toString();
      return fetch(`/api/services/all${queryString ? '?' + queryString : ''}`)
        .then(res => res.json());
    },
  });

  // Fetch catalog services (services without provider)
  const { data: catalogServices, isLoading: catalogServicesLoading } = useQuery({
    queryKey: ["/api/services-catalog"],
  });

  const servicesLoading = providerServicesLoading || catalogServicesLoading;

  // Fetch cart (only if user is authenticated)
  const { data: cart } = useQuery({
    queryKey: ["/api/cart"],
    enabled: !!user,
  });

  // Add to cart mutation for provider services
  const addToCartMutation = useMutation({
    mutationFn: (data: { providerServiceId?: number; catalogServiceId?: number; quantity: number; unitPrice: string }) =>
      apiRequest("POST", "/api/cart/items", data),
    onSuccess: () => {
      toast({
        title: "Item adicionado ao carrinho!",
        description: "O item foi adicionado com sucesso ao seu carrinho.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar ao carrinho",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Combine both types of services
  const allServices: CombinedService[] = [
    ...(providerServices as ProviderService[] || []),
    ...(catalogServices as CatalogService[] || []).map(service => ({
      ...service,
      type: 'catalog' as const
    }))
  ];

  // Helper function to check if service is a catalog service
  const isCatalogService = (service: CombinedService): service is CatalogService => {
    return 'type' in service && service.type === 'catalog';
  };

  // Helper function to get price range from charging types
  const getPriceRange = (service: CombinedService) => {
    if (isCatalogService(service)) {
      // For catalog services, use the fixed price
      const price = parseFloat(service.price || "0");
      return {
        min: price,
        max: price,
        hasChargingTypes: false
      };
    }
    
    // For provider services
    const providerService = service as ProviderService;
    if (!providerService.chargingTypes || providerService.chargingTypes.length === 0) {
      return {
        min: parseFloat(providerService.price || "0"),
        max: parseFloat(providerService.price || "0"),
        hasChargingTypes: false
      };
    }
    
    const prices = providerService.chargingTypes
      .filter(ct => ct.price && ct.chargingType !== 'quote')
      .map(ct => parseFloat(ct.price));
    
    if (prices.length === 0) {
      return {
        min: parseFloat(providerService.price || "0"),
        max: parseFloat(providerService.price || "0"),
        hasChargingTypes: false
      };
    }
    
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
      hasChargingTypes: true
    };
  };

  const filteredServices = allServices.filter((service: CombinedService) => {
    const matchesCategory = selectedCategory === "all" || service.categoryId.toString() === selectedCategory;
    const matchesSearch = !searchTerm || 
      service.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.category.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch && service.isActive;
  }).sort((a: CombinedService, b: CombinedService) => {
    switch (sortBy) {
      case "price":
        const aPriceRange = getPriceRange(a);
        const bPriceRange = getPriceRange(b);
        return aPriceRange.min - bPriceRange.min;
      case "rating":
        // Only provider services have ratings, catalog services come first
        const aRating = isCatalogService(a) ? 0 : parseFloat((a as ProviderService).provider.rating);
        const bRating = isCatalogService(b) ? 0 : parseFloat((b as ProviderService).provider.rating);
        return bRating - aRating;
      case "name":
        return (a.name || "").localeCompare(b.name || "");
      default:
        return 0;
    }
  });

  const handleAddToCart = (service: CombinedService) => {
    // Check if user is authenticated
    if (!user) {
      setLocation("/login");
      return;
    }

    const priceRange = getPriceRange(service);
    const unitPrice = priceRange.hasChargingTypes ? priceRange.min.toFixed(2) : (service.price || "0.00");
    
    if (isCatalogService(service)) {
      // For catalog services, add to cart with catalogServiceId
      addToCartMutation.mutate({
        catalogServiceId: service.id,
        quantity: 1,
        unitPrice: unitPrice,
      });
    } else {
      // For provider services, add to cart with providerServiceId
      addToCartMutation.mutate({
        providerServiceId: service.id,
        quantity: 1,
        unitPrice: unitPrice,
      });
    }
  };

  const getServiceImage = (service: CombinedService) => {
    if (isCatalogService(service)) {
      // For catalog services, use imageUrl directly
      return service.imageUrl || "/uploads/services/limpeza_residencial.png";
    }
    
    // For provider services
    const providerService = service as ProviderService;
    try {
      // Try to parse images JSON array first
      const images = JSON.parse(providerService.images || "[]");
      if (images.length > 0) {
        return images[0];
      }
      
      // Fallback to service imageUrl if available
      if (providerService.service?.imageUrl) {
        return providerService.service.imageUrl;
      }
      
      // Fallback to default service image
      return "/uploads/services/limpeza_residencial.png";
    } catch {
      // Fallback to service imageUrl or default
      return providerService.service?.imageUrl || "/uploads/services/limpeza_residencial.png";
    }
  };

  const cartItemCount = Array.isArray((cart as any)?.items) ? (cart as any).items.reduce((sum: number, item: any) => sum + item.quantity, 0) : 0;

  if (categoriesLoading || servicesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Serviços Disponíveis</h1>
              <p className="text-muted-foreground">Encontre o serviço perfeito para suas necessidades</p>
            </div>
            <Button 
              variant="outline" 
              className="relative"
              onClick={() => setLocation("/cart")}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Carrinho
              {cartItemCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {cartItemCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white dark:bg-gray-900 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => setSelectedCategory("all")}
              className="whitespace-nowrap"
            >
              Todas
            </Button>
            {Array.isArray(categories) ? categories.map((category: ServiceCategory) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id.toString() ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.id.toString())}
                className="whitespace-nowrap"
              >
                {category.name}
              </Button>
            )) : null}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col gap-4 mb-6">
          {/* Search bar */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar serviços..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          {/* Location and Sort filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger className="w-full md:w-48">
                  <MapPin className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os estados</SelectItem>
                  <SelectItem value="AC">Acre</SelectItem>
                  <SelectItem value="AL">Alagoas</SelectItem>
                  <SelectItem value="AP">Amapá</SelectItem>
                  <SelectItem value="AM">Amazonas</SelectItem>
                  <SelectItem value="BA">Bahia</SelectItem>
                  <SelectItem value="CE">Ceará</SelectItem>
                  <SelectItem value="DF">Distrito Federal</SelectItem>
                  <SelectItem value="ES">Espírito Santo</SelectItem>
                  <SelectItem value="GO">Goiás</SelectItem>
                  <SelectItem value="MA">Maranhão</SelectItem>
                  <SelectItem value="MT">Mato Grosso</SelectItem>
                  <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                  <SelectItem value="MG">Minas Gerais</SelectItem>
                  <SelectItem value="PA">Pará</SelectItem>
                  <SelectItem value="PB">Paraíba</SelectItem>
                  <SelectItem value="PR">Paraná</SelectItem>
                  <SelectItem value="PE">Pernambuco</SelectItem>
                  <SelectItem value="PI">Piauí</SelectItem>
                  <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                  <SelectItem value="RN">Rio Grande do Norte</SelectItem>
                  <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                  <SelectItem value="RO">Rondônia</SelectItem>
                  <SelectItem value="RR">Roraima</SelectItem>
                  <SelectItem value="SC">Santa Catarina</SelectItem>
                  <SelectItem value="SP">São Paulo</SelectItem>
                  <SelectItem value="SE">Sergipe</SelectItem>
                  <SelectItem value="TO">Tocantins</SelectItem>
                </SelectContent>
              </Select>
              
              <Input
                placeholder="Cidade..."
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full md:w-48"
              />
            </div>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price">Menor preço</SelectItem>
                <SelectItem value="rating">Melhor avaliação</SelectItem>
                <SelectItem value="name">Nome A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Active filters display */}
          {(selectedCity || selectedState) && (
            <div className="flex flex-wrap gap-2">
              {selectedState && (
                <Badge variant="secondary" className="gap-2">
                  Estado: {selectedState}
                  <button
                    onClick={() => setSelectedState("")}
                    className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {selectedCity && (
                <Badge variant="secondary" className="gap-2">
                  Cidade: {selectedCity}
                  <button
                    onClick={() => setSelectedCity("")}
                    className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.isArray(filteredServices) ? filteredServices.map((service: CombinedService) => (
            <Card key={`${isCatalogService(service) ? 'catalog' : 'provider'}-${service.id}`} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video relative">
                <img
                  src={getServiceImage(service)}
                  alt={service.name || service.category.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/uploads/services/limpeza_residencial.png';
                  }}
                />
                <div className="absolute top-2 left-2">
                  <Badge variant="secondary">{service.category.name}</Badge>
                </div>
                <div className="absolute top-2 right-2">
                  {isCatalogService(service) ? (
                    <Badge variant="outline" className="bg-blue-500 text-white border-blue-500">
                      Prestador a definir
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-green-500 text-white border-green-500">
                      Prestador definido
                    </Badge>
                  )}
                </div>
              </div>
              
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">
                      {service.name || service.category.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      {!isCatalogService(service) && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-current text-yellow-500" />
                          <span>{parseFloat((service as ProviderService).provider.rating).toFixed(1)}</span>
                          <span>({(service as ProviderService).provider.totalReviews})</span>
                        </div>
                      )}
                      {!isCatalogService(service) && (service as ProviderService).provider.user.city && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{(service as ProviderService).provider.user.city}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    {isCatalogService(service) ? (
                      <div className="text-sm text-muted-foreground">Serviço do catálogo - Prestador será designado após compra</div>
                    ) : (
                      <div className="text-sm text-muted-foreground">Por {(service as ProviderService).provider.user.name}</div>
                    )}
                    {service.estimatedDuration && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Duração: {service.estimatedDuration}
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {service.description || `Serviço de ${service.category.name.toLowerCase()}`}
                </p>

                {/* Informações adicionais do serviço */}
                <div className="mb-3 space-y-1">
                  {/* Materiais incluídos */}
                  {(isCatalogService(service) ? service.materialsIncluded : service.service?.materialsIncluded) && (
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <Shield className="h-3 w-3" />
                      <span>Materiais incluídos</span>
                    </div>
                  )}
                  
                  {/* Tipo de cobrança */}
                  {(isCatalogService(service) ? service.defaultChargingType : service.service?.defaultChargingType) && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <DollarSign className="h-3 w-3" />
                      <span>
                        {(isCatalogService(service) ? service.defaultChargingType : service.service?.defaultChargingType) === 'visit' && 'Por visita'}
                        {(isCatalogService(service) ? service.defaultChargingType : service.service?.defaultChargingType) === 'hour' && 'Por hora'}
                        {(isCatalogService(service) ? service.defaultChargingType : service.service?.defaultChargingType) === 'daily' && 'Diária'}
                        {(isCatalogService(service) ? service.defaultChargingType : service.service?.defaultChargingType) === 'package' && 'Pacote'}
                        {(isCatalogService(service) ? service.defaultChargingType : service.service?.defaultChargingType) === 'quote' && 'Orçamento'}
                      </span>
                    </div>
                  )}
                  
                  {/* Tags do serviço */}
                  {(isCatalogService(service) ? service.tags : service.service?.tags) && (() => {
                    try {
                      const tags = JSON.parse(isCatalogService(service) ? service.tags || '[]' : service.service?.tags || '[]');
                      return Array.isArray(tags) && tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {tags.slice(0, 3).map((tag: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      );
                    } catch {
                      return null;
                    }
                  })()}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    {(() => {
                      const priceRange = getPriceRange(service);
                      
                      if (isCatalogService(service)) {
                        return (
                          <div>
                            <div className="text-lg font-bold text-primary">
                              R$ {parseFloat(service.price || "0").toFixed(2)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Preço fixo do catálogo
                            </div>
                          </div>
                        );
                      }
                      
                      // For provider services
                      const providerService = service as ProviderService;
                      const hasQuoteOnly = providerService.chargingTypes?.some(ct => ct.chargingType === 'quote') && 
                        providerService.chargingTypes?.filter(ct => ct.price && ct.chargingType !== 'quote').length === 0;
                      
                      if (hasQuoteOnly) {
                        return (
                          <div className="text-lg font-bold text-primary">
                            Sob consulta
                          </div>
                        );
                      }
                      
                      if (priceRange.hasChargingTypes) {
                        if (priceRange.min === priceRange.max) {
                          return (
                            <div className="text-lg font-bold text-primary">
                              R$ {priceRange.min.toFixed(2)}
                            </div>
                          );
                        } else {
                          return (
                            <div>
                              <div className="text-lg font-bold text-primary">
                                R$ {priceRange.min.toFixed(2)} - R$ {priceRange.max.toFixed(2)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Faixa configurada pelo prestador
                              </div>
                            </div>
                          );
                        }
                      } else {
                        return (
                          <div>
                            <div className="text-lg font-bold text-primary">
                              R$ {parseFloat(providerService.price || "0").toFixed(2)}
                            </div>
                            {providerService.minimumPrice && providerService.minimumPrice !== providerService.price && (
                              <div className="text-xs text-muted-foreground">
                                Mínimo: R$ {parseFloat(providerService.minimumPrice).toFixed(2)}
                              </div>
                            )}
                            {/* Faixa de preço sugerida do catálogo */}
                            {providerService.service?.suggestedMinPrice && providerService.service?.suggestedMaxPrice && (
                              <div className="text-xs text-muted-foreground">
                                Faixa sugerida: R$ {parseFloat(providerService.service.suggestedMinPrice).toFixed(2)} - R$ {parseFloat(providerService.service.suggestedMaxPrice).toFixed(2)}
                              </div>
                            )}
                          </div>
                        );
                      }
                    })()} 
                  </div>
                  <Button
                    onClick={() => handleAddToCart(service)}
                    disabled={addToCartMutation.isPending}
                    size="sm"
                  >
                    {addToCartMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    Adicionar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )) : null}
        </div>

        {Array.isArray(filteredServices) && filteredServices?.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold mb-2">Nenhum serviço encontrado</h3>
            <p className="text-muted-foreground">
              Tente ajustar os filtros ou termo de busca
            </p>
          </div>
        )}
      </div>
    </div>
  );
}