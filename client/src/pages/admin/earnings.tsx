import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingUp, Users, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProviderEarning {
  id: number;
  providerId: number;
  serviceRequestId: number;
  totalAmount: string;
  platformFee: string;
  providerAmount: string;
  isWithdrawn: boolean;
  withdrawnAt?: string;
  createdAt: string;
  provider: {
    id: number;
    user: {
      name: string;
      email: string;
    };
  };
  serviceRequest: {
    id: number;
    title: string;
    finalPrice?: string;
  };
}

export default function EarningsPage() {
  const { data: earnings, isLoading } = useQuery<ProviderEarning[]>({
    queryKey: ["/api/admin/earnings"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-32" />
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
    );
  }

  const totalEarnings = earnings?.reduce((sum, earning) => sum + parseFloat(earning.totalAmount), 0) || 0;
  const totalProviderEarnings = earnings?.reduce((sum, earning) => sum + parseFloat(earning.providerAmount), 0) || 0;
  const totalPlatformFees = earnings?.reduce((sum, earning) => sum + parseFloat(earning.platformFee), 0) || 0;
  const withdrawnEarnings = earnings?.filter(e => e.isWithdrawn).reduce((sum, earning) => sum + parseFloat(earning.providerAmount), 0) || 0;
  const availableEarnings = totalProviderEarnings - withdrawnEarnings;

  const uniqueProviders = new Set(earnings?.map(e => e.providerId)).size;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ganhos</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Acompanhe os ganhos dos prestadores e taxas da plataforma
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Ganhos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Valor total dos serviços
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa da Plataforma</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">R$ {totalPlatformFees.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {totalEarnings > 0 ? ((totalPlatformFees / totalEarnings) * 100).toFixed(1) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponível para Saque</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">R$ {availableEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Ainda não sacado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prestadores Ativos</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{uniqueProviders}</div>
            <p className="text-xs text-muted-foreground">
              Com ganhos registrados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Earnings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Ganhos</CardTitle>
          <CardDescription>
            Detalhamento completo dos ganhos por prestador e serviço
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!earnings || earnings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum ganho encontrado</p>
              <p className="text-sm">Ganhos aparecerão aqui quando os serviços forem concluídos</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prestador</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Taxa Plataforma</TableHead>
                  <TableHead>Valor Prestador</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {earnings.map((earning) => (
                  <TableRow key={earning.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{earning.provider.user.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {earning.provider.user.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{earning.serviceRequest.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Serviço #{earning.serviceRequest.id}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      R$ {parseFloat(earning.totalAmount).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-blue-600 font-medium">
                      R$ {parseFloat(earning.platformFee).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-green-600 font-semibold">
                      R$ {parseFloat(earning.providerAmount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {earning.isWithdrawn ? (
                        <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">
                          Sacado
                        </Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                          Disponível
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{format(new Date(earning.createdAt), "dd/MM/yyyy", { locale: ptBR })}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(earning.createdAt), "HH:mm", { locale: ptBR })}
                        </p>
                        {earning.withdrawnAt && (
                          <p className="text-xs text-gray-600">
                            Sacado: {format(new Date(earning.withdrawnAt), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}