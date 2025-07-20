import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { CreditCard, DollarSign, Calendar, User, Filter } from "lucide-react";
import { useState } from "react";
import ProviderLayout from "@/components/layout/provider-layout";

interface Payment {
  id: number;
  serviceId: number;
  serviceName: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  status: string;
  paymentType: string;
  createdAt: string;
}

export default function ProviderPayments() {
  const { user, loading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch payments for provider (mock data for now)
  const { data: payments, isLoading } = useQuery<Payment[]>({
    queryKey: ["/api/payments/provider"],
    queryFn: () => 
      // Mock payment data based on the image structure
      Promise.resolve([
        {
          id: 15,
          serviceId: 1,
          serviceName: "Higienização Completa da Casa (Serviço)",
          clientName: "Pedro Norris",
          clientEmail: "demo@user.com",
          amount: 399.55,
          status: "Pendente Pelo Administrador",
          paymentType: "numerário",
          createdAt: "2025-07-20T01:51:00Z"
        }
      ]),
    enabled: !!user?.userType && user.userType === "provider",
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pendente":
      case "pendente pelo administrador":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "aprovado":
      case "pago":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "cancelado":
      case "rejeitado":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

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
    <ProviderLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Pagamentos</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Procurar"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <Button>Filtro</Button>
          </div>
        </div>

        {/* Payments Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-indigo-600 hover:bg-indigo-600">
                    <TableHead className="text-white font-medium">ID</TableHead>
                    <TableHead className="text-white font-medium">Serviço</TableHead>
                    <TableHead className="text-white font-medium">Utilizador</TableHead>
                    <TableHead className="text-white font-medium">Tipo de pagamento</TableHead>
                    <TableHead className="text-white font-medium">Estado</TableHead>
                    <TableHead className="text-white font-medium">Data e hora</TableHead>
                    <TableHead className="text-white font-medium">Valor Total Pago</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-muted-foreground">Carregando pagamentos...</p>
                    </TableCell>
                  </TableRow>
                ) : payments?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        Nenhum pagamento encontrado
                      </h3>
                      <p className="text-muted-foreground">
                        Os pagamentos dos seus serviços aparecerão aqui.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  payments?.map((payment) => (
                    <TableRow key={payment.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">#{payment.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <span className="text-sm font-medium text-foreground">
                            {payment.serviceName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-foreground">{payment.clientName}</div>
                            <div className="text-xs text-muted-foreground">{payment.clientEmail}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-foreground">{payment.paymentType}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`px-2 py-1 text-xs ${getStatusColor(payment.status)}`}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(payment.createdAt).toLocaleString('pt-BR')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-semibold text-foreground">
                          R$ {payment.amount.toFixed(2)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {payments && payments.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Programa: <strong>10</strong> Entradas
          </div>
          <div className="text-sm text-muted-foreground">
            Mostrando <strong>1 a 1 de 1 entradas</strong>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              ‹
            </Button>
            <Button variant="default" size="sm" className="bg-indigo-600 hover:bg-indigo-700">
              1
            </Button>
            <Button variant="outline" size="sm" disabled>
              ›
            </Button>
          </div>
        </div>
      )}
      </div>
    </ProviderLayout>
  );
}