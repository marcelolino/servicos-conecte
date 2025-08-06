import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ModernAdminLayout } from "@/components/layout/modern-admin-layout";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, CreditCard } from "lucide-react";
import { Link } from "wouter";
import type { PaymentGatewayConfig, InsertPaymentGatewayConfig } from "@shared/schema";

interface PaymentMethodFormData {
  gatewayName: string;
  isActive: boolean;
  environmentMode: "test" | "live";
  publicKey: string;
  accessToken: string;
  clientId: string;
  gatewayTitle: string;
  logo: string;
}

export default function AdminPaymentMethods() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [stripeForm, setStripeForm] = useState<PaymentMethodFormData>({
    gatewayName: "stripe",
    isActive: false,
    environmentMode: "test",
    publicKey: "",
    accessToken: "",
    clientId: "",
    gatewayTitle: "Gateway Title",
    logo: ""
  });

  const [mercadoPagoForm, setMercadoPagoForm] = useState<PaymentMethodFormData>({
    gatewayName: "mercadopago",
    isActive: false,
    environmentMode: "test",
    publicKey: "",
    accessToken: "",
    clientId: "",
    gatewayTitle: "Gateway Title",
    logo: ""
  });

  // Fetch existing configurations
  const { data: configs, isLoading } = useQuery({
    queryKey: ["/api/admin/payment-gateways"],
    refetchOnWindowFocus: false,
  });

  // Load existing configurations when data is available
  useEffect(() => {
    if (configs) {
      const stripeConfig = configs.find((c: PaymentGatewayConfig) => c.gatewayName === "stripe");
      const mercadoPagoConfig = configs.find((c: PaymentGatewayConfig) => c.gatewayName === "mercadopago");

      if (stripeConfig) {
        setStripeForm({
          gatewayName: "stripe",
          isActive: stripeConfig.isActive,
          environmentMode: stripeConfig.environmentMode as "test" | "live",
          publicKey: stripeConfig.publicKey || "",
          accessToken: stripeConfig.accessToken || "",
          clientId: stripeConfig.clientId || "",
          gatewayTitle: stripeConfig.gatewayTitle || "Gateway Title",
          logo: stripeConfig.logo || ""
        });
      }

      if (mercadoPagoConfig) {
        setMercadoPagoForm({
          gatewayName: "mercadopago",
          isActive: mercadoPagoConfig.isActive,
          environmentMode: mercadoPagoConfig.environmentMode as "test" | "live",
          publicKey: mercadoPagoConfig.publicKey || "",
          accessToken: mercadoPagoConfig.accessToken || "",
          clientId: mercadoPagoConfig.clientId || "",
          gatewayTitle: mercadoPagoConfig.gatewayTitle || "Gateway Title",
          logo: mercadoPagoConfig.logo || ""
        });
      }
    }
  }, [configs]);

  // Create/Update mutation
  const saveConfigMutation = useMutation({
    mutationFn: async (formData: PaymentMethodFormData) => {
      const existingConfig = configs?.find((c: PaymentGatewayConfig) => c.gatewayName === formData.gatewayName);
      
      if (existingConfig) {
        return await apiRequest("PUT", `/api/admin/payment-gateways/${existingConfig.id}`, formData);
      } else {
        return await apiRequest("POST", "/api/admin/payment-gateways", formData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-gateways"] });
      toast({
        title: "Configuração salva",
        description: "As configurações do método de pagamento foram salvas com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Erro ao salvar as configurações.",
        variant: "destructive",
      });
    },
  });

  const handleStripeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveConfigMutation.mutate(stripeForm);
  };

  const handleMercadoPagoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveConfigMutation.mutate(mercadoPagoForm);
  };

  if (isLoading) {
    return (
      <ModernAdminLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </ModernAdminLayout>
    );
  }

  return (
    <ModernAdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin-dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            Métodos de Pagamento
          </h1>
        </div>
        
        <p className="text-muted-foreground">
          Configure os métodos de pagamento do sistema
        </p>

        {/* Payment Methods Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stripe Card */}
          <Card className="bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">STRIPE</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">OFF</span>
                  <Switch
                    checked={stripeForm.isActive}
                    onCheckedChange={(checked) => 
                      setStripeForm(prev => ({ ...prev, isActive: checked }))
                    }
                  />
                </div>
              </div>
              <div className="flex justify-center py-4">
                <div className="w-24 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">stripe</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStripeSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="stripe-env">Environment Mode</Label>
                  <div className="w-full bg-black text-white p-2 rounded text-sm">
                    Test
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stripe-publishable">Publishable Key *</Label>
                  <Input
                    id="stripe-publishable"
                    type="password"
                    value={stripeForm.publicKey}
                    onChange={(e) => setStripeForm(prev => ({ ...prev, publicKey: e.target.value }))}
                    placeholder="pk_test_TYooMQauvdEDq54NiTphI7jx"
                    className="bg-black text-white border-gray-600"
                  />
                </div>

                <div className="space-y-2">
                  <div className="bg-yellow-100 text-yellow-800 px-3 py-2 rounded text-sm">
                    <span className="font-semibold">Payment</span> Gateway Title
                  </div>
                  <Input
                    value={stripeForm.gatewayTitle}
                    onChange={(e) => setStripeForm(prev => ({ ...prev, gatewayTitle: e.target.value }))}
                    placeholder="Gateway Title"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Logo</Label>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 bg-gray-100"
                  >
                    <span className="text-gray-500">Escolher Arquivo</span>
                    <span className="ml-2 text-gray-400">Nenhum arquivo escolhido</span>
                  </Button>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-teal-500 hover:bg-teal-600 text-white"
                  disabled={saveConfigMutation.isPending}
                >
                  {saveConfigMutation.isPending ? "Salvando..." : "Save"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* MercadoPago Card */}
          <Card className="bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">MERCADOPAGO</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">OFF</span>
                  <Switch
                    checked={mercadoPagoForm.isActive}
                    onCheckedChange={(checked) => 
                      setMercadoPagoForm(prev => ({ ...prev, isActive: checked }))
                    }
                  />
                </div>
              </div>
              <div className="flex justify-center py-4">
                <div className="w-24 h-16 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">mercado pago</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleMercadoPagoSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mp-env">Environment Mode</Label>
                  <div className="w-full bg-black text-white p-2 rounded text-sm">
                    Test
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mp-access">Access Token *</Label>
                  <div className="w-full bg-black text-white p-2 rounded text-sm">
                    Access Token *
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mp-public">Public Key *</Label>
                  <Input
                    id="mp-public"
                    type="password"
                    value={mercadoPagoForm.publicKey}
                    onChange={(e) => setMercadoPagoForm(prev => ({ ...prev, publicKey: e.target.value }))}
                    placeholder="Public Key *"
                    className="bg-black text-white border-gray-600"
                  />
                </div>

                <div className="space-y-2">
                  <div className="bg-yellow-100 text-yellow-800 px-3 py-2 rounded text-sm">
                    <span className="font-semibold">Payment</span> Gateway Title
                  </div>
                  <Input
                    value={mercadoPagoForm.gatewayTitle}
                    onChange={(e) => setMercadoPagoForm(prev => ({ ...prev, gatewayTitle: e.target.value }))}
                    placeholder="Gateway Title"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Logo</Label>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 bg-gray-100"
                  >
                    <span className="text-gray-500">Escolher Arquivo</span>
                    <span className="ml-2 text-gray-400">Nenhum arquivo escolhido</span>
                  </Button>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-teal-500 hover:bg-teal-600 text-white"
                  disabled={saveConfigMutation.isPending}
                >
                  {saveConfigMutation.isPending ? "Salvando..." : "Save"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </ModernAdminLayout>
  );
}