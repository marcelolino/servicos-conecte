import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { 
  CheckCircle,
  MapPin,
  Calendar,
  Clock,
  CreditCard,
  ArrowLeft,
  Phone,
  Mail,
  User,
  Package
} from "lucide-react";

const OrderSuccess = () => {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/order-success");
  
  const orderId = new URLSearchParams(window.location.search).get('orderId');

  // Fetch order details
  const { data: order, isLoading } = useQuery({
    queryKey: ['/api/orders', orderId],
    queryFn: () => apiRequest('GET', `/api/orders/${orderId}`),
    enabled: !!orderId
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">Pedido não encontrado</h3>
            <Button onClick={() => setLocation("/")}>
              Voltar ao Início
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue);
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      cash: 'Dinheiro',
      pix: 'PIX',
      credit_card: 'Cartão de Crédito',
      debit_card: 'Cartão de Débito'
    };
    return methods[method] || method;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      in_progress: 'Em Andamento',
      completed: 'Concluído',
      cancelled: 'Cancelado'
    };
    return labels[status] || status;
  };

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
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 text-green-600 rounded-full">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Pedido #{order.id}</h1>
                <p className="text-muted-foreground">
                  Criado em {formatDate(order.createdAt)}
                </p>
              </div>
            </div>
            <div className="ml-auto">
              <Badge className={getStatusColor(order.status)}>
                {getStatusLabel(order.status)}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Success Message */}
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 text-green-600 rounded-full">
                    <CheckCircle className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-green-800 mb-1">
                      Pedido realizado com sucesso!
                    </h2>
                    <p className="text-green-700">
                      Seu pedido foi confirmado e os prestadores foram notificados.
                      Você receberá atualizações sobre o andamento do serviço.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Serviços Solicitados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.orderItems?.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-4 p-3 border rounded-lg">
                    <img
                      src={`/api/placeholder/60/60`}
                      alt={item.providerService?.name || item.providerService?.category?.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">
                        {item.providerService?.name || item.providerService?.category?.name}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Por {item.providerService?.provider?.user?.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {item.providerService?.category?.name}
                        </Badge>
                        <span className="text-sm">Qty: {item.quantity}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {formatCurrency(item.totalPrice)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(item.unitPrice)} cada
                      </div>
                    </div>
                  </div>
                )) || (
                  <p className="text-muted-foreground">Nenhum item encontrado</p>
                )}
              </CardContent>
            </Card>

            {/* Delivery Information */}
            {order.shippingAddress && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Informações de Entrega
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="font-medium">Endereço de Atendimento:</p>
                    <p className="text-muted-foreground">{order.shippingAddress}</p>
                    
                    {order.scheduledAt && (
                      <div className="flex items-center gap-4 mt-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {formatDate(order.scheduledAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {new Date(order.scheduledAt).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    )}

                    {order.notes && (
                      <div className="mt-4">
                        <p className="font-medium">Observações:</p>
                        <p className="text-muted-foreground text-sm">{order.notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Informações de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxa de serviço:</span>
                  <span>{formatCurrency(order.serviceAmount)}</span>
                </div>
                {parseFloat(order.discountAmount || "0") > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Desconto:</span>
                    <span>-{formatCurrency(order.discountAmount)}</span>
                  </div>
                )}
                <div className="border-t pt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t">
                  <div className="flex justify-between text-sm">
                    <span>Método:</span>
                    <span>{getPaymentMethodLabel(order.paymentMethod)}</span>
                  </div>
                  {order.paymentMethod === 'cash' && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mt-3">
                      <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                        💡 Pagamento em dinheiro será efetuado no término do serviço
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Próximos Passos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Acompanhe o andamento do seu pedido e receba atualizações em tempo real.
                </p>
                <div className="space-y-2">
                  <Button
                    className="w-full"
                    onClick={() => setLocation("/orders")}
                  >
                    Ver Todos os Pedidos
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setLocation("/services")}
                  >
                    Explorar Mais Serviços
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;