import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  CreditCard, 
  MapPin, 
  Clock, 
  Check,
  Plus,
  Minus,
  ShoppingCart
} from "lucide-react";

interface PaymentMethod {
  id: number;
  gatewayName: string;
  gatewayTitle: string;
  environmentMode: string;
  isActive: boolean;
  logo?: string;
  clientId?: string;
  publicKey?: string;
}

interface CartItem {
  id: number;
  name: string;
  description: string;
  price: string;
  quantity: number;
  providerId: number;
  providerName: string;
}

const CheckoutPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const [address, setAddress] = useState("");
  const [cep, setCep] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [notes, setNotes] = useState("");

  // Mock cart data - In real app this would come from cart state/API
  const [cartItems] = useState<CartItem[]>([
    {
      id: 1,
      name: "Limpeza Residencial Completa",
      description: "Limpeza completa de casa incluindo cozinha, banheiros e quartos",
      price: "150.00",
      quantity: 1,
      providerId: 1,
      providerName: "Maria Silva"
    },
    {
      id: 2,
      name: "Jardinagem e Paisagismo",
      description: "Manutenção de jardim e poda de plantas",
      price: "80.00",
      quantity: 1,
      providerId: 2,
      providerName: "João Santos"
    }
  ]);

  // Fetch active payment methods
  const { data: paymentMethods, isLoading: loadingPayments } = useQuery<PaymentMethod[]>({
    queryKey: ['/api/payment-methods/active'],
    queryFn: () => apiRequest('GET', '/api/payment-methods/active').then(res => res.json())
  });

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
  const serviceAmount = 15; // Fixed service fee
  const totalAmount = subtotal + serviceAmount;

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await apiRequest('POST', '/api/orders', orderData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Pedido criado com sucesso!",
        description: "Seu pedido foi processado e enviado aos prestadores.",
      });
      setLocation(`/client/orders/${data.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar pedido",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    }
  });

  const handleSubmitOrder = () => {
    if (!selectedPaymentMethod) {
      toast({
        title: "Método de pagamento obrigatório",
        description: "Por favor, selecione um método de pagamento.",
        variant: "destructive",
      });
      return;
    }

    if (!address || !cep || !city || !state) {
      toast({
        title: "Endereço obrigatório",
        description: "Por favor, preencha todos os campos de endereço.",
        variant: "destructive",
      });
      return;
    }

    if (!scheduledDate || !scheduledTime) {
      toast({
        title: "Agendamento obrigatório",
        description: "Por favor, selecione data e horário para o serviço.",
        variant: "destructive",
      });
      return;
    }

    const orderData = {
      items: cartItems,
      subtotal: subtotal.toFixed(2),
      serviceAmount: serviceAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      paymentMethod: selectedPaymentMethod,
      address,
      cep,
      city,
      state,
      scheduledAt: `${scheduledDate}T${scheduledTime}:00.000Z`,
      notes
    };

    createOrderMutation.mutate(orderData);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-8">
            <p>Você precisa estar logado para fazer um pedido.</p>
            <Button onClick={() => setLocation('/login')} className="mt-4">
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Finalizar Pedido</h1>
        <p className="text-gray-600 mt-2">Revise seus serviços e complete o pagamento</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Order Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Cart Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Serviços Selecionados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-start py-4 border-b last:border-b-0">
                    <div className="flex-1">
                      <h4 className="font-semibold">{item.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                      <p className="text-sm text-blue-600 mt-1">Prestador: {item.providerName}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">R$ {item.price}</div>
                      <div className="text-sm text-gray-500">Qtd: {item.quantity}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Método de Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPayments ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-gray-200 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {paymentMethods?.map((method) => (
                    <div
                      key={method.id}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedPaymentMethod === method.gatewayName
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedPaymentMethod(method.gatewayName)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {method.logo ? (
                            <img src={method.logo} alt={method.gatewayTitle} className="h-8 w-12 object-contain" />
                          ) : (
                            <div className="h-8 w-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded flex items-center justify-center">
                              <span className="text-white text-xs font-bold">
                                {method.gatewayName.toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="font-semibold">{method.gatewayTitle}</p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {method.environmentMode === 'test' ? 'Teste' : 'Produção'}
                              </Badge>
                              {method.gatewayName === 'mercadopago' && (
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                  PIX Disponível
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        {selectedPaymentMethod === method.gatewayName && (
                          <Check className="h-5 w-5 text-blue-500" />
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {(!paymentMethods || paymentMethods.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Nenhum método de pagamento configurado.</p>
                      <p className="text-sm">Entre em contato com o administrador.</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Endereço de Entrega
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="address">Endereço Completo *</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Rua, número, complemento"
                  />
                </div>
                <div>
                  <Label htmlFor="cep">CEP *</Label>
                  <Input
                    id="cep"
                    value={cep}
                    onChange={(e) => setCep(e.target.value)}
                    placeholder="00000-000"
                  />
                </div>
                <div>
                  <Label htmlFor="city">Cidade *</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Sua cidade"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="state">Estado *</Label>
                  <Input
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Seu estado"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scheduling */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Agendamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Data *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <Label htmlFor="time">Horário *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Observações (Opcional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Instruções especiais, detalhes do local, etc."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Order Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>R$ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxa de Serviço</span>
                  <span>R$ {serviceAmount.toFixed(2)}</span>
                </div>
                <hr />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>R$ {totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <Button 
                onClick={handleSubmitOrder}
                className="w-full"
                size="lg"
                disabled={createOrderMutation.isPending}
              >
                {createOrderMutation.isPending ? 'Processando...' : 'Finalizar Pedido'}
              </Button>

              <div className="text-sm text-gray-500 text-center">
                <p>Ao finalizar o pedido, você concorda com nossos</p>
                <p>
                  <span className="text-blue-600 cursor-pointer">Termos de Serviço</span>
                  {' e '}
                  <span className="text-blue-600 cursor-pointer">Política de Privacidade</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;