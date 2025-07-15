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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Search, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Star,
  MapPin,
  Calendar,
  DollarSign,
  Filter
} from "lucide-react";
import type { ServiceRequest, ServiceCategory } from "@shared/schema";

const serviceRequestSchema = z.object({
  categoryId: z.string().min(1, "Selecione uma categoria"),
  title: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
  address: z.string().min(5, "Endereço deve ter pelo menos 5 caracteres"),
  cep: z.string().min(8, "CEP deve ter 8 caracteres"),
  city: z.string().min(2, "Cidade é obrigatória"),
  state: z.string().min(2, "Estado é obrigatório"),
});

type ServiceRequestForm = z.infer<typeof serviceRequestSchema>;

export default function ClientDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("requests");
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const form = useForm<ServiceRequestForm>({
    resolver: zodResolver(serviceRequestSchema),
    defaultValues: {
      categoryId: "",
      title: "",
      description: "",
      address: "",
      cep: "",
      city: "",
      state: "",
    },
  });

  // Fetch service categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Fetch client's service requests
  const { data: serviceRequests, isLoading: requestsLoading } = useQuery({
    queryKey: ["/api/service-requests/client"],
  });

  // Fetch client statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats/client"],
  });

  // Create service request mutation
  const createRequestMutation = useMutation({
    mutationFn: (data: ServiceRequestForm) => 
      apiRequest("POST", "/api/service-requests", {
        ...data,
        categoryId: parseInt(data.categoryId),
      }),
    onSuccess: () => {
      toast({
        title: "Solicitação criada com sucesso!",
        description: "Os prestadores da sua região serão notificados.",
      });
      setIsNewRequestOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests/client"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar solicitação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "service-status-pending";
      case "accepted":
        return "service-status-accepted";
      case "in_progress":
        return "service-status-in-progress";
      case "completed":
        return "service-status-completed";
      case "cancelled":
        return "service-status-cancelled";
      default:
        return "service-status-pending";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendente";
      case "accepted":
        return "Aceito";
      case "in_progress":
        return "Em andamento";
      case "completed":
        return "Concluído";
      case "cancelled":
        return "Cancelado";
      default:
        return "Pendente";
    }
  };

  const filteredRequests = serviceRequests?.filter((request: ServiceRequest) => 
    selectedStatus === "all" || request.status === selectedStatus
  );

  const onSubmit = (data: ServiceRequestForm) => {
    createRequestMutation.mutate(data);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Acesso Negado</h1>
          <p className="text-muted-foreground">Você precisa fazer login para acessar esta página.</p>
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
            Olá, {user.name}!
          </h1>
          <p className="text-muted-foreground">
            Gerencie suas solicitações de serviços e encontre os melhores profissionais.
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="dashboard-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Serviços Solicitados</p>
                  <p className="text-2xl font-bold text-foreground">
                    {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.totalServices || 0}
                  </p>
                </div>
                <div className="bg-primary/10 p-3 rounded-full">
                  <Search className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Concluídos</p>
                  <p className="text-2xl font-bold text-foreground">
                    {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.completedServices || 0}
                  </p>
                </div>
                <div className="bg-secondary/10 p-3 rounded-full">
                  <CheckCircle className="h-6 w-6 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Investido</p>
                  <p className="text-2xl font-bold text-secondary">
                    {statsLoading ? <Skeleton className="h-8 w-20" /> : `R$ ${stats?.totalSpent?.toFixed(2) || "0.00"}`}
                  </p>
                </div>
                <div className="bg-accent/10 p-3 rounded-full">
                  <DollarSign className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <TabsList className="grid w-full sm:w-auto grid-cols-2">
              <TabsTrigger value="requests">Solicitações</TabsTrigger>
              <TabsTrigger value="find">Encontrar Profissionais</TabsTrigger>
            </TabsList>

            <Dialog open={isNewRequestOpen} onOpenChange={setIsNewRequestOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Solicitação
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Criar Nova Solicitação</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoria do Serviço</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma categoria" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories?.map((category: ServiceCategory) => (
                                <SelectItem key={category.id} value={category.id.toString()}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Reparo de vazamento na cozinha" {...field} />
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
                              placeholder="Descreva detalhadamente o serviço que precisa..."
                              className="resize-none"
                              rows={4}
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
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Endereço</FormLabel>
                          <FormControl>
                            <Input placeholder="Rua, número, bairro" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsNewRequestOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={createRequestMutation.isPending}>
                        {createRequestMutation.isPending ? "Criando..." : "Criar Solicitação"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <TabsContent value="requests" className="space-y-6">
            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="status-filter" className="text-sm font-medium">
                  Status:
                </Label>
              </div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger id="status-filter" className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="accepted">Aceito</SelectItem>
                  <SelectItem value="in_progress">Em andamento</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Service Requests List */}
            <div className="space-y-4">
              {requestsLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <Card key={index} className="dashboard-card">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <Skeleton className="h-6 w-64 mb-2" />
                          <Skeleton className="h-4 w-32 mb-4" />
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-3/4" />
                        </div>
                        <Skeleton className="h-6 w-20" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : filteredRequests?.length === 0 ? (
                <Card className="dashboard-card">
                  <CardContent className="p-12 text-center">
                    <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Nenhuma solicitação encontrada
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {selectedStatus === "all" 
                        ? "Você ainda não criou nenhuma solicitação de serviço."
                        : `Nenhuma solicitação com status "${getStatusText(selectedStatus)}" encontrada.`
                      }
                    </p>
                    <Button onClick={() => setIsNewRequestOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeira Solicitação
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                filteredRequests?.map((request: ServiceRequest & { category: ServiceCategory; provider?: any }) => (
                  <Card key={request.id} className="dashboard-card">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-foreground">{request.title}</h3>
                            <Badge className={`px-3 py-1 rounded-full text-xs ${getStatusColor(request.status)}`}>
                              {getStatusText(request.status)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {request.category.name} • {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-foreground mb-3">{request.description}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {request.city}, {request.state}
                            </div>
                            {request.estimatedPrice && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                R$ {Number(request.estimatedPrice).toFixed(2)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {request.provider && (
                        <div className="border-t pt-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <span className="text-sm font-bold text-primary">
                                  {request.provider.user?.name?.charAt(0) || "P"}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-foreground">
                                  {request.provider.user?.name || "Prestador"}
                                </p>
                                <div className="flex items-center gap-1">
                                  <Star className="h-3 w-3 text-yellow-400 fill-current" />
                                  <span className="text-xs text-muted-foreground">
                                    {Number(request.provider.rating || 0).toFixed(1)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {request.status === "completed" && (
                              <Button variant="outline" size="sm">
                                Avaliar
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="find" className="space-y-6">
            <Card className="dashboard-card">
              <CardContent className="p-12 text-center">
                <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Encontre Profissionais
                </h3>
                <p className="text-muted-foreground mb-4">
                  Esta funcionalidade permite buscar profissionais próximos a você.
                </p>
                <Button onClick={() => setActiveTab("requests")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Solicitação
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
