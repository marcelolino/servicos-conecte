import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import ServicesAvailableSidebar from "@/components/provider/ServicesAvailableSidebar";
import ProviderStatsPanel from "@/components/provider/ProviderStatsPanel";
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Calendar,
  ArrowLeft,
  Settings
} from "lucide-react";
import { useLocation } from "wouter";

interface Provider {
  id: number;
  userId: number;
  status: string;
  rating: string;
  totalReviews: number;
  totalServices: number;
  user: {
    id: number;
    name: string;
    email: string;
    city: string;
    state: string;
  };
}

export default function ProviderServiceFlow() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch current provider data
  const { data: provider, isLoading: providerLoading } = useQuery<Provider>({
    queryKey: ["/api/providers/me", refreshTrigger],
    enabled: user?.userType === "provider",
  });

  // Handle service subscription to refresh data
  const handleServiceSubscribe = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (providerLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Perfil de Prestador Não Encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Você precisa completar seu perfil de prestador para acessar esta área.
            </p>
            <Button onClick={() => setLocation("/provider-dashboard")}>
              Ir para Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => setLocation("/provider-dashboard")}
                className="p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Gestão de Serviços
                </h1>
                <p className="text-muted-foreground">
                  {provider.user.name} • {provider.user.city}, {provider.user.state}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant={provider.status === "approved" ? "default" : "secondary"}>
                {provider.status === "approved" ? "Aprovado" : "Pendente"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Side - Main Content */}
          <div className="lg:col-span-2">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Ganho de comissão</p>
                      <p className="text-2xl font-bold text-green-600">R$0,00</p>
                    </div>
                    <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Ganho total</p>
                      <p className="text-2xl font-bold text-blue-600">R$169,60</p>
                    </div>
                    <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Clientes</p>
                      <p className="text-2xl font-bold text-orange-600">1</p>
                    </div>
                    <div className="h-12 w-12 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                      <Users className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Stats Panel */}
            <ProviderStatsPanel providerId={provider.id} />
          </div>

          {/* Right Side - Services Available */}
          <div className="lg:col-span-2">
            <ServicesAvailableSidebar 
              providerId={provider.id}
              onServiceSubscribe={handleServiceSubscribe}
            />
          </div>
        </div>
      </div>
    </div>
  );
}