import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Loader2, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  CreditCard, 
  Banknote, 
  Smartphone,
  MapPin,
  Calendar,
  Clock
} from "lucide-react";

const checkoutSchema = z.object({
  address: z.string().min(1, "Endereço é obrigatório"),
  cep: z.string().min(8, "CEP deve ter 8 dígitos"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().min(2, "Estado é obrigatório"),
  scheduledAt: z.string().optional(),
  notes: z.string().optional(),
  paymentMethod: z.enum(["digital", "cash", "credit_card", "pix"]),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

const steps = [
  { id: "details", label: "Detalhes", icon: MapPin },
  { id: "payment", label: "Pagamento", icon: CreditCard },
  { id: "scheduled", label: "Agendado", icon: Check },
];

const paymentMethods = [
  { id: "pix", label: "PIX", icon: Smartphone, description: "Pagamento instantâneo" },
  { id: "credit_card", label: "Cartão de Crédito", icon: CreditCard, description: "Visa, Master, Elo" },
  { id: "cash", label: "Dinheiro", icon: Banknote, description: "Pagamento na entrega" },
  { id: "digital", label: "Pagamento Digital", icon: Smartphone, description: "Outros métodos digitais" },
];

export default function CheckoutPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState("details");

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      address: "",
      cep: "",
      city: "",
      state: "",
      scheduledAt: "",
      notes: "",
      paymentMethod: "pix",
    },
  });

  // Fetch cart
  const { data: cart, isLoading: cartLoading } = useQuery({
    queryKey: ["/api/cart"],
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: (data: CheckoutForm) => apiRequest("POST", "/api/orders", data),
    onSuccess: (order) => {
      console.log("Order created successfully:", order);
      
      // Clear the cache to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      
      // Ensure we have an order ID
      if (order && order.id) {
        setLocation(`/order-success/${order.id}`);
      } else {
        console.error("Order ID is missing from response:", order);
        // Fallback to orders page if ID is missing
        toast({
          title: "Pedido criado com sucesso!",
          description: "Redirecionando para a página de pedidos...",
        });
        setLocation("/orders");
      }
    },
    onError: (error: any) => {
      console.error("Order creation error:", error);
      toast({
        title: "Erro ao criar pedido",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const calculateSubtotal = () => {
    return cart?.items?.reduce((sum: number, item: any) => sum + parseFloat(item.totalPrice), 0) || 0;
  };

  const calculateServiceFee = () => {
    const subtotal = calculateSubtotal();
    return subtotal * 0.1; // 10% service fee
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const serviceFee = calculateServiceFee();
    const discount = parseFloat(cart?.discountAmount || "0");
    return subtotal + serviceFee - discount;
  };

  const onSubmit = (data: CheckoutForm) => {
    if (currentStep === "details") {
      setCurrentStep("payment");
    } else if (currentStep === "payment") {
      createOrderMutation.mutate(data);
    }
  };

  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.id === currentStep);
  };

  if (cartLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!cart?.items || cart.items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Carrinho vazio</h1>
          <p className="text-muted-foreground mb-6">
            Adicione alguns serviços antes de finalizar o pedido
          </p>
          <Button onClick={() => setLocation("/services")}>
            Explorar Serviços
          </Button>
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
              <h1 className="text-2xl font-bold text-foreground">Finalizar Pedido</h1>
              <p className="text-muted-foreground">
                Complete suas informações para continuar
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white dark:bg-gray-900 border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = getCurrentStepIndex() > index;
              const isAccessible = getCurrentStepIndex() >= index;

              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : isCompleted
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : isAccessible
                          ? "bg-muted text-muted-foreground"
                          : "bg-muted text-muted-foreground opacity-50"
                  }`}>
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <StepIcon className="h-4 w-4" />
                    )}
                    <span className="font-medium">{step.label}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-px mx-2 ${
                      isCompleted ? "bg-green-500" : "bg-muted"
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {currentStep === "details" && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Informações de Entrega
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Endereço Completo</FormLabel>
                            <FormControl>
                              <Input placeholder="Rua, número, complemento" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="cep"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CEP</FormLabel>
                              <FormControl>
                                <Input placeholder="00000-000" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cidade</FormLabel>
                              <FormControl>
                                <Input placeholder="Sua cidade" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estado</FormLabel>
                            <FormControl>
                              <Input placeholder="SP" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="scheduledAt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data e Hora Agendada (Opcional)</FormLabel>
                            <FormControl>
                              <Input 
                                type="datetime-local" 
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Observações (Opcional)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Informações adicionais sobre o serviço"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                )}

                {currentStep === "payment" && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Forma de Pagamento
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="paymentMethod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Selecione a forma de pagamento</FormLabel>
                            <FormControl>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {paymentMethods.map((method) => {
                                  const MethodIcon = method.icon;
                                  return (
                                    <div
                                      key={method.id}
                                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                                        field.value === method.id
                                          ? "border-primary bg-primary/5"
                                          : "border-muted hover:border-primary/50"
                                      }`}
                                      onClick={() => field.onChange(method.id)}
                                    >
                                      <div className="flex items-center gap-3">
                                        <MethodIcon className="h-6 w-6" />
                                        <div>
                                          <div className="font-medium">{method.label}</div>
                                          <div className="text-sm text-muted-foreground">
                                            {method.description}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                )}

                <div className="flex justify-between">
                  {currentStep === "payment" && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep("details")}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Voltar
                    </Button>
                  )}

                  <Button
                    type="submit"
                    disabled={createOrderMutation.isPending}
                    className={currentStep === "details" ? "ml-auto" : ""}
                  >
                    {createOrderMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : currentStep === "details" ? (
                      <>
                        Continuar
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    ) : (
                      <>
                        Finalizar Pedido
                        <Check className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          {/* Order Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items */}
                <div className="space-y-3">
                  {cart?.items?.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <Badge className="h-6 w-6 rounded-full flex items-center justify-center p-0 text-xs">
                        {item.quantity}
                      </Badge>
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {item.providerService.name || item.providerService.category.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.providerService.provider.user.name}
                        </div>
                      </div>
                      <div className="text-sm font-medium">
                        R$ {parseFloat(item.totalPrice).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>R$ {calculateSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxa de serviço</span>
                    <span>R$ {calculateServiceFee().toFixed(2)}</span>
                  </div>
                  {parseFloat(cart?.discountAmount || "0") > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Desconto</span>
                      <span>-R$ {parseFloat(cart?.discountAmount || "0").toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>R$ {calculateTotal().toFixed(2)}</span>
                  </div>
                </div>

                {form.watch("scheduledAt") && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Agendado para: {new Date(form.watch("scheduledAt")).toLocaleString("pt-BR")}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}