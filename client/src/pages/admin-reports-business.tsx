import { useQuery } from '@tanstack/react-query';
import { ModernAdminLayout } from '@/components/layout/modern-admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, Calendar, Download } from 'lucide-react';
import { useState } from 'react';

interface BusinessMetrics {
  overallEarnings: number;
  netEarnings: number;
  totalBookings: number;
}

interface ChartData {
  month: string;
  earnings: number;
}

interface YearlyData {
  year: number;
  bookings: number;
  expenses: number;
  totalRevenue: number;
  netIncome: number;
}

export default function AdminReportsBusiness() {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    zone: 'all',
    category: 'all'
  });

  const { data: reportData, isLoading } = useQuery<{
    metrics: BusinessMetrics;
    chartData: ChartData[];
    yearlyData: YearlyData[];
  }>({
    queryKey: ['/api/admin/reports/business', filters],
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
      title: 'Ganhos Gerais',
      value: formatCurrency(reportData?.metrics.overallEarnings || 23988.00),
      icon: DollarSign,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Ganhos Líquidos',
      value: formatCurrency(reportData?.metrics.netEarnings || 25688.00),
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Total de Reservas',
      value: formatCurrency(reportData?.metrics.totalBookings || 1700.00),
      icon: Calendar,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <ModernAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Relatórios De Negócios</h1>
            <p className="text-muted-foreground mt-1">
              Visão geral do desempenho dos negócios
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros de pesquisa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <Label htmlFor="startDate">Selecione a data</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Selecione o intervalo de dados</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-between items-center mt-4">
              <Button variant="outline">
                Procurar
              </Button>
              <Button>
                <Download className="w-4 h-4 mr-2" />
                Filtro
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

        {/* Earnings Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Estatísticas de ganhos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reportData?.chartData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(Number(value)), 'Ganhos']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="earnings" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Yearly Summary Table */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo anual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SL</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Ganhos de comissão</TableHead>
                    <TableHead>Despesas totais</TableHead>
                    <TableHead>Lucro líquido</TableHead>
                    <TableHead>Taxa de lucro líquido</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData?.yearlyData.map((data, index) => (
                    <TableRow key={data.year}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{data.year}</TableCell>
                      <TableCell>{data.bookings.toLocaleString('pt-BR')}</TableCell>
                      <TableCell>{formatCurrency(data.expenses)}</TableCell>
                      <TableCell>{formatCurrency(data.totalRevenue)}</TableCell>
                      <TableCell>{formatCurrency(data.netIncome)}</TableCell>
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