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
  suggestedMinPrice?: string;
  suggestedMaxPrice?: string;
  tags?: string;
  requirements?: string;
  imageUrl?: string;
  isActive: boolean;
}

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
  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ["/api/services/all"],
  });

  // Fetch cart (only if user is authenticated)
  const { data: cart } = useQuery({
    queryKey: ["/api/cart"],
    enabled: !!user,
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: (data: { providerServiceId: number; quantity: number; unitPrice: string }) =>
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

  // Helper function to get price range from charging types
  const getPriceRange = (service: ProviderService) => {
    if (!service.chargingTypes || service.chargingTypes.length === 0) {
      return {
        min: parseFloat(service.price || "0"),
        max: parseFloat(service.price || "0"),
        hasChargingTypes: false
      };
    }
    
    const prices = service.chargingTypes
      .filter(ct => ct.price && ct.chargingType !== 'quote')
      .map(ct => parseFloat(ct.price));
    
    if (prices.length === 0) {
      return {
        min: parseFloat(service.price || "0"),
        max: parseFloat(service.price || "0"),
        hasChargingTypes: false
      };
    }
    
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
      hasChargingTypes: true
    };
  };

  const filteredServices = (services as ProviderService[] || [])?.filter((service: ProviderService) => {
    const matchesCategory = selectedCategory === "all" || service.categoryId.toString() === selectedCategory;
    const matchesSearch = !searchTerm || 
      service.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.category.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch && service.isActive;
  }).sort((a: ProviderService, b: ProviderService) => {
    switch (sortBy) {
      case "price":
        const aPriceRange = getPriceRange(a);
        const bPriceRange = getPriceRange(b);
        return aPriceRange.min - bPriceRange.min;
      case "rating":
        return parseFloat(b.provider.rating) - parseFloat(a.provider.rating);
      case "name":
        return (a.name || "").localeCompare(b.name || "");
      default:
        return 0;
    }
  });

  const handleAddToCart = (service: ProviderService) => {
    // Check if user is authenticated
    if (!user) {
      setLocation("/login");
      return;
    }

    const priceRange = getPriceRange(service);
    const unitPrice = priceRange.hasChargingTypes ? priceRange.min.toFixed(2) : (service.price || "0.00");
    
    addToCartMutation.mutate({
      providerServiceId: service.id,
      quantity: 1,
      unitPrice: unitPrice,
    });
  };

  const getServiceImage = (service: ProviderService) => {
    try {
      const images = JSON.parse(service.images || "[]");
      return images[0] || "/api/placeholder/300/200";
    } catch {
      return "/api/placeholder/300/200";
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
        <div className="flex flex-col md:flex-row gap-4 mb-6">
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

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.isArray(filteredServices) ? filteredServices.map((service: ProviderService) => (
            <Card key={service.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video relative">
                <img
                  src={getServiceImage(service)}
                  alt={service.name || service.category.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2">
                  <Badge variant="secondary">{service.category.name}</Badge>
                </div>
              </div>
              
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">
                      {service.name || service.category.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current text-yellow-500" />
                        <span>{parseFloat(service.provider.rating).toFixed(1)}</span>
                        <span>({service.provider.totalReviews})</span>
                      </div>
                      {service.provider.user.city && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{service.provider.user.city}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-sm text-muted-foreground">Por {service.provider.user.name}</div>
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
                  {service.service?.materialsIncluded && (
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <Shield className="h-3 w-3" />
                      <span>Materiais incluídos</span>
                    </div>
                  )}
                  
                  {/* Tipo de cobrança */}
                  {service.service?.defaultChargingType && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <DollarSign className="h-3 w-3" />
                      <span>
                        {service.service.defaultChargingType === 'visit' && 'Por visita'}
                        {service.service.defaultChargingType === 'hour' && 'Por hora'}
                        {service.service.defaultChargingType === 'daily' && 'Diária'}
                        {service.service.defaultChargingType === 'package' && 'Pacote'}
                        {service.service.defaultChargingType === 'quote' && 'Orçamento'}
                      </span>
                    </div>
                  )}
                  
                  {/* Tags do serviço */}
                  {service.service?.tags && (() => {
                    try {
                      const tags = JSON.parse(service.service.tags);
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
                      const hasQuoteOnly = service.chargingTypes?.some(ct => ct.chargingType === 'quote') && 
                        service.chargingTypes?.filter(ct => ct.price && ct.chargingType !== 'quote').length === 0;
                      
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
                              R$ {parseFloat(service.price || "0").toFixed(2)}
                            </div>
                            {service.minimumPrice && service.minimumPrice !== service.price && (
                              <div className="text-xs text-muted-foreground">
                                Mínimo: R$ {parseFloat(service.minimumPrice).toFixed(2)}
                              </div>
                            )}
                            {/* Faixa de preço sugerida do catálogo */}
                            {service.service?.suggestedMinPrice && service.service?.suggestedMaxPrice && (
                              <div className="text-xs text-muted-foreground">
                                Faixa sugerida: R$ {parseFloat(service.service.suggestedMinPrice).toFixed(2)} - R$ {parseFloat(service.service.suggestedMaxPrice).toFixed(2)}
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