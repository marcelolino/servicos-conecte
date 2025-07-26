import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

declare global {
  interface Window {
    MercadoPago: any;
    cardPaymentBrickController: any;
  }
}

interface CardPaymentData {
  id: string;
  status: string;
  status_detail: string;
  amount: number;
  currency_id: string;
}

interface CardPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentData: CardPaymentData | null;
  orderSummary: {
    serviceName: string;
    total: number;
  };
  publicKey: string;
  paymentType: 'credit_card' | 'debit_card';
}

export function CardPaymentModal({ 
  isOpen, 
  onClose, 
  paymentData, 
  orderSummary, 
  publicKey,
  paymentType 
}: CardPaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [mpLoaded, setMpLoaded] = useState(false);
  const brickRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && !mpLoaded) {
      loadMercadoPagoScript();
    }
  }, [isOpen, mpLoaded]);

  useEffect(() => {
    if (isOpen && mpLoaded && publicKey) {
      renderCardPaymentBrick();
    }
    
    return () => {
      if (window.cardPaymentBrickController) {
        window.cardPaymentBrickController.unmount();
      }
    };
  }, [isOpen, mpLoaded, publicKey]);

  const loadMercadoPagoScript = () => {
    if (window.MercadoPago) {
      setMpLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.async = true;
    script.onload = () => {
      setMpLoaded(true);
    };
    script.onerror = () => {
      toast({
        title: "Erro ao carregar MercadoPago",
        description: "Não foi possível carregar o SDK do MercadoPago. Tente novamente.",
        variant: "destructive"
      });
    };
    document.head.appendChild(script);
  };

  const renderCardPaymentBrick = async () => {
    if (!window.MercadoPago || !brickRef.current) return;

    try {
      const mp = new window.MercadoPago(publicKey, {
        locale: 'pt-BR'
      });
      
      const bricksBuilder = mp.bricks();

      const settings = {
        initialization: {
          amount: orderSummary.total,
        },
        customization: {
          visual: {
            style: {
              theme: 'default',
              customVariables: {
                baseColor: '#3b82f6',
                buttonBackground: '#3b82f6',
                buttonText: '#ffffff',
                inputBackgroundColor: '#ffffff',
                inputColor: '#1f2937',
                borderColor: '#d1d5db',
                borderRadius: '8px'
              }
            },
          },
          paymentMethods: {
            creditCard: paymentType === 'credit_card' ? 'all' : 'none',
            debitCard: paymentType === 'debit_card' ? 'all' : 'none',
          },
        },
        callbacks: {
          onReady: () => {
            console.log('Card Payment Brick ready');
          },
          onSubmit: (cardFormData: any) => {
            return new Promise<void>((resolve, reject) => {
              setIsProcessing(true);
              
              // Format data according to MercadoPago structure
              const payment_data = {
                transaction_amount: orderSummary.total,
                token: cardFormData.token,
                description: orderSummary.serviceName,
                installments: cardFormData.installments || 1,
                payment_method_id: cardFormData.paymentMethodId,
                issuer_id: cardFormData.issuerId,
                payer: {
                  email: cardFormData.cardholderEmail,
                  identification: {
                    type: cardFormData.identificationType,
                    number: cardFormData.identificationNumber,
                  },
                }
              };
              
              fetch('/api/payments/card', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(payment_data),
              })
              .then(response => response.json())
              .then(response => {
                setIsProcessing(false);
                
                if (response.status === 'approved') {
                  toast({
                    title: "Pagamento Aprovado!",
                    description: "Seu pagamento foi processado com sucesso.",
                  });
                  onClose();
                  resolve();
                } else if (response.status === 'pending') {
                  toast({
                    title: "Pagamento Pendente",
                    description: "Seu pagamento está sendo processado.",
                  });
                } else {
                  toast({
                    title: "Pagamento Rejeitado",
                    description: response.status_detail || "Verifique os dados do cartão e tente novamente.",
                    variant: "destructive"
                  });
                }
                resolve();
              })
              .catch(error => {
                setIsProcessing(false);
                console.error('Payment error:', error);
                toast({
                  title: "Erro no Pagamento",
                  description: "Ocorreu um erro ao processar o pagamento. Tente novamente.",
                  variant: "destructive"
                });
                reject(error);
              });
            });
          },
          onError: (error: any) => {
            console.error('Brick error:', error);
            toast({
              title: "Erro no Formulário",
              description: "Verifique os dados inseridos e tente novamente.",
              variant: "destructive"
            });
          },
        },
      };

      // Clear any existing brick
      if (window.cardPaymentBrickController) {
        window.cardPaymentBrickController.unmount();
      }

      // Clear the container
      if (brickRef.current) {
        brickRef.current.innerHTML = '';
      }

      window.cardPaymentBrickController = await bricksBuilder.create(
        'cardPayment',
        'cardPaymentBrick_container',
        settings
      );

    } catch (error) {
      console.error('Error creating Card Payment Brick:', error);
      toast({
        title: "Erro na Configuração",
        description: "Não foi possível configurar o formulário de pagamento.",
        variant: "destructive"
      });
    }
  };

  const getPaymentTypeTitle = () => {
    return paymentType === 'credit_card' ? 'Cartão de Crédito' : 'Cartão de Débito';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white border-gray-200">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2 text-gray-900">
            <CreditCard className="h-5 w-5 text-blue-600" />
            Pagamento com {getPaymentTypeTitle()}
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h3 className="font-semibold text-gray-900 mb-2">Resumo do Pedido</h3>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{orderSummary.serviceName}</span>
                <span className="font-medium">R$ {orderSummary.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>R$ {orderSummary.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Form Container */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Dados do {getPaymentTypeTitle()}</h3>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Ambiente de Teste
              </Badge>
            </div>
            
            {!mpLoaded ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2 text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando formulário de pagamento...
                </div>
              </div>
            ) : (
              <div id="cardPaymentBrick_container" ref={brickRef} className="min-h-[300px]"></div>
            )}

            {isProcessing && (
              <div className="flex items-center justify-center py-4">
                <div className="flex items-center gap-2 text-blue-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processando pagamento...
                </div>
              </div>
            )}
          </div>

          {/* Test Cards Info */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h4 className="font-medium text-yellow-800 mb-2">Cartões de Teste</h4>
            <div className="text-sm text-yellow-700 space-y-1">
              <p><strong>Aprovado:</strong> 4111 1111 1111 1111</p>
              <p><strong>Rejeitado:</strong> 4000 0000 0000 0002</p>
              <p><strong>CVV:</strong> 123 | <strong>Vencimento:</strong> 12/25</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}