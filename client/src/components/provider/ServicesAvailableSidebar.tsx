import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Clock, Settings, Plus, Check } from "lucide-react";

interface ServiceCategory {
  id: number;
  name: string;
  description: string;
  icon: string;
  imageUrl: string;
  color: string;
  isActive: boolean;
}

interface ProviderService {
  id: number;
  categoryId: number;
  name: string;
  price: string;
  isActive: boolean;
  category: ServiceCategory;
}

interface ServicesAvailableSidebarProps {
  providerId?: number;
  onServiceSubscribe?: () => void;
}

export default function ServicesAvailableSidebar({ providerId, onServiceSubscribe }: ServicesAvailableSidebarProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Fetch all service categories
  const { data: categories, isLoading: categoriesLoading } = useQuery<ServiceCategory[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch provider's current services
  const { data: providerServices, isLoading: servicesLoading } = useQuery<ProviderService[]>({
    queryKey: ["/api/providers", providerId, "services"],
    enabled: !!providerId,
  });

  // Subscribe to category mutation
  const subscribeToServiceMutation = useMutation({
    mutationFn: (categoryId: number) =>
      apiRequest("POST", "/api/provider-services", {
        categoryId,
        name: selectedCategory?.name,
        price: "50.00",
        description: `Serviço de ${selectedCategory?.name}`,
        isActive: true,
      }),
    onSuccess: () => {
      toast({
        title: "Inscrição realizada!",
        description: `Você foi inscrito na categoria ${selectedCategory?.name}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/providers", providerId, "services"] });
      setIsConfirmOpen(false);
      setSelectedCategory(null);
      onServiceSubscribe?.();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao se inscrever",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCategoryClick = (category: ServiceCategory) => {
    const isAlreadySubscribed = providerServices?.some(
      service => service.categoryId === category.id
    );

    if (isAlreadySubscribed) {
      toast({
        title: "Já inscrito",
        description: `Você já está inscrito na categoria ${category.name}`,
      });
      return;
    }

    setSelectedCategory(category);
    setIsConfirmOpen(true);
  };

  const handleConfirmSubscription = () => {
    if (selectedCategory) {
      subscribeToServiceMutation.mutate(selectedCategory.id);
    }
  };

  const isSubscribed = (categoryId: number) => {
    return providerServices?.some(service => service.categoryId === categoryId);
  };

  if (categoriesLoading || servicesLoading) {
    return (
      <Card className="w-80 h-fit">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Carregando...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-80 h-fit">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Serviços Disponíveis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground mb-4">
            Categorias
          </div>
          
          {categories?.map((category) => (
            <div
              key={category.id}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => handleCategoryClick(category)}
            >
              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                {category.imageUrl ? (
                  <img
                    src={category.imageUrl}
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-semibold text-primary">
                      {category.name.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm truncate">
                    {category.name}
                  </h4>
                  {isSubscribed(category.id) ? (
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCategoryClick(category);
                      }}
                    >
                      Se inscrever
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {isSubscribed(category.id) ? "Inscrito" : "Disponível"}
                </p>
              </div>
            </div>
          ))}
          
          <div className="mt-6 space-y-2">
            <div className="text-sm text-muted-foreground">
              Veja detalhes (1)
            </div>
            <div className="text-sm text-muted-foreground">
              Veja detalhes (0)
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mb-4">
              <Settings className="h-8 w-8 text-muted-foreground" />
            </div>
            <DialogTitle className="text-center">
              Você quer se inscrever esta subcategoria?
            </DialogTitle>
            <DialogDescription className="text-center">
              {selectedCategory?.name}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setIsConfirmOpen(false)}
              className="flex-1"
            >
              Não
            </Button>
            <Button
              onClick={handleConfirmSubscription}
              disabled={subscribeToServiceMutation.isPending}
              className="flex-1"
            >
              {subscribeToServiceMutation.isPending ? "Inscrevendo..." : "Sim"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}