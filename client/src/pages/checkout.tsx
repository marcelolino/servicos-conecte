import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  ShoppingCart,
  Banknote,
  Smartphone,
  Loader2,
  QrCode
} from "lucide-react";

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
  gateway?: string; // Which gateway supports this method
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

// Helper functions for input formatting
const formatCardNumber = (value: string) => {
  return value
    .replace(/\s/g, '')
    .replace(/(\d{4})/g, '$1 ')
    .trim()
    .slice(0, 19);
};

const formatCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

const formatExpiry = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1/$2')
    .slice(0, 5);
};

// Function to get card info from BIN using known test cards
const getCardInfo = async (cardNumber: string) => {
  const cleanCardNumber = cardNumber.replace(/\s/g, '');
  if (cleanCardNumber.length >= 6) {
    const bin = cleanCardNumber.substring(0, 6);
    console.log('Detecting card info for BIN:', bin);
    
    // Check against known test cards first
    const knownCards = [
      { bin: '503143', paymentMethodId: 'master', issuerId: '25', type: 'credit_card' },
      { bin: '423564', paymentMethodId: 'visa', issuerId: '25', type: 'credit_card' },
      { bin: '375365', paymentMethodId: 'amex', issuerId: '25', type: 'credit_card' },
      // Elo cards need API detection for correct parameters
      { bin: '503175', paymentMethodId: 'master', issuerId: '25', type: 'credit_card' },
      { bin: '400917', paymentMethodId: 'visa', issuerId: '25', type: 'credit_card' }
    ];
    
    const knownCard = knownCards.find(card => bin.startsWith(card.bin));
    if (knownCard) {
      console.log('Known test card detected:', knownCard);
      return {
        payment_method_id: knownCard.paymentMethodId,
        issuer_id: knownCard.issuerId,
        payment_type_id: knownCard.type,
        bin: bin
      };
    }
    
    // Fallback to API detection for unknown cards
    try {
      const response = await apiRequest('POST', '/api/payments/card-info', { bin });
      console.log('Card info response:', response);
      return response;
    } catch (error) {
      console.error('Could not detect card info:', error);
      return null;
    }
  }
  return null;
};

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
  
  // Inline Payment States
  const [pixPaymentData, setPixPaymentData] = useState<any>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isProcessingCardPayment, setIsProcessingCardPayment] = useState(false);
  
  // Card Payment Fields
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardCpf, setCardCpf] = useState("");
  const [installments, setInstallments] = useState("1");
  const [cardInfo, setCardInfo] = useState<any>(null);
  const [isLoadingCardInfo, setIsLoadingCardInfo] = useState(false);

  // Fetch real cart data from API
  const { data: cartData, isLoading: cartLoading } = useQuery({
    queryKey: ['/api/cart'],
    queryFn: () => apiRequest('GET', '/api/cart').then(res => res.json())
  });

  // Transform cart data to checkout format
  const cartItems: CartItem[] = cartData?.items?.map((item: any) => ({
    id: item.id,
    name: item.providerService?.name || item.providerService?.category?.name || "Serviço",
    description: item.providerService?.description || "Descrição do serviço",
    price: item.unitPrice,
    quantity: item.quantity,
    providerId: item.providerService?.provider?.id || 0,
    providerName: item.providerService?.provider?.user?.name || "Prestador"
  })) || [];

  // Fetch active payment gateways
  const { data: paymentGateways, isLoading: loadingPayments } = useQuery<PaymentGateway[]>({
    queryKey: ['/api/payment-methods/active'],
    queryFn: () => apiRequest('GET', '/api/payment-methods/active').then(res => res.json())
  });

  // Define available payment methods - force all methods to show for testing
  const availablePaymentMethods: PaymentMethod[] = React.useMemo(() => {
    console.log('Payment gateways:', paymentGateways);
    
    const methods: PaymentMethod[] = [];
    const hasStripe = paymentGateways?.some(g => g.gatewayName === 'stripe' && g.isActive) || false;
    const hasMercadoPago = paymentGateways?.some(g => g.gatewayName === 'mercadopago' && g.isActive) || false;

    console.log('hasStripe:', hasStripe, 'hasMercadoPago:', hasMercadoPago);

    // Always show all 4 payment methods for now - will work when gateways are properly configured
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
        name: 'Cartão Crédito',
        description: 'À vista ou parcelado',
        icon: <CreditCard className="h-5 w-5" />,
        gateway: hasMercadoPago ? 'mercadopago' : 'stripe'
      },
      {
        id: 'debit_card',
        name: 'Cartão Débito',
        description: 'À vista',
        icon: <CreditCard className="h-5 w-5" />,
        gateway: hasMercadoPago ? 'mercadopago' : 'stripe'
      }
    );

    console.log('Final payment methods:', methods);
    return methods;
  }, [paymentGateways]);

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (parseFloat(item.price || "0") * item.quantity), 0);
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

  const handlePixPayment = async () => {
    if (!user?.email) {
      toast({
        title: "Erro",
        description: "Email do usuário não encontrado.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingPayment(true);
    try {
      const pixData = await apiRequest('POST', '/api/payments/pix', {
        transaction_amount: totalAmount,
        description: `Pagamento de serviços - ${cartItems[0]?.name}`,
        email: user.email
      });
      
      setPixPaymentData(pixData);
      toast({
        title: "PIX gerado com sucesso!",
        description: "Escaneie o QR Code ou copie o código PIX para pagar.",
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar PIX",
        description: "Não foi possível gerar o pagamento PIX. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleCardNumberChange = async (value: string) => {
    const formatted = formatCardNumber(value);
    setCardNumber(formatted);
    
    // Auto-detect card info when we have enough digits
    const cleanNumber = formatted.replace(/\s/g, '');
    if (cleanNumber.length >= 6) {
      setIsLoadingCardInfo(true);
      const info = await getCardInfo(formatted);
      setCardInfo(info);
      setIsLoadingCardInfo(false);
    } else {
      // Clear card info if number is too short
      setCardInfo(null);
    }
  };

  const handleCardPayment = async () => {
    if (!cardNumber || !cardName || !cardExpiry || !cardCvv || !cardCpf) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos do cartão.",
        variant: "destructive",
      });
      return;
    }

    if (!cardInfo) {
      toast({
        title: "Cartão não identificado",
        description: "Não foi possível identificar as informações do cartão. Verifique o número.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingCardPayment(true);
    try {
      // Format card data
      const [expMonth, expYear] = cardExpiry.split('/');
      const formattedExpYear = expYear.length === 2 ? `20${expYear}` : expYear;
      
      // Step 1: Create card token
      const tokenResponse = await apiRequest('POST', '/api/payments/create-card-token', {
        card_number: cardNumber.replace(/\s/g, ''),
        security_code: cardCvv,
        expiration_month: expMonth,
        expiration_year: formattedExpYear,
        cardholder_name: cardName,
        cardholder_identification_type: 'CPF',
        cardholder_identification_number: cardCpf.replace(/\D/g, '')
      });

      // Step 2: Create payment with token using detected card info
      const paymentResponse = await apiRequest('POST', '/api/payments/card', {
        transaction_amount: totalAmount,
        token: tokenResponse.id,
        description: `Pagamento de serviços - ${cartItems[0]?.name}`,
        installments: parseInt(installments),
        payment_method_id: cardInfo.payment_method_id,
        issuer_id: cardInfo.issuer_id,
        payer: {
          email: user?.email,
          identification: {
            type: 'CPF',
            number: cardCpf.replace(/\D/g, '')
          }
        }
      });

      if (paymentResponse.status === 'approved') {
        toast({
          title: "Pagamento aprovado!",
          description: "Seu pagamento foi processado com sucesso.",
        });
        
        // Create order after successful payment
        const orderData = {
          items: cartItems,
          subtotal: subtotal.toFixed(2),
          serviceAmount: serviceAmount.toFixed(2),
          totalAmount: totalAmount.toFixed(2),
          paymentMethod: selectedPaymentMethod,
          paymentId: paymentResponse.id,
          address,
          cep,
          city,
          state,
          scheduledAt: `${scheduledDate}T${scheduledTime}:00.000Z`,
          notes
        };

        createOrderMutation.mutate(orderData);
      } else {
        toast({
          title: "Pagamento recusado",
          description: paymentResponse.status_detail || "Pagamento não aprovado. Verifique os dados do cartão.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro no pagamento",
        description: error.message || "Não foi possível processar o pagamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingCardPayment(false);
    }
  };

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

    // Handle PIX payment
    if (selectedPaymentMethod === 'pix') {
      handlePixPayment();
      return;
    }

    // Handle card payments
    if (selectedPaymentMethod === 'credit_card' || selectedPaymentMethod === 'debit_card') {
      handleCardPayment();
      return;
    }

    // Handle cash payment directly
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
              {cartLoading ? (
                <div className="space-y-3">
                  <div className="animate-pulse">
                    <div className="h-16 bg-gray-200 rounded-lg"></div>
                  </div>
                </div>
              ) : cartItems.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Seu carrinho está vazio.</p>
                  <Button onClick={() => setLocation('/')} className="mt-4">
                    Buscar Serviços
                  </Button>
                </div>
              ) : (
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
              )}
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
              ) : cartLoading ? (
                <div className="space-y-3">
                  <div className="animate-pulse">
                    <div className="h-16 bg-gray-200 rounded-lg"></div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {availablePaymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedPaymentMethod === method.id
                          ? 'border-yellow-400 bg-yellow-50'
                          : 'border-gray-600 bg-gray-800 hover:border-yellow-400'
                      }`}
                      onClick={() => setSelectedPaymentMethod(method.id)}
                    >
                      <div className="flex flex-col items-center text-center gap-2">
                        <div className={`h-8 w-8 flex items-center justify-center rounded ${
                          selectedPaymentMethod === method.id 
                            ? 'text-yellow-600' 
                            : 'text-yellow-400'
                        }`}>
                          {method.icon}
                        </div>
                        <div>
                          <h4 className={`font-medium text-sm ${
                            selectedPaymentMethod === method.id 
                              ? 'text-gray-900' 
                              : 'text-yellow-400'
                          }`}>
                            {method.name}
                          </h4>
                          <p className={`text-xs ${
                            selectedPaymentMethod === method.id 
                              ? 'text-gray-600' 
                              : 'text-gray-400'
                          }`}>
                            {method.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {availablePaymentMethods.length === 0 && (
                    <div className="col-span-2 text-center py-8 text-gray-500">
                      <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Nenhum método de pagamento configurado.</p>
                      <p className="text-sm">Entre em contato com o administrador.</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* PIX Payment Details */}
          {selectedPaymentMethod === 'pix' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  Pagamento PIX
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!pixPaymentData ? (
                  <div className="text-center py-4">
                    <p className="text-gray-600 mb-4">Clique no botão para gerar o PIX</p>
                    <Button 
                      onClick={handlePixPayment}
                      disabled={isProcessingPayment}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {isProcessingPayment ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Gerando PIX...
                        </>
                      ) : (
                        <>
                          <QrCode className="h-4 w-4 mr-2" />
                          Gerar PIX
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-green-600 font-medium mb-2">PIX gerado com sucesso!</p>
                      <p className="text-sm text-gray-600 mb-4">
                        Valor: R$ {totalAmount.toFixed(2)}
                      </p>
                    </div>
                    
                    {pixPaymentData.qr_code_base64 && (
                      <div className="text-center">
                        <Label className="text-sm font-medium">QR Code PIX:</Label>
                        <div className="flex justify-center mt-2">
                          <img 
                            src={`data:image/png;base64,${pixPaymentData.qr_code_base64}`}
                            alt="QR Code PIX"
                            className="max-w-48 border rounded-lg"
                          />
                        </div>
                      </div>
                    )}
                    
                    {pixPaymentData.qr_code && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Código PIX (Copia e Cola):</Label>
                        <div className="flex gap-2">
                          <Input
                            value={pixPaymentData.qr_code}
                            readOnly
                            className="font-mono text-xs"
                          />
                          <Button
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(pixPaymentData.qr_code);
                              toast({
                                title: "Código copiado!",
                                description: "O código PIX foi copiado para a área de transferência.",
                              });
                            }}
                          >
                            Copiar
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-yellow-800 text-sm">
                        <strong>Atenção:</strong> Após efetuar o pagamento, aguarde alguns minutos para confirmação automática.
                      </p>
                    </div>
                    
                    <Button 
                      onClick={() => {
                        // Create order after PIX is generated (pending payment)
                        const orderData = {
                          items: cartItems,
                          subtotal: subtotal.toFixed(2),
                          serviceAmount: serviceAmount.toFixed(2),
                          totalAmount: totalAmount.toFixed(2),
                          paymentMethod: selectedPaymentMethod,
                          paymentId: pixPaymentData.id,
                          address,
                          cep,
                          city,
                          state,
                          scheduledAt: `${scheduledDate}T${scheduledTime}:00.000Z`,
                          notes
                        };
                        createOrderMutation.mutate(orderData);
                      }}
                      className="w-full"
                      disabled={createOrderMutation.isPending}
                    >
                      {createOrderMutation.isPending ? 'Criando pedido...' : 'Confirmar Pedido'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Card Payment Details */}
          {(selectedPaymentMethod === 'credit_card' || selectedPaymentMethod === 'debit_card') && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  {selectedPaymentMethod === 'credit_card' ? 'Cartão de Crédito' : 'Cartão de Débito'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="cardNumber">Número do Cartão *</Label>
                    <div className="relative">
                      <Input
                        id="cardNumber"
                        value={cardNumber}
                        onChange={(e) => handleCardNumberChange(e.target.value)}
                        placeholder="0000 0000 0000 0000"
                        maxLength={19}
                      />
                      {isLoadingCardInfo && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                        </div>
                      )}
                      {cardInfo && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="flex items-center gap-1">
                            <Check className="h-4 w-4 text-green-500" />
                            <span className="text-xs text-green-600">Cartão detectado</span>
                          </div>
                        </div>
                      )}
                    </div>
                    {cardInfo && (
                      <div className="mt-1 text-xs text-green-600">
                        Tipo: {cardInfo.payment_type_id === 'credit_card' ? 'Crédito' : 'Débito'} • 
                        Método: {cardInfo.payment_method_id?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="cardName">Nome no Cartão *</Label>
                    <Input
                      id="cardName"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value.toUpperCase())}
                      placeholder="NOME COMPLETO"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="cardCpf">CPF do Portador *</Label>
                    <Input
                      id="cardCpf"
                      value={cardCpf}
                      onChange={(e) => setCardCpf(formatCPF(e.target.value))}
                      placeholder="000.000.000-00"
                      maxLength={14}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="cardExpiry">Validade *</Label>
                    <Input
                      id="cardExpiry"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                      placeholder="MM/AA"
                      maxLength={5}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="cardCvv">CVV *</Label>
                    <Input
                      id="cardCvv"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="123"
                      maxLength={4}
                    />
                  </div>
                  
                  {selectedPaymentMethod === 'credit_card' && (
                    <div className="md:col-span-2">
                      <Label htmlFor="installments">Parcelas</Label>
                      <Select value={installments} onValueChange={setInstallments}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o número de parcelas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1x de R$ {totalAmount.toFixed(2)} sem juros</SelectItem>
                          <SelectItem value="2">2x de R$ {(totalAmount / 2).toFixed(2)} sem juros</SelectItem>
                          <SelectItem value="3">3x de R$ {(totalAmount / 3).toFixed(2)} sem juros</SelectItem>
                          <SelectItem value="4">4x de R$ {(totalAmount / 4).toFixed(2)} sem juros</SelectItem>
                          <SelectItem value="5">5x de R$ {(totalAmount / 5).toFixed(2)} sem juros</SelectItem>
                          <SelectItem value="6">6x de R$ {(totalAmount / 6).toFixed(2)} sem juros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-blue-800 text-sm">
                    <strong>Ambiente de Teste:</strong> Use os cartões de teste do MercadoPago:
                  </p>
                  <div className="mt-2 text-xs text-blue-700">
                    <p>• Mastercard: 5031 4332 1540 6351</p>
                    <p>• Visa: 4235 6477 2802 5682</p>
                    <p>• CVV: 123 • Data: 11/30 • Nome: APRO</p>
                  </div>
                </div>
                
                <Button 
                  onClick={handleCardPayment}
                  className="w-full"
                  disabled={isProcessingCardPayment || !cardNumber || !cardName || !cardExpiry || !cardCvv || !cardCpf}
                >
                  {isProcessingCardPayment ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processando Pagamento...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pagar R$ {totalAmount.toFixed(2)}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

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
                disabled={createOrderMutation.isPending || isProcessingPayment || isProcessingCardPayment || 
                         (selectedPaymentMethod === 'pix' && !pixPaymentData) ||
                         ((selectedPaymentMethod === 'credit_card' || selectedPaymentMethod === 'debit_card') && 
                          (!cardNumber || !cardName || !cardExpiry || !cardCvv || !cardCpf))}
              >
                {createOrderMutation.isPending || isProcessingPayment || isProcessingCardPayment ? 
                  'Processando...' : 
                  selectedPaymentMethod === 'cash' ? 'Finalizar Pedido' :
                  selectedPaymentMethod === 'pix' ? (pixPaymentData ? 'PIX Gerado - Preencha os dados' : 'Gerar PIX') :
                  (selectedPaymentMethod === 'credit_card' || selectedPaymentMethod === 'debit_card') ? 'Preencha os dados do cartão' :
                  'Selecione um método de pagamento'
                }
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