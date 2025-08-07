import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ModernProviderLayout } from "@/components/layout/modern-provider-layout";
import { 
  Banknote, 
  TrendingUp, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react";

interface WithdrawalRequest {
  id: number;
  amount: string;
  method: string;
  bankInfo?: string;
  pixKey?: string;
  status: string;
  createdAt: string;
}

interface ProviderEarnings {
  earnings: Array<{
    id: number;
    totalAmount: string;
    providerAmount: string;
    commissionAmount: string;
    commissionRate: number;
    isWithdrawn: boolean;
    createdAt: string;
    serviceRequest: {
      id: number;
      title: string;
      status: string;
    };
  }>;
  totalEarnings: number;
  availableBalance: number;
  withdrawnAmount: number;
}

export default function ProviderWallet() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("solicitacao");

  // Fetch provider earnings
  const { data: earnings } = useQuery<ProviderEarnings>({
    queryKey: ["/api/provider/earnings"],
    enabled: !!user && user.userType === "provider",
  });

  // Fetch withdrawal requests
  const { data: withdrawalRequests } = useQuery<WithdrawalRequest[]>({
    queryKey: ["/api/provider/withdrawal-requests"],
    enabled: !!user && user.userType === "provider",
  });

  const formatCurrency = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Aprovado';
      case 'rejected':
        return 'Rejeitado';
      case 'pending':
      default:
        return 'Pendente';
    }
  };

  if (!user || user.userType !== "provider") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Acesso Negado</h1>
          <p className="text-muted-foreground">Você precisa ser um prestador para acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <ModernProviderLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Wallet className="h-8 w-8 text-indigo-600" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Carteira Da Loja</h1>
            <p className="text-muted-foreground">Gerencie seus ganhos e solicitações de retirada</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          {/* Dinheiro em casa */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Dinheiro em casa</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(earnings?.availableBalance || 0)}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Banknote className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Saldo saque */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Saldo saque</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency((earnings?.totalEarnings || 0) - (earnings?.withdrawnAmount || 0))}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white">
                      Ajuste Com Carteira
                    </Button>
                  </div>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Saldo não ativado */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Saldo não ativado</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(0)}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Button size="sm" variant="outline" className="border-teal-600 text-teal-600 hover:bg-teal-50">
                      Solicitar Retirada
                    </Button>
                  </div>
                </div>
                <div className="p-3 bg-teal-100 rounded-lg">
                  <Wallet className="h-6 w-6 text-teal-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Segunda linha de cards */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Retirada pendente</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(0)}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total retirado</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(earnings?.withdrawnAmount || 0)}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <ArrowDownRight className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Ganho total</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(earnings?.totalEarnings || 0)}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="solicitacao">Solicitação de retirada</TabsTrigger>
            <TabsTrigger value="historico">Histórico de pagamentos</TabsTrigger>
            <TabsTrigger value="proximos">Próximos pagamentos</TabsTrigger>
          </TabsList>

          <TabsContent value="solicitacao">
            <Card>
              <CardHeader>
                <CardTitle>Solicitações de Retirada</CardTitle>
              </CardHeader>
              <CardContent>
                {withdrawalRequests && withdrawalRequests.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Si</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead>Solicitar Horário</TableHead>
                        <TableHead>Método De Desenbolso</TableHead>
                        <TableHead>Tipo De Transação</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Nota</TableHead>
                        <TableHead>Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {withdrawalRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>{request.id}</TableCell>
                          <TableCell>{formatCurrency(parseFloat(request.amount))}</TableCell>
                          <TableCell>{new Date(request.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell>{request.method === 'pix' ? 'PIX' : request.method === 'bank' ? 'Transferência Bancária' : request.method}</TableCell>
                          <TableCell>Retirada</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(request.status)}>
                              {getStatusText(request.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              Ver Detalhes
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <Wallet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">Nenhuma solicitação encontrada</h3>
                    <p className="text-muted-foreground">
                      Você ainda não fez nenhuma solicitação de retirada.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="historico">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Pagamentos</CardTitle>
              </CardHeader>
              <CardContent>
                {earnings?.earnings && earnings.earnings.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Serviço</TableHead>
                        <TableHead>Valor Total</TableHead>
                        <TableHead>Comissão</TableHead>
                        <TableHead>Valor Recebido</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {earnings.earnings.map((earning) => (
                        <TableRow key={earning.id}>
                          <TableCell>{earning.serviceRequest?.title || `Serviço #${earning.serviceRequest?.id}`}</TableCell>
                          <TableCell>{formatCurrency(parseFloat(earning.totalAmount))}</TableCell>
                          <TableCell>{formatCurrency(parseFloat(earning.commissionAmount))}</TableCell>
                          <TableCell>{formatCurrency(parseFloat(earning.providerAmount))}</TableCell>
                          <TableCell>
                            <Badge className={earning.isWithdrawn ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                              {earning.isWithdrawn ? 'Retirado' : 'Disponível'}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(earning.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <DollarSign className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">Nenhum pagamento encontrado</h3>
                    <p className="text-muted-foreground">
                      Você ainda não possui histórico de pagamentos.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="proximos">
            <Card>
              <CardHeader>
                <CardTitle>Próximos Pagamentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">Nenhum pagamento agendado</h3>
                  <p className="text-muted-foreground">
                    Não há pagamentos programados para os próximos dias.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ModernProviderLayout>
  );
}