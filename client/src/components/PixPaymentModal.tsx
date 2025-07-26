import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PixPaymentData {
  id: string;
  qr_code: string;
  qr_code_image: string;
  amount: number;
  expires_at?: string;
}

interface PixPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentData: PixPaymentData | null;
  orderSummary: {
    serviceName: string;
    total: number;
  };
}

export function PixPaymentModal({ isOpen, onClose, paymentData, orderSummary }: PixPaymentModalProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopyPixCode = () => {
    if (paymentData?.qr_code) {
      navigator.clipboard.writeText(paymentData.qr_code);
      setCopied(true);
      toast({
        title: "Código PIX copiado!",
        description: "Cole o código em seu aplicativo bancário para pagar.",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConfirmPayment = () => {
    toast({
      title: "Aguardando pagamento",
      description: "Sua compra será confirmada automaticamente após o pagamento PIX.",
    });
    onClose();
  };

  if (!paymentData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gray-900 text-white border-gray-700">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-yellow-400 flex items-center gap-2">
            📦 Finalizar Venda
          </DialogTitle>
          <Button
            variant="ghost" 
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Side - Order Summary */}
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-yellow-400 font-medium mb-3">📋 Resumo do Pedido</h3>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center text-sm">
                  🔧
                </div>
                <span className="text-gray-300">{orderSummary.serviceName}</span>
                <span className="text-white font-bold ml-auto">R$ {orderSummary.total.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-700 pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold">Total:</span>
                  <span className="font-bold text-lg">R$ {orderSummary.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div>
              <h3 className="text-yellow-400 font-medium mb-3">Método de Pagamento</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 border border-gray-600 rounded-lg bg-gray-800">
                  <div className="text-center">
                    <div className="text-yellow-400 mb-1">💰</div>
                    <div className="text-sm text-gray-300">Dinheiro</div>
                    <div className="text-xs text-gray-400">Pagamento em espécie</div>
                  </div>
                </div>
                <div className="p-3 border-2 border-purple-500 bg-purple-600 rounded-lg">
                  <div className="text-center">
                    <div className="text-white mb-1">📱</div>
                    <div className="text-sm text-white font-bold">PIX</div>
                    <div className="text-xs text-purple-100">Transferência instantânea</div>
                  </div>
                </div>
                <div className="p-3 border border-gray-600 rounded-lg bg-gray-800">
                  <div className="text-center">
                    <div className="text-yellow-400 mb-1">💳</div>
                    <div className="text-sm text-gray-300">Cartão Crédito</div>
                    <div className="text-xs text-gray-400">À vista ou parcelado</div>
                  </div>
                </div>
                <div className="p-3 border border-gray-600 rounded-lg bg-gray-800">
                  <div className="text-center">
                    <div className="text-yellow-400 mb-1">💳</div>
                    <div className="text-sm text-gray-300">Cartão Débito</div>
                    <div className="text-xs text-gray-400">À vista</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - PIX Payment */}
          <div className="space-y-4">
            <div className="bg-blue-600 rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">📱</div>
              <div className="text-white text-lg font-bold mb-1">PIX será processado instantaneamente</div>
              <div className="text-blue-100 text-sm">Valor: R$ {paymentData.amount.toFixed(2)}</div>
            </div>

            {/* QR Code */}
            {paymentData.qr_code_image && (
              <div className="bg-white rounded-lg p-4 flex justify-center">
                <img 
                  src={paymentData.qr_code_image} 
                  alt="QR Code PIX" 
                  className="w-32 h-32"
                />
              </div>
            )}

            {/* Copy PIX Code */}
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-2">Código PIX:</div>
              <div className="bg-gray-700 rounded p-2 text-xs break-all text-gray-300 mb-3">
                {paymentData.qr_code}
              </div>
              <Button
                onClick={handleCopyPixCode}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                disabled={copied}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Código Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Código PIX
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmPayment}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            Confirmar Pagamento
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}