import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ModernAdminLayout } from "@/components/layout/modern-admin-layout";
import { Search, User, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function AdminPayments() {
  const { user, isLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data for payments
  const payments = [
    {
      id: "13",
      service: "Saneamento completo (Serviço)",
      user: {
        name: "Pedro Norris (em inglês)",
        email: "demo.user.com"
      },
      paymentType: "Dinheiro em dinheiro",
      paymentStatus: "Pendizendo Por Admin",
      date: "20 de julho de 2025",
      time: "1:51 AM",
      amount: "$99.55 (em inglês)"
    }
  ];

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.user.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <ModernAdminLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </ModernAdminLayout>
    );
  }

  return (
    <ModernAdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin-dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Pagamentos</h1>
        </div>

        {/* Search */}
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">All</span>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Procurar"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary hover:bg-primary">
                    <TableHead className="text-primary-foreground font-medium">ID</TableHead>
                    <TableHead className="text-primary-foreground font-medium">Serviço de reposição</TableHead>
                    <TableHead className="text-primary-foreground font-medium">Usuário</TableHead>
                    <TableHead className="text-primary-foreground font-medium">Tipo de pagamento</TableHead>
                    <TableHead className="text-primary-foreground font-medium">Status do jogo</TableHead>
                    <TableHead className="text-primary-foreground font-medium">Data e hora</TableHead>
                    <TableHead className="text-primary-foreground font-medium">Quantidade total paga</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.length > 0 ? (
                    filteredPayments.map((payment) => (
                      <TableRow key={payment.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{payment.id}</TableCell>
                        <TableCell className="font-medium">{payment.service}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                              <User className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="font-medium">{payment.user.name}</div>
                              <div className="text-sm text-muted-foreground">{payment.user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{payment.paymentType}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            {payment.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{payment.date}</div>
                          <div className="text-xs text-muted-foreground">{payment.time}</div>
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
            Mostrar mais: 10 | entradas: Mostrando 1 a 1 de 1 entradas
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

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground pt-4">
          © 2024 Todos os direitos reservados por IQONIC Design
        </div>
      </div>
    </ModernAdminLayout>
  );
}