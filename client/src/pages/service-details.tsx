import React, { useState } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Star, Clock, Users, Phone, Mail, ImageIcon, Heart, Share2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { AddToCartButton } from "@/components/cart/AddToCartButton";

interface ServiceDetails {
  id: number;
  name: string;
  description: string;
  price?: string;
  minimumPrice?: string;
  maximumPrice?: string;
  category: {
    id: number;
    name: string;
    description: string;
  };
  provider?: {
    id: number;
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
  };
  chargingTypes: Array<{
    id: number;
    chargingType: string;
    price: string;
  }>;
  images?: string;
  materialsIncluded?: boolean;
  serviceZone?: string;
  suggestedMinPrice?: string;
  suggestedMaxPrice?: string;
  durationType?: string;
  duration?: number;
  imageUrl?: string;
}

export default function ServiceDetails() {
  const [, setLocation] = useLocation();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { toast } = useToast();

  // Try to match the different route patterns
  const [, catalogParams] = useRoute("/services/catalog/:id");
  const [, providerParams] = useRoute("/services/provider/:id");
  const [, legacyParams] = useRoute("/services/:id");
  
  // Determine service type and ID
  const serviceId = catalogParams?.id || providerParams?.id || legacyParams?.id;
  const isProviderService = !!providerParams?.id;
  const isCatalogService = !!catalogParams?.id;
  
  // For legacy routes, we keep the old behavior (try provider first, then catalog)
  const apiEndpoint = isCatalogService 
    ? `/api/catalog-services/${serviceId}`
    : isProviderService 
      ? `/api/provider-services/${serviceId}`
      : `/api/services/${serviceId}`;

  const { data: service, isLoading, error } = useQuery<ServiceDetails>({
    queryKey: [apiEndpoint],
    queryFn: async () => {
      const response = await fetch(apiEndpoint);
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

  // Parse images if it's a provider service
  let serviceImages: string[] = [];
  if (service.images) {
    try {
      serviceImages = JSON.parse(service.images);
    } catch (e) {
      serviceImages = [];
    }
  }

  // Use catalog image if it's a catalog service
  if (!serviceImages.length && service.imageUrl) {
    serviceImages = [service.imageUrl];
  }

  // Fallback image
  if (!serviceImages.length) {
    serviceImages = ['/uploads/services/limpeza_residencial.png'];
  }

  const isProviderServiceFromData = !!service.provider;

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

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % serviceImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + serviceImages.length) % serviceImages.length);
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
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Voltar
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Heart className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative">
              <img
                src={serviceImages[currentImageIndex]}
                alt={service.name}
                className="w-full h-96 object-cover rounded-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/uploads/services/limpeza_residencial.png';
                }}
              />
              
              {serviceImages.length > 1 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
              
              <div className="absolute bottom-2 right-2">
                <Badge variant="outline" className="bg-white/80">
                  <ImageIcon className="h-3 w-3 mr-1" />
                  {currentImageIndex + 1}/{serviceImages.length}
                </Badge>
              </div>
            </div>

            {/* Thumbnail Gallery */}
            {serviceImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {serviceImages.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${service.name} ${index + 1}`}
                    className={`w-20 h-20 object-cover rounded cursor-pointer ${
                      index === currentImageIndex ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setCurrentImageIndex(index)}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/uploads/services/limpeza_residencial.png';
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Service Information */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">{service.category.name}</Badge>
                {service.materialsIncluded && (
                  <Badge variant="outline" className="text-green-600">
                    Materiais incluídos
                  </Badge>
                )}
              </div>
              
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {service.name}
              </h1>
              
              <p className="text-muted-foreground text-lg">
                {service.description}
              </p>
            </div>

            {/* Provider Info */}
            {isProviderServiceFromData && service.provider && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={service.provider.user.avatar} />
                      <AvatarFallback>
                        {service.provider.user.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold">{service.provider.user.name}</h3>
                      <p className="text-sm text-muted-foreground">{service.provider.businessName}</p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span>{service.provider.rating} ({service.provider.totalReviews} avaliações)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{service.provider.totalServices} serviços</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{service.provider.user.city}, {service.provider.user.state}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{service.provider.user.phone}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>Preços e Opções</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {service.chargingTypes && service.chargingTypes.length > 0 ? (
                  <div className="space-y-3">
                    {service.chargingTypes.map((ct, index) => {
                      const chargingTypeInfo = (chargingTypes as any[])?.find(
                        (type: any) => type.key === ct.chargingType
                      );
                      const typeName = chargingTypeInfo?.name || ct.chargingType;
                      
                      return (
                        <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                          <div>
                            <span className="font-medium">{typeName}</span>
                            {service.duration && service.durationType && (
                              <p className="text-sm text-muted-foreground">
                                Duração: {service.duration} {service.durationType}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-bold text-green-600">
                              R$ {ct.price}
                              {ct.chargingType === 'hourly' || ct.chargingType.includes('hour') ? '/h' : ''}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">Solicite um orçamento personalizado</p>
                  </div>
                )}

                {service.serviceZone && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm">
                      <strong>Zona de atendimento:</strong> {service.serviceZone}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Add to Cart */}
            <Card>
              <CardContent className="p-4">
                <AddToCartButton
                  serviceId={service.id}
                  serviceName={service.name}
                  providerId={service.provider?.id}
                  chargingTypes={(service.chargingTypes || []).map(ct => ({
                    chargingType: ct.chargingType,
                    price: parseFloat(ct.price)
                  }))}
                  directPrice={service.price || service.suggestedMinPrice}
                  isProviderService={isProviderServiceFromData}
                  variant="default"
                  size="lg"
                  className="w-full"
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Category Description */}
        <div className="mt-12">
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
      </div>
    </div>
  );
}