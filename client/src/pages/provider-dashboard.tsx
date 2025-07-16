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
import CreateProviderProfile from "@/components/create-provider-profile";
import ImageUpload from "@/components/image-upload";
import { 
  DollarSign, 
  Star, 
  Clock, 
  CheckCircle, 
  XCircle,
  MapPin,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  AlertCircle,
  Plus,
  Settings,
  Package
} from "lucide-react";
import { Link } from "wouter";
import type { ServiceRequest, ServiceCategory, Provider } from "@shared/schema";

const providerServiceSchema = z.object({
  categoryId: z.string().min(1, "Selecione uma categoria"),
  name: z.string().min(3, "Nome do serviço é obrigatório"),
  price: z.string().min(1, "Preço é obrigatório"),
  description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
  images: z.array(z.string()).optional(),
});

type ProviderServiceForm = z.infer<typeof providerServiceSchema>;

export default function ProviderDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("requests");
  const [isNewServiceOpen, setIsNewServiceOpen] = useState(false);
  const [showCreateProfile, setShowCreateProfile] = useState(false);
  const [serviceImages, setServiceImages] = useState<string[]>([]);

  const form = useForm<ProviderServiceForm>({
    resolver: zodResolver(providerServiceSchema),
    defaultValues: {
      categoryId: "",
      name: "",
      price: "",
      description: "",
      images: [],
    },
  });

  // Fetch provider data
  const { data: provider, isLoading: providerLoading } = useQuery({
    queryKey: ["/api/providers/me"],
    enabled: user?.userType === "provider",
  });

  // Fetch service categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Fetch provider's service requests
  const { data: serviceRequests, isLoading: requestsLoading } = useQuery({
    queryKey: ["/api/service-requests/provider"],
    enabled: !!provider,
  });

  // Fetch provider's services
  const { data: providerServices, isLoading: servicesLoading } = useQuery({
    queryKey: ["/api/providers", provider?.id, "services"],
    enabled: !!provider,
  });

  // Fetch provider statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats/provider"],
    enabled: !!provider,
  });

  // Accept service request mutation
  const acceptRequestMutation = useMutation({
    mutationFn: (requestId: number) => 
      apiRequest("PUT", `/api/service-requests/${requestId}`, {
        status: "accepted",
        providerId: provider?.id,
      }),
    onSuccess: () => {
      toast({
        title: "Solicitação aceita!",
        description: "O cliente foi notificado e você pode iniciar o trabalho.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests/provider"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao aceitar solicitação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reject service request mutation
  const rejectRequestMutation = useMutation({
    mutationFn: (requestId: number) => 
      apiRequest("PUT", `/api/service-requests/${requestId}`, {
        status: "cancelled",
      }),
    onSuccess: () => {
      toast({
        title: "Solicitação recusada",
        description: "A solicitação foi removida da sua lista.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests/provider"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao recusar solicitação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Add service mutation
  const addServiceMutation = useMutation({
    mutationFn: (data: ProviderServiceForm) => 
      apiRequest("POST", `/api/providers/${provider?.id}/services`, {
        ...data,
        categoryId: parseInt(data.categoryId),
        price: parseFloat(data.price),
        images: JSON.stringify(serviceImages),
      }),
    onSuccess: () => {
      toast({
        title: "Serviço adicionado com sucesso!",
        description: "Agora você pode receber solicitações para este serviço.",
      });
      setIsNewServiceOpen(false);
      form.reset();
      setServiceImages([]);
      queryClient.invalidateQueries({ queryKey: ["/api/providers", provider?.id, "services"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar serviço",
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
        return "Aguardando Aprovação";
      case "approved":
        return "Aprovado";
      case "rejected":
        return "Rejeitado";
      case "suspended":
        return "Suspenso";
      default:
        return "Aguardando Aprovação";
    }
  };

  const onSubmit = (data: ProviderServiceForm) => {
    const serviceData = {
      ...data,
      images: serviceImages,
    };
    addServiceMutation.mutate(serviceData);
  };

  const handleImageUpload = (imageUrl: string) => {
    setServiceImages(prev => [...prev, imageUrl]);
  };

  const handleImageRemove = (imageUrl: string) => {
    setServiceImages(prev => prev.filter(img => img !== imageUrl));
  };

  if (!user || user.userType !== "provider") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Acesso Negado</h1>
          <p className="text-muted-foreground">Você precisa ser um prestador para acessar esta página.</p>
        </div>
      </div>
    );
  }

  if (providerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <CreateProviderProfile
        userId={user.id}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/providers/me"] });
          setShowCreateProfile(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Olá, {user.name}!
              </h1>
              <p className="text-muted-foreground">
                Gerencie seus serviços e solicitações.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/service-management">
                <Button className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Gerenciar Serviços
                </Button>
              </Link>
              <Link href="/employee-management">
                <Button variant="outline" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Funcionários
                </Button>
              </Link>
              <Badge className={`px-3 py-1 rounded-full text-xs ${getProviderStatusColor(provider.status)}`}>
                {getProviderStatusText(provider.status)}
              </Badge>
              {provider.isTrialActive && (
                <Badge variant="secondary" className="text-xs">
                  Período de teste ativo
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Provider Status Alert */}
        {provider.status === "pending" && (
          <Card className="mb-8 border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                    Perfil em Análise
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Seu perfil está sendo analisado pela nossa equipe. Você será notificado quando for aprovado.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="dashboard-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ganhos do Mês</p>
                  <p className="text-2xl font-bold text-secondary">
                    {statsLoading ? <Skeleton className="h-8 w-20" /> : `R$ ${stats?.totalEarnings?.toFixed(2) || "0.00"}`}
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
                  <p className="text-sm font-medium text-muted-foreground">Serviços Concluídos</p>
                  <p className="text-2xl font-bold text-foreground">
                    {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.totalServices || 0}
                  </p>
                </div>
                <div className="bg-primary/10 p-3 rounded-full">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avaliação</p>
                  <p className="text-2xl font-bold text-foreground">
                    {statsLoading ? <Skeleton className="h-8 w-16" /> : (stats?.averageRating?.toFixed(1) || "0.0")}
                  </p>
                </div>
                <div className="bg-accent/10 p-3 rounded-full">
                  <Star className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Avaliações</p>
                  <p className="text-2xl font-bold text-foreground">
                    {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.totalReviews || 0}
                  </p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                  <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <TabsList className="grid w-full sm:w-auto grid-cols-3">
              <TabsTrigger value="requests">Solicitações</TabsTrigger>
              <TabsTrigger value="services">Meus Serviços</TabsTrigger>
              <TabsTrigger value="profile">Perfil</TabsTrigger>
            </TabsList>

            <Dialog open={isNewServiceOpen} onOpenChange={setIsNewServiceOpen}>
              <DialogTrigger asChild>
                <Button disabled={provider.status !== "approved"}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Serviço
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Serviço</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Serviço</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Instalação de torneira" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoria</FormLabel>
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
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preço por Hora (R$)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="50.00"
                              {...field}
                            />
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
                              placeholder="Descreva sua especialidade neste serviço..."
                              className="resize-none"
                              rows={4}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-2">
                      <Label>Imagens do Serviço (Opcional)</Label>
                      <ImageUpload
                        category="service"
                        onUpload={handleImageUpload}
                        onRemove={handleImageRemove}
                        currentImages={serviceImages.map(url => ({ id: url, url, name: '' }))}
                        multiple={true}
                        maxFiles={5}
                        accept="image/*"
                        maxSize={5}
                        disabled={addServiceMutation.isPending}
                        showPreview={true}
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsNewServiceOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={addServiceMutation.isPending}>
                        {addServiceMutation.isPending ? "Adicionando..." : "Adicionar Serviço"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <TabsContent value="requests" className="space-y-6">
            {/* Service Requests */}
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
                        <div className="flex gap-2">
                          <Skeleton className="h-9 w-20" />
                          <Skeleton className="h-9 w-20" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : serviceRequests?.length === 0 ? (
                <Card className="dashboard-card">
                  <CardContent className="p-12 text-center">
                    <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Nenhuma solicitação encontrada
                    </h3>
                    <p className="text-muted-foreground">
                      Quando clientes solicitarem seus serviços, eles aparecerão aqui.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                serviceRequests?.map((request: ServiceRequest & { client: any; category: ServiceCategory }) => (
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
                        
                        {request.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => rejectRequestMutation.mutate(request.id)}
                              disabled={rejectRequestMutation.isPending}
                            >
                              Recusar
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => acceptRequestMutation.mutate(request.id)}
                              disabled={acceptRequestMutation.isPending}
                            >
                              Aceitar
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      <div className="border-t pt-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-foreground">
                              {request.client.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{request.client.name}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              {request.client.phone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {request.client.phone}
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {request.client.email}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="services" className="space-y-6">
            {/* Provider Services */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {servicesLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <Card key={index} className="dashboard-card">
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-32 mb-2" />
                      <Skeleton className="h-4 w-20 mb-4" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4" />
                    </CardContent>
                  </Card>
                ))
              ) : providerServices?.length === 0 ? (
                <Card className="dashboard-card col-span-full">
                  <CardContent className="p-12 text-center">
                    <Settings className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Nenhum serviço cadastrado
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Adicione os serviços que você oferece para começar a receber solicitações.
                    </p>
                    <Button onClick={() => setIsNewServiceOpen(true)} disabled={provider.status !== "approved"}>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Primeiro Serviço
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                providerServices?.map((service: any) => (
                  <Card key={service.id} className="dashboard-card">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">{service.category.name}</h3>
                          <p className="text-lg font-bold text-secondary">
                            R$ {Number(service.price).toFixed(2)}/hora
                          </p>
                        </div>
                        <Badge variant={service.isActive ? "default" : "secondary"}>
                          {service.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {service.description}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            {/* Provider Profile */}
            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle>Informações do Perfil</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Nome</Label>
                    <p className="text-foreground">{user.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                    <p className="text-foreground">{user.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Telefone</Label>
                    <p className="text-foreground">{user.phone || "Não informado"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <div>
                      <Badge className={`px-3 py-1 rounded-full text-xs ${getProviderStatusColor(provider.status)}`}>
                        {getProviderStatusText(provider.status)}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Descrição</Label>
                  <p className="text-foreground">
                    {provider.description || "Nenhuma descrição informada"}
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Experiência</Label>
                  <p className="text-foreground">
                    {provider.experience || "Nenhuma experiência informada"}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Raio de Atendimento</Label>
                    <p className="text-foreground">{provider.serviceRadius || 10} km</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Preço Base</Label>
                    <p className="text-foreground">
                      R$ {Number(provider.basePrice || 0).toFixed(2)}/hora
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
