import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  MoreVertical,
  MapPin,
  Clock,
  User,
  DollarSign,
  Calendar,
  CheckCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ModernProviderLayout } from "@/components/layout/modern-provider-layout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface OngoingBookingData {
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
  client: {
    id: number;
    name: string;
    email: string;
    phone?: string;
  };
  category: {
    id: number;
    name: string;
  };
}

export default function ProviderBookingsOngoingPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bookings, isLoading } = useQuery<OngoingBookingData[]>({
    queryKey: ["/api/service-requests/provider"],
  });

  // Filter only ongoing bookings
  const ongoingBookings = bookings?.filter(booking => booking.status === 'in_progress') || [];

  // Mutation for completing bookings
  const completeBookingMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes?: string }) => {
      return apiRequest("PUT", `/api/service-requests/${id}`, { 
        status: 'completed', 
        notes: notes || 'Serviço finalizado pelo provedor',
        completedAt: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests/provider"] });
      toast({
        title: "Serviço Finalizado",
        description: "O serviço foi marcado como concluído com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao finalizar o serviço.",
        variant: "destructive",
      });
    },
  });

  const handleCompleteService = (bookingId: number) => {
    completeBookingMutation.mutate({ id: bookingId });
  };

  const filteredBookings = ongoingBookings.filter(booking => {
    const searchLower = searchTerm.toLowerCase();
    return (
      booking.id.toString().includes(searchLower) ||
      booking.client.name.toLowerCase().includes(searchLower) ||
      booking.category.name.toLowerCase().includes(searchLower) ||
      booking.address.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return (
      <ModernProviderLayout>
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
      </ModernProviderLayout>
    );
  }

  return (
    <ModernProviderLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Solicitação de Reserva</h1>
            <div className="text-sm text-muted-foreground">
              Total de Solicitações: {ongoingBookings.length}
            </div>
          </div>
          <p className="text-muted-foreground">
            Gerencie seus serviços em andamento
          </p>
        </div>

        {/* Tabs */}
        <Tabs value="ongoing" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">Todas as Reservas</TabsTrigger>
            <TabsTrigger value="regular">Reserva Regular</TabsTrigger>
            <TabsTrigger value="ongoing">Reserva Em Andamento</TabsTrigger>
          </TabsList>

          <TabsContent value="ongoing" className="mt-6">
            {/* Search and Filter Bar */}
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

            {/* Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">N°</TableHead>
                      <TableHead className="font-semibold">ID da Reserva</TableHead>
                      <TableHead className="font-semibold">Onde o Serviço Será Prestado</TableHead>
                      <TableHead className="font-semibold">Informações do Cliente</TableHead>
                      <TableHead className="font-semibold">Valor Total</TableHead>
                      <TableHead className="font-semibold">Status de Pagamento</TableHead>
                      <TableHead className="font-semibold">Data Agendada</TableHead>
                      <TableHead className="font-semibold">Data da Reserva</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                          <div className="flex flex-col items-center gap-2">
                            <Clock className="w-12 h-12 opacity-50" />
                            <p>Nenhum serviço em andamento</p>
                            <p className="text-sm">Os serviços em andamento aparecerão aqui</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBookings.map((booking, index) => (
                        <TableRow key={booking.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="font-medium">{booking.id.toString().padStart(6, '0')}</span>
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
                            <div>
                              <p className="font-medium">{booking.client.name}</p>
                              <p className="text-xs text-muted-foreground">+••••••••••</p>
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
                            <Badge 
                              variant={booking.paymentStatus === 'completed' ? 'default' : 'secondary'}
                              className={
                                booking.paymentStatus === 'completed' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }
                            >
                              {booking.paymentStatus === 'completed' ? 'Pago' : 'Não Pago'}
                            </Badge>
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
                            <div className="text-sm">
                              {format(new Date(booking.createdAt), 'dd-MMM-yyyy HH:mm', { locale: ptBR })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800">
                              Em Andamento
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-8 h-8 p-0"
                                title="Visualizar"
                                onClick={() => window.open(`/provider-bookings/details/${booking.id}`, '_blank')}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-8 h-8 p-0 text-green-600 hover:text-green-700"
                                title="Finalizar Serviço"
                                onClick={() => handleCompleteService(booking.id)}
                                disabled={completeBookingMutation.isPending}
                              >
                                <CheckCircle className="w-4 h-4" />
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
                                  <DropdownMenuItem>Contatar Cliente</DropdownMenuItem>
                                  <DropdownMenuItem>Histórico</DropdownMenuItem>
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
    </ModernProviderLayout>
  );
}