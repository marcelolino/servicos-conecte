import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, Briefcase, MapPin, Calendar, DollarSign } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { useLocation } from '@/contexts/LocationContext';

interface MetricsData {
  totalClients: number;
  totalProviders: number;
  pendingProviders: number;
  approvedProviders: number;
  totalServices: number;
  totalBookings: number;
  monthlyRevenue: number;
  citiesCount: number;
}

export function AdminMetrics() {
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const { selectedCity: contextCity } = useLocation();

  const { data: metrics, isLoading } = useQuery<MetricsData>({
    queryKey: ['/api/admin/metrics', selectedCity],
  });

  const { data: cities = [] } = useQuery({
    queryKey: ['/api/admin/cities'],
  });

  const metricsCards = [
    {
      title: 'Total de Clientes',
      value: metrics?.totalClients || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Prestadores Ativos',
      value: metrics?.approvedProviders || 0,
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Aguardando Aprovação',
      value: metrics?.pendingProviders || 0,
      icon: Users,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Total de Serviços',
      value: metrics?.totalServices || 0,
      icon: Briefcase,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Reservas do Mês',
      value: metrics?.totalBookings || 0,
      icon: Calendar,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
    {
      title: 'Receita Mensal',
      value: `R$ ${(metrics?.monthlyRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
    },
    {
      title: 'Cidades Ativas',
      value: metrics?.citiesCount || 0,
      icon: MapPin,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 7 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter by City */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">Filtrar por cidade:</span>
        <Select value={selectedCity} onValueChange={setSelectedCity}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Selecione uma cidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as cidades</SelectItem>
            {cities.map((city: any) => (
              <SelectItem key={`${city.city}-${city.state}`} value={`${city.city}-${city.state}`}>
                {city.city} - {city.state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {contextCity && (
          <div className="text-sm text-gray-600">
            Cidade atual: {contextCity.city} - {contextCity.state}
          </div>
        )}
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricsCards.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {metric.title}
                </CardTitle>
                <div className={`h-8 w-8 rounded-full ${metric.bgColor} flex items-center justify-center`}>
                  <Icon className={`h-4 w-4 ${metric.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {typeof metric.value === 'number' ? metric.value.toLocaleString('pt-BR') : metric.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}