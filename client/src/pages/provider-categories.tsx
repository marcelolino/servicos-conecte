import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Crown, X, Star } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiRequest } from '@/lib/queryClient';
import { ProviderLayout } from '@/components/layout/provider-layout';

interface ServiceCategory {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  isActive: boolean;
}

interface ProviderCategory {
  id: number;
  providerId: number;
  categoryId: number;
  isPrimary: boolean;
  createdAt: string;
  category: ServiceCategory;
}

interface Provider {
  id: number;
  userId: number;
  status: string;
}

export default function ProviderCategories() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [isPrimary, setIsPrimary] = useState(false);

  // Get provider info
  const { data: provider } = useQuery<Provider>({
    queryKey: ['/api/providers/me'],
  });

  // Get provider categories
  const { data: providerCategories = [], isLoading } = useQuery<ProviderCategory[]>({
    queryKey: [`/api/providers/${provider?.id}/categories`],
    enabled: !!provider?.id,
  });

  // Get all available categories
  const { data: allCategories = [] } = useQuery<ServiceCategory[]>({
    queryKey: ['/api/categories'],
  });

  // Add category mutation
  const addCategoryMutation = useMutation({
    mutationFn: async ({ categoryId, isPrimary }: { categoryId: number; isPrimary: boolean }) => {
      if (!provider) throw new Error('Provider not found');
      return apiRequest(`/api/providers/${provider.id}/categories`, 'POST', {
        categoryId,
        isPrimary,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/providers/${provider?.id}/categories`] });
      toast({
        title: 'Sucesso',
        description: 'Categoria adicionada com sucesso!',
      });
      setIsAddDialogOpen(false);
      setSelectedCategoryId('');
      setIsPrimary(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao adicionar categoria',
        variant: 'destructive',
      });
    },
  });

  // Remove category mutation
  const removeCategoryMutation = useMutation({
    mutationFn: async (categoryId: number) => {
      if (!provider) throw new Error('Provider not found');
      return apiRequest(`/api/providers/${provider.id}/categories/${categoryId}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/providers/${provider?.id}/categories`] });
      toast({
        title: 'Sucesso',
        description: 'Categoria removida com sucesso!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao remover categoria',
        variant: 'destructive',
      });
    },
  });

  // Set primary category mutation
  const setPrimaryMutation = useMutation({
    mutationFn: async (categoryId: number) => {
      if (!provider) throw new Error('Provider not found');
      return apiRequest(`/api/providers/${provider.id}/categories/primary`, 'PUT', {
        categoryId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/providers/${provider?.id}/categories`] });
      toast({
        title: 'Sucesso',
        description: 'Categoria principal atualizada!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao definir categoria principal',
        variant: 'destructive',
      });
    },
  });

  // Get available categories (not yet added)
  const availableCategories = allCategories.filter(
    (category: ServiceCategory) =>
      !providerCategories.some((pc: ProviderCategory) => pc.categoryId === category.id)
  );

  const handleAddCategory = () => {
    if (!selectedCategoryId) return;
    
    addCategoryMutation.mutate({
      categoryId: parseInt(selectedCategoryId),
      isPrimary,
    });
  };

  const handleRemoveCategory = (categoryId: number) => {
    removeCategoryMutation.mutate(categoryId);
  };

  const handleSetPrimary = (categoryId: number) => {
    setPrimaryMutation.mutate(categoryId);
  };

  if (!user || user.userType !== 'provider') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
          <p className="text-muted-foreground">Você precisa ser um prestador para acessar esta página.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando categorias...</p>
        </div>
      </div>
    );
  }

  return (
    <ProviderLayout>
      <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Categorias</h1>
          <p className="text-muted-foreground mt-2">
            Adicione ou remova categorias para expandir seus serviços e aumentar sua visibilidade.
          </p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Categoria
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Nova Categoria</DialogTitle>
              <DialogDescription>
                Selecione uma categoria para adicionar aos seus serviços.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Categoria</label>
                <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((category: ServiceCategory) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPrimary"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="isPrimary" className="text-sm font-medium">
                  Definir como categoria principal
                </label>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleAddCategory} 
                  disabled={!selectedCategoryId || addCategoryMutation.isPending}
                >
                  {addCategoryMutation.isPending ? 'Adicionando...' : 'Adicionar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {providerCategories.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <div className="bg-muted rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Nenhuma categoria adicionada</h3>
              <p className="text-muted-foreground mb-4">
                Adicione categorias para aparecer em mais solicitações de serviço.
              </p>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Primeira Categoria
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providerCategories.map((providerCategory: ProviderCategory) => (
            <Card key={providerCategory.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {providerCategory.category.name}
                    {providerCategory.isPrimary && (
                      <Badge variant="default" className="gap-1">
                        <Crown className="h-3 w-3" />
                        Principal
                      </Badge>
                    )}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveCategory(providerCategory.categoryId)}
                    disabled={removeCategoryMutation.isPending}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {providerCategory.category.description}
                </p>
                
                {!providerCategory.isPrimary && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetPrimary(providerCategory.categoryId)}
                    disabled={setPrimaryMutation.isPending}
                    className="w-full"
                  >
                    {setPrimaryMutation.isPending ? 'Atualizando...' : 'Definir como Principal'}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {availableCategories.length === 0 && providerCategories.length > 0 && (
        <Card className="mt-6">
          <CardContent className="py-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Todas as categorias adicionadas!</h3>
              <p className="text-muted-foreground">
                Você já está presente em todas as categorias disponíveis.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">💡 Dicas para Gerenciar Categorias</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-1">
                <Star className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-medium">Categoria Principal</h4>
                <p className="text-sm text-muted-foreground">
                  Sua categoria principal aparece com destaque no seu perfil e recebe prioridade nas buscas.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-green-100 dark:bg-green-900 rounded-full p-1">
                <Plus className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h4 className="font-medium">Mais Categorias = Mais Visibilidade</h4>
                <p className="text-sm text-muted-foreground">
                  Quanto mais categorias você atender, mais solicitações de serviço você receberá.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </ProviderLayout>
  );
}