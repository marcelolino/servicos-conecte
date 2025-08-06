import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, DollarSign, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ModernAdminLayout } from "@/components/layout/modern-admin-layout";

interface CashPayment {
  id: number;
  serviceRequestId: number;
  amount: string;
  paymentMethod: string;
  status: string;
  confirmedBy?: number;
  createdAt: string;
  confirmedAt?: string;
  serviceRequest: {
    id: number;
    title: string;
    client: {
      name: string;
      email: string;
    };
    provider?: {
      user: {
        name: string;
        email: string;
      };
    };
  };
}

export default function CashPaymentsPage() {
  const { data: cashPayments, isLoading } = useQuery<CashPayment[]>({
    queryKey: ["/api/admin/payments/cash"],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'disputed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmado';
      case 'pending':
        return 'Pendente';
      case 'disputed':
        return 'Disputado';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <ModernAdminLayout>
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </ModernAdminLayout>
    );
  }

  const totalAmount = cashPayments?.reduce((sum, payment) => sum + parseFloat(payment.amount), 0) || 0;
  const confirmedPayments = cashPayments?.filter(p => p.status === 'confirmed') || [];
  const pendingPayments = cashPayments?.filter(p => p.status === 'pending') || [];

  return (
    <ModernAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pagamentos Em Dinheiro</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie pagamentos realizados em dinheiro que necessitam confirmação
          </p>
        </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total em Dinheiro</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              +{cashPayments?.length || 0} transações em dinheiro
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagamentos Confirmados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{confirmedPayments.length}</div>
            <p className="text-xs text-muted-foreground">
              R$ {confirmedPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aguardando Confirmação</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingPayments.length}</div>
            <p className="text-xs text-muted-foreground">
              R$ {pendingPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cash Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pagamentos em Dinheiro</CardTitle>
          <CardDescription>
            Lista de pagamentos realizados em dinheiro que necessitam confirmação administrativa
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!cashPayments || cashPayments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum pagamento em dinheiro encontrado</p>
              <p className="text-sm">Pagamentos em dinheiro aparecerão aqui quando reportados</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Prestador</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cashPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">#{payment.id}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{payment.serviceRequest.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Serviço #{payment.serviceRequest.id}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{payment.serviceRequest.client.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {payment.serviceRequest.client.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {payment.serviceRequest.provider?.user.name || "N/A"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {payment.serviceRequest.provider?.user.email || "Não atribuído"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-green-600">
                      R$ {parseFloat(payment.amount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(payment.status)}>
                        {getStatusText(payment.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{format(new Date(payment.createdAt), "dd/MM/yyyy", { locale: ptBR })}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(payment.createdAt), "HH:mm", { locale: ptBR })}
                        </p>
                        {payment.confirmedAt && (
                          <p className="text-xs text-green-600">
                            Confirmado: {format(new Date(payment.confirmedAt), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {payment.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="text-green-600 border-green-600">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Confirmar
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-600">
                            Disputar
                          </Button>
                        </div>
                      )}
                      {payment.status === 'confirmed' && (
                        <span className="text-sm text-muted-foreground">Confirmado</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      </div>
    </ModernAdminLayout>
  );
}