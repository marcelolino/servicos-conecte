import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Plus, Minus, Trash2, ArrowLeft, ArrowRight, ShoppingCart, Eye, Clock, Calendar, Package, FileText } from "lucide-react";

const chargingTypeLabels = {
  visit: 'Por Visita/Consultoria',
  hour: 'Por Hora',
  daily: 'Por Diária',
  package: 'Pacote/Projeto',
  quote: 'Orçamento Personalizado'
};

const chargingTypeIcons = {
  visit: Eye,
  hour: Clock, 
  daily: Calendar,
  package: Package,
  quote: FileText
};

interface CartItem {
  id: number;
  orderId: number;
  providerServiceId: number;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  notes?: string;
  providerService: {
    id: number;
    name?: string;
    description?: string;
    images?: string;
    chargingTypes?: Array<{
      id: number;
      chargingType: 'visit' | 'hour' | 'daily' | 'package' | 'quote';
      price: string | null;
      description: string | null;
      isActive: boolean;
    }>;
    category: {
      id: number;
      name: string;
    };
    provider: {
      id: number;
      userId: number;
      status: string;
      serviceRadius: number;
      basePrice: string;
      description: string;
      experience: string;
      documents: string;
      portfolioImages: string;
      rating: string;
      totalReviews: number;
      totalServices: number;
      isTrialActive: boolean;
      trialEndsAt: Date;
      createdAt: Date;
      updatedAt: Date;
      user: {
        id: number;
        email: string;
        name: string;
        phone: string;
        userType: string;
        address: string;
        cep: string;
        city: string;
        state: string;
        latitude: string;
        longitude: string;
        avatar: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
      };
    };
  };
}

interface Cart {
  id: number;
  items: CartItem[];
  subtotal: string;
  discountAmount: string;
  serviceAmount: string;
  totalAmount: string;
}

