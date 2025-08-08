import { useQuery } from '@tanstack/react-query';
import { ModernAdminLayout } from '@/components/layout/modern-admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { DollarSign, TrendingUp, TrendingDown, FileText, Download } from 'lucide-react';
import { useState } from 'react';

interface TransactionMetrics {
  totalRevenue: number;
  commissionRevenue: number;
  depositsRequired: number;
  lostGain: number;
  completedGain: number;
}

interface Transaction {
  id: string;
  amount: number;
  status: string;
  paymentMethod: string;
  transactionId: string;
  date: string;
  provider: string;
  serviceType: string;
  location: string;
}

export default function AdminReportsTransactions() {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    zone: 'all',
    category: 'all',
    provider: 'all'
  });

  const { data: reportData, isLoading } = useQuery<{
    metrics: TransactionMetrics;
    transactions: Transaction[];
  }>({
    queryKey: ['/api/admin/reports/transactions', filters],
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
      title: 'Receita da publicidade',
      value: formatCurrency(reportData?.metrics.totalRevenue || 25688.00),
      icon: DollarSign,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Receita da comissão',
      value: formatCurrency(reportData?.metrics.commissionRevenue || 24178.00),
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Depósitos',
      value: formatCurrency(reportData?.metrics.depositsRequired || 210.00),
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Perda perdida',
      value: formatCurrency(reportData?.metrics.lostGain || 7536815.14),
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Ganhos completados',
      value: formatCurrency(reportData?.metrics.completedGain || 17547.89),
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
    },
  ];

  return (
    <ModernAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Relatórios De Transações</h1>
            <p className="text-muted-foreground mt-1">
              Análise detalhada das transações financeiras
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
                <Label htmlFor="provider">Provedor</Label>
                <Select
                  value={filters.provider}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, provider: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o provedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os provedores</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Data inicial</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Data final</Label>
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
                Pesquisar por filtragem
              </Button>
              <Button>
                <Download className="w-4 h-4 mr-2" />
                Filtro
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Todos de transação</CardTitle>
              <div className="text-sm text-muted-foreground">
                Total de transações: 325
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SL</TableHead>
                    <TableHead>ID da transação</TableHead>
                    <TableHead>Data da transação</TableHead>
                    <TableHead>Transação para</TableHead>
                    <TableHead>Debitar</TableHead>
                    <TableHead>Crédito</TableHead>
                    <TableHead>Resultante</TableHead>
                    <TableHead>Tipo de transação</TableHead>
                    <TableHead>Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData?.transactions.map((transaction, index) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {transaction.transactionId}
                      </TableCell>
                      <TableCell>{transaction.date}</TableCell>
                      <TableCell>{transaction.provider}</TableCell>
                      <TableCell>-R$ 0,00</TableCell>
                      <TableCell>+ {formatCurrency(transaction.amount)}</TableCell>
                      <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          Confirmado a receber
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          Ver detalhes
                        </Button>
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