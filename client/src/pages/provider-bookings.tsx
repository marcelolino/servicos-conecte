import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  MapPin,
  DollarSign,
  Printer,
  Check,
  X,
  MessageCircle,
  Settings
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ModernProviderLayout } from "@/components/layout/modern-provider-layout";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getAuthToken } from "@/lib/auth";

interface BookingData {
  id: number;
  clientId: number;
  categoryId: number;
  providerId: number;
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
  title?: string;
  type: 'order' | 'service_request';
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

export default function ProviderBookingsPage() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Navigation function
  const navigate = (path: string) => {
    window.location.href = path;
  };
  
  // Determine selected tab based on URL
  const getSelectedTab = () => {
    if (location.includes('/pending')) return 'pending';
    if (location.includes('/accepted')) return 'accepted';
    if (location.includes('/ongoing')) return 'in_progress';
    if (location.includes('/completed')) return 'completed';
    if (location.includes('/cancelled')) return 'cancelled';
    return 'all';
  };
  
  const selectedTab = getSelectedTab();
  
  // Fetch service requests (open requests where providers make proposals)
  const { data: serviceRequests, isLoading: isLoadingRequests } = useQuery<BookingData[]>({
    queryKey: ["/api/service-requests/provider"],
  });

  // Fetch catalog orders (orders from catalog that need a provider)
  const { data: catalogOrders, isLoading: isLoadingOrders } = useQuery<BookingData[]>({
    queryKey: ["/api/orders/provider"],
  });

  // Merge both data sources
  const bookings = [
    ...(serviceRequests || []),
    ...(catalogOrders || [])
  ];
  
  const isLoading = isLoadingRequests || isLoadingOrders;

