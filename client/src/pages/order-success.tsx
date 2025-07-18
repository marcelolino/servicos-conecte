import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle, 
  Clock, 
  MapPin, 
  CreditCard, 
  ArrowRight,
  Home,
  Package,
  Phone,
  MessageCircle
} from "lucide-react";

export default function OrderSuccessPage() {
  const [match, params] = useRoute("/order-success/:id");
  const [, setLocation] = useLocation();
  const orderId = params?.id;

  // Fetch order details
  const { data: order, isLoading } = useQuery({
    queryKey: ["/api/orders", orderId],
    enabled: !!orderId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando detalhes do pedido...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Pedido não encontrado</h1>
          <p className="text-muted-foreground mb-6">
            O pedido solicitado não existe ou você não tem permissão para visualizá-lo.
          </p>
          <Button onClick={() => setLocation("/orders")}>
            Ver Meus Pedidos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Success Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <CheckCircle className="h-16 w-16 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Pedido Realizado com Sucesso!</h1>
            <p className="text-green-100 text-lg">
              Seu pedido #{order.id} foi criado e será processado em breve.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Detalhes do Pedido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Número do Pedido:</span>
                  <span className="text-sm">#{order.id}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {order.status === "confirmed" ? "Confirmado" : order.status}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Data:</span>
                  <span className="text-sm">
                    {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Valor Total:</span>
                  <span className="text-sm font-bold text-green-600">
                    R$ {parseFloat(order.totalAmount).toFixed(2)}
                  </span>
                </div>
                
                {order.scheduledAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Data Agendada:</span>
                    <span className="text-sm flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {new Date(order.scheduledAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Address */}
            {order.address && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Endereço de Entrega
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm">{order.address}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.city}, {order.state} - CEP: {order.cep}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Method */}
            {order.paymentMethod && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Método de Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm capitalize">
                    {order.paymentMethod === "pix" ? "PIX" : 
                     order.paymentMethod === "credit_card" ? "Cartão de Crédito" :
                     order.paymentMethod === "cash" ? "Dinheiro" :
                     "Pagamento Digital"}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Next Steps */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Próximos Passos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                    <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium">Aguardando Confirmação</h4>
                    <p className="text-sm text-muted-foreground">
                      Seu pedido será analisado e um prestador será designado em breve.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full">
                    <Phone className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-medium">Contato do Prestador</h4>
                    <p className="text-sm text-muted-foreground">
                      Você receberá os dados de contato do prestador designado.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-full">
                    <MessageCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-medium">Acompanhe o Progresso</h4>
                    <p className="text-sm text-muted-foreground">
                      Você pode acompanhar o status do seu pedido na área de pedidos.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={() => setLocation(`/orders/${order.id}`)}
                className="w-full"
              >
                Ver Detalhes do Pedido
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => setLocation("/orders")}
                className="w-full"
              >
                Ver Todos os Pedidos
              </Button>
              
              <Button 
                variant="ghost" 
                onClick={() => setLocation("/")}
                className="w-full"
              >
                <Home className="h-4 w-4 mr-2" />
                Voltar ao Início
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}