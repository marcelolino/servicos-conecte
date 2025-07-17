import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Loader2, 
  ArrowLeft, 
  Package, 
  MapPin, 
  Calendar, 
  CreditCard, 
  User, 
  Phone,
  MessageCircle,
  Star,
  X
} from "lucide-react";

interface OrderDetails {
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
  cep?: string;
  city?: string;
  state?: string;
  scheduledAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  provider?: {
    id: number;
    rating: string;
    totalReviews: number;
    user: {
      id: number;
      name: string;
      email: string;
      phone?: string;
      city?: string;
      avatar?: string;
    };
  };
  items: Array<{
    id: number;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
    notes?: string;
    providerService: {
      id: number;
      name?: string;
      description?: string;
      price?: string;
      estimatedDuration?: string;
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

export default function OrderDetailsPage() {
  const [match, params] = useRoute("/orders/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const orderId = params?.id;

  // Fetch order details
  const { data: order, isLoading: orderLoading } = useQuery<OrderDetails>({
    queryKey: ["/api/orders", orderId],
    enabled: !!orderId,
  });

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: () => apiRequest("PUT", `/api/orders/${orderId}`, { status: "cancelled" }),
    onSuccess: () => {
      toast({
        title: "Pedido cancelado",
        description: "O pedido foi cancelado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders", orderId] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao cancelar pedido",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
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

  const getStatusText = (status: string) => {
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
      case "cash":
        return "Dinheiro";
      case "digital":
        return "Pagamento Digital";
      default:
        return "Não definido";
    }
  };

  const getServiceImage = (item: any) => {
    try {
      if (item.providerService.images) {
        const images = JSON.parse(item.providerService.images);
        return images[0] || "/api/placeholder/100/100";
      }
    } catch {}
    return "/api/placeholder/100/100";
  };

  const canCancelOrder = (status: string) => {
    return ["pending_payment", "confirmed"].includes(status);
  };

  if (orderLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Pedido não encontrado</h1>
          <p className="text-muted-foreground mb-6">
            O pedido solicitado não existe ou você não tem permissão para visualizá-lo.
          </p>
          <Button onClick={() => setLocation("/orders")}>
            Voltar para Pedidos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setLocation("/orders")}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">
                  Pedido #{order.id}
                </h1>
                <Badge className={getStatusColor(order.status)}>
                  {getStatusText(order.status)}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Criado em {new Date(order.createdAt).toLocaleDateString("pt-BR")}
              </p>
            </div>
            {canCancelOrder(order.status) && (
              <Button
                variant="destructive"
                onClick={() => cancelOrderMutation.mutate()}
                disabled={cancelOrderMutation.isPending}
              >
                {cancelOrderMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <X className="h-4 w-4 mr-2" />
                )}
                Cancelar Pedido
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Items */}
            <Card>
              <CardHeader>
                <CardTitle>Serviços Solicitados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 border rounded-lg">
                    <img
                      src={getServiceImage(item)}
                      alt={item.providerService.name || item.providerService.category.name}
                      className="w-20 h-20 object-cover rounded"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold">
                            {item.providerService.name || item.providerService.category.name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Por {item.providerService.provider.user.name}
                          </p>
                          <Badge variant="secondary" className="mt-1">
                            {item.providerService.category.name}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          Quantidade: {item.quantity}
                          {item.providerService.estimatedDuration && (
                            <span className="ml-4">
                              Duração: {item.providerService.estimatedDuration}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">
                            R$ {parseFloat(item.unitPrice).toFixed(2)} cada
                          </div>
                          <div className="font-semibold">
                            R$ {parseFloat(item.totalPrice).toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {item.notes && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Observações: {item.notes}
                        </p>
                      )}

                      {item.providerService.description && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {item.providerService.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Delivery Information */}
            {order.address && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Informações de Entrega
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="font-medium">{order.address}</p>
                    <p className="text-muted-foreground">
                      {order.city}, {order.state}
                    </p>
                    {order.cep && (
                      <p className="text-muted-foreground">CEP: {order.cep}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Additional Notes */}
            {order.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Observações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{order.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Provider Information */}
            {order.provider && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Prestador de Serviço
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-4">
                    {order.provider.user.avatar ? (
                      <img
                        src={order.provider.user.avatar}
                        alt={order.provider.user.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-6 w-6" />
                      </div>
                    )}
                    <div>
                      <div className="font-semibold">{order.provider.user.name}</div>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-3 w-3 fill-current text-yellow-500" />
                        <span>{parseFloat(order.provider.rating).toFixed(1)}</span>
                        <span className="text-muted-foreground">
                          ({order.provider.totalReviews} avaliações)
                        </span>
                      </div>
                      {order.provider.user.city && (
                        <div className="text-sm text-muted-foreground">
                          {order.provider.user.city}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {order.provider.user.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Email:</span>
                        <span>{order.provider.user.email}</span>
                      </div>
                    )}
                    {order.provider.user.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{order.provider.user.phone}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Informações de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>R$ {parseFloat(order.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxa de serviço:</span>
                    <span>R$ {parseFloat(order.serviceAmount).toFixed(2)}</span>
                  </div>
                  {parseFloat(order.discountAmount) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Desconto:</span>
                      <span>-R$ {parseFloat(order.discountAmount).toFixed(2)}</span>
                    </div>
                  )}
                  {order.couponCode && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Cupom:</span>
                      <span className="font-mono">{order.couponCode}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total:</span>
                    <span>R$ {parseFloat(order.totalAmount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Método:</span>
                    <span>{getPaymentMethodText(order.paymentMethod)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Schedule Information */}
            {order.scheduledAt && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Agendamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-lg font-semibold">
                      {new Date(order.scheduledAt).toLocaleDateString("pt-BR")}
                    </div>
                    <div className="text-muted-foreground">
                      {new Date(order.scheduledAt).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}