import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CreditCard, Smartphone } from "lucide-react";

declare global {
  interface Window {
    mp: any;
  }
}

export default function TestMercadoPago() {
  const [loading, setLoading] = useState(false);
  const [cardResult, setCardResult] = useState<any>(null);
  const [pixResult, setPixResult] = useState<any>(null);
  const { toast } = useToast();
  const cardPaymentRef = useRef<HTMLDivElement>(null);
  const [mp, setMp] = useState<any>(null);
  const [isCardFormReady, setIsCardFormReady] = useState(false);
  
  // Form data states
  const [testData, setTestData] = useState({
    email: '',
    cpf: '',
    amount: 115.0,
    description: 'Teste de Pagamento'
  });

  // Initialize MercadoPago SDK
  useEffect(() => {
    const initializeMercadoPago = async () => {
      try {
        // Get public key from API
        const response = await fetch('/api/payment-methods/active');
        const paymentMethods = await response.json();
        const mercadoPago = paymentMethods.find((pm: any) => pm.gatewayName === 'mercadopago');
        
        if (!mercadoPago?.publicKey) {
          toast({
            title: "Erro de Configuração",
            description: "Chave pública do MercadoPago não encontrada.",
            variant: "destructive"
          });
          return;
        }

        // Load MercadoPago script
        const script = document.createElement('script');
        script.src = 'https://sdk.mercadopago.com/js/v2';
        script.onload = () => {
          const mpInstance = new window.mp(mercadoPago.publicKey);
          setMp(mpInstance);
          console.log('MercadoPago SDK initialized');
        };
        document.head.appendChild(script);
      } catch (error) {
        console.error('Error initializing MercadoPago:', error);
        toast({
          title: "Erro de Inicialização",
          description: "Não foi possível carregar o MercadoPago SDK.",
          variant: "destructive"
        });
      }
    };

    initializeMercadoPago();
  }, []);

  // Initialize Card Payment Brick
  useEffect(() => {
    if (mp && cardPaymentRef.current && testData.email && testData.cpf) {
      try {
        const cardPaymentBrick = mp.bricks().create('cardPayment', cardPaymentRef.current, {
          initialization: {
            amount: testData.amount,
            payer: {
              email: testData.email,
              identification: {
                type: 'CPF',
                number: testData.cpf.replace(/\D/g, '')
              }
            }
          },
          customization: {
            paymentMethods: {
              creditCard: 'all',
              debitCard: 'all'
            },
            visual: {
              style: {
                customVariables: {
                  theme: 'default'
                }
              }
            }
          },
          callbacks: {
            onReady: () => {
              console.log('Card Payment Brick ready');
              setIsCardFormReady(true);
            },
            onSubmit: async (cardFormData: any) => {
              setLoading(true);
              try {
                console.log('Card form data:', cardFormData);
                const response = await apiRequest('POST', '/api/payments/card', {
                  transaction_amount: testData.amount,
                  token: cardFormData.token,
                  description: testData.description,
                  installments: cardFormData.installments || 1,
                  payment_method_id: cardFormData.paymentMethodId,
                  issuer_id: cardFormData.issuerId,
                  payer: {
                    email: testData.email,
                    identification: {
                      type: 'CPF',
                      number: testData.cpf.replace(/\D/g, '')
                    }
                  }
                });
                
                setCardResult(response);
                toast({
                  title: "Teste de Cartão Executado",
                  description: "Pagamento processado com sucesso!",
                });
              } catch (error) {
                console.error('Card payment error:', error);
                toast({
                  title: "Erro no Pagamento",
                  description: error instanceof Error ? error.message : "Erro desconhecido",
                  variant: "destructive"
                });
                setCardResult({ error: error instanceof Error ? error.message : "Erro desconhecido" });
              } finally {
                setLoading(false);
              }
            }
          }
        });
      } catch (error) {
        console.error('Error creating Card Payment Brick:', error);
      }
    }
  }, [mp, testData.email, testData.cpf, testData.amount]);

  // Card payment is now handled by the Brick's onSubmit callback

  const testPixPayment = async () => {
    if (!testData.email) {
      toast({
        title: "Email Obrigatório",
        description: "Por favor, preencha o email para testar o pagamento PIX.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Test PIX payment with user-provided data
      const response = await apiRequest('POST', '/api/payments/pix', {
        transaction_amount: testData.amount,
        description: testData.description,
        email: testData.email
      });
      
      setPixResult(response);
      toast({
        title: "Teste de PIX Executado",
        description: "Verifique os resultados abaixo. QR Code gerado com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro no Teste de PIX",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
      setPixResult({ error: error instanceof Error ? error.message : "Erro desconhecido" });
    } finally {
      setLoading(false);
    }
  };

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setTestData(prev => ({ ...prev, cpf: formatted }));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Teste MercadoPago - Checkout Transparente
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Teste das funcionalidades de pagamento integradas com MercadoPago
        </p>
      </div>

      {/* Form for test data */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Dados para Teste</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={testData.email}
                onChange={(e) => setTestData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                type="text"
                placeholder="000.000.000-00"
                value={testData.cpf}
                onChange={handleCPFChange}
                maxLength={14}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={testData.amount}
                onChange={(e) => setTestData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                type="text"
                value={testData.description}
                onChange={(e) => setTestData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card Payment Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              Teste Pagamento com Cartão
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {testData.email && testData.cpf ? (
              <div className="space-y-4">
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  <p><strong>Valor:</strong> R$ {testData.amount.toFixed(2)}</p>
                  <p><strong>Descrição:</strong> {testData.description}</p>
                  <p><strong>Email:</strong> {testData.email}</p>
                  <p><strong>CPF:</strong> {testData.cpf}</p>
                </div>
                
                <div className="border rounded-lg p-4 bg-white">
                  <Label className="text-sm font-medium mb-3 block">Formulário de Pagamento:</Label>
                  <div ref={cardPaymentRef} id="cardPayment"></div>
                  {loading && (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Processando pagamento...</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center p-6 bg-yellow-50 rounded-lg">
                <p className="text-yellow-800">
                  Preencha email e CPF acima para carregar o formulário de pagamento
                </p>
              </div>
            )}

            {cardResult && (
              <div className="space-y-2">
                <Label>Resultado:</Label>
                <Textarea
                  value={JSON.stringify(cardResult, null, 2)}
                  readOnly
                  className="h-40 text-xs font-mono"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* PIX Payment Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-purple-600" />
              Teste Pagamento PIX
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Dados do Teste:</Label>
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                <p><strong>Valor:</strong> R$ {testData.amount.toFixed(2)}</p>
                <p><strong>Descrição:</strong> {testData.description}</p>
                <p><strong>Email:</strong> {testData.email || 'Não informado'}</p>
                <p><strong>Método:</strong> PIX</p>
              </div>
            </div>
            
            <Button
              onClick={testPixPayment}
              disabled={loading || !testData.email}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Testando...
                </>
              ) : (
                'Testar Pagamento PIX'
              )}
            </Button>

            {pixResult && (
              <div className="space-y-2">
                <Label>Resultado:</Label>
                <Textarea
                  value={JSON.stringify(pixResult, null, 2)}
                  readOnly
                  className="h-40 text-xs font-mono"
                />
                {pixResult.qr_code_base64 && (
                  <div className="text-center">
                    <Label>QR Code PIX:</Label>
                    <img 
                      src={`data:image/png;base64,${pixResult.qr_code_base64}`}
                      alt="QR Code PIX"
                      className="mx-auto mt-2 max-w-48"
                    />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informações sobre o Ambiente de Teste</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• <strong>Ambiente:</strong> Teste (Sandbox)</p>
            <p>• <strong>Gateway:</strong> MercadoPago</p>
            <p>• <strong>Email Válido:</strong> Use um email real (não test@mercadopago.com)</p>
            <p>• <strong>CPF Válido:</strong> Insira um CPF válido para testes</p>
            <p>• <strong>Cartões de Teste MercadoPago:</strong></p>
            <div className="ml-4 space-y-1">
              <p>- Mastercard Aprovado: 5031 7557 3453 0604</p>
              <p>- Visa Aprovado: 4509 9535 6623 3704</p>
              <p>- CVV: 123 | Vencimento: 11/25</p>
              <p>- Nome: APRO (para aprovado) ou CONT (para contestado)</p>
            </div>
            <p>• <strong>PIX:</strong> QR Code gerado automaticamente para pagamentos instantâneos</p>
            <p>• <strong>Checkout Transparente:</strong> Sem redirecionamento para páginas externas</p>
            <p className="text-orange-600 font-medium">⚠️ Preencha email e CPF válidos acima para evitar erros de "Payer email forbidden"</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}