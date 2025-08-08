import { useQuery } from '@tanstack/react-query';
import { ModernAdminLayout } from '@/components/layout/modern-admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { UserCheck, DollarSign, Star, Download } from 'lucide-react';
import { useState } from 'react';

interface Provider {
  id: number;
  name: string;
  subscriptionsNumber: number;
  servicesNumber: number;
  totalReservations: number;
  totalEarnings: number;
  cancellationData: number;
  completionRate: string;
}

export default function AdminReportsProviders() {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    zone: 'all',
    subcategory: 'all',
    intervalOfData: 'all'
  });

  const { data: reportData, isLoading } = useQuery<{
    providers: Provider[];
  }>({
    queryKey: ['/api/admin/reports/providers', filters],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
  });

  const { data: cities = [] } = useQuery({
    queryKey: ['/api/admin/cities'],
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <ModernAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Relatórios Dos Provedores</h1>
            <p className="text-muted-foreground mt-1">
              Análise de desempenho dos prestadores de serviços
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros de pesquisa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zone">Zona</Label>
                <Select
                  value={filters.zone}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, zone: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a zona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as zonas</SelectItem>
                    {cities.map((city: any) => (
                      <SelectItem key={`${city.city}-${city.state}`} value={`${city.city}-${city.state}`}>
                        {city.city}, {city.state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subcategory">Subcategoria</Label>
                <Select
                  value={filters.subcategory}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, subcategory: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma subcategoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as subcategorias</SelectItem>
                    {categories.map((category: any) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="intervalOfData">Intervalo de dados</Label>
                <Select
                  value={filters.intervalOfData}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, intervalOfData: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o intervalo de dados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os intervalos</SelectItem>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="week">Esta semana</SelectItem>
                    <SelectItem value="month">Este mês</SelectItem>
                    <SelectItem value="year">Este ano</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Seleção e intervalo de dados</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">&nbsp;</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-center mt-4">
              <Button>
                Procurar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Providers Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Populares por Ofertas</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Procurar
                </Button>
                <Button size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Baixar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SL</TableHead>
                    <TableHead>Informações do Provedor</TableHead>
                    <TableHead>Subscrições inscritas</TableHead>
                    <TableHead>Número de serviços</TableHead>
                    <TableHead>Total de reservas</TableHead>
                    <TableHead>Ganhos totais</TableHead>
                    <TableHead>Comissão dada</TableHead>
                    <TableHead>Taxa de conclusão</TableHead>
                    <TableHead>Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData?.providers.map((provider, index) => (
                    <TableRow key={provider.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{provider.name}</TableCell>
                      <TableCell>{provider.subscriptionsNumber}</TableCell>
                      <TableCell>{provider.servicesNumber}</TableCell>
                      <TableCell>{provider.totalReservations}</TableCell>
                      <TableCell>{formatCurrency(provider.totalEarnings)}</TableCell>
                      <TableCell>{formatCurrency(provider.cancellationData)}</TableCell>
                      <TableCell>
                        <span 
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            parseFloat(provider.completionRate) > 90 
                              ? 'bg-green-100 text-green-800'
                              : parseFloat(provider.completionRate) > 70
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {provider.completionRate}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Checkbox />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </ModernAdminLayout>
  );
}