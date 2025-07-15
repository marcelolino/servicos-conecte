import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getQueryFn } from "@/lib/queryClient";
import { User, MapPin, Star, Clock, Award, Phone, Mail, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
// import { format } from "date-fns";
// import { ptBR } from "date-fns/locale";

interface ProviderProfileData {
  id: number;
  userId: number;
  status: string;
  serviceRadius: number;
  basePrice: string;
  description: string;
  experience: string;
  rating: string;
  totalReviews: number;
  totalServices: number;
  createdAt: string;
  user: {
    id: number;
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    avatar: string | null;
  };
}

interface ServiceData {
  id: number;
  categoryId: number;
  price: string;
  description: string;
  isActive: boolean;
  category: {
    id: number;
    name: string;
    description: string;
    icon: string;
  };
}

export default function ProviderProfile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const providerId = parseInt(id || "0");

  console.log("ProviderProfile - ID from params:", id);
  console.log("ProviderProfile - Parsed ID:", providerId);

  const { data: provider, isLoading: loadingProvider, error } = useQuery<ProviderProfileData>({
    queryKey: ["/api/provider-profile", providerId],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!providerId,
  });

  const { data: services, isLoading: loadingServices } = useQuery<ServiceData[]>({
    queryKey: ["/api/providers", providerId, "services"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!providerId,
  });

  const { data: reviews, isLoading: loadingReviews } = useQuery({
    queryKey: ["/api/providers", providerId, "reviews"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!providerId,
  });

  // Early return for testing
  if (!id) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Perfil do Prestador</h1>
          <p className="text-red-500">ID não encontrado na URL</p>
        </div>
      </div>
    );
  }

  if (loadingProvider || loadingServices) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Carregando perfil do prestador #{id}...</h1>
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="h-64 bg-muted rounded mb-6"></div>
                <div className="h-32 bg-muted rounded"></div>
              </div>
              <div className="h-96 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-8">
            <h2 className="text-2xl font-bold mb-2">Erro ao carregar perfil</h2>
            <p className="text-muted-foreground">
              Erro: {error instanceof Error ? error.message : "Erro desconhecido"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-8">
            <h2 className="text-2xl font-bold mb-2">Prestador não encontrado</h2>
            <p className="text-muted-foreground">
              O prestador que você está procurando não foi encontrado ou não está mais ativo.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              ID pesquisado: {id}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge variant="default" className="bg-green-100 text-green-800">Aprovado</Badge>;
      case "pending":
        return <Badge variant="secondary">Pendente</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejeitado</Badge>;
      case "suspended":
        return <Badge variant="outline" className="border-orange-500 text-orange-700">Suspenso</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(price));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Perfil Principal */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    {provider.user.avatar ? (
                      <img 
                        src={provider.user.avatar} 
                        alt={provider.user.name}
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-8 w-8 text-primary" />
                    )}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">{provider.user.name}</h1>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {provider.user.city}, {provider.user.state}
                    </div>
                  </div>
                </div>
                {getStatusBadge(provider.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{parseFloat(provider.rating).toFixed(1)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{provider.totalReviews} avaliações</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Award className="h-4 w-4 text-primary" />
                    <span className="font-semibold">{provider.totalServices}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">serviços realizados</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="font-semibold">{provider.serviceRadius}km</span>
                  </div>
                  <p className="text-sm text-muted-foreground">raio de atendimento</p>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="mb-6">
                <h3 className="font-semibold mb-2">Sobre o Prestador</h3>
                <p className="text-muted-foreground">{provider.description}</p>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-2">Experiência Profissional</h3>
                <p className="text-muted-foreground">{provider.experience}</p>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-2">Preço Base</h3>
                <p className="text-2xl font-bold text-primary">{formatPrice(provider.basePrice)}</p>
                <p className="text-sm text-muted-foreground">A partir de</p>
              </div>

              {/* Serviços Oferecidos */}
              {services && services.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Serviços Oferecidos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {services.map((service) => (
                      <Card key={service.id} className="border-l-4 border-l-primary">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{service.category.name}</h4>
                            <Badge variant={service.isActive ? "default" : "secondary"}>
                              {service.isActive ? "Ativo" : "Inativo"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{service.description}</p>
                          <p className="font-semibold text-primary">{formatPrice(service.price)}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Informações de Contato */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações de Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{provider.user.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{provider.user.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{provider.user.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Membro desde {new Date(provider.createdAt).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' })}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Ação */}
          {user && user.id !== provider.userId && (
            <Card>
              <CardContent className="p-6">
                <Button className="w-full" size="lg">
                  Solicitar Orçamento
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}