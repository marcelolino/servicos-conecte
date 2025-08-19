import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Plus, Minus, Check } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface AddToCartButtonProps {
  serviceId: number;
  serviceName: string;
  providerId?: number;
  chargingTypes?: Array<{
    chargingType: string;
    price: number;
  }>;
  directPrice?: string | number; // For services that have direct pricing
  isProviderService?: boolean;
  className?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
}

export function AddToCartButton({
  serviceId,
  serviceName,
  providerId,
  chargingTypes = [],
  directPrice,
  isProviderService = false,
  className = "",
  variant = "default",
  size = "sm"
}: AddToCartButtonProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated || user?.userType !== "client") {
        throw new Error("Login necessário");
      }

      // Determine the price - use charging types first, then directPrice
      const priceInfo = chargingTypes.find(ct => ct.price > 0);
      const price = priceInfo?.price || (directPrice ? parseFloat(directPrice.toString()) : 0);

      const response = await fetch('/api/cart/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          providerServiceId: serviceId,
          quantity,
          unitPrice: price,
          notes: `Tipo de cobrança: ${priceInfo?.chargingType || 'quote'}`
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao adicionar ao carrinho');
      }

      return response.json();
    },
    onSuccess: () => {
      setIsAdded(true);
      toast({
        title: "Sucesso!",
        description: `${serviceName} foi adicionado ao carrinho`,
      });
      
      // Invalidate and refetch cart data
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      
      // Reset the "added" state after 2 seconds
      setTimeout(() => setIsAdded(false), 2000);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast({
        title: "Login necessário",
        description: "Faça login para adicionar serviços ao carrinho",
        variant: "destructive",
      });
      return;
    }

    if (user?.userType !== "client") {
      toast({
        title: "Acesso negado",
        description: "Apenas clientes podem adicionar serviços ao carrinho",
        variant: "destructive",
      });
      return;
    }

    addToCartMutation.mutate();
  };

  const hasValidPrice = chargingTypes.some(ct => ct.price && ct.price > 0) || (directPrice && parseFloat(directPrice.toString()) > 0);
  const isQuoteOnly = !hasValidPrice;

  // Don't show add to cart for quote-only services
  if (isQuoteOnly) {
    return (
      <Button
        variant="outline"
        size={size}
        className={className}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toast({
            title: "Serviço sob consulta",
            description: "Entre em contato para solicitar orçamento",
          });
        }}
      >
        Solicitar Orçamento
      </Button>
    );
  }

  if (isAdded) {
    return (
      <Button
        variant="secondary"
        size={size}
        className={className}
        disabled
      >
        <Check className="h-4 w-4 mr-1" />
        Adicionado
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {quantity > 1 && (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setQuantity(Math.max(1, quantity - 1));
            }}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <Badge variant="outline" className="min-w-[2rem] text-center">
            {quantity}
          </Badge>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setQuantity(Math.min(10, quantity + 1));
            }}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      )}
      
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleAddToCart}
        disabled={addToCartMutation.isPending}
        onMouseEnter={() => {
          if (quantity === 1) setQuantity(1);
        }}
      >
        {addToCartMutation.isPending ? (
          "Adicionando..."
        ) : (
          <>
            <ShoppingCart className="h-4 w-4 mr-1" />
            {quantity > 1 ? `Adicionar ${quantity}x` : "Adicionar"}
          </>
        )}
      </Button>
    </div>
  );
}