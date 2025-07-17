import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Package, Calendar, MapPin, CreditCard, Eye } from "lucide-react";

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

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState("all");

  // Fetch orders
  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
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

  const filteredOrders = orders?.filter((order) => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return ["pending_payment", "confirmed"].includes(order.status);
    if (activeTab === "active") return order.status === "in_progress";
    if (activeTab === "completed") return order.status === "completed";
    return true;
  });

  const getServiceImage = (order: Order) => {
    try {
      if (order.items[0]?.providerService?.images) {
        const images = JSON.parse(order.items[0].providerService.images);
        return images[0] || "/api/placeholder/80/80";
      }
    } catch {}
    return "/api/placeholder/80/80";
  };

  if (ordersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Meus Pedidos</h1>
              <p className="text-muted-foreground">
                Acompanhe o status dos seus serviços solicitados
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
            <TabsTrigger value="active">Em Andamento</TabsTrigger>
            <TabsTrigger value="completed">Concluídos</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {!filteredOrders || filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum pedido encontrado</h3>
                <p className="text-muted-foreground mb-6">
                  {activeTab === "all" 
                    ? "Você ainda não fez nenhum pedido" 
                    : `Nenhum pedido ${
                        activeTab === "pending" ? "pendente" :
                        activeTab === "active" ? "em andamento" : "concluído"
                      } encontrado`
                  }
                </p>
                <Button asChild>
                  <Link href="/services">Explorar Serviços</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <Card key={order.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <img
                          src={getServiceImage(order)}
                          alt="Serviço"
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-lg">
                                  Pedido #{order.id}
                                </h3>
                                <Badge className={getStatusColor(order.status)}>
                                  {getStatusText(order.status)}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {order.items.length} {order.items.length === 1 ? "item" : "itens"}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-primary">
                                R$ {parseFloat(order.totalAmount).toFixed(2)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                              </div>
                            </div>
                          </div>

                          {/* Order Details */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            {order.provider && (
                              <div className="flex items-center gap-2 text-sm">
                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                <span className="text-muted-foreground">Prestador:</span>
                                <span>{order.provider.user.name}</span>
                              </div>
                            )}

                            {order.paymentMethod && (
                              <div className="flex items-center gap-2 text-sm">
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Pagamento:</span>
                                <span>{getPaymentMethodText(order.paymentMethod)}</span>
                              </div>
                            )}

                            {order.scheduledAt && (
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Agendado:</span>
                                <span>
                                  {new Date(order.scheduledAt).toLocaleDateString("pt-BR")}
                                </span>
                              </div>
                            )}
                          </div>

                          {order.address && (
                            <div className="flex items-start gap-2 text-sm mb-4">
                              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <div>
                                <span className="text-muted-foreground">Endereço:</span>
                                <p className="text-foreground">
                                  {order.address}, {order.city} - {order.state}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Service Items Preview */}
                          <div className="mb-4">
                            <div className="text-sm text-muted-foreground mb-2">Serviços:</div>
                            <div className="space-y-1">
                              {order.items.slice(0, 2).map((item) => (
                                <div key={item.id} className="text-sm">
                                  <span className="font-medium">
                                    {item.quantity}x {item.providerService.name || item.providerService.category.name}
                                  </span>
                                  <span className="text-muted-foreground ml-2">
                                    - R$ {parseFloat(item.totalPrice).toFixed(2)}
                                  </span>
                                </div>
                              ))}
                              {order.items.length > 2 && (
                                <div className="text-sm text-muted-foreground">
                                  +{order.items.length - 2} mais...
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex justify-end">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/orders/${order.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalhes
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}