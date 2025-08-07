import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ModernProviderLayout } from "@/components/layout/modern-provider-layout";
import { Search, User, Calendar, DollarSign } from "lucide-react";

export default function ProviderCashPayments() {
  const { user, isLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");

  // Mock data for cash payments
  const cashPayments = [
    {
      id: "#13",
      service: "Higienização Completa da Casa (Serviço)",
      client: {
        name: "Pedro Norris",
        email: "demo@user.com"
      },
      date: "20 de julho de 2025",
      time: "01:51",
      history: "Vista",
      status: "Pendente pelo administrador",
      amount: "R$ 99,55"
    }
  ];

  const filteredPayments = cashPayments.filter(payment => {
    const matchesSearch = payment.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.client.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "Todos" || payment.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <ModernProviderLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </ModernProviderLayout>
    );
  }

  return (
    <ModernProviderLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Pagamentos em Dinheiro</h1>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Procurar"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  <SelectItem value="Pendente pelo administrador">Pendente pelo administrador</SelectItem>
                  <SelectItem value="Aprovado">Aprovado</SelectItem>
                  <SelectItem value="Rejeitado">Rejeitado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Cash Payments Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary hover:bg-primary">
                    <TableHead className="text-primary-foreground font-medium">ID</TableHead>
                    <TableHead className="text-primary-foreground font-medium">Serviço</TableHead>
                    <TableHead className="text-primary-foreground font-medium">Utilizador</TableHead>
                    <TableHead className="text-primary-foreground font-medium">Data e hora</TableHead>
                    <TableHead className="text-primary-foreground font-medium">Histórico</TableHead>
                    <TableHead className="text-primary-foreground font-medium">Estado</TableHead>
                    <TableHead className="text-primary-foreground font-medium">Preço</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.length > 0 ? (
                    filteredPayments.map((payment) => (
                      <TableRow key={payment.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{payment.id}</TableCell>
                        <TableCell>
                          <div className="font-medium">{payment.service}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                              <User className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="font-medium">{payment.client.name}</div>
                              <div className="text-sm text-muted-foreground">{payment.client.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-4 w-4" />
                            <span>{payment.date}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">{payment.time}</div>
                        </TableCell>
                        <TableCell>
                          <Button variant="link" className="p-0 h-auto text-primary">
                            {payment.history}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-green-600">
                          {payment.amount}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Nenhum pagamento encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Programa: 10 | Entradas: Mostrando 1 a 1 de 1 entradas
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              ‹
            </Button>
            <Button variant="default" size="sm">
              1
            </Button>
            <Button variant="outline" size="sm" disabled>
              ›
            </Button>
          </div>
        </div>
      </div>
    </ModernProviderLayout>
  );
}