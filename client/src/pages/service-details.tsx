import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Star, Clock, Users, Phone, Mail, ChevronLeft, ChevronRight, ImageIcon, Heart, Share2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface ServiceWithProviders {
  id: number;
  name: string;
  description: string;
  suggestedMinPrice?: string;
  suggestedMaxPrice?: string;
  category: {
    id: number;
    name: string;
    description: string;
  };
  providerCount: number;
  providers: Array<{
    id: number;
    providerServiceId: number;
    businessName: string;
    rating: string;
    totalReviews: number;
    totalServices: number;
    user: {
      id: number;
      name: string;
      email: string;
      phone: string;
      city: string;
      state: string;
      avatar: string;
    };
    chargingTypes?: Array<{
      id: number;
      chargingType: string;
      price: string;
      description?: string;
    }>;
    serviceZone?: string;
  }>;
  imageUrl?: string;
  materialsIncluded?: boolean;
  estimatedDuration?: number;
  durationType?: string;
}

export default function ServiceDetails() {
  const [, setLocation] = useLocation();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedProvider, setSelectedProvider] = useState<number | null>(null);
  const [expandedProvider, setExpandedProvider] = useState<number | null>(null);
  const { toast } = useToast();

  // Get service ID from URL
  const [, catalogParams] = useRoute("/services/catalog/:id");
  const serviceId = catalogParams?.id;

  // Get city/state from query params (passed from home page)
  const urlParams = new URLSearchParams(window.location.search);
  const city = urlParams.get('city') || '';
  const state = urlParams.get('state') || '';

  // Fetch service with providers
  const { data: service, isLoading, error } = useQuery<ServiceWithProviders>({
    queryKey: ['/api/services-catalog', serviceId, 'providers', city, state],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (city) params.append('city', city);
      if (state) params.append('state', state);
      const queryString = params.toString();
      const url = `/api/services-catalog/${serviceId}/providers${queryString ? `?${queryString}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Serviço não encontrado");
      }
      return response.json();
    },
    enabled: !!serviceId,
  });

  const { data: chargingTypes } = useQuery({
    queryKey: ["/api/charging-types"],
    enabled: true,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="h-96 w-full rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Serviço não encontrado</h1>
          <p className="text-muted-foreground mb-4">O serviço que você está procurando não existe.</p>
          <Button onClick={() => setLocation("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar à Home
          </Button>
        </div>
      </div>
    );
  }

  // Service image
  const serviceImage = service.imageUrl || '/uploads/services/limpeza_residencial.png';

  // Selected provider data
  const selectedProviderData = service.providers.find(p => p.id === selectedProvider);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: service.name,
          text: service.description,
          url: window.location.href,
        });
      } catch (error) {
        toast({
          title: "Erro ao compartilhar",
          description: "Não foi possível compartilhar o serviço",
        });
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copiado!",
        description: "O link do serviço foi copiado para a área de transferência",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setLocation("/")}
              className="p-2"
              data-testid="back-button"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Voltar
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleShare} data-testid="share-button">
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" data-testid="favorite-button">
                <Heart className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Service Overview - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Image */}
            <div className="relative">
              <img
                src={serviceImage}
                alt={service.name}
                className="w-full h-96 object-cover rounded-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/uploads/services/limpeza_residencial.png';
                }}
                data-testid="service-image"
              />
            </div>

            {/* Service Information */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" data-testid="category-badge">{service.category.name}</Badge>
                  {service.materialsIncluded && (
                    <Badge variant="outline" className="text-green-600" data-testid="materials-badge">
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      Materiais incluídos
                    </Badge>
                  )}
                </div>
                
                <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="service-name">
                  {service.name}
                </h1>
                
                <p className="text-muted-foreground text-lg" data-testid="service-description">
                  {service.description}
                </p>
              </div>

              {/* Duration */}
              {service.estimatedDuration && service.durationType && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    Duração estimada: {service.estimatedDuration}{' '}
                    {service.durationType === 'hours' ? 'horas' : service.durationType === 'days' ? 'dias' : 'visitas'}
                  </span>
                </div>
              )}

              {/* Price Range */}
              {service.suggestedMinPrice && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Faixa de preço sugerida</p>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {service.suggestedMinPrice}
                    {service.suggestedMaxPrice && ` - R$ ${service.suggestedMaxPrice}`}
                  </p>
                </div>
              )}
            </div>

            {/* Provider Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Escolha um Prestador</span>
                  <Badge variant="outline" data-testid="provider-count">
                    {service.providerCount} {service.providerCount === 1 ? 'prestador disponível' : 'prestadores disponíveis'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {service.providerCount === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      Nenhum prestador disponível na região selecionada.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setLocation("/")}
                      data-testid="change-location-button"
                    >
                      Alterar região
                    </Button>
                  </div>
                ) : (
                  <RadioGroup value={selectedProvider?.toString() || ''} onValueChange={(value) => setSelectedProvider(Number(value))}>
                    <div className="space-y-4">
                      {service.providers.map((provider) => (
                        <div
                          key={provider.id}
                          className={`border rounded-lg p-4 cursor-pointer transition-all ${
                            selectedProvider === provider.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : 'hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedProvider(provider.id)}
                          data-testid={`provider-card-${provider.id}`}
                        >
                          <div className="flex items-start gap-4">
                            <RadioGroupItem value={provider.id.toString()} id={`provider-${provider.id}`} />
                            
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  <Avatar>
                                    <AvatarImage src={provider.user.avatar} />
                                    <AvatarFallback>
                                      {provider.user.name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <h3 className="font-semibold" data-testid={`provider-name-${provider.id}`}>
                                      {provider.user.name}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">{provider.businessName}</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-4 text-sm">
                                  <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                    <span className="font-medium">{provider.rating}</span>
                                    <span className="text-muted-foreground">({provider.totalReviews})</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  <span>{provider.user.city}, {provider.user.state}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="h-4 w-4" />
                                  <span>{provider.totalServices} serviços</span>
                                </div>
                              </div>

                              {/* Expandable pricing details */}
                              {provider.chargingTypes && provider.chargingTypes.length > 0 && (
                                <div className="mt-3">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedProvider(expandedProvider === provider.id ? null : provider.id);
                                    }}
                                    data-testid={`toggle-pricing-${provider.id}`}
                                  >
                                    {expandedProvider === provider.id ? 'Ocultar' : 'Ver'} opções de preço
                                  </Button>
                                  
                                  {expandedProvider === provider.id && (
                                    <div className="mt-3 space-y-2">
                                      {provider.chargingTypes.map((ct, index) => {
                                        const chargingTypeInfo = (chargingTypes as any[])?.find(
                                          (type: any) => type.key === ct.chargingType
                                        );
                                        const typeName = chargingTypeInfo?.name || ct.chargingType;
                                        
                                        return (
                                          <div key={index} className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 border rounded">
                                            <span className="text-sm">{typeName}</span>
                                            <span className="font-semibold text-green-600">
                                              R$ {ct.price}
                                              {ct.chargingType === 'hourly' || ct.chargingType.includes('hour') ? '/h' : ''}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              )}

                              {provider.serviceZone && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  <strong>Zona de atendimento:</strong> {provider.serviceZone}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                )}
              </CardContent>
            </Card>

            {/* Category Description */}
            <Card>
              <CardHeader>
                <CardTitle>Sobre {service.category.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {service.category.description}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Add to Cart - Right Column (Sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <Card>
                <CardHeader>
                  <CardTitle>Adicionar ao Carrinho</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {service.providerCount === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground mb-4">
                        Ainda não há prestador (vinculado)
                      </p>
                      <Button disabled className="w-full" data-testid="no-provider-available">
                        Nenhum prestador disponível
                      </Button>
                    </div>
                  ) : !selectedProvider ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground mb-4">
                        Selecione um prestador para continuar
                      </p>
                      <Button disabled className="w-full" data-testid="add-to-cart-disabled">
                        Selecione um prestador
                      </Button>
                    </div>
                  ) : (
                    <>
                      {/* Selected provider summary */}
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Prestador selecionado:</p>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={selectedProviderData?.user.avatar} />
                            <AvatarFallback>
                              {selectedProviderData?.user.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{selectedProviderData?.user.name}</p>
                            <p className="text-xs text-muted-foreground">{selectedProviderData?.businessName}</p>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <AddToCartButton
                        serviceId={selectedProviderData?.providerServiceId || 0}
                        serviceName={service.name}
                        providerId={selectedProvider}
                        chargingTypes={(selectedProviderData?.chargingTypes || []).map(ct => ({
                          chargingType: ct.chargingType,
                          price: parseFloat(ct.price || '0')
                        }))}
                        directPrice={service.suggestedMinPrice}
                        isProviderService={true}
                        variant="default"
                        size="lg"
                        className="w-full"
                      />
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
