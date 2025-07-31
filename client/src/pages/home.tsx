import { useState } from "react";
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
import type { ServiceCategory, PromotionalBanner } from "@shared/schema";

interface BannerWithCategory extends PromotionalBanner {
  category?: ServiceCategory;
}

export default function Home() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [showNearbyProviders, setShowNearbyProviders] = useState(false);
  const [proximityRadius, setProximityRadius] = useState("5"); // km
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: banners, isLoading: bannersLoading } = useQuery({
    queryKey: ['/api/banners'],
    enabled: true,
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/categories'],
    enabled: true,
  });

  const { data: popularProviders, isLoading: providersLoading } = useQuery({
    queryKey: ['/api/providers/popular'],
    enabled: true,
  });

  // Query for nearby providers based on user location
  const { data: nearbyProviders, isLoading: nearbyProvidersLoading } = useQuery({
    queryKey: ['/api/providers/nearby', userLocation?.lat, userLocation?.lng, proximityRadius, selectedCategory],
    enabled: showNearbyProviders && !!userLocation,
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

  const filteredCategories = (categories as ServiceCategory[])?.filter((category: ServiceCategory) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="desktop-container py-8">
        {/* Location Request Card */}
        <LocationCard onLocationChange={setUserLocation} />
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Bem-vindo ao <span className="text-blue-600">Qserviços</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Conecte-se com os melhores profissionais da sua região
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Buscar serviços (ex: Encanador, Limpeza, Pintor...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-lg border-2 border-blue-200 focus:border-blue-400 rounded-xl"
            />
          </div>
        </div>

        {/* Promotional Banners */}
        {!bannersLoading && banners && (banners as BannerWithCategory[]).length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Ofertas Especiais
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(banners as BannerWithCategory[]).slice(0, 3).map((banner: BannerWithCategory) => (
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
                  Encontre prestadores na sua região: {userLocation.address}
                </p>
              </div>
              <Button
                onClick={() => setShowNearbyProviders(!showNearbyProviders)}
                variant={showNearbyProviders ? "default" : "outline"}
                className="flex items-center gap-2"
              >
                <Map className="h-4 w-4" />
                {showNearbyProviders ? "Ocultar Mapa" : "Ver no Mapa"}
              </Button>
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
                    {(categories as ServiceCategory[])?.map((category) => (
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
                ) : nearbyProviders && (nearbyProviders as any[]).length > 0 ? (
                  <>
                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                      Encontrados {(nearbyProviders as any[]).length} profissionais em um raio de {proximityRadius}km
                    </div>
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
                            
                            {/* Services */}
                            {provider.services && provider.services.length > 0 && (
                              <div className="mb-3">
                                <div className="text-xs font-medium text-gray-500 mb-1">Serviços:</div>
                                <div className="flex flex-wrap gap-1">
                                  {provider.services.slice(0, 2).map((service: any) => (
                                    <Badge key={service.id} variant="secondary" className="text-xs">
                                      {service.category.name}
                                    </Badge>
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
                  </>
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
            )}
          </div>
        )}

        {/* Popular Providers */}
        {!providersLoading && popularProviders && (popularProviders as any[]).length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Profissionais Populares
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(popularProviders as any[]).slice(0, 6).map((provider: any) => (
                <Card key={provider.id} className="group cursor-pointer hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center">
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
                    
                    {/* Preços configurados */}
                    {provider.services && provider.services.length > 0 && (
                      <div className="mb-3">
                        <div className="text-xs font-medium text-gray-500 mb-1">Preços a partir de:</div>
                        <div className="flex flex-wrap gap-1">
                          {provider.services
                            .slice(0, 2)
                            .map((service: any) => {
                              const minPrice = service.chargingTypes
                                ?.filter((ct: any) => ct.price)
                                ?.reduce((min: any, ct: any) => 
                                  !min || parseFloat(ct.price) < parseFloat(min.price) ? ct : min, null);
                              
                              return minPrice ? (
                                <Badge key={service.id} variant="secondary" className="text-xs">
                                  {service.category.name}: R$ {minPrice.price}
                                </Badge>
                              ) : (
                                <Badge key={service.id} variant="outline" className="text-xs">
                                  {service.category.name}: Sob consulta
                                </Badge>
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Por que escolher o Qserviços?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Profissionais Verificados
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Todos os profissionais passam por verificação e aprovação
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Atendimento Rápido
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Resposta rápida e agendamento facilitado
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
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
          <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-8">
            <h3 className="text-2xl font-bold mb-2">
              Comece agora mesmo!
            </h3>
            <p className="text-lg mb-6">
              Cadastre-se e encontre os melhores profissionais da sua região
            </p>
            <div className="space-x-4">
              <Link to="/register">
                <Button size="lg" variant="secondary" className="text-blue-600">
                  Criar Conta
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600">
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