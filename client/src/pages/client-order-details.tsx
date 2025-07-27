import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Package, 
  Calendar, 
  MapPin, 
  CreditCard, 
  Clock,
  User,
  CheckCircle,
  XCircle
} from "lucide-react";
import ClientLayout from "@/components/layout/client-layout";

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
  city?: string;
  state?: string;
  cep?: string;
  scheduledAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  provider?: {
    id: number;
    user: {
      id: number;
      name: string;
      email: string;
      phone?: string;
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

export default function ClientOrderDetailsPage() {
  const { id } = useParams<{ id: string }>();
  
  // Fetch order details
  const { data: order, isLoading } = useQuery<OrderDetails>({
    queryKey: [`/api/orders/${id}`],
    enabled: !!id,
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "cancelled":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-blue-600" />;
    }
  };

  if (isLoading) {
    return (
      <ClientLayout>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Package className="h-8 w-8 animate-pulse text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando detalhes do pedido...</p>
            </div>
          </div>
        </div>
      </ClientLayout>
    );
  }

  if (!order) {
    return (
      <ClientLayout>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Package className="h-8 w-8 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Pedido não encontrado
              </p>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                O pedido solicitado não existe ou você não tem permissão para visualizá-lo.
              </p>
              <Link href="/client-orders">
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar aos Pedidos
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/client-orders">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Pedido #{order.id}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Criado em {new Date(order.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(order.status)}
            <Badge className={getStatusColor(order.status)}>
              {getStatusText(order.status)}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Services */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Serviços Solicitados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.items?.map((item, index) => (
                  <div key={index} className="flex justify-between items-start p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                        {item.providerService?.name || item.providerService?.category?.name || "Serviço"}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        Prestador: {item.providerService?.provider?.user?.name || "Não informado"}
                      </p>
                      {item.providerService?.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {item.providerService.description}
                        </p>
                      )}
                      <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Quantidade: {item.quantity}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 dark:text-white">
                        R$ {parseFloat(item.unitPrice).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Total: R$ {parseFloat(item.totalPrice).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Delivery Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Informações de Entrega
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {order.address && (
                  <p className="text-gray-900 dark:text-white font-medium">
                    {order.address}
                  </p>
                )}
                {order.city && order.state && (
                  <p className="text-gray-600 dark:text-gray-400">
                    {order.city}, {order.state}
                  </p>
                )}
                {order.cep && (
                  <p className="text-gray-600 dark:text-gray-400">
                    CEP: {order.cep}
                  </p>
                )}
              </CardContent>
            </Card>
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
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                  <span className="font-medium">R$ {parseFloat(order.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Taxa de serviço:</span>
                  <span className="font-medium">R$ {parseFloat(order.serviceAmount).toFixed(2)}</span>
                </div>
                {parseFloat(order.discountAmount) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Desconto:</span>
                    <span>-R$ {parseFloat(order.discountAmount).toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>R$ {parseFloat(order.totalAmount).toFixed(2)}</span>
                </div>
                <div className="pt-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Método: {getPaymentMethodText(order.paymentMethod)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Scheduling */}
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
                    <p className="text-lg font-medium text-gray-900 dark:text-white">
                      {new Date(order.scheduledAt).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(order.scheduledAt).toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Provider Information */}
            {order.provider && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Prestador
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {order.provider.user.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {order.provider.user.email}
                    </p>
                    {order.provider.user.city && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {order.provider.user.city}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}