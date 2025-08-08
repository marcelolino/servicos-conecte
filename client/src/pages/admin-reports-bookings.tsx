import { useQuery } from '@tanstack/react-query';
import { ModernAdminLayout } from '@/components/layout/modern-admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, DollarSign, CheckCircle, Download } from 'lucide-react';
import { useState } from 'react';

interface BookingMetrics {
  totalReservations: number;
  totalAmount: number;
}

interface ChartData {
  month: string;
  reservations: number;
}

interface Booking {
  id: string;
  clientInfo: string;
  providerInfo: string;
  serviceValue: number;
  serviceAmount: number;
  depositValue: number;
  totalAmount: number;
  paymentStatus: string;
  action: string;
}

export default function AdminReportsBookings() {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    zone: 'all',
    category: 'all',
    intervalOfData: 'all'
  });

  const { data: reportData, isLoading } = useQuery<{
    metrics: BookingMetrics;
    chartData: ChartData[];
    bookings: Booking[];
  }>({
    queryKey: ['/api/admin/reports/bookings', filters],
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

  const metricsCards = [
    {
      title: 'Total de reservas',
      value: (reportData?.metrics.totalReservations || 78).toString(),
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Valor total',
      value: formatCurrency(reportData?.metrics.totalAmount || 7946409.33),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
  ];

  return (
    <ModernAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Relatórios De Reservas</h1>
            <p className="text-muted-foreground mt-1">
              Análise detalhada das reservas e bookings
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
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={filters.category}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {categories.map((category: any) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="provider">Intervalo de dados</Label>
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
                <Label htmlFor="startDate">Provedor</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um provedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os provedores</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Estado dos dados</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os estados</SelectItem>
                    <SelectItem value="confirmed">Confirmado</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-center mt-4">
              <Button>
                Procurar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {metricsCards.map((metric, index) => (
            <Card key={index}>
              <CardContent className="flex items-center p-6">
                <div className={`p-3 rounded-full ${metric.bgColor} mr-4`}>
                  <metric.icon className={`h-6 w-6 ${metric.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{metric.title}</p>
                  <p className="text-2xl font-bold">{metric.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Reservations Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Estatísticas de reserva</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData?.chartData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [value, 'Reservas']}
                  />
                  <Bar 
                    dataKey="reservations" 
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Bookings Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Populares por 30 Dias</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Seleção de reservas
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
                    <TableHead>ID da reserva</TableHead>
                    <TableHead>Informações do cliente</TableHead>
                    <TableHead>Informações do Provedor</TableHead>
                    <TableHead>Valor do serviço</TableHead>
                    <TableHead>Desconto do serviço</TableHead>
                    <TableHead>Cupom de desconto</TableHead>
                    <TableHead>Valor do depósito</TableHead>
                    <TableHead>P/S / Prêmio</TableHead>
                    <TableHead>Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData?.bookings.map((booking, index) => (
                    <TableRow key={booking.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-mono text-sm">{booking.id}</TableCell>
                      <TableCell>{booking.clientInfo}</TableCell>
                      <TableCell>{booking.providerInfo}</TableCell>
                      <TableCell>{formatCurrency(booking.serviceValue)}</TableCell>
                      <TableCell>{formatCurrency(booking.serviceAmount)}</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>{formatCurrency(booking.depositValue)}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          {booking.paymentStatus}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <CheckCircle className="w-4 h-4" />
                          </Button>
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