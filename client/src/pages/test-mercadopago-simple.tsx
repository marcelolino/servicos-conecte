import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CreditCard, Smartphone, CheckCircle } from "lucide-react";

export default function TestMercadoPagoSimple() {
  const [loading, setLoading] = useState(false);
  const [cardResult, setCardResult] = useState<any>(null);
  const [pixResult, setPixResult] = useState<any>(null);
  const { toast } = useToast();
  
  // Form data states
  const [testData, setTestData] = useState({
    email: '',
    cpf: '',
    amount: 115.0,
    description: 'Teste de Pagamento'
  });

  const testCardPaymentSimulation = async () => {
    if (!testData.email || !testData.cpf) {
      toast({
        title: "Dados Obrigatórios",
        description: "Por favor, preencha email e CPF para testar o pagamento.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Simulate a realistic card token (like what MercadoPago would generate)
      const simulatedToken = `card_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const response = await apiRequest('POST', '/api/payments/card', {
        transaction_amount: testData.amount,
        token: simulatedToken,
        description: testData.description,
        installments: 1,
        payment_method_id: 'master',
        issuer_id: '25',
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
        description: "Simulação realizada com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro no Teste de Cartão",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
      setCardResult({ error: error instanceof Error ? error.message : "Erro desconhecido" });
    } finally {
      setLoading(false);
    }
  };

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
      const response = await apiRequest('POST', '/api/payments/pix', {
        transaction_amount: testData.amount,
        description: testData.description,
        email: testData.email
      });
      
      setPixResult(response);
      toast({
        title: "Teste de PIX Executado",
        description: "QR Code gerado com sucesso!",
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
          Teste MercadoPago - Versão Simples
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Teste das funcionalidades de pagamento com simulação de tokens
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
            <div className="space-y-2">
              <Label>Dados do Teste:</Label>
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                <p><strong>Valor:</strong> R$ {testData.amount.toFixed(2)}</p>
                <p><strong>Descrição:</strong> {testData.description}</p>
                <p><strong>Email:</strong> {testData.email || 'Não informado'}</p>
                <p><strong>CPF:</strong> {testData.cpf || 'Não informado'}</p>
                <p><strong>Método:</strong> Mastercard (simulado)</p>
                <p><strong>Parcelas:</strong> 1x</p>
              </div>
            </div>
            
            <Button
              onClick={testCardPaymentSimulation}
              disabled={loading || !testData.email || !testData.cpf}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Testando...
                </>
              ) : (
                'Testar Pagamento com Cartão'
              )}
            </Button>

            {cardResult && (
              <div className="space-y-2">
                <Label>Resultado:</Label>
                <Textarea
                  value={JSON.stringify(cardResult, null, 2)}
                  readOnly
                  className="h-40 text-xs font-mono"
                />
                {cardResult.status === 'approved' && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Pagamento Aprovado!</span>
                  </div>
                )}
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
                {pixResult.status === 'pending' && (
                  <div className="flex items-center gap-2 text-orange-600">
                    <Smartphone className="h-4 w-4" />
                    <span className="text-sm font-medium">PIX gerado! Aguardando pagamento.</span>
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
            <p>• <strong>Simulação de Token:</strong> Esta versão simula tokens de cartão</p>
            <p>• <strong>PIX Real:</strong> Gera QR Code PIX real através da API do MercadoPago</p>
            <p>• <strong>Checkout Transparente:</strong> Sem redirecionamento para páginas externas</p>
            <p className="text-green-600 font-medium">✅ Esta versão evita problemas de carregamento do SDK</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}