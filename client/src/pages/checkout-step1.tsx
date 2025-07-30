import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { 
  MapPin, 
  Clock, 
  Calendar,
  ArrowLeft,
  ArrowRight,
  Loader2,
  ShoppingCart
} from "lucide-react";

const CheckoutStep1 = () => {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Form states - Auto-populate with user data
  const [address, setAddress] = useState(() => localStorage.getItem('checkout_address') || user?.address || '');
  const [cep, setCep] = useState(() => localStorage.getItem('checkout_cep') || user?.cep || '');
  const [city, setCity] = useState(() => localStorage.getItem('checkout_city') || user?.city || '');
  const [state, setState] = useState(() => localStorage.getItem('checkout_state') || user?.state || '');
  const [scheduledDate, setScheduledDate] = useState(() => localStorage.getItem('checkout_scheduled_date') || '');
  const [scheduledTime, setScheduledTime] = useState(() => localStorage.getItem('checkout_scheduled_time') || '');
  const [notes, setNotes] = useState(() => localStorage.getItem('checkout_notes') || '');

  // Fetch cart data
  const { data: cartData, isLoading: cartLoading } = useQuery({
    queryKey: ['/api/cart'],
    queryFn: () => apiRequest('GET', '/api/cart')
  });

  const cartItems = cartData?.items || [];
  const isEmpty = cartItems.length === 0;

  // Update form fields when user data is loaded
  useEffect(() => {
    if (user && !localStorage.getItem('checkout_address')) {
      setAddress(user.address || '');
      setCep(user.cep || '');
      setCity(user.city || '');
      setState(user.state || '');
    }
  }, [user]);

  const calculateSubtotal = () => {
    return cartItems.reduce((sum: number, item: any) => sum + parseFloat(item.totalPrice), 0) || 0;
  };

  const calculateServiceFee = () => {
    const subtotal = calculateSubtotal();
    return subtotal * 0.1; // 10% service fee
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const serviceFee = calculateServiceFee();
    const discount = parseFloat(cartData?.discountAmount || "0");
    return subtotal + serviceFee - discount;
  };

  const handleNext = () => {
    // Save form data to localStorage
    localStorage.setItem('checkout_address', address);
    localStorage.setItem('checkout_cep', cep);
    localStorage.setItem('checkout_city', city);
    localStorage.setItem('checkout_state', state);
    localStorage.setItem('checkout_scheduled_date', scheduledDate);
    localStorage.setItem('checkout_scheduled_time', scheduledTime);
    localStorage.setItem('checkout_notes', notes);

    // Navigate to payment step
    setLocation('/checkout/payment');
  };

  const isFormValid = address.trim() && cep.trim() && city.trim() && state.trim();

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
            <p className="text-muted-foreground mb-6">
              Adicione alguns serviços para continuar
            </p>
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
              onClick={() => setLocation("/cart")}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Checkout - Passo 1 de 3</h1>
              <p className="text-muted-foreground">Dados de Agendamento & Endereço</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="bg-muted/30 border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <span className="text-sm font-medium text-primary">Agendamento</span>
            </div>
            <div className="flex-1 h-px bg-muted mx-4"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <span className="text-sm text-muted-foreground">Pagamento</span>
            </div>
            <div className="flex-1 h-px bg-muted mx-4"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <span className="text-sm text-muted-foreground">Confirmação</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Address Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Endereço de Atendimento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="address">Endereço Completo *</Label>
                    <Input
                      id="address"
                      placeholder="Rua, número, bairro..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cep">CEP *</Label>
                    <Input
                      id="cep"
                      placeholder="00000-000"
                      value={cep}
                      onChange={(e) => setCep(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">Cidade *</Label>
                    <Input
                      id="city"
                      placeholder="Nome da cidade"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">Estado *</Label>
                    <Input
                      id="state"
                      placeholder="Ex: SP, RJ, MG..."
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Scheduling Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Agendamento do Serviço
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="scheduledDate">Data Preferida</Label>
                    <Input
                      id="scheduledDate"
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <Label htmlFor="scheduledTime">Horário Preferido</Label>
                    <Input
                      id="scheduledTime"
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Observações Adicionais</Label>
                  <Textarea
                    id="notes"
                    placeholder="Descreva detalhes importantes, instruções especiais, etc..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
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
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>R$ {calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-4">
                  <Button
                    className="w-full"
                    onClick={handleNext}
                    disabled={!isFormValid}
                  >
                    Continuar para Pagamento
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setLocation("/cart")}
                  >
                    Voltar ao Carrinho
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

export default CheckoutStep1;