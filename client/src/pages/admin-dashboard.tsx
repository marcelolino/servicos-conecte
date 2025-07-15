import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Users, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  AlertCircle,
  Plus,
  Settings,
  Search,
  Filter,
  MoreVertical,
  Eye,
  UserCheck,
  UserX,
  Shield
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ServiceCategory, User, Provider } from "@shared/schema";

const categorySchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
  icon: z.string().optional(),
  color: z.string().optional(),
});

type CategoryForm = z.infer<typeof categorySchema>;

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [isNewCategoryOpen, setIsNewCategoryOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);

  const form = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      icon: "",
      color: "",
    },
  });

  // Fetch admin statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats/admin"],
    enabled: user?.userType === "admin",
  });

  // Fetch service categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Fetch providers (this would need to be implemented in the backend)
  const { data: providers, isLoading: providersLoading } = useQuery({
    queryKey: ["/api/admin/providers"],
    enabled: user?.userType === "admin",
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: (data: CategoryForm) => apiRequest("POST", "/api/categories", data),
    onSuccess: () => {
      toast({
        title: "Categoria criada com sucesso!",
        description: "A nova categoria está disponível para os prestadores.",
      });
      setIsNewCategoryOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar categoria",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Approve provider mutation
  const approveProviderMutation = useMutation({
    mutationFn: (providerId: number) => 
      apiRequest("PUT", `/api/admin/providers/${providerId}/approve`, {}),
    onSuccess: () => {
      toast({
        title: "Prestador aprovado!",
        description: "O prestador foi notificado e agora pode receber solicitações.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/providers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/admin"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao aprovar prestador",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reject provider mutation
  const rejectProviderMutation = useMutation({
    mutationFn: (providerId: number) => 
      apiRequest("PUT", `/api/admin/providers/${providerId}/reject`, {}),
    onSuccess: () => {
      toast({
        title: "Prestador rejeitado",
        description: "O prestador foi notificado sobre a decisão.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/providers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/admin"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao rejeitar prestador",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getProviderStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "suspended":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    }
  };

  const getProviderStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Aguardando";
      case "approved":
        return "Aprovado";
      case "rejected":
        return "Rejeitado";
      case "suspended":
        return "Suspenso";
      default:
        return "Aguardando";
    }
  };

  const onSubmit = (data: CategoryForm) => {
    createCategoryMutation.mutate(data);
  };

  if (!user || user.userType !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-4">Acesso Negado</h1>
          <p className="text-muted-foreground">Você precisa ser um administrador para acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Painel Administrativo
          </h1>
          <p className="text-muted-foreground">
            Gerencie usuários, categorias e monitore o desempenho da plataforma.
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card className="dashboard-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Usuários</p>
                  <p className="text-2xl font-bold text-foreground">
                    {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.totalUsers || 0}
                  </p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Prestadores</p>
                  <p className="text-2xl font-bold text-foreground">
                    {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.totalProviders || 0}
                  </p>
                </div>
                <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                  <UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Solicitações</p>
                  <p className="text-2xl font-bold text-foreground">
                    {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.totalServiceRequests || 0}
                  </p>
                </div>
                <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
                  <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Receita Total</p>
                  <p className="text-2xl font-bold text-secondary">
                    {statsLoading ? <Skeleton className="h-8 w-20" /> : `R$ ${stats?.totalRevenue?.toFixed(2) || "0.00"}`}
                  </p>
                </div>
                <div className="bg-secondary/10 p-3 rounded-full">
                  <DollarSign className="h-6 w-6 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Aguardando Aprovação</p>
                  <p className="text-2xl font-bold text-foreground">
                    {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.pendingApprovals || 0}
                  </p>
                </div>
                <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-full">
                  <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <TabsList className="grid w-full sm:w-auto grid-cols-3">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="providers">Prestadores</TabsTrigger>
              <TabsTrigger value="categories">Categorias</TabsTrigger>
            </TabsList>

            <Dialog open={isNewCategoryOpen} onOpenChange={setIsNewCategoryOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Categoria
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Criar Nova Categoria</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Categoria</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Encanador" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Descreva o tipo de serviço desta categoria..."
                              className="resize-none"
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="icon"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ícone (opcional)</FormLabel>
                            <FormControl>
                              <Input placeholder="wrench" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="color"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cor (opcional)</FormLabel>
                            <FormControl>
                              <Input placeholder="#3B82F6" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsNewCategoryOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={createCategoryMutation.isPending}>
                        {createCategoryMutation.isPending ? "Criando..." : "Criar Categoria"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="dashboard-card">
                <CardHeader>
                  <CardTitle>Estatísticas Gerais</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Taxa de Aprovação</span>
                      <span className="font-semibold text-foreground">
                        {statsLoading ? <Skeleton className="h-4 w-12" /> : "87%"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Serviços Concluídos</span>
                      <span className="font-semibold text-foreground">
                        {statsLoading ? <Skeleton className="h-4 w-12" /> : "1,234"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Avaliação Média</span>
                      <span className="font-semibold text-foreground">
                        {statsLoading ? <Skeleton className="h-4 w-12" /> : "4.8"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="dashboard-card">
                <CardHeader>
                  <CardTitle>Atividade Recente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-secondary rounded-full"></div>
                      <span className="text-sm text-muted-foreground">
                        Novo prestador cadastrado
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-sm text-muted-foreground">
                        Serviço concluído
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-accent rounded-full"></div>
                      <span className="text-sm text-muted-foreground">
                        Nova avaliação recebida
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="providers" className="space-y-6">
            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle>Prestadores de Serviços</CardTitle>
              </CardHeader>
              <CardContent>
                {providersLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-10 h-10 rounded-full" />
                          <div>
                            <Skeleton className="h-4 w-32 mb-1" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-6 w-20" />
                          <Skeleton className="h-8 w-8" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Mock providers data since the endpoint isn't fully implemented */}
                    <div className="text-center py-8">
                      <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        Lista de Prestadores
                      </h3>
                      <p className="text-muted-foreground">
                        A lista completa de prestadores seria exibida aqui.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle>Categorias de Serviços</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoriesLoading ? (
                    Array.from({ length: 6 }).map((_, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Skeleton className="h-5 w-24" />
                          <Skeleton className="h-6 w-16" />
                        </div>
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    ))
                  ) : (
                    categories?.map((category: ServiceCategory) => (
                      <div key={category.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-foreground">{category.name}</h3>
                          <Badge variant={category.isActive ? "default" : "secondary"}>
                            {category.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {category.description}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
