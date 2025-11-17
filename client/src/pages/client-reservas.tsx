import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ModernClientLayout } from "@/components/layout/modern-client-layout";
import { 
  Package,
  Eye,
  CreditCard,
  Calendar,
  MapPin,
  Play,
  CheckCircle,
  MessageCircle
} from "lucide-react";

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

  // Create chat conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async ({ providerId, orderId }: { providerId: number; orderId: number }) => {
      const response = await apiRequest("POST", "/api/chat/conversations", {
        participantId: providerId,
        orderId,
        title: `Pedido #${orderId}`
      });
      return response;
    },
    onSuccess: (conversation) => {
      window.location.href = `/client-chat/${conversation.id}`;
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao iniciar conversa.",
        variant: "destructive",
      });
    },
  });

  // Fetch client's orders
  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    enabled: !!user,
  });

  // Start service mutation
  const startServiceMutation = useMutation({
    mutationFn: (orderId: number) =>
      apiRequest("PUT", `/api/orders/${orderId}`, { status: "in_progress" }),
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Serviço iniciado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
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
    mutationFn: (orderId: number) =>
      apiRequest("PUT", `/api/orders/${orderId}`, { status: "completed" }),
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Serviço finalizado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao finalizar serviço.",
        variant: "destructive",
      });
    },
  });

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

  const canStartService = (order: Order) => {
    return order.status === "confirmed" || order.status === "pending";
  };

  const canCompleteService = (order: Order) => {
    return order.status === "in_progress";
  };

  const getServiceActionButton = (order: Order) => {
    if (canStartService(order)) {
      return (
        <Button
          size="sm"
          onClick={() => startServiceMutation.mutate(order.id)}
          disabled={startServiceMutation.isPending}
          className="bg-green-600 hover:bg-green-700 text-white"
          data-testid={`button-start-${order.id}`}
        >
          {startServiceMutation.isPending ? (
            <Play className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Play className="h-4 w-4 mr-2" />
          )}
          Iniciar Serviço
        </Button>
      );
    }

    if (canCompleteService(order)) {
      return (
        <Button
          size="sm"
          onClick={() => completeServiceMutation.mutate(order.id)}
          disabled={completeServiceMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          data-testid={`button-complete-${order.id}`}
        >
          {completeServiceMutation.isPending ? (
            <CheckCircle className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4 mr-2" />
          )}
          Finalizar Serviço
        </Button>
      );
    }

    return null;
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

              <div className="flex justify-end gap-2">
                {getServiceActionButton(order)}
                {order.providerId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => createConversationMutation.mutate({ 
                      providerId: order.providerId!, 
                      orderId: order.id 
                    })}
                    disabled={createConversationMutation.isPending}
                    data-testid={`button-chat-${order.id}`}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Chat
                  </Button>
                )}
                <Link href={`/client-order-details/${order.id}`}>
                  <Button variant="outline" size="sm" data-testid={`button-view-details-${order.id}`}>
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
            Meus Pedidos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie seus pedidos realizados
          </p>
        </div>

        {/* Orders List */}
        <div className="w-full space-y-6">
          {renderOrdersList()}
        </div>


      </div>
    </ModernClientLayout>
  );
}