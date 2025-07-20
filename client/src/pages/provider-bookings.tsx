import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { Calendar, User, Filter, MapPin, Trash2, Edit } from "lucide-react";
import { useState } from "react";
import type { ServiceRequest } from "@shared/schema";
import ProviderLayout from "@/components/layout/provider-layout";

export default function ProviderBookings() {
  const { user, loading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterValue, setFilterValue] = useState("Tudo");

  // Fetch bookings for provider
  const { data: bookings, isLoading } = useQuery<(ServiceRequest & { client: any; category: any })[]>({
    queryKey: ["/api/service-requests/provider"],
    enabled: !!user?.userType && user.userType === "provider",
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "accepted":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "in_progress":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendente";
      case "accepted":
        return "Continuar";
      case "in_progress":
        return "Pendente";
      case "completed":
        return "Pendente";
      case "cancelled":
        return "Cancelado";
      default:
        return "Pendente";
    }
  };

  const filteredBookings = bookings?.filter(booking => {
    const matchesSearch = booking.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.client?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterValue === "Tudo" || getStatusText(booking.status) === filterValue;
    return matchesSearch && matchesFilter;
  });

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
          <h1 className="text-2xl font-bold text-foreground">Reservas</h1>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="text-sm text-muted-foreground mb-2">Valor total: R$ 1587.11 Ver detalhamento</div>
            <div className="flex items-center gap-4">
              <Select value={filterValue} onValueChange={setFilterValue}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Aplicar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tudo">Tudo</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Continuar">Continuar</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Procurar"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <Button>Filtro</Button>
            </div>
          </div>
        </div>

        {/* Bookings Table */}
        <Card>
          <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-indigo-600 hover:bg-indigo-600">
                  <TableHead className="text-white font-medium">ID</TableHead>
                  <TableHead className="text-white font-medium">Serviço</TableHead>
                  <TableHead className="text-white font-medium">Utilizador</TableHead>
                  <TableHead className="text-white font-medium">Data da reserva</TableHead>
                  <TableHead className="text-white font-medium">Preço</TableHead>
                  <TableHead className="text-white font-medium">Estado</TableHead>
                  <TableHead className="text-white font-medium">Status do pagamento</TableHead>
                  <TableHead className="text-white font-medium">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-muted-foreground">Carregando reservas...</p>
                    </TableCell>
                  </TableRow>
                ) : !filteredBookings || filteredBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        Nenhuma reserva encontrada
                      </h3>
                      <p className="text-muted-foreground">
                        As reservas dos seus serviços aparecerão aqui.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBookings.map((booking) => (
                    <TableRow key={booking.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">#{booking.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-foreground">{booking.title}</div>
                            <div className="text-xs text-muted-foreground">{booking.category.name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-foreground">{booking.client?.name || "Pedro Norris"}</div>
                            <div className="text-xs text-muted-foreground">{booking.client?.email || "demo@user.com"}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {booking.scheduledDate 
                            ? new Date(booking.scheduledDate).toLocaleDateString('pt-BR') + " " + 
                              (booking.scheduledTime || "15:37")
                            : "24 de julho de 2025 15:37"
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-semibold text-foreground">
                          R$ {booking.estimatedPrice ? Number(booking.estimatedPrice).toFixed(2) : "37.60"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`px-2 py-1 text-xs ${getStatusColor(booking.status)}`}>
                          {getStatusText(booking.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                          Pendente
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
      {filteredBookings && filteredBookings.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Programa: <strong>10</strong> Entradas
          </div>
          <div className="text-sm text-muted-foreground">
            Mostrando <strong>1 a {filteredBookings.length} de {filteredBookings.length} entradas</strong>
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