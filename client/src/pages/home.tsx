import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { 
  Search, 
  MapPin, 
  Star, 
  TrendingUp, 
  Users, 
  Clock,
  ArrowRight,
  ShieldCheck,
  Heart,
  Zap,
  Map,
  Filter,
  X
} from "lucide-react";
import { LocationCard } from "@/components/location/LocationCard";
import { ProvidersMap } from "@/components/maps/ProvidersMap";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import type { ServiceCategory, PromotionalBanner, CustomChargingType } from "@shared/schema";

interface PageSettings {
  siteName: string;
  siteLogo: string;
  siteDescription: string;
  primaryColor: string;
  secondaryColor: string;
}

interface BannerWithCategory extends PromotionalBanner {
  category?: ServiceCategory;
}

export default function Home() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; address: string | any } | null>(null);
  const [showNearbyProviders, setShowNearbyProviders] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [proximityRadius, setProximityRadius] = useState("10"); // km
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAllServices, setShowAllServices] = useState(false);
  const SERVICES_PER_PAGE = 12;

  // Reset pagination when filters change
  useEffect(() => {
    if (selectedCategory && selectedCategory !== "all" || selectedCity || (selectedState && selectedState !== "all")) {
      setCurrentPage(1);
      setShowAllServices(true);
    } else {
      setShowAllServices(false);
      setCurrentPage(1);
    }
  }, [selectedCategory, selectedCity, selectedState]);

  // Função para formatar endereços de forma segura
  const formatAddress = (address: string | any): string => {
    if (!address) return "Localização não definida";
    
    if (typeof address === 'string') {
      return address;
    }
    
    if (typeof address === 'object' && address !== null) {
      const parts: string[] = [];
      if (address.street) parts.push(address.street);
      if (address.number) parts.push(address.number);
      if (address.neighborhood) parts.push(address.neighborhood);
      if (address.city) parts.push(address.city);
      if (address.state) parts.push(address.state);
      
      if (parts.length > 0) {
        return parts.join(', ');
      }
    }
    
    return String(address);
  };

  const { data: banners, isLoading: bannersLoading } = useQuery<BannerWithCategory[]>({
    queryKey: ['/api/banners'],
    enabled: true,
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery<ServiceCategory[]>({
    queryKey: ['/api/categories'],
    enabled: true,
  });

  const { data: pageSettings } = useQuery<PageSettings>({
    queryKey: ['/api/page-settings'],
    enabled: true,
  });

  const { data: popularProviders, isLoading: providersLoading } = useQuery<any[]>({
    queryKey: ['/api/providers/popular'],
    enabled: true,
  });

  const { data: chargingTypes } = useQuery<CustomChargingType[]>({
    queryKey: ['/api/charging-types'],
    enabled: true,
  });

  // Query for home visible services (from catalog) - used for featured/default view
  const { data: homeVisibleServices, isLoading: homeServicesLoading } = useQuery<any[]>({
    queryKey: ['/api/services-catalog/home'],
    enabled: selectedCategory === "all" && !selectedCity && (!selectedState || selectedState === "all"),
    refetchOnMount: true,
    staleTime: 0, // Always refetch to get latest data
  });

  // Query for services by category with providers (new system)
  const { data: categoryServices, isLoading: categoryServicesLoading } = useQuery<any[]>({
    queryKey: ['/api/services-catalog/category', selectedCategory, selectedCity, selectedState],
    queryFn: () => {
      if (selectedCategory === "all") return Promise.resolve([]);
      
      const params = new URLSearchParams();
      if (selectedCity) params.append('city', selectedCity);
      if (selectedState && selectedState !== "all") params.append('state', selectedState);
      const queryString = params.toString();
      return fetch(`/api/services-catalog/category/${selectedCategory}/with-providers${queryString ? '?' + queryString : ''}`)
        .then(res => res.json());
    },
    enabled: selectedCategory !== "all",
  });

  // Query for all services with providers when category is "all" but location filters are active
  const { data: allServicesWithProviders, isLoading: allServicesLoading } = useQuery<any[]>({
    queryKey: ['/api/services-catalog/all-with-providers', selectedCity, selectedState],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedCity) params.append('city', selectedCity);
      if (selectedState && selectedState !== "all") params.append('state', selectedState);
      const queryString = params.toString();
      return fetch(`/api/services-catalog/all-with-providers${queryString ? '?' + queryString : ''}`)
        .then(res => res.json());
    },
    enabled: selectedCategory === "all" && (!!selectedCity || (!!selectedState && selectedState !== "all")),
  });

  // Query for nearby providers based on user location
  const { data: nearbyProviders, isLoading: nearbyProvidersLoading } = useQuery({
    queryKey: ['/api/providers/nearby', userLocation?.lat, userLocation?.lng, proximityRadius, selectedCategory],
    enabled: showNearbyProviders && !!userLocation,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const params = new URLSearchParams({
        lat: userLocation!.lat.toString(),
        lng: userLocation!.lng.toString(),
        radius: proximityRadius,
        ...(selectedCategory !== "all" && { category: selectedCategory })
      });
      
      const response = await fetch(`/api/providers/nearby?${params}`);
      if (!response.ok) throw new Error('Failed to fetch nearby providers');
      return response.json();
    }
  });

  const filteredCategories = categories?.filter((category: ServiceCategory) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Function to get the services to display based on current filters
  const getServicesToDisplay = () => {
    // If a specific category is selected, use category services with providers
    if (selectedCategory && selectedCategory !== "all") {
      const services = categoryServices || [];
      
      // Filter by search term if present
      if (searchTerm.trim()) {
        return services.filter((service: any) => 
          service.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      return services;
    }

    // If category is "all" but location filters are active, use allServicesWithProviders
    if (selectedCity || (selectedState && selectedState !== "all")) {
      const services = allServicesWithProviders || [];
      
      // Filter by search term if present
      if (searchTerm.trim()) {
        return services.filter((service: any) => 
          service.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      return services;
    }

    // Default: show catalog services (home visible)
    const services = homeVisibleServices || [];
    
    // Filter by search term if present
    if (searchTerm.trim()) {
      return services.filter((service: any) => 
        service.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return services;
  };

  const allServicesList = getServicesToDisplay();
  const isLoadingServices = categoryServicesLoading || homeServicesLoading || allServicesLoading;
  
  // Calculate pagination
  const totalServices = allServicesList.length;
  const totalPages = Math.ceil(totalServices / SERVICES_PER_PAGE);
  const startIndex = (currentPage - 1) * SERVICES_PER_PAGE;
  const endIndex = startIndex + SERVICES_PER_PAGE;
  
  // Services to display based on whether showing all or limited
  const servicesToDisplay = showAllServices 
    ? allServicesList.slice(startIndex, endIndex)
    : allServicesList.slice(0, 12);

  const handleBannerClick = (banner: BannerWithCategory) => {
    // Increment banner click count
    fetch(`/api/banners/${banner.id}/click`, { method: 'POST' });
    
    // Navigate to category or target URL
    if (banner.targetUrl) {
      window.open(banner.targetUrl, '_blank');
    } else if (banner.category) {
      window.location.href = `/services/${banner.category.id}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      <div className="desktop-container py-8">
        {/* Location Request Card */}
        <LocationCard onLocationChange={setUserLocation} />
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
            Bem-vindo ao <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">{pageSettings?.siteName || "Qserviços"}</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto opacity-90">
            {pageSettings?.siteDescription || "Conecte-se com os melhores profissionais da sua região"}
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative glass-card p-2 rounded-2xl">
            <Search className="absolute left-5 top-5 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Buscar serviços (ex: Encanador, Limpeza, Pintor...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 text-lg border-0 bg-white/90 dark:bg-gray-900/90 focus:ring-2 focus:ring-purple-500 rounded-xl shadow-lg"
            />
          </div>
        </div>

        {/* Featured Services */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Serviços Disponíveis
            </h2>
            
            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-muted-foreground" />
              
              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os serviços</SelectItem>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* State Filter */}
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger className="w-40">
                  <MapPin className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os estados</SelectItem>
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
              
              {/* City Filter */}
              <Input
                placeholder="Cidade..."
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-40"
              />
              
              {/* Clear Filters */}
              {(selectedCategory !== "all" || selectedCity || (selectedState && selectedState !== "all")) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedCategory("all");
                    setSelectedCity("");
                    setSelectedState("all");
                  }}
                  className="flex items-center gap-1"
                >
                  <X className="h-3 w-3" />
                  Limpar Filtros
                </Button>
              )}
            </div>
            
            {/* Active filters display */}
            {(selectedCity || (selectedState && selectedState !== "all") || selectedCategory !== "all") && (
              <div className="flex flex-wrap gap-2 mt-4">
                {selectedCategory !== "all" && (
                  <Badge variant="secondary" className="gap-2">
                    Categoria: {categories?.find(c => c.id.toString() === selectedCategory)?.name || selectedCategory}
                    <button
                      onClick={() => setSelectedCategory("all")}
                      className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {selectedState && selectedState !== "all" && (
                  <Badge variant="secondary" className="gap-2">
                    Estado: {selectedState}
                    <button
                      onClick={() => setSelectedState("all")}
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
          
          {isLoadingServices ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-80 w-full rounded-lg" />
              ))}
            </div>
          ) : servicesToDisplay && servicesToDisplay.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {servicesToDisplay.map((service: any) => {
                // All services are now catalog-based with providers array
                const hasProviders = service.providers && service.providers.length > 0;
                const providerCount = service.providerCount || service.providers?.length || 0;
                
                // Use catalog service image
                const firstImage = service.imageUrl || '/uploads/services/limpeza_residencial.png';
                
                // Build URL with query params for location filters
                const params = new URLSearchParams();
                if (selectedCity) params.append('city', selectedCity);
                if (selectedState && selectedState !== 'all') params.append('state', selectedState);
                const queryString = params.toString();
                const serviceUrl = `/services/catalog/${service.id}${queryString ? `?${queryString}` : ''}`;
                
                return (
                  <Link key={`catalog-${service.id}`} to={serviceUrl} data-testid={`service-card-${service.id}`}>
                    <Card className="feature-card group cursor-pointer h-full">
                      <div className="relative overflow-hidden rounded-t-lg">
                        <img
                          src={firstImage}
                          alt={service.name}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/uploads/services/limpeza_residencial.png';
                          }}
                        />
                        <div className="absolute top-2 right-2 flex flex-col gap-1">
                          <Badge variant="secondary" className="text-xs" data-testid={`service-category-${service.id}`}>
                            {service.category?.name}
                          </Badge>
                          {service.isOnSale && service.salePercentage && (
                            <Badge variant="destructive" className="text-xs animate-pulse">
                              🔥 {service.salePercentage}% OFF
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg group-hover:text-blue-600 transition-colors line-clamp-2">
                          {service.name}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                          {service.description || service.service?.description}
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="space-y-3">
                        {/* Provider Count - show how many providers offer this service */}
                        {providerCount > 0 && (
                          <div className="flex items-center space-x-2 text-sm font-medium text-blue-600 dark:text-blue-400" data-testid={`provider-count-${service.id}`}>
                            <Users className="h-4 w-4" />
                            <span>{providerCount} {providerCount === 1 ? 'prestador disponível' : 'prestadores disponíveis'}</span>
                          </div>
                        )}
                        
                        {/* Location */}
                        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                          <MapPin className="h-4 w-4" />
                          <span>Disponível na região</span>
                        </div>
                        
                        {/* Pricing */}
                        <div className="space-y-2">
                          {service.suggestedMinPrice ? (
                            <div className="flex flex-wrap gap-1">
                              {service.isOnSale && service.salePercentage ? (
                                <div className="flex items-center gap-2">
                                  <Badge variant="destructive" className="text-xs">
                                    {service.salePercentage}% OFF
                                  </Badge>
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs text-muted-foreground line-through">
                                      R$ {service.suggestedMinPrice}
                                    </span>
                                    <Badge variant="outline" className="text-xs text-green-600">
                                      R$ {(parseFloat(service.suggestedMinPrice) * (1 - parseFloat(service.salePercentage) / 100)).toFixed(2)}
                                    </Badge>
                                  </div>
                                </div>
                              ) : (
                                <Badge variant="outline" className="text-xs" data-testid={`service-price-${service.id}`}>
                                  A partir de R$ {service.suggestedMinPrice}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Preço sob consulta
                            </Badge>
                          )}
                        </div>
                        
                        {/* Duration and features */}
                        <div className="space-y-1">
                          {service.estimatedDuration && (
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {service.estimatedDuration} {service.durationType === 'hours' ? 'horas' : service.durationType === 'days' ? 'dias' : 'visitas'}
                            </div>
                          )}
                          {service.materialsIncluded && (
                            <div className="text-xs text-green-600 flex items-center gap-1">
                              <ShieldCheck className="h-3 w-3" />
                              Materiais incluídos
                            </div>
                          )}
                        </div>
                        
                        {/* View Providers Button */}
                        <div className="pt-3 border-t">
                          <Button
                            variant="default"
                            size="sm"
                            className="w-full"
                            data-testid={`view-providers-${service.id}`}
                            asChild
                          >
                            <span>Ver Prestadores</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-300">Nenhum serviço disponível no momento.</p>
            </div>
          )}
          
          {/* Show pagination controls when displaying all services */}
          {showAllServices && totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Página {currentPage} de {totalPages} ({totalServices} serviços)
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Próxima
              </Button>
            </div>
          )}
          
          {/* Show "View All Services" button when not showing all */}
          {!showAllServices && totalServices > 12 && (
            <div className="text-center mt-8">
              <Button 
                variant="outline" 
                size="lg" 
                className="px-8"
                onClick={() => {
                  setShowAllServices(true);
                  setCurrentPage(1);
                }}
              >
                Ver Todos os {totalServices} Serviços
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
          
          {/* Show "Show Less" button when showing all */}
          {showAllServices && (
            <div className="text-center mt-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setShowAllServices(false);
                  setCurrentPage(1);
                  setSelectedCategory("all");
                }}
              >
                Mostrar Menos
              </Button>
            </div>
          )}
        </div>

        {/* Promotional Banners */}
        {!bannersLoading && banners && banners.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Ofertas Especiais
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {banners.slice(0, 3).map((banner: BannerWithCategory) => (
                <Card 
                  key={banner.id} 
                  className="group cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                  onClick={() => handleBannerClick(banner)}
                >
                  <CardHeader className="pb-3">
                    {banner.imageUrl && (
                      <div className="w-full h-40 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg mb-3 flex items-center justify-center text-white text-2xl font-bold">
                        {banner.title}
                      </div>
                    )}
                    <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                      {banner.title}
                    </CardTitle>
                    {banner.description && (
                      <CardDescription>{banner.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      {banner.category && (
                        <Badge variant="secondary" className="text-xs">
                          {banner.category.name}
                        </Badge>
                      )}
                      <Button size="sm" variant="ghost" className="p-0 h-auto">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Service Categories */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Categorias de Serviços
          </h2>
          
          {categoriesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCategories.map((category: ServiceCategory) => (
                <Link key={category.id} to={`/services?category=${category.id}`}>
                  <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 h-full">
                    <CardHeader className="text-center">
                      {category.imageUrl ? (
                        <div className="w-20 h-20 rounded-lg overflow-hidden mx-auto mb-3 group-hover:scale-110 transition-transform">
                          <img
                            src={category.imageUrl}
                            alt={category.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                          <span className="text-white text-2xl font-bold">
                            {category.icon || category.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                        {category.name}
                      </CardTitle>
                      {category.description && (
                        <CardDescription className="text-sm line-clamp-2">
                          {category.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Nearby Providers Section */}
        {userLocation && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Profissionais Próximos
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Encontre prestadores na sua região: {formatAddress(userLocation.address)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowNearbyProviders(!showNearbyProviders)}
                  variant={showNearbyProviders ? "default" : "outline"}
                  className="flex items-center gap-2"
                >
                  <MapPin className="h-4 w-4" />
                  {showNearbyProviders ? "Ocultar" : "Buscar Próximos"}
                </Button>
                {showNearbyProviders && (
                  <Button
                    onClick={() => setShowMap(!showMap)}
                    variant={showMap ? "default" : "outline"}
                    className="flex items-center gap-2"
                  >
                    <Map className="h-4 w-4" />
                    {showMap ? "Ver Lista" : "Ver no Mapa"}
                  </Button>
                )}
              </div>
            </div>

            {/* Filters for nearby providers */}
            {showNearbyProviders && (
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={proximityRadius} onValueChange={setProximityRadius}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 km</SelectItem>
                      <SelectItem value="5">5 km</SelectItem>
                      <SelectItem value="10">10 km</SelectItem>
                      <SelectItem value="25">25 km</SelectItem>
                      <SelectItem value="50">50 km</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Categoria" />
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
                {(proximityRadius !== "5" || selectedCategory !== "all") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setProximityRadius("5");
                      setSelectedCategory("all");
                    }}
                    className="flex items-center gap-1"
                  >
                    <X className="h-3 w-3" />
                    Limpar
                  </Button>
                )}
              </div>
            )}

            {/* Nearby providers results */}
            {showNearbyProviders && (
              <>
                {nearbyProvidersLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <Skeleton key={i} className="h-64 w-full rounded-lg" />
                    ))}
                  </div>
                ) : nearbyProviders ? (
                  <>
                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                      {(nearbyProviders as any[]).length > 0 
                        ? `Encontrados ${(nearbyProviders as any[]).length} profissionais em um raio de ${proximityRadius}km`
                        : `Buscando profissionais em um raio de ${proximityRadius}km`
                      }
                    </div>
                    
                    {/* Show map or list view */}
                    {showMap ? (
                      <ProvidersMap
                        providers={nearbyProviders as any[]}
                        userLocation={userLocation}
                        height="500px"
                        onProviderSelect={(provider) => {
                          console.log("Selected provider:", provider);
                        }}
                      />
                    ) : (nearbyProviders as any[]).length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(nearbyProviders as any[]).map((provider: any) => (
                        <Card key={provider.id} className="group cursor-pointer hover:shadow-lg transition-all duration-300">
                          <CardHeader>
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-lg">
                                  {provider.user.name.charAt(0)}
                                </span>
                              </div>
                              <div className="flex-1">
                                <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                                  {provider.user.name}
                                </CardTitle>
                                <div className="flex items-center space-x-2 text-sm text-gray-500">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  <span>{provider.rating || "5.0"}</span>
                                  <span>({provider.totalReviews || 0} avaliações)</span>
                                </div>
                                <div className="flex items-center space-x-1 text-xs text-blue-600 mt-1">
                                  <MapPin className="h-3 w-3" />
                                  <span>{provider.distance} km</span>
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                              {provider.description || "Profissional experiente e qualificado"}
                            </p>
                            
                            {/* Services com informações detalhadas */}
                            {provider.services && provider.services.length > 0 && (
                              <div className="mb-3">
                                <div className="text-xs font-medium text-gray-500 mb-1">Serviços especializados:</div>
                                <div className="space-y-1">
                                  {provider.services.slice(0, 2).map((service: any) => (
                                    <div key={service.id} className="text-xs">
                                      <Badge variant="secondary" className="text-xs mb-1">
                                        {service.category?.name || 'Categoria não definida'}
                                      </Badge>
                                      <div className="flex items-center gap-2 text-gray-500">
                                        {service.service?.estimatedDuration && (
                                          <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {service.service.estimatedDuration}
                                          </span>
                                        )}
                                        {service.service?.materialsIncluded && (
                                          <span className="flex items-center gap-1 text-green-600">
                                            <ShieldCheck className="h-3 w-3" />
                                            Materiais incl.
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                  {provider.services.length > 2 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{provider.services.length - 2} mais
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <MapPin className="h-4 w-4" />
                                <span>{provider.user.city || "Região"}</span>
                              </div>
                              <Button size="sm" variant="outline">
                                Ver Perfil
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <MapPin className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          Nenhum profissional encontrado
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          Tente aumentar o raio de busca ou alterar a categoria
                        </p>
                      </div>
                    )}
                  </>
                ) : null}
              </>
            )}
          </div>
        )}

        {/* Popular Providers */}
        {!providersLoading && popularProviders && (popularProviders as any[]).length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-6">
              Profissionais Populares
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(popularProviders as any[]).slice(0, 6).map((provider: any) => (
                <Card key={provider.id} className="feature-card group cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="category-icon-gradient w-12 h-12">
                        <span className="text-white font-bold text-lg">
                          {provider.user.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                          {provider.user.name}
                        </CardTitle>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>{provider.rating || "5.0"}</span>
                          <span>({provider.totalReviews || 0} avaliações)</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                      {provider.description || "Profissional experiente e qualificado"}
                    </p>
                    
                    {/* Serviços e informações detalhadas */}
                    {provider.services && provider.services.length > 0 && (
                      <div className="mb-3 space-y-2">
                        <div className="text-xs font-medium text-gray-500 mb-1">Serviços disponíveis:</div>
                        <div className="space-y-1">
                          {provider.services
                            .slice(0, 2)
                            .map((service: any) => {
                              const chargingTypesWithPrice = service.chargingTypes?.filter((ct: any) => ct.price) || [];
                              const hasQuoteOnly = service.chargingTypes?.some((ct: any) => !ct.price) && chargingTypesWithPrice.length === 0;
                              
                              return (
                                <div key={service.id} className="text-xs">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium">{service.category?.name || 'Categoria não definida'}</span>
                                  </div>
                                  
                                  {/* Display multiple charging types */}
                                  <div className="flex flex-wrap gap-1 mb-1">
                                    {chargingTypesWithPrice.length > 0 ? (
                                      chargingTypesWithPrice.slice(0, 3).map((ct: any, index: number) => {
                                        const chargingTypeInfo = chargingTypes?.find(type => type.key === ct.chargingType);
                                        const typeName = chargingTypeInfo?.name || ct.chargingType;
                                        
                                        return (
                                          <Badge key={index} variant="secondary" className="text-xs">
                                            {typeName}: R$ {ct.price}
                                            {ct.chargingType === 'hourly' || ct.chargingType.includes('hour') ? '/h' : ''}
                                            {(ct.chargingType === 'package' || ct.chargingType.includes('package')) && ct.minimumQuantity ? 
                                              ` (min: ${ct.minimumQuantity})` : ''}
                                          </Badge>
                                        );
                                      })
                                    ) : hasQuoteOnly ? (
                                      <Badge variant="outline" className="text-xs">
                                        Sob consulta
                                      </Badge>
                                    ) : service.service?.suggestedMinPrice ? (
                                      <Badge variant="outline" className="text-xs">
                                        A partir de R$ {service.service.suggestedMinPrice}
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-xs">
                                        Preço não definido
                                      </Badge>
                                    )}
                                    {chargingTypesWithPrice.length > 3 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{chargingTypesWithPrice.length - 3} mais
                                      </Badge>
                                    )}
                                  </div>
                                  {/* Duração estimada */}
                                  {service.service?.estimatedDuration && (
                                    <div className="text-gray-400 flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {service.service.estimatedDuration}
                                    </div>
                                  )}
                                  {/* Materiais incluídos */}
                                  {service.service?.materialsIncluded && (
                                    <div className="text-green-600 text-xs flex items-center gap-1">
                                      <ShieldCheck className="h-3 w-3" />
                                      Materiais incluídos
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          {provider.services.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{provider.services.length - 2} serviços
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <MapPin className="h-4 w-4" />
                        <span>{provider.user.city || "Região"}</span>
                      </div>
                      <Button size="sm" variant="outline">
                        Ver Perfil
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Features Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-6 text-center">
            Por que escolher o Qserviços?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="feature-card text-center">
              <div className="category-icon-gradient w-16 h-16 mx-auto mb-4">
                <ShieldCheck className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Profissionais Verificados
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Todos os profissionais passam por verificação e aprovação
              </p>
            </div>
            <div className="feature-card text-center">
              <div className="category-icon-gradient w-16 h-16 mx-auto mb-4">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Atendimento Rápido
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Resposta rápida e agendamento facilitado
              </p>
            </div>
            <div className="feature-card text-center">
              <div className="category-icon-gradient w-16 h-16 mx-auto mb-4">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Satisfação Garantida
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Sistema de avaliações e qualidade garantida
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        {!user && (
          <div className="text-center hero-gradient text-white rounded-2xl p-8 shadow-2xl">
            <h3 className="text-3xl font-bold mb-3">
              Comece agora mesmo!
            </h3>
            <p className="text-lg mb-6 opacity-90">
              Cadastre-se e encontre os melhores profissionais da sua região
            </p>
            <div className="space-x-4">
              <Link to="/register">
                <Button size="lg" variant="secondary" className="bg-white text-purple-600 hover:bg-gray-100 rounded-full px-8">
                  Criar Conta
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="glass-card text-white border-white/30 hover:bg-white/10 rounded-full px-8">
                  Entrar
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}