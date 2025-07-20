import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AdminLayout from "@/components/layout/admin-layout";
import { Search, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function AdminWithdrawalRequests() {
  const { user, isLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  // Empty state - no withdrawal requests available
  const withdrawalRequests: any[] = [];

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin-dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Solicitações de retirada do provedor</h1>
        </div>

        {/* Search */}
        <div className="flex items-center justify-end">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Pesquisar"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Withdrawal Requests Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary hover:bg-primary">
                    <TableHead className="text-primary-foreground font-medium">Nome do banco</TableHead>
                    <TableHead className="text-primary-foreground font-medium">Montante</TableHead>
                    <TableHead className="text-primary-foreground font-medium">Tipo de pagamento</TableHead>
                    <TableHead className="text-primary-foreground font-medium">Data de lançamento</TableHead>
                    <TableHead className="text-primary-foreground font-medium">Status do jogo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <div className="text-muted-foreground">
                        <p>Nenhum dado disponível na tabela</p>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrar mais: 10 | entradas: Mostrando 0 a 0 de 0 entradas
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              ‹
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
    </AdminLayout>
  );
}