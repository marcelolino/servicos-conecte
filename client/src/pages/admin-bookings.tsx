import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Download,
  Filter,
  Eye,
  Edit,
  MoreVertical,
  Plus,
  RefreshCw,
  X,
  Check,
  Clock,
  XCircle,
  MapPin,
  User,
  Calendar,
  DollarSign,
  Phone,
  Mail,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";

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
  const [selectedBooking, setSelectedBooking] = useState<BookingData | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditStatusOpen, setIsEditStatusOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");
  
  const { toast } = useToast();

  const { data: bookings, isLoading, refetch } = useQuery<BookingData[]>({
    queryKey: ["/api/admin/bookings"],
  });

  // Query para buscar prestadores disponíveis
  const { data: providers } = useQuery<Array<{
    id: number;
    businessName: string;
    user: { name: string; };
    status: string;
  }>>({
    queryKey: ["/api/admin/providers"],
    enabled: isEditStatusOpen && (newStatus === 'accepted' || newStatus === 'in_progress'),
  });

  // Mutation para atualizar status da reserva
  const updateStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status, note, providerId }: { 
      bookingId: number; 
      status: string; 
      note?: string; 
      providerId?: number;
    }) => {
      const response = await fetch(`/api/admin/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status, note, providerId })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao atualizar status');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
      toast({
        title: "Status atualizado",
        description: "O status da reserva foi atualizado com sucesso.",
      });
      setIsEditStatusOpen(false);
      setSelectedBooking(null);
      setNewStatus("");
      setStatusNote("");
      setSelectedProviderId("");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message || "Ocorreu um erro ao atualizar o status da reserva.",
        variant: "destructive",
      });
    },
  });

  // Mutation para cancelar reserva
  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      const response = await fetch(`/api/admin/bookings/${bookingId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao cancelar reserva');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
      toast({
        title: "Reserva cancelada",
        description: "A reserva foi cancelada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao cancelar reserva",
        description: error.message || "Ocorreu um erro ao cancelar a reserva.",
        variant: "destructive",
      });
    },
  });

  // Funções para abrir modais
  const openDetails = (booking: BookingData) => {
    setSelectedBooking(booking);
    setIsDetailsOpen(true);
  };

  const openEditStatus = (booking: BookingData) => {
    setSelectedBooking(booking);
    setNewStatus(booking.status);
    setSelectedProviderId(booking.providerId?.toString() || "");
    setIsEditStatusOpen(true);
  };

  const handleUpdateStatus = () => {
    if (!selectedBooking || !newStatus) return;
    
    // Verificar se é necessário selecionar um prestador
    const needsProvider = (newStatus === 'accepted' || newStatus === 'in_progress');
    if (needsProvider && !selectedProviderId) {
      toast({
        title: "Prestador obrigatório",
        description: "Selecione um prestador para aceitar ou iniciar a reserva.",
        variant: "destructive",
      });
      return;
    }
    
    updateStatusMutation.mutate({
      bookingId: selectedBooking.id,
      status: newStatus,
      note: statusNote,
      providerId: selectedProviderId ? parseInt(selectedProviderId) : undefined
    });
  };

  const handleCancelBooking = (booking: BookingData) => {
    if (confirm(`Tem certeza que deseja cancelar a reserva #${booking.id.toString().padStart(6, '0')}?`)) {
      cancelBookingMutation.mutate(booking.id);
    }
  };

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
                                title="Ver Detalhes"
                                onClick={() => openDetails(booking)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline" 
                                className="w-8 h-8 p-0 bg-yellow-50 hover:bg-yellow-100"
                                title="Editar Status"
                                onClick={() => openEditStatus(booking)}
                              >
                                <Edit className="w-4 h-4 text-yellow-600" />
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
                                  <DropdownMenuItem onClick={() => openDetails(booking)}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    Ver Detalhes
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openEditStatus(booking)}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Editar Status
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Clock className="w-4 h-4 mr-2" />
                                    Histórico
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-red-600"
                                    onClick={() => handleCancelBooking(booking)}
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
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

        {/* Modal de Detalhes da Reserva */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Detalhes da Reserva #{selectedBooking?.id.toString().padStart(6, '0')}
              </DialogTitle>
              <DialogDescription>
                Informações completas sobre a reserva
              </DialogDescription>
            </DialogHeader>
            
            {selectedBooking && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Informações Gerais */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Informações Gerais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">ID da Reserva</Label>
                      <p className="font-semibold">#{selectedBooking.id.toString().padStart(6, '0')}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Categoria</Label>
                      <p>{selectedBooking.category.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                      <div className="mt-1">{getStatusBadge(selectedBooking.status)}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Data de Criação</Label>
                      <p>{format(new Date(selectedBooking.createdAt), 'dd/MM/yyyy - HH:mm', { locale: ptBR })}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Data Agendada</Label>
                      <p className="font-medium text-blue-600">
                        {format(new Date(selectedBooking.scheduledAt), 'dd/MM/yyyy - HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Informações do Cliente */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Nome</Label>
                      <p className="font-semibold">{selectedBooking.client.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                      <p className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {selectedBooking.client.email}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Telefone</Label>
                      <p className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {selectedBooking.client.phone || 'Não informado'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Informações do Provedor */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Provedor
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedBooking.provider ? (
                      <>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Nome do Negócio</Label>
                          <p className="font-semibold">{selectedBooking.provider.businessName}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Nome do Responsável</Label>
                          <p>{selectedBooking.provider.user.name}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                          <p className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            {selectedBooking.provider.user.email}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Telefone</Label>
                          <p className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {selectedBooking.provider.user.phone || 'Não informado'}
                          </p>
                        </div>
                      </>
                    ) : (
                      <p className="text-muted-foreground">Provedor não atribuído</p>
                    )}
                  </CardContent>
                </Card>

                {/* Localização */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Localização
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Endereço Completo</Label>
                      <p>{selectedBooking.address}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">CEP</Label>
                        <p>{selectedBooking.cep}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Cidade</Label>
                        <p>{selectedBooking.city}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Estado</Label>
                      <p>{selectedBooking.state}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Informações de Pagamento */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Pagamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Valor Total</Label>
                      <p className="text-2xl font-bold text-green-600">
                        {parseFloat(selectedBooking.totalAmount).toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        })}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Método de Pagamento</Label>
                      <p className="capitalize">{selectedBooking.paymentMethod}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Status do Pagamento</Label>
                      <div className="mt-1">{getPaymentStatusBadge(selectedBooking.paymentStatus)}</div>
                    </div>
                  </CardContent>
                </Card>

                {/* Observações */}
                {selectedBooking.notes && (
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-lg">Observações</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{selectedBooking.notes}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Edição de Status */}
        <Dialog open={isEditStatusOpen} onOpenChange={setIsEditStatusOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5" />
                Editar Status da Reserva
              </DialogTitle>
              <DialogDescription>
                Reserva #{selectedBooking?.id.toString().padStart(6, '0')}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="status">Novo Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="accepted">Aceito</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Campo de seleção de prestador - apenas para status aceito ou em andamento */}
              {(newStatus === 'accepted' || newStatus === 'in_progress') && (
                <div>
                  <Label htmlFor="provider">Prestador *</Label>
                  <Select value={selectedProviderId} onValueChange={setSelectedProviderId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um prestador" />
                    </SelectTrigger>
                    <SelectContent>
                      {providers?.filter(p => p.status === 'approved').map((provider) => (
                        <SelectItem key={provider.id} value={provider.id.toString()}>
                          {provider.businessName} - {provider.user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground mt-1">
                    Obrigatório para aceitar ou iniciar a reserva
                  </p>
                </div>
              )}
              
              <div>
                <Label htmlFor="note">Observação (Opcional)</Label>
                <Textarea
                  id="note"
                  placeholder="Adicione uma observação sobre a mudança de status..."
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsEditStatusOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleUpdateStatus}
                disabled={updateStatusMutation.isPending || !newStatus}
              >
                {updateStatusMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Atualizar Status
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ModernAdminLayout>
  );
}