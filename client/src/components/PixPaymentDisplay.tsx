import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Copy, Clock, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import QRCode from "qrcode";

interface PixPaymentDisplayProps {
  amount: number;
  orderId?: string;
  onPaymentComplete?: () => void;
}

const PixPaymentDisplay: React.FC<PixPaymentDisplayProps> = ({ 
  amount, 
  orderId, 
  onPaymentComplete 
}) => {
  const { toast } = useToast();
  const [pixCode, setPixCode] = useState<string>("");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds

  // Generate PIX payment data
  useEffect(() => {
    generatePixPayment();
  }, [amount]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const generatePixPayment = async () => {
    setIsLoading(true);
    
    try {
      // Generate a realistic PIX code
      const pixCodeData = `00020101021243650016COM.MERCADOLIBRE02013063638f1192a-5fd1-4180-a180-8bcae3556bc35204000053039865802BR5925QSERVICOS MARKETPLACE6009SAO PAULO62070503***6304${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      
      // Generate real QR code using the qrcode library
      const qrCodeDataUrl = await QRCode.toDataURL(pixCodeData, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      setPixCode(pixCodeData);
      setQrCodeUrl(qrCodeDataUrl);
      setIsLoading(false);
    } catch (error) {
      console.error('Error generating QR code:', error);
      // Fallback to text-based display
      const pixCodeData = `00020101021243650016COM.MERCADOLIBRE02013063638f1192a-5fd1-4180-a180-8bcae3556bc35204000053039865802BR5925QSERVICOS MARKETPLACE6009SAO PAULO62070503***6304${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      setPixCode(pixCodeData);
      setIsLoading(false);
    }
  };



  const copyPixCode = () => {
    navigator.clipboard.writeText(pixCode).then(() => {
      toast({
        title: "Código PIX copiado!",
        description: "Cole no seu app de pagamentos para finalizar.",
      });
    }).catch(() => {
      toast({
        title: "Erro ao copiar",
        description: "Copie manualmente o código PIX.",
        variant: "destructive",
      });
    });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatAmount = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Gerando PIX...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Preparando seu código PIX...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Pagamento PIX
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Expira em: {formatTime(timeLeft)}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Amount */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Valor a pagar</p>
          <p className="text-2xl font-bold text-primary">{formatAmount(amount)}</p>
        </div>

        {/* QR Code */}
        {qrCodeUrl && (
          <div className="text-center space-y-4">
            <div className="bg-white p-4 rounded-lg border inline-block">
              <img 
                src={qrCodeUrl} 
                alt="QR Code PIX" 
                className="w-48 h-48 mx-auto"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Escaneie com o app do seu banco
            </p>
          </div>
        )}

        {/* PIX Code */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Código PIX:</label>
            <Button
              variant="outline"
              size="sm"
              onClick={copyPixCode}
              className="h-8"
            >
              <Copy className="h-3 w-3 mr-1" />
              Copiar
            </Button>
          </div>
          <div className="bg-muted p-3 rounded border text-xs font-mono break-all">
            {pixCode}
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Como pagar:</h4>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Abra o aplicativo do seu banco</li>
            <li>Escolha a opção <strong>Pagar com PIX</strong></li>
            <li>Escaneie o QR Code ou cole o código PIX</li>
            <li>Confirme os dados e finalize o pagamento</li>
          </ol>
        </div>

        {/* Status */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-700">
            <Clock className="h-4 w-4" />
            <span className="font-medium text-sm">Aguardando pagamento...</span>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            Assim que detectarmos o pagamento, você será redirecionado automaticamente.
          </p>
        </div>

        {/* Manual confirmation for testing */}
        <div className="text-center pt-4 border-t">
          <p className="text-xs text-muted-foreground mb-2">
            Apenas para testes - em produção a confirmação é automática
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onPaymentComplete}
            className="text-green-600 border-green-600 hover:bg-green-50"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Simular Pagamento Aprovado
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PixPaymentDisplay;