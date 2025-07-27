import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Package, Calendar, MapPin, CreditCard, Eye } from "lucide-react";
import ClientLayout from "@/components/layout/client-layout";

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

export default function ClientOrdersPage() {
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

  const filteredOrders = orders?.filter((order) => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return ["pending_payment", "confirmed"].includes(order.status);
    if (activeTab === "active") return order.status === "in_progress";
    if (activeTab === "completed") return order.status === "completed";
    return true;
  });

  if (ordersLoading) {
    return (
      <ClientLayout>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando seus pedidos...</p>
            </div>
          </div>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Meu Histórico de Reservas
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Acompanhe o status dos seus serviços solicitados
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
            <TabsTrigger value="active">Em Andamento</TabsTrigger>
            <TabsTrigger value="completed">Concluídos</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {!filteredOrders || filteredOrders.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-12">
                  <Package className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Nenhum pedido encontrado
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-center mb-6">
                    {activeTab === "all" 
                      ? "Você ainda não fez nenhum pedido."
                      : `Nenhum pedido ${getTabDescription(activeTab)} encontrado.`
                    }
                  </p>
                  <Link href="/services">
                    <Button>
                      Explorar Serviços
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
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
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusText(order.status)}
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
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ClientLayout>
  );
}

function getTabDescription(tab: string): string {
  switch (tab) {
    case "pending":
      return "pendente";
    case "active":
      return "em andamento";
    case "completed":
      return "concluído";
    default:
      return "";
  }
}