export default function CartPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [couponCode, setCouponCode] = useState("");

  // Fetch cart
  const { data: cart, isLoading: cartLoading } = useQuery<Cart>({
    queryKey: ["/api/cart"],
  });

  // Update cart item mutation
  const updateCartItemMutation = useMutation({
    mutationFn: ({ itemId, quantity, unitPrice }: { itemId: number; quantity?: number; unitPrice?: string }) =>
      apiRequest("PUT", `/api/cart/items/${itemId}`, { quantity, unitPrice }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove cart item mutation
  const removeCartItemMutation = useMutation({
    mutationFn: (itemId: number) =>
      apiRequest("DELETE", `/api/cart/items/${itemId}`),
    onSuccess: () => {
      toast({
        title: "Item removido",
        description: "O item foi removido do carrinho.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Clear cart mutation
  const clearCartMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", "/api/cart"),
    onSuccess: () => {
      toast({
        title: "Carrinho limpo",
        description: "Todos os itens foram removidos do carrinho.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao limpar carrinho",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleQuantityChange = (itemId: number, currentQuantity: number, change: number) => {
    const newQuantity = Math.max(1, currentQuantity + change);
    updateCartItemMutation.mutate({ itemId, quantity: newQuantity });
  };

  const handlePriceChange = (itemId: number, unitPrice: string) => {
    updateCartItemMutation.mutate({ itemId, unitPrice });
  };

  const handleRemoveItem = (itemId: number) => {
    removeCartItemMutation.mutate(itemId);
  };

  const getServiceImage = (item: CartItem) => {
    try {
      const images = JSON.parse(item.providerService.images || "[]");
      return images[0] || "/api/placeholder/150/100";
    } catch {
      return "/api/placeholder/150/100";
    }
  };

  const calculateSubtotal = () => {
    return cart?.items?.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0) || 0;
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

  if (cartLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const isEmpty = !cart?.items || cart.items.length === 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setLocation("/services")}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Carrinho</h1>
              <p className="text-muted-foreground">
                {cart?.items?.length || 0} {cart?.items?.length === 1 ? "item" : "itens"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {isEmpty ? (
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
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Itens do Carrinho</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => clearCartMutation.mutate()}
                      disabled={clearCartMutation.isPending}
                    >
                      {clearCartMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      Limpar Carrinho
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cart?.items?.map((item) => (
                    <div key={item.id} className="flex gap-4 p-4 border rounded-lg">
                      <img
                        src={getServiceImage(item)}
                        alt={item.providerService.name || item.providerService.category.name}
                        className="w-20 h-20 object-cover rounded"
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold">
                              {item.providerService.name || item.providerService.category.name}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Por {item.providerService.provider.user.name}
                            </p>
                            {item.providerService.provider.user.city && (
                              <p className="text-xs text-muted-foreground">
                                {item.providerService.provider.user.city}
                              </p>
                            )}
                          </div>
                          <Badge variant="secondary">
                            {item.providerService.category.name}
                          </Badge>
                        </div>

                        {/* Seletor de tipo de cobrança */}
                        {item.providerService.chargingTypes && item.providerService.chargingTypes.length > 0 && (
                          <div className="mb-3">
                            <label className="text-sm font-medium text-foreground mb-3 block">
                              Como você quer pagar pelo serviço:
                            </label>
                            <div className="grid gap-2">
                              {item.providerService.chargingTypes
                                .filter(ct => ct.isActive)
                                .map((chargingType) => {
                                  const Icon = chargingTypeIcons[chargingType.chargingType];
                                  const isSelected = item.unitPrice === (chargingType.price || "0");
                                  return (
                                    <div
                                      key={chargingType.id}
                                      className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                        isSelected
                                          ? 'border-primary bg-primary/5 shadow-sm'
                                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                                      } ${updateCartItemMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                                      onClick={() => !updateCartItemMutation.isPending && handlePriceChange(item.id, chargingType.price || "0")}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                          <div className={`p-2 rounded-full ${
                                            isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                          }`}>
                                            <Icon className="h-4 w-4" />
                                          </div>
                                          <div>
                                            <div className={`font-medium ${
                                              isSelected ? 'text-primary' : 'text-foreground'
                                            }`}>
                                              {chargingTypeLabels[chargingType.chargingType]}
                                            </div>
                                            {chargingType.description && (
                                              <div className="text-xs text-muted-foreground">
                                                {chargingType.description}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <div className={`font-bold text-lg ${
                                          isSelected ? 'text-primary' : 'text-foreground'
                                        }`}>
                                          {chargingType.price ? `R$ ${parseFloat(chargingType.price).toFixed(2)}` : 'Sob consulta'}
                                        </div>
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                          isSelected 
                                            ? 'border-primary bg-primary' 
                                            : 'border-muted-foreground'
                                        }`}>
                                          {isSelected && (
                                            <div className="w-2 h-2 rounded-full bg-primary-foreground"></div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuantityChange(item.id, item.quantity, -1)}
                              disabled={updateCartItemMutation.isPending}
                              className="h-8 w-8 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuantityChange(item.id, item.quantity, 1)}
                              disabled={updateCartItemMutation.isPending}
                              className="h-8 w-8 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">
                                R$ {parseFloat(item.unitPrice).toFixed(2)} cada
                              </div>
                              <div className="font-semibold">
                                R$ {parseFloat(item.totalPrice).toFixed(2)}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(item.id)}
                              disabled={removeCartItemMutation.isPending}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {item.notes && (
                          <p className="text-sm text-muted-foreground mt-2">
                            Observações: {item.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
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

                  {/* Coupon Code */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Código do Cupom</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Digite o código"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                      />
                      <Button variant="outline" size="sm">
                        Aplicar
                      </Button>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => setLocation("/checkout")}
                    disabled={isEmpty}
                  >
                    Finalizar Pedido
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setLocation("/services")}
                  >
                    Continuar Comprando
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}