  // Mutation for accepting/rejecting bookings
  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, status, notes, type }: { id: number; status: string; notes?: string; type?: 'order' | 'service_request' }) => {
      // For catalog orders, use the orders endpoint
      if (type === 'order') {
        if (status === 'accepted') {
          return apiRequest("PUT", `/api/orders/${id}/accept-catalog-service`, {});
        } else {
          // For rejecting/cancelling orders, update order status
          return apiRequest("PUT", `/api/orders/${id}`, { status, notes });
        }
      }
      // For service requests, use the service-requests endpoint
      return apiRequest("PUT", `/api/service-requests/${id}`, { status, notes });
    },
    onMutate: async ({ id, status, type }) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["/api/service-requests/provider"] });
      await queryClient.cancelQueries({ queryKey: ["/api/orders/provider"] });
      
      // Snapshot the previous values
      const previousServiceRequests = queryClient.getQueryData(["/api/service-requests/provider"]);
      const previousOrders = queryClient.getQueryData(["/api/orders/provider"]);
      
      // Optimistically update the correct query based on type
      if (type === 'order') {
        queryClient.setQueryData(["/api/orders/provider"], (old: BookingData[] | undefined) => {
          if (!old) return old;
          return old.map(booking => 
            booking.id === id 
              ? { ...booking, status: status }
              : booking
          );
        });
      } else {
        queryClient.setQueryData(["/api/service-requests/provider"], (old: BookingData[] | undefined) => {
          if (!old) return old;
          return old.map(booking => 
            booking.id === id 
              ? { ...booking, status: status }
              : booking
          );
        });
      }
      
      // Return a context object with the snapshotted values
      return { previousServiceRequests, previousOrders };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests/provider"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders/provider"] });
      toast({
        title: "Reserva atualizada",
        description: "O status da reserva foi atualizado com sucesso.",
      });
    },
    onError: (error: any, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousServiceRequests) {
        queryClient.setQueryData(["/api/service-requests/provider"], context.previousServiceRequests);
      }
      if (context?.previousOrders) {
        queryClient.setQueryData(["/api/orders/provider"], context.previousOrders);
      }
      
      const errorMessage = error?.message || "Ocorreu um erro ao atualizar a reserva.";
      
      // Check if error is about provider approval
      if (errorMessage.includes("aprovação") || errorMessage.includes("precisa ser aprovado")) {
        toast({
          title: "Aguarde a liberação de aprovação",
          description: "Seu perfil precisa ser aprovado antes de aceitar reservas.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: errorMessage,
          variant: "destructive",
        });
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests/provider"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders/provider"] });
    },
  });

  const handleAcceptBooking = (bookingId: number, bookingType?: 'order' | 'service_request') => {
    updateBookingMutation.mutate({ id: bookingId, status: 'accepted', type: bookingType });
  };

  const handleRejectBooking = (bookingId: number, bookingType?: 'order' | 'service_request') => {
    updateBookingMutation.mutate({ id: bookingId, status: 'cancelled', notes: 'Rejeitado pelo provedor', type: bookingType });
  };

  if (isLoading) {
    return (
      <ModernProviderLayout>
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
      </ModernProviderLayout>
    );
  }

  const filteredBookings = bookings?.filter(booking => {
    const matchesSearch = 
      booking.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.id.toString().includes(searchTerm);

    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;

    return matchesSearch && matchesStatus;
  }) || [];

  const getBookingsByStatus = (status: string) => {
    if (status === "all") return filteredBookings;
    return filteredBookings.filter(booking => booking.status === status);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'accepted':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'in_progress':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'accepted':
        return 'Aceita';
      case 'in_progress':
        return 'Em Andamento';
      case 'completed':
        return 'Concluída';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'accepted':
        return <CheckCircle className="w-4 h-4" />;
      case 'in_progress':
        return <AlertTriangle className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  const totalBookings = filteredBookings.length;
  const pendingBookings = filteredBookings.filter(b => b.status === 'pending').length;
  const acceptedBookings = filteredBookings.filter(b => b.status === 'accepted').length;
  const completedBookings = filteredBookings.filter(b => b.status === 'completed').length;

  return (
    <ModernProviderLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Solicitações de Reserva</h1>
          <p className="text-muted-foreground">
            Gerencie suas reservas de serviços e solicitações dos clientes
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Solicitações</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalBookings}</div>
              <p className="text-xs text-muted-foreground">
                Todas as solicitações
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingBookings}</div>
              <p className="text-xs text-muted-foreground">
                Aguardando resposta
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aceitas</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{acceptedBookings}</div>
              <p className="text-xs text-muted-foreground">
                Confirmadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{completedBookings}</div>
              <p className="text-xs text-muted-foreground">
                Finalizadas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente, email, categoria ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="accepted">Aceita</SelectItem>
              <SelectItem value="in_progress">Em Andamento</SelectItem>
              <SelectItem value="completed">Concluída</SelectItem>
              <SelectItem value="cancelled">Cancelada</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Baixar
          </Button>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filtro
          </Button>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={selectedTab} onValueChange={(value) => {
          // Navigate to corresponding URL
          const urlMap: Record<string, string> = {
            'all': '/provider-bookings',
            'pending': '/provider-bookings/pending',
            'accepted': '/provider-bookings/accepted',
            'in_progress': '/provider-bookings/ongoing',
            'completed': '/provider-bookings/completed',
            'cancelled': '/provider-bookings/cancelled'
          };
          navigate(urlMap[value] || '/provider-bookings');
        }}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">Todas Reservas</TabsTrigger>
            <TabsTrigger value="pending">Solicitações Pendentes</TabsTrigger>
            <TabsTrigger value="accepted">Reservas Aceitas</TabsTrigger>
            <TabsTrigger value="in_progress">Em Andamento</TabsTrigger>
            <TabsTrigger value="completed">Concluídas</TabsTrigger>
            <TabsTrigger value="cancelled">Canceladas</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <BookingsTable 
              bookings={filteredBookings} 
              onAcceptBooking={handleAcceptBooking}
              onRejectBooking={handleRejectBooking}
              isUpdating={updateBookingMutation.isPending}
              navigate={navigate}
            />
          </TabsContent>
          
          <TabsContent value="pending" className="mt-6">
            <BookingsTable 
              bookings={getBookingsByStatus('pending')} 
              onAcceptBooking={handleAcceptBooking}
              onRejectBooking={handleRejectBooking}
              isUpdating={updateBookingMutation.isPending}
              navigate={navigate}
            />
          </TabsContent>
          
          <TabsContent value="accepted" className="mt-6">
            <BookingsTable 
              bookings={getBookingsByStatus('accepted')} 
              onAcceptBooking={handleAcceptBooking}
              onRejectBooking={handleRejectBooking}
              isUpdating={updateBookingMutation.isPending}
              navigate={navigate}
            />
          </TabsContent>
          
          <TabsContent value="in_progress" className="mt-6">
            <BookingsTable 
              bookings={getBookingsByStatus('in_progress')} 
              onAcceptBooking={handleAcceptBooking}
              onRejectBooking={handleRejectBooking}
              isUpdating={updateBookingMutation.isPending}
              navigate={navigate}
            />
          </TabsContent>
          
          <TabsContent value="completed" className="mt-6">
            <BookingsTable 
              bookings={getBookingsByStatus('completed')} 
              onAcceptBooking={handleAcceptBooking}
              onRejectBooking={handleRejectBooking}
              isUpdating={updateBookingMutation.isPending}
              navigate={navigate}
            />
          </TabsContent>
          
          <TabsContent value="cancelled" className="mt-6">
            <BookingsTable 
              bookings={getBookingsByStatus('cancelled')} 
              onAcceptBooking={handleAcceptBooking}
              onRejectBooking={handleRejectBooking}
              isUpdating={updateBookingMutation.isPending}
              navigate={navigate}
            />
          </TabsContent>
        </Tabs>
      </div>
    </ModernProviderLayout>
  );
}

interface BookingsTableProps {
  bookings: BookingData[];
  onAcceptBooking: (id: number, type?: 'order' | 'service_request') => void;
  onRejectBooking: (id: number, type?: 'order' | 'service_request') => void;
  isUpdating: boolean;
  navigate: (path: string) => void;
}

function BookingsTable({ bookings, onAcceptBooking, onRejectBooking, isUpdating, navigate }: BookingsTableProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createChatMutation = useMutation({
    mutationFn: async ({ participantId, serviceRequestId }: { participantId: number; serviceRequestId: number }) => {
      return apiRequest('POST', '/api/chat/conversations', { 
        participantId, 
        serviceRequestId,
        title: `Serviço #${serviceRequestId}`
      });
    },
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
      window.location.href = '/provider-chat';
      toast({
        title: "Chat iniciado",
        description: "Conversa iniciada com o cliente. Você foi redirecionado para o chat.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível iniciar o chat",
        variant: "destructive",
      });
    },
  });

  const handleStartChat = (clientId: number, serviceRequestId: number) => {
    createChatMutation.mutate({ participantId: clientId, serviceRequestId });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'accepted':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'in_progress':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'accepted':
        return 'Aceita';
      case 'in_progress':
        return 'Em Andamento';
      case 'completed':
        return 'Concluída';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista de Solicitações</CardTitle>
        <CardDescription>
          Todas as solicitações de reserva dos clientes
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!bookings || bookings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma solicitação encontrada</p>
            <p className="text-sm">As reservas aparecerão aqui quando os clientes fizerem solicitações</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº do Pedido</TableHead>
                <TableHead>Nome do Serviço</TableHead>
                <TableHead>Onde o Serviço Será Prestado</TableHead>
                <TableHead>Informações do Cliente</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Status do Pagamento</TableHead>
                <TableHead>Data Agendada</TableHead>
                <TableHead>Data da Reserva</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={`${booking.type}-${booking.id}`}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{booking.id.toString().padStart(5, '0')}</span>
                      <span className="text-xs text-muted-foreground">
                        {booking.type === 'order' ? 'Pedido' : 'Solicitação'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">
                        {booking.title || booking.category.name}
                      </span>
                      {booking.title && booking.title !== booking.category.name && (
                        <span className="text-xs text-muted-foreground">
                          {booking.category.name}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm">{booking.address}</p>
                        <p className="text-xs text-muted-foreground">
                          {booking.city}, {booking.state} - {booking.cep}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{booking.client.name}</p>
                      <p className="text-sm text-muted-foreground">{booking.client.email}</p>
                      {booking.client.phone && (
                        <p className="text-xs text-muted-foreground">{booking.client.phone}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="font-semibold text-green-600">
                        R$ {parseFloat(booking.totalAmount).toFixed(2)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        booking.paymentStatus === 'completed'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : booking.paymentMethod === 'cash'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : booking.paymentStatus === 'pending'
                          ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }
                    >
                      {booking.paymentStatus === 'completed' ? 'Pago' : 
                       booking.paymentMethod === 'cash' ? 'Pagamento no Local' :
                       booking.paymentStatus === 'pending' ? 'Não Pago' : 'Falhou'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm">
                          {format(new Date(booking.scheduledAt), 'dd-MMM-yyyy', { locale: ptBR })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(booking.scheduledAt), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">
                      {format(new Date(booking.createdAt), 'dd-MMM-yyyy HH:mm', { locale: ptBR })}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(booking.status)}>
                      {getStatusText(booking.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => navigate(`/provider-bookings/details/${booking.id}`)}
                        title="Visualizar Detalhes"
                        className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                        data-testid={`button-view-${booking.id}`}
                      >
                        <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => navigate(`/provider-bookings/details/${booking.id}`)}
                        title="Gerenciar Reserva"
                        className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                        data-testid={`button-manage-${booking.id}`}
                      >
                        <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </Button>
                      {booking.status === 'pending' ? (
                        <>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="h-8 w-8 p-0 hover:bg-green-50 dark:hover:bg-green-900/20"
                            title="Aceitar Reserva"
                            onClick={() => onAcceptBooking(booking.id, booking.type)}
                            disabled={isUpdating}
                            data-testid={`button-accept-${booking.id}`}
                          >
                            {isUpdating ? (
                              <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                            )}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Ignorar/Rejeitar"
                            onClick={() => onRejectBooking(booking.id, booking.type)}
                            disabled={isUpdating}
                            data-testid={`button-reject-${booking.id}`}
                          >
                            {isUpdating ? (
                              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                            )}
                          </Button>
                        </>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => window.print()}
                          title="Imprimir"
                          className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                          data-testid={`button-print-${booking.id}`}
                        >
                          <Printer className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </Button>
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
  );
}