import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft,
  Loader2,
  ShoppingCart,
  MapPin,
  Clock,
  Calendar,
  CreditCard,
  Check,
  Edit
} from "lucide-react";

const CheckoutStep3 = () => {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [isProcessing, setIsProcessing] = useState(false);

  // Get saved data from localStorage
  const [orderData, setOrderData] = useState<any>({});

  useEffect(() => {
    const address = localStorage.getItem('checkout_address') || '';
    const cep = localStorage.getItem('checkout_cep') || '';
    const city = localStorage.getItem('checkout_city') || '';
    const state = localStorage.getItem('checkout_state') || '';
    const scheduledDate = localStorage.getItem('checkout_scheduled_date') || '';
    const scheduledTime = localStorage.getItem('checkout_scheduled_time') || '';
    const notes = localStorage.getItem('checkout_notes') || '';
    const paymentMethod = localStorage.getItem('checkout_payment_method') || '';
    const cardData = localStorage.getItem('checkout_card_data');

    // Redirect if missing essential data
    if (!address || !city || !paymentMethod) {
      toast({
        title: "Dados incompletos",
        description: "Por favor, complete todas as etapas do checkout.",
        variant: "destructive"
      });
      setLocation('/checkout/scheduling');
      return;
    }

    setOrderData({
      address,
      cep,
      city,
      state,
      scheduledDate,
      scheduledTime,
      notes,
      paymentMethod,
      cardData: cardData ? JSON.parse(cardData) : null
    });
  }, []);

  // Fetch cart data
  const { data: cartData, isLoading: cartLoading } = useQuery({
    queryKey: ['/api/cart'],
    queryFn: () => apiRequest('GET', '/api/cart')
  });

  const cartItems = cartData?.items || [];
  const isEmpty = cartItems.length === 0;

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const orderPayload = {
        items: cartItems.map((item: any) => ({
          providerServiceId: item.providerServiceId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          notes: item.notes
        })),
        shippingAddress: `${orderData.address}, ${orderData.city} - ${orderData.state}, ${orderData.cep}`,
        scheduledDate: orderData.scheduledDate || null,
        scheduledTime: orderData.scheduledTime || null,
        notes: orderData.notes,
        paymentMethod: orderData.paymentMethod,
        ...(orderData.cardData && {
          cardData: orderData.cardData
        })
      };

      return apiRequest("POST", "/api/orders", orderPayload);
    },
    onSuccess: (data) => {
      // Clear checkout data
      localStorage.removeItem('checkout_address');
      localStorage.removeItem('checkout_cep');
      localStorage.removeItem('checkout_city');
      localStorage.removeItem('checkout_state');
      localStorage.removeItem('checkout_scheduled_date');
      localStorage.removeItem('checkout_scheduled_time');
      localStorage.removeItem('checkout_notes');
      localStorage.removeItem('checkout_payment_method');
      localStorage.removeItem('checkout_card_data');

      toast({
        title: "Pedido criado com sucesso!",
        description: "Você será redirecionado para a página de sucesso.",
      });

      setLocation(`/order-success?orderId=${data.id}`);
    },
    onError: (error: any) => {
      setIsProcessing(false);
      toast({
        title: "Erro ao criar pedido",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  const calculateSubtotal = () => {
    return cartItems.reduce((sum: number, item: any) => sum + parseFloat(item.totalPrice), 0) || 0;
  };

  const calculateServiceFee = () => {
    const subtotal = calculateSubtotal();
    return subtotal * 0.1;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const serviceFee = calculateServiceFee();
    const discount = parseFloat(cartData?.discountAmount || "0");
    return subtotal + serviceFee - discount;
  };

  const handleConfirmOrder = async () => {
    setIsProcessing(true);
    createOrderMutation.mutate();
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

  if (cartLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center py-12">
            <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Seu carrinho está vazio</h3>
            <Button onClick={() => setLocation("/services")}>
              Explorar Serviços
            </Button>
          </div>
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
              onClick={() => setLocation("/checkout/payment")}
              className="p-2"
              disabled={isProcessing}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Checkout - Passo 3 de 3</h1>
              <p className="text-muted-foreground">Confirmação do Pedido</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="bg-muted/30 border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                ✓
              </div>
              <span className="text-sm text-green-600">Agendamento</span>
            </div>
            <div className="flex-1 h-px bg-green-500 mx-4"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                ✓
              </div>
              <span className="text-sm text-green-600">Pagamento</span>
            </div>
            <div className="flex-1 h-px bg-green-500 mx-4"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <span className="text-sm font-medium text-primary">Confirmação</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Review */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cart Items */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Itens do Pedido</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setLocation("/cart")}
                    className="text-primary hover:text-primary"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-4 p-3 border rounded-lg">
                    <img
                      src={`/api/placeholder/80/80`}
                      alt={item.providerService.name || item.providerService.category.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">
                        {item.providerService.name || item.providerService.category.name}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Por {item.providerService.provider.user.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {item.providerService.category.name}
                        </Badge>
                        <span className="text-sm">Qty: {item.quantity}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        R$ {parseFloat(item.totalPrice).toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        R$ {parseFloat(item.unitPrice).toFixed(2)} cada
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Address & Scheduling */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Endereço & Agendamento
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setLocation("/checkout/scheduling")}
                    className="text-primary hover:text-primary"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">Endereço de Atendimento:</p>
                  <p className="text-muted-foreground">
                    {orderData.address}, {orderData.city} - {orderData.state}
                  </p>
                  {orderData.cep && (
                    <p className="text-muted-foreground">CEP: {orderData.cep}</p>
                  )}
                </div>
                
                {(orderData.scheduledDate || orderData.scheduledTime) && (
                  <div className="flex items-center gap-4">
                    {orderData.scheduledDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {new Date(orderData.scheduledDate).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    )}
                    {orderData.scheduledTime && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{orderData.scheduledTime}</span>
                      </div>
                    )}
                  </div>
                )}

                {orderData.notes && (
                  <div>
                    <p className="font-medium">Observações:</p>
                    <p className="text-muted-foreground text-sm">{orderData.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Método de Pagamento
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setLocation("/checkout/payment")}
                    className="text-primary hover:text-primary"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 text-primary rounded-full">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{getPaymentMethodLabel(orderData.paymentMethod)}</p>
                    {orderData.cardData && (
                      <p className="text-sm text-muted-foreground">
                        **** **** **** {orderData.cardData.cardNumber.slice(-4)}
                        {orderData.paymentMethod === 'credit_card' && orderData.cardData.installments && (
                          <span> • {orderData.cardData.installments}x</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Final Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Resumo Final</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>R$ {calculateSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxa de serviço</span>
                    <span>R$ {calculateServiceFee().toFixed(2)}</span>
                  </div>
                  {parseFloat(cartData?.discountAmount || "0") > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Desconto</span>
                      <span>-R$ {parseFloat(cartData?.discountAmount || "0").toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-bold text-xl text-primary">
                      <span>Total a Pagar</span>
                      <span>R$ {calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-4">
                  <Button
                    className="w-full"
                    onClick={handleConfirmOrder}
                    disabled={isProcessing || createOrderMutation.isPending}
                    size="lg"
                  >
                    {isProcessing || createOrderMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Confirmar Pedido
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setLocation("/checkout/payment")}
                    disabled={isProcessing}
                  >
                    Voltar ao Pagamento
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

export default CheckoutStep3;