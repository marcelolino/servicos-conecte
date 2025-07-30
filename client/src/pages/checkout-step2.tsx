import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { 
  CreditCard, 
  ArrowLeft,
  ArrowRight,
  Loader2,
  ShoppingCart,
  Banknote,
  Smartphone,
  QrCode
} from "lucide-react";
import PixPaymentDisplay from "@/components/PixPaymentDisplay";

interface PaymentGateway {
  id: number;
  gatewayName: string;
  gatewayTitle: string;
  environmentMode: string;
  isActive: boolean;
  logo?: string;
  clientId?: string;
  publicKey?: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  gateway?: string;
}

const CheckoutStep2 = () => {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  
  // Card payment fields
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardCpf, setCardCpf] = useState("");
  const [installments, setInstallments] = useState("1");

  // Fetch cart data
  const { data: cartData, isLoading: cartLoading } = useQuery({
    queryKey: ['/api/cart'],
    queryFn: () => apiRequest('GET', '/api/cart')
  });

  // Fetch payment gateways
  const { data: paymentGateways, isLoading: loadingPayments } = useQuery<PaymentGateway[]>({
    queryKey: ['/api/payment-methods/active'],
    queryFn: () => apiRequest('GET', '/api/payment-methods/active')
  });

  const cartItems = cartData?.items || [];
  const isEmpty = cartItems.length === 0;

  // Define available payment methods
  const availablePaymentMethods: PaymentMethod[] = useMemo(() => {
    const methods: PaymentMethod[] = [];
    const hasStripe = paymentGateways?.some(g => g.gatewayName === 'stripe' && g.isActive) || false;
    const hasMercadoPago = paymentGateways?.some(g => g.gatewayName === 'mercadopago' && g.isActive) || false;

    methods.push(
      {
        id: 'cash',
        name: 'Dinheiro',
        description: 'Pagamento em espécie',
        icon: <Banknote className="h-5 w-5" />
      },
      {
        id: 'pix',
        name: 'PIX',
        description: 'Transferência instantânea',
        icon: <Smartphone className="h-5 w-5" />,
        gateway: 'mercadopago'
      },
      {
        id: 'credit_card',
        name: 'Cartão de Crédito',
        description: 'À vista ou parcelado',
        icon: <CreditCard className="h-5 w-5" />,
        gateway: hasMercadoPago ? 'mercadopago' : 'stripe'
      },
      {
        id: 'debit_card',
        name: 'Cartão de Débito',
        description: 'À vista',
        icon: <CreditCard className="h-5 w-5" />,
        gateway: hasMercadoPago ? 'mercadopago' : 'stripe'
      }
    );

    return methods;
  }, [paymentGateways]);

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

  const handleNext = () => {
    // Save payment method to localStorage
    localStorage.setItem('checkout_payment_method', selectedPaymentMethod);
    
    if (isCardPayment()) {
      localStorage.setItem('checkout_card_data', JSON.stringify({
        cardNumber,
        cardName,
        cardExpiry,
        cardCvv,
        cardCpf,
        installments
      }));
    }

    setLocation('/checkout/confirmation');
  };

  const isCardPayment = () => {
    return selectedPaymentMethod === 'credit_card' || selectedPaymentMethod === 'debit_card';
  };

  const isFormValid = () => {
    if (!selectedPaymentMethod) return false;
    
    if (isCardPayment()) {
      return cardNumber.length >= 16 && cardName.trim() && cardExpiry.length >= 5 && cardCvv.length >= 3;
    }
    
    return true;
  };

  // Input formatters
  const formatCardNumber = (value: string) => {
    return value
      .replace(/\s/g, '')
      .replace(/(\d{4})/g, '$1 ')
      .trim()
      .slice(0, 19);
  };

  const formatExpiry = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1/$2')
      .slice(0, 5);
  };

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  if (cartLoading || loadingPayments) {
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
              onClick={() => setLocation("/checkout/scheduling")}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Checkout - Passo 2 de 3</h1>
              <p className="text-muted-foreground">Método de Pagamento</p>
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
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <span className="text-sm font-medium text-primary">Pagamento</span>
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
          {/* Payment Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Como você quer pagar pelo serviço
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {availablePaymentMethods.map((method) => {
                    const isSelected = selectedPaymentMethod === method.id;
                    return (
                      <div
                        key={method.id}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-border hover:border-primary/50 hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedPaymentMethod(method.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${
                              isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                            }`}>
                              {method.icon}
                            </div>
                            <div>
                              <div className={`font-medium ${
                                isSelected ? 'text-primary' : 'text-foreground'
                              }`}>
                                {method.name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {method.description}
                              </div>
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected 
                              ? 'border-primary bg-primary' 
                              : 'border-muted-foreground'
                          }`}>
                            {isSelected && (
                              <div className="w-2.5 h-2.5 rounded-full bg-primary-foreground"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* PIX Payment */}
            {selectedPaymentMethod === 'pix' && (
              <PixPaymentDisplay 
                amount={calculateTotal()}
                onPaymentComplete={() => {
                  localStorage.setItem('checkout_payment_method', 'pix');
                  localStorage.setItem('checkout_pix_paid', 'true');
                  setLocation('/checkout/confirmation');
                }}
              />
            )}

            {/* Card Payment Form */}
            {isCardPayment() && (
              <Card>
                <CardHeader>
                  <CardTitle>Dados do Cartão</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="cardNumber">Número do Cartão *</Label>
                      <Input
                        id="cardNumber"
                        placeholder="0000 0000 0000 0000"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        maxLength={19}
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="cardName">Nome no Cartão *</Label>
                      <Input
                        id="cardName"
                        placeholder="Como está escrito no cartão"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="cardExpiry">Validade *</Label>
                      <Input
                        id="cardExpiry"
                        placeholder="MM/AA"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                        maxLength={5}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="cardCvv">CVV *</Label>
                      <Input
                        id="cardCvv"
                        placeholder="000"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        maxLength={4}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="cardCpf">CPF do Portador</Label>
                      <Input
                        id="cardCpf"
                        placeholder="000.000.000-00"
                        value={cardCpf}
                        onChange={(e) => setCardCpf(formatCPF(e.target.value))}
                        maxLength={14}
                      />
                    </div>
                    {selectedPaymentMethod === 'credit_card' && (
                      <div>
                        <Label htmlFor="installments">Parcelas</Label>
                        <Select value={installments} onValueChange={setInstallments}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1x sem juros</SelectItem>
                            <SelectItem value="2">2x sem juros</SelectItem>
                            <SelectItem value="3">3x sem juros</SelectItem>
                            <SelectItem value="6">6x com juros</SelectItem>
                            <SelectItem value="12">12x com juros</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
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
                    disabled={!isFormValid()}
                  >
                    Revisar Pedido
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setLocation("/checkout/scheduling")}
                  >
                    Voltar ao Agendamento
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

export default CheckoutStep2;