import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getAuthToken } from "@/lib/auth";
import { ModernClientLayout } from "@/components/layout/modern-client-layout";
import RatingModal from "@/components/rating-modal";
import { 
  Search, 
  Plus, 
  Clock, 
  CheckCircle, 
  Star,
  MapPin,
  Calendar,
  DollarSign,
  Play,
  XCircle,
  MessageCircle,
  Filter,
  Package,
  Eye,
  CreditCard,
  ShoppingBag,
  FileText
} from "lucide-react";
import type { ServiceRequest, ServiceCategory } from "@shared/schema";

interface Order {
  id: number;
  clientId: number;
  providerId?: number;
  status: string;
  subtotal: string;
  discountAmount: string;
  serviceAmount: string;
  totalAmount: string;
  couponCode?: string;
  paymentMethod?: string;
  address?: string;
  city?: string;
  state?: string;
  scheduledAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  provider?: {
    id: number;
    user: {
      id: number;
      name: string;
      city?: string;
    };
  };
  items: Array<{
    id: number;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
    providerService: {
      id: number;
      name?: string;
      description?: string;
      images?: string;
      category: {
        id: number;
        name: string;
      };
      provider: {
        id: number;
        user: {
          id: number;
          name: string;
        };
      };
    };
  }>;
}

export default function ClientReservas() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState("all");
  const itemsPerPage = 6;

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
      window.location.href = '/client-chat';
      toast({
        title: "Chat iniciado",
        description: "Conversa iniciada com o prestador. Você foi redirecionado para o chat.",
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

  const handleStartChat = (providerId: number, serviceRequestId: number) => {
    createChatMutation.mutate({ participantId: providerId, serviceRequestId });
  };

  // Reset page when navigating or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [location, activeFilter]);



  // Fetch client's service requests
  const { data: serviceRequests, isLoading: requestsLoading } = useQuery<ServiceRequest[]>({
    queryKey: ["/api/service-requests/client"],
    enabled: !!user,
  });

  // Fetch client's orders
  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    enabled: !!user,
  });



  // Start service mutation
  const startServiceMutation = useMutation({
    mutationFn: (requestId: string) =>
      apiRequest("PUT", `/api/service-requests/${requestId}/start`),
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Serviço iniciado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests/client"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao iniciar serviço.",
        variant: "destructive",
      });
    },
  });

  // Complete service mutation
  const completeServiceMutation = useMutation({
    mutationFn: (requestId: string) =>
      apiRequest("PUT", `/api/service-requests/${requestId}/complete`),
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Serviço finalizado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests/client"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao finalizar serviço.",
        variant: "destructive",
      });
    },
  });

  const getServiceRequestStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "accepted":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "in_progress":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getServiceRequestStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendente";
      case "accepted":
        return "Aceita";
      case "in_progress":
        return "Em Andamento";
      case "completed":
        return "Concluída";
      case "cancelled":
        return "Cancelada";
      default:
        return "Pendente";
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case "pending_payment":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "confirmed":
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

  const getOrderStatusText = (status: string) => {
    switch (status) {
      case "pending_payment":
        return "Aguardando Pagamento";
      case "confirmed":
        return "Confirmado";
      case "in_progress":
        return "Em Andamento";
      case "completed":
        return "Concluído";
      case "cancelled":
        return "Cancelado";
      default:
        return status;
    }
  };

  const getPaymentMethodText = (method?: string) => {
    switch (method) {
      case "pix":
        return "PIX";
      case "credit_card":
        return "Cartão de Crédito";
      case "debit_card":
        return "Cartão de Débito";
      case "cash":
        return "Dinheiro";
      case "digital":
        return "Pagamento Digital";
      default:
        return "Não definido";
    }
  };

  const getFilterStatusText = (filter: string) => {
    switch (filter) {
      case "pending":
        return "pendentes";
      case "accepted":
        return "aceitas";
      case "in_progress":
        return "em andamento";
      case "completed":
        return "concluídas";
      case "cancelled":
        return "canceladas";
      default:
        return "";
    }
  };

  const canStartService = (request: any) => request.status === "accepted";
  const canCompleteService = (request: any) => request.status === "in_progress";

  const getServiceActionButton = (request: any) => {
    if (canStartService(request)) {
      return (
        <Button
          size="sm"
          onClick={() => startServiceMutation.mutate(request.id)}
          disabled={startServiceMutation.isPending}
          className="bg-green-600 hover:bg-green-700"
        >
          {startServiceMutation.isPending ? (
            <Clock className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Play className="h-4 w-4 mr-1" />
          )}
          Iniciar Serviço
        </Button>
      );
    }

    if (canCompleteService(request)) {
      return (
        <Button
          size="sm"
          onClick={() => completeServiceMutation.mutate(request.id)}
          disabled={completeServiceMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {completeServiceMutation.isPending ? (
            <CheckCircle className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4 mr-1" />
          )}
          Finalizar Serviço
        </Button>
      );
    }

    if (request.status === "completed" && request.provider) {
      return (
        <RatingModal
          serviceRequestId={request.id}
          providerId={request.provider.id}
          providerName={request.provider.user?.name || "Prestador"}
          trigger={
            <Button variant="outline" size="sm">
              <Star className="h-4 w-4 mr-1" />
              Avaliar
            </Button>
          }
          onSuccess={() => {
            toast({
              title: "Avaliação enviada!",
              description: "Sua avaliação foi registrada com sucesso.",
            });
          }}
        />
      );
    }

    return null;
  };

  const getFilteredRequests = () => {
    if (!serviceRequests || !Array.isArray(serviceRequests)) return [];
    
    if (activeFilter === "all") return serviceRequests;
    
    return serviceRequests.filter(request => {
      switch (activeFilter) {
        case "pending":
          return request.status === "pending";
        case "accepted":
          return request.status === "accepted";
        case "in_progress":
          return request.status === "in_progress";
        case "completed":
          return request.status === "completed";
        case "cancelled":
          return request.status === "cancelled";
        default:
          return true;
      }
    });
  };

  const getStatusCounts = () => {
    if (!serviceRequests || !Array.isArray(serviceRequests)) {
      return {
        all: 0,
        pending: 0,
        accepted: 0,
        in_progress: 0,
        completed: 0,
        cancelled: 0
      };
    }

    return {
      all: serviceRequests.length,
      pending: serviceRequests.filter(r => r.status === "pending").length,
      accepted: serviceRequests.filter(r => r.status === "accepted").length,
      in_progress: serviceRequests.filter(r => r.status === "in_progress").length,
      completed: serviceRequests.filter(r => r.status === "completed").length,
      cancelled: serviceRequests.filter(r => r.status === "cancelled").length,
    };
  };

  const getPaginatedRequests = () => {
    const filteredRequests = getFilteredRequests();
    
    const totalItems = filteredRequests.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = filteredRequests.slice(startIndex, endIndex);
    
    return {
      currentItems,
      totalPages,
      totalItems
    };
  };



  const { currentItems, totalPages, totalItems } = getPaginatedRequests();

  const renderServiceRequestsList = () => {
    if (requestsLoading) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Skeleton className="h-6 w-64 mb-2" />
                    <Skeleton className="h-4 w-32 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (currentItems.length === 0 && !requestsLoading) {
      return (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {activeFilter === "all" ? "Nenhuma solicitação encontrada" : `Nenhuma solicitação ${getFilterStatusText(activeFilter)} encontrada`}
            </h3>
            <p className="text-muted-foreground">
              {activeFilter === "all" 
                ? "Você ainda não criou nenhuma solicitação de serviço. Acesse a página inicial para fazer uma nova solicitação."
                : `Não há solicitações com status "${getFilterStatusText(activeFilter)}" no momento.`
              }
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {currentItems.map((request: ServiceRequest & { category: ServiceCategory; provider?: any }) => (
          <Card key={request.id} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-foreground">{request.title || 'Sem título'}</h3>
                    <Badge className={`px-3 py-1 rounded-full text-xs ${getServiceRequestStatusColor(request.status || 'pending')}`}>
                      {getServiceRequestStatusText(request.status || 'pending')}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {request.category?.name} • {request.createdAt ? new Date(request.createdAt).toLocaleDateString('pt-BR') : ''}
                  </p>
                  <p className="text-sm text-foreground mb-3">{request.description}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {request.city}, {request.state}
                    </div>
                    {request.estimatedPrice && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        R$ {Number(request.estimatedPrice).toFixed(2)}
                      </div>
                    )}
                    {request.scheduledAt && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(request.scheduledAt).toLocaleDateString('pt-BR')} às {new Date(request.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLocation(`/client-booking-details/${request.id}`)}
                  >
                    Ver Detalhes
                  </Button>
                  {(request.status === 'accepted' || request.status === 'in_progress' || request.status === 'completed') && request.provider && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-blue-600 hover:text-blue-700"
                      onClick={() => handleStartChat(request.provider.userId, request.id)}
                      disabled={createChatMutation.isPending}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Chat
                    </Button>
                  )}
                  {getServiceActionButton(request)}
                </div>
              </div>
              
              {request.provider && (
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">
                          {request.provider.user?.name?.charAt(0) || "P"}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {request.provider.user?.name || "Prestador"}
                        </p>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-400 fill-current" />
                          <span className="text-xs text-muted-foreground">
                            {Number(request.provider.rating || 0).toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderOrdersList = () => {
    if (ordersLoading) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Skeleton className="h-6 w-64 mb-2" />
                    <Skeleton className="h-4 w-32 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (!orders || orders.length === 0) {
      return (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhum pedido encontrado
            </h3>
            <p className="text-muted-foreground mb-6">
              Você ainda não fez nenhum pedido.
            </p>
            <Link href="/services">
              <Button>
                Explorar Serviços
              </Button>
            </Link>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {orders.map((order) => (
          <Card key={order.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    <span className="text-lg font-bold text-gray-600 dark:text-gray-400">
                      #{order.id}
                    </span>
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      Pedido #{order.id}
                    </CardTitle>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'itens'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    R$ {parseFloat(order.totalAmount).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge className={getOrderStatusColor(order.status)}>
                  {getOrderStatusText(order.status)}
                </Badge>
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  {order.paymentMethod && (
                    <div className="flex items-center gap-1">
                      <CreditCard className="h-4 w-4" />
                      {getPaymentMethodText(order.paymentMethod)}
                    </div>
                  )}
                  {order.scheduledAt && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(order.scheduledAt).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                  {order.address && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {order.city}
                    </div>
                  )}
                </div>
              </div>

              {order.items && order.items.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">Serviços:</h4>
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {item.providerService?.name || item.providerService?.category?.name || "Serviço"}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Prestador: {item.providerService?.provider?.user?.name || "Não informado"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {item.quantity}x R$ {parseFloat(item.unitPrice).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Total: R$ {parseFloat(item.totalPrice).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end">
                <Link href={`/client-order-details/${order.id}`}>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalhes
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <ModernClientLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Meu Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie suas solicitações de serviço e pedidos realizados
          </p>
        </div>

        {/* Main Tabs for Service Requests and Orders */}
        <Tabs defaultValue="service-requests" className="w-full space-y-6">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="service-requests" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Solicitações de Serviço
              {serviceRequests && Array.isArray(serviceRequests) && serviceRequests.length > 0 ? (
                <Badge variant="secondary" className="ml-1 h-4 min-w-[16px] text-[10px]">
                  {serviceRequests.length}
                </Badge>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              Pedidos
              {orders && Array.isArray(orders) && orders.length > 0 ? (
                <Badge variant="secondary" className="ml-1 h-4 min-w-[16px] text-[10px]">
                  {orders.length}
                </Badge>
              ) : null}
            </TabsTrigger>
          </TabsList>

          {/* Service Requests Tab */}
          <TabsContent value="service-requests" className="space-y-6">
            <div className="space-y-6">
              {/* Status Filter Tabs for Service Requests */}
              <Tabs value={activeFilter} onValueChange={setActiveFilter} className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-6 h-auto p-1">
                  <TabsTrigger value="all" className="flex items-center gap-1 justify-center text-xs sm:text-sm px-2 py-2">
                    <span className="hidden sm:inline">Todas</span>
                    <span className="sm:hidden">Todas</span>
                    {(() => {
                      const counts = getStatusCounts();
                      return counts.all > 0 && (
                        <Badge variant="secondary" className="ml-1 h-4 min-w-[16px] text-[10px]">
                          {counts.all}
                        </Badge>
                      );
                    })()}
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="flex items-center gap-1 justify-center text-xs sm:text-sm px-2 py-2">
                    <span className="hidden md:inline">Pendentes</span>
                    <span className="md:hidden">Pendentes</span>
                    {(() => {
                      const counts = getStatusCounts();
                      return counts.pending > 0 && (
                        <Badge variant="secondary" className="ml-1 h-4 min-w-[16px] text-[10px] bg-yellow-100 text-yellow-800">
                          {counts.pending}
                        </Badge>
                      );
                    })()}
                  </TabsTrigger>
                  <TabsTrigger value="accepted" className="flex items-center gap-1 justify-center text-xs sm:text-sm px-2 py-2">
                    <span className="hidden md:inline">Aceitas</span>
                    <span className="md:hidden">Aceitas</span>
                    {(() => {
                      const counts = getStatusCounts();
                      return counts.accepted > 0 && (
                        <Badge variant="secondary" className="ml-1 h-4 min-w-[16px] text-[10px] bg-blue-100 text-blue-800">
                          {counts.accepted}
                        </Badge>
                      );
                    })()}
                  </TabsTrigger>
                  <TabsTrigger value="in_progress" className="flex items-center gap-1 justify-center text-xs sm:text-sm px-2 py-2">
                    <span className="hidden sm:inline">Em Andamento</span>
                    <span className="sm:hidden">Em Andamento</span>
                    {(() => {
                      const counts = getStatusCounts();
                      return counts.in_progress > 0 && (
                        <Badge variant="secondary" className="ml-1 h-4 min-w-[16px] text-[10px] bg-purple-100 text-purple-800">
                          {counts.in_progress}
                        </Badge>
                      );
                    })()}
                  </TabsTrigger>
                  <TabsTrigger value="completed" className="flex items-center gap-1 justify-center text-xs sm:text-sm px-2 py-2">
                    <span>Concluídas</span>
                    {(() => {
                      const counts = getStatusCounts();
                      return counts.completed > 0 && (
                        <Badge variant="secondary" className="ml-1 h-4 min-w-[16px] text-[10px] bg-green-100 text-green-800">
                          {counts.completed}
                        </Badge>
                      );
                    })()}
                  </TabsTrigger>
                  <TabsTrigger value="cancelled" className="flex items-center gap-1 justify-center text-xs sm:text-sm px-2 py-2">
                    <span>Canceladas</span>
                    {(() => {
                      const counts = getStatusCounts();
                      return counts.cancelled > 0 && (
                        <Badge variant="secondary" className="ml-1 h-4 min-w-[16px] text-[10px] bg-red-100 text-red-800">
                          {counts.cancelled}
                        </Badge>
                      );
                    })()}
                  </TabsTrigger>
                </TabsList>

                {/* Tab Contents */}
                <TabsContent value={activeFilter} className="mt-0">
                  {/* Service Requests List */}
                  {renderServiceRequestsList()}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-8">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        Anterior
                      </Button>
                      
                      <div className="flex gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <Button
                            key={page}
                            variant={page === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        ))}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Próxima
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            {renderOrdersList()}
          </TabsContent>
        </Tabs>


      </div>
    </ModernClientLayout>
  );
}