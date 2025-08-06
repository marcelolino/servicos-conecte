import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ModernAdminLayout } from "@/components/layout/modern-admin-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Download,
  Filter,
  Eye,
  Edit,
  MoreVertical,
  Plus,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "wouter";

interface BookingData {
  id: number;
  clientId: number;
  providerId?: number;
  categoryId: number;
  status: string;
  totalAmount: string;
  paymentMethod: string;
  paymentStatus: string;
  address: string;
  cep: string;
  city: string;
  state: string;
  scheduledAt: string;
  notes?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  client: {
    id: number;
    name: string;
    email: string;
    phone?: string;
  };
  provider?: {
    id: number;
    userId: number;
    businessName: string;
    user: {
      name: string;
      email: string;
      phone?: string;
    };
  };
  category: {
    id: number;
    name: string;
  };
}

export default function AdminBookingsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");

  const { data: bookings, isLoading, refetch } = useQuery<BookingData[]>({
    queryKey: ["/api/admin/bookings"],
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
      accepted: { label: "Aceito", color: "bg-blue-100 text-blue-800" },
      in_progress: { label: "Em Andamento", color: "bg-orange-100 text-orange-800" },
      completed: { label: "Concluído", color: "bg-green-100 text-green-800" },
      cancelled: { label: "Cancelado", color: "bg-red-100 text-red-800" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      color: "bg-gray-100 text-gray-800",
    };

    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    return (
      <Badge 
        className={
          status === 'completed' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }
      >
        {status === 'completed' ? 'Pago' : 'Não Pago'}
      </Badge>
    );
  };

  const filteredBookings = bookings?.filter(booking => {
    // Filter by status tab
    if (selectedTab !== "all") {
      if (selectedTab === "pending" && booking.status !== "pending") return false;
      if (selectedTab === "accepted" && booking.status !== "accepted") return false;
      if (selectedTab === "ongoing" && booking.status !== "in_progress") return false;
      if (selectedTab === "completed" && booking.status !== "completed") return false;
      if (selectedTab === "cancelled" && booking.status !== "cancelled") return false;
      if (selectedTab === "offline" && booking.paymentMethod !== "cash") return false;
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        booking.id.toString().includes(searchLower) ||
        booking.client.name.toLowerCase().includes(searchLower) ||
        booking.category.name.toLowerCase().includes(searchLower) ||
        booking.address.toLowerCase().includes(searchLower) ||
        booking.provider?.businessName?.toLowerCase().includes(searchLower)
      );
    }

    return true;
  }) || [];

  if (isLoading) {
    return (
      <ModernAdminLayout>
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
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

  return (
    <ModernAdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Reservas</h1>
            <div className="text-sm text-muted-foreground">
              Total de Reservas: {filteredBookings.length}
            </div>
          </div>
          <p className="text-muted-foreground">
            Gerencie todas as reservas e solicitações de serviços
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="all">Todas as Reservas</TabsTrigger>
            <TabsTrigger value="regular">Reserva Regular</TabsTrigger>
            <TabsTrigger value="repeat">Repetir Reserva</TabsTrigger>
            <TabsTrigger value="offline">Lista de Pagamento Offline</TabsTrigger>
            <TabsTrigger value="accepted">Aceito</TabsTrigger>
            <TabsTrigger value="ongoing">Em Andamento</TabsTrigger>
            <TabsTrigger value="completed">Concluído</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelado</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="mt-6">
            {/* Search and Action Bar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Pesquisar aqui..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Button variant="default" size="sm">
                  <Search className="w-4 h-4 mr-2" />
                  PESQUISAR
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Atualizar
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Baixar
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="w-4 h-4 mr-2" />
                      Filtrar {filteredBookings.length}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>Todos</DropdownMenuItem>
                    <DropdownMenuItem>Hoje</DropdownMenuItem>
                    <DropdownMenuItem>Esta Semana</DropdownMenuItem>
                    <DropdownMenuItem>Este Mês</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Bookings Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">SL</TableHead>
                      <TableHead className="font-semibold">ID da Reserva</TableHead>
                      <TableHead className="font-semibold">Data da Reserva</TableHead>
                      <TableHead className="font-semibold">Onde o Serviço Será Prestado</TableHead>
                      <TableHead className="font-semibold">Data Agendada</TableHead>
                      <TableHead className="font-semibold">Informações do Cliente</TableHead>
                      <TableHead className="font-semibold">Informações do Provedor</TableHead>
                      <TableHead className="font-semibold">Valor Total</TableHead>
                      <TableHead className="font-semibold">Status de Pagamento</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                          <div className="flex flex-col items-center gap-2">
                            <Search className="w-12 h-12 opacity-50" />
                            <p>Nenhuma reserva encontrada</p>
                            <p className="text-sm">Ajuste os filtros ou termos de pesquisa</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBookings.map((booking, index) => (
                        <TableRow key={booking.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="font-medium">{booking.id.toString().padStart(6, '0')}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {format(new Date(booking.createdAt), 'dd-MMM-yyyy', { locale: ptBR })}
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(booking.createdAt), 'HH:mm')}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-48">
                              <p className="text-sm font-medium">Local do Cliente</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {booking.address}, {booking.city}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>Próximo Agendado</div>
                              <div className="font-medium">
                                {format(new Date(booking.scheduledAt), 'dd-MMM-yyyy', { locale: ptBR })}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(booking.scheduledAt), 'HH:mm')}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{booking.client.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {booking.client.phone || '+••••••••••'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              {booking.provider ? (
                                <>
                                  <p className="font-medium">{booking.provider.businessName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {booking.provider.user.phone || '+••••••••••'}
                                  </p>
                                </>
                              ) : (
                                <span className="text-muted-foreground text-sm">Não atribuído</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-green-600">
                              {parseFloat(booking.totalAmount).toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                              })}
                            </span>
                          </TableCell>
                          <TableCell>
                            {getPaymentStatusBadge(booking.paymentStatus)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(booking.status)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-8 h-8 p-0"
                                title="Visualizar"
                                asChild
                              >
                                <Link href={`/admin-bookings/details/${booking.id}`}>
                                  <Eye className="w-4 h-4" />
                                </Link>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-8 h-8 p-0"
                                title="Editar"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-8 h-8 p-0"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
                                  <DropdownMenuItem>Editar Status</DropdownMenuItem>
                                  <DropdownMenuItem>Histórico</DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600">
                                    Cancelar Reserva
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ModernAdminLayout>
  );
}