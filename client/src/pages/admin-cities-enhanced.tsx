import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Search, Plus, Edit, Trash2, MapPin, Star, Loader2, Users, Briefcase, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const citySchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  state: z.string().min(2, "Estado deve ter pelo menos 2 caracteres"),
  stateCode: z.string().length(2, "Código UF deve ter 2 caracteres").toUpperCase(),
  isHighlighted: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});

type CityForm = z.infer<typeof citySchema>;

interface CityWithStats {
  id: number;
  name: string;
  state: string;
  stateCode: string;
  isActive: boolean;
  isHighlighted: boolean;
  servicesCount: number;
  providersCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export default function AdminCitiesEnhanced() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewCityOpen, setIsNewCityOpen] = useState(false);
  const [isEditCityOpen, setIsEditCityOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<CityWithStats | null>(null);
  const [expandedCityId, setExpandedCityId] = useState<number | null>(null);

  // Forms
  const cityForm = useForm<CityForm>({
    resolver: zodResolver(citySchema),
    defaultValues: {
      name: "",
      state: "",
      stateCode: "",
      isHighlighted: false,
      isActive: true,
    },
  });

  const editCityForm = useForm<CityForm>({
    resolver: zodResolver(citySchema),
    defaultValues: {
      name: "",
      state: "",
      stateCode: "",
      isHighlighted: false,
      isActive: true,
    },
  });

  // Fetch cities with stats
  const { data: cities, isLoading: citiesLoading } = useQuery<CityWithStats[]>({
    queryKey: ["/api/admin/cities-with-stats"],
    enabled: user?.userType === "admin",
  });

  // Create city mutation
  const createCityMutation = useMutation({
    mutationFn: async (data: CityForm) => {
      const response = await apiRequest("POST", "/api/admin/cities", data);
      if (!response.ok) throw new Error("Erro ao criar cidade");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Cidade criada com sucesso!",
        description: "A nova cidade está disponível no sistema.",
      });
      setIsNewCityOpen(false);
      cityForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cities-with-stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cities"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar cidade",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update city mutation
  const updateCityMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CityForm }) => {
      const response = await apiRequest("PUT", `/api/admin/cities/${id}`, data);
      if (!response.ok) throw new Error("Erro ao atualizar cidade");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Cidade atualizada com sucesso!",
        description: "As alterações foram salvas.",
      });
      setIsEditCityOpen(false);
      setEditingCity(null);
      editCityForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cities-with-stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cities"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar cidade",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete city mutation
  const deleteCityMutation = useMutation({
    mutationFn: async (cityId: number) => {
      const response = await apiRequest("DELETE", `/api/admin/cities/${cityId}`, {});
      if (!response.ok) throw new Error("Erro ao deletar cidade");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Cidade deletada com sucesso!",
        description: "A cidade foi removida do sistema.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cities-with-stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cities"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao deletar cidade",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submissions
  const onCreateSubmit = (data: CityForm) => {
    createCityMutation.mutate(data);
  };

  const onEditSubmit = (data: CityForm) => {
    if (!editingCity) return;
    updateCityMutation.mutate({ id: editingCity.id, data });
  };

  const handleEdit = (city: CityWithStats) => {
    setEditingCity(city);
    editCityForm.reset({
      name: city.name,
      state: city.state,
      stateCode: city.stateCode,
      isHighlighted: city.isHighlighted,
      isActive: city.isActive,
    });
    setIsEditCityOpen(true);
  };

  const handleDelete = (cityId: number) => {
    if (confirm("Tem certeza que deseja deletar esta cidade?")) {
      deleteCityMutation.mutate(cityId);
    }
  };

  // Filter cities
  const filteredCities = cities?.filter((city) =>
    city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    city.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
    city.stateCode.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Calculate totals
  const totalServices = filteredCities.reduce((acc, city) => acc + city.servicesCount, 0);
  const totalProviders = filteredCities.reduce((acc, city) => acc + city.providersCount, 0);

  if (user?.userType !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Você não tem permissão para acessar esta página.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2" data-testid="heading-admin-cities-enhanced">
            <MapPin className="h-8 w-8" />
            Gerenciar Cidades e Serviços
          </h1>
          <p className="text-muted-foreground mt-1" data-testid="text-admin-cities-description">
            Gerencie as cidades e visualize serviços e prestadores por localidade
          </p>
        </div>
        <Dialog open={isNewCityOpen} onOpenChange={setIsNewCityOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-city">
              <Plus className="h-4 w-4 mr-2" />
              Nova Cidade
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Criar Nova Cidade</DialogTitle>
              <DialogDescription>
                Adicione uma nova cidade ao sistema
              </DialogDescription>
            </DialogHeader>
            <Form {...cityForm}>
              <form onSubmit={cityForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                <FormField
                  control={cityForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Cidade</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Goiânia" {...field} data-testid="input-city-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={cityForm.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Goiás" {...field} data-testid="input-city-state" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={cityForm.control}
                  name="stateCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código UF</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: GO" 
                          {...field} 
                          maxLength={2}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          data-testid="input-city-state-code"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={cityForm.control}
                  name="isHighlighted"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Cidade em Destaque</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Marcar como principal cidade
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-city-highlighted"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={cityForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Ativa</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Cidade disponível no sistema
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-city-active"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsNewCityOpen(false)}
                    data-testid="button-cancel-new-city"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createCityMutation.isPending} data-testid="button-submit-new-city">
                    {createCityMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Criar Cidade
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Cidades</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-cities">{filteredCities.length}</div>
            <p className="text-xs text-muted-foreground">
              {filteredCities.filter(c => c.isActive).length} ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Serviços</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-services">{totalServices}</div>
            <p className="text-xs text-muted-foreground">
              Disponíveis nas cidades
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Prestadores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-providers">{totalProviders}</div>
            <p className="text-xs text-muted-foreground">
              Ativos nas cidades
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cidades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-cities"
            />
          </div>
        </CardContent>
      </Card>

      {/* Cities Table */}
      <Card>
        <CardHeader>
          <CardTitle data-testid="heading-cities-list">
            Lista de Cidades (<span data-testid="text-cities-count">{filteredCities.length}</span>)
          </CardTitle>
          <CardDescription>
            Visualize e gerencie cidades com informações de serviços e prestadores
          </CardDescription>
        </CardHeader>
        <CardContent>
          {citiesLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredCities.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? "Nenhuma cidade encontrada com esse termo de busca." : "Nenhuma cidade cadastrada."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCities.map((city) => (
                <Collapsible key={city.id}>
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-0 h-8 w-8"
                            data-testid={`button-expand-city-${city.id}`}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </CollapsibleTrigger>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium" data-testid={`text-city-name-${city.id}`}>
                              {city.name}
                            </span>
                            <Badge variant="outline" data-testid={`badge-city-state-code-${city.id}`}>
                              {city.stateCode}
                            </Badge>
                            {city.isActive ? (
                              <Badge variant="default" data-testid={`badge-city-status-${city.id}`}>Ativa</Badge>
                            ) : (
                              <Badge variant="secondary" data-testid={`badge-city-status-${city.id}`}>Inativa</Badge>
                            )}
                            {city.isHighlighted && (
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" data-testid={`icon-city-highlighted-${city.id}`} />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground" data-testid={`text-city-state-${city.id}`}>
                            {city.state}
                          </p>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <div className="text-sm font-medium flex items-center gap-1">
                              <Briefcase className="h-4 w-4" />
                              <span data-testid={`text-city-services-${city.id}`}>{city.servicesCount}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Serviços</p>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-sm font-medium flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span data-testid={`text-city-providers-${city.id}`}>{city.providersCount}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Prestadores</p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(city)}
                            data-testid={`button-edit-city-${city.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(city.id)}
                            disabled={deleteCityMutation.isPending}
                            data-testid={`button-delete-city-${city.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <CollapsibleContent>
                      <div className="mt-4 pt-4 border-t">
                        <div className="grid gap-4 md:grid-cols-2">
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-sm">Serviços Disponíveis</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground">
                                {city.servicesCount} serviço(s) disponível(is) nesta cidade.
                              </p>
                              <Button
                                variant="link"
                                className="p-0 h-auto mt-2"
                                onClick={() => window.location.href = `/admin-services?city=${city.name}`}
                                data-testid={`button-view-services-${city.id}`}
                              >
                                Ver todos os serviços →
                              </Button>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle className="text-sm">Prestadores Ativos</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground">
                                {city.providersCount} prestador(es) ativo(s) nesta cidade.
                              </p>
                              <Button
                                variant="link"
                                className="p-0 h-auto mt-2"
                                onClick={() => window.location.href = `/admin-providers?city=${city.name}`}
                                data-testid={`button-view-providers-${city.id}`}
                              >
                                Ver todos os prestadores →
                              </Button>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditCityOpen} onOpenChange={setIsEditCityOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Cidade</DialogTitle>
            <DialogDescription>
              Atualize as informações da cidade
            </DialogDescription>
          </DialogHeader>
          <Form {...editCityForm}>
            <form onSubmit={editCityForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editCityForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Cidade</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Goiânia" {...field} data-testid="input-edit-city-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editCityForm.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Goiás" {...field} data-testid="input-edit-city-state" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editCityForm.control}
                name="stateCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código UF</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: GO" 
                        {...field} 
                        maxLength={2}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        data-testid="input-edit-city-state-code"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editCityForm.control}
                name="isHighlighted"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Cidade em Destaque</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Marcar como principal cidade
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-edit-city-highlighted"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={editCityForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Ativa</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Cidade disponível no sistema
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-edit-city-active"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditCityOpen(false);
                    setEditingCity(null);
                  }}
                  data-testid="button-cancel-edit-city"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateCityMutation.isPending} data-testid="button-submit-edit-city">
                  {updateCityMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Alterações
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
