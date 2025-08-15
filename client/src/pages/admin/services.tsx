import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Search, Plus, Edit, Trash2, MapPin, DollarSign, User, Star } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import { ModernAdminLayout } from "@/components/layout/modern-admin-layout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface Service {
  id: number;
  title: string;
  description: string;
  categoryId: number;
  providerId: number;
  basePrice: string;
  minPrice: string;
  maxPrice: string;
  pricingType: 'fixed' | 'hourly' | 'negotiable';
  serviceArea: string;
  isActive: boolean;
  createdAt: string;
  category: {
    id: number;
    name: string;
  };
  provider: {
    id: number;
    user: {
      name: string;
      email: string;
    };
  };
  _count?: {
    serviceRequests: number;
    reviews: number;
  };
  averageRating?: number;
}

interface Category {
  id: number;
  name: string;
}

interface Provider {
  id: number;
  userId: number;
  user: {
    name: string;
    email: string;
  };
}

const serviceSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
  categoryId: z.number().min(1, "Categoria é obrigatória"),
  providerId: z.number().min(1, "Prestador é obrigatório"),
  price: z.string().min(1, "Preço é obrigatório"),
  minimumPrice: z.string().optional(),
  estimatedDuration: z.string().optional(),
  requirements: z.string().optional(),
  serviceZone: z.string().optional(),
  isActive: z.boolean().default(true),
});

type ServiceForm = z.infer<typeof serviceSchema>;

export default function AdminServicesPage() {
  const { data: services, isLoading } = useQuery<Service[]>({
    queryKey: ["/api/admin/services"],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: providers } = useQuery<Provider[]>({
    queryKey: ["/api/admin/providers"],
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isNewServiceOpen, setIsNewServiceOpen] = useState(false);
  const [isEditServiceOpen, setIsEditServiceOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const toggleServiceStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      return apiRequest("PUT", `/api/admin/services/${id}/status`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/services"] });
      toast({
        title: "Status atualizado",
        description: "O status do serviço foi atualizado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao atualizar o status do serviço.",
        variant: "destructive",
      });
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/admin/services/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/services"] });
      toast({
        title: "Serviço excluído",
        description: "O serviço foi excluído com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao excluir o serviço.",
        variant: "destructive",
      });
    },
  });

  // Create service mutation
  const createServiceMutation = useMutation({
    mutationFn: (data: ServiceForm) => 
      apiRequest("POST", "/api/admin/services", data),
    onSuccess: () => {
      toast({
        title: "Serviço criado com sucesso!",
        description: "O novo serviço foi adicionado ao sistema.",
      });
      setIsNewServiceOpen(false);
      serviceForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/services"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar serviço",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update service mutation
  const updateServiceMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ServiceForm }) => 
      apiRequest("PUT", `/api/admin/services/${id}`, data),
    onSuccess: () => {
      toast({
        title: "Serviço atualizado com sucesso!",
        description: "As alterações foram salvas.",
      });
      setIsEditServiceOpen(false);
      setEditingService(null);
      editServiceForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/services"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar serviço",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleToggleStatus = (id: number, currentStatus: boolean) => {
    toggleServiceStatusMutation.mutate({ id, isActive: !currentStatus });
  };

  const handleDeleteService = (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir este serviço?")) {
      deleteServiceMutation.mutate(id);
    }
  };

  // Form setup
  const serviceForm = useForm<ServiceForm>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      description: "",
      categoryId: 0,
      providerId: 0,
      price: "",
      minimumPrice: "",
      estimatedDuration: "",
      requirements: "",
      serviceZone: "",
      isActive: true,
    },
  });

  const editServiceForm = useForm<ServiceForm>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      description: "",
      categoryId: 0,
      providerId: 0,
      price: "",
      minimumPrice: "",
      estimatedDuration: "",
      requirements: "",
      serviceZone: "",
      isActive: true,
    },
  });

  // Form submit handlers
  const onServiceSubmit = (data: ServiceForm) => {
    console.log('onServiceSubmit chamado com:', data);
    const serviceData = {
      name: data.name || "",
      description: data.description || "",
      categoryId: data.categoryId,
      providerId: data.providerId,
      price: data.price || "",
      minimumPrice: data.minimumPrice || "",
      estimatedDuration: data.estimatedDuration || "",
      requirements: data.requirements || "",
      serviceZone: data.serviceZone || "",
      isActive: data.isActive,
    };
    createServiceMutation.mutate(serviceData);
  };

  const onEditServiceSubmit = (data: ServiceForm) => {
    console.log('onEditServiceSubmit chamado com:', data);
    if (editingService) {
      const serviceData = {
        name: data.name || "",
        description: data.description || "",
        categoryId: data.categoryId,
        providerId: data.providerId,
        price: data.price || "",
        minimumPrice: data.minimumPrice || "",
        estimatedDuration: data.estimatedDuration || "",
        requirements: data.requirements || "",
        serviceZone: data.serviceZone || "",
        isActive: data.isActive,
      };
      updateServiceMutation.mutate({ id: editingService.id, data: serviceData });
    }
  };

  const handleEditService = (service: Service) => {
    console.log('handleEditService chamado com:', service);
    setEditingService(service);
    editServiceForm.reset({
      name: service.title || "",
      description: service.description || "",
      categoryId: service.categoryId || 0,
      providerId: service.providerId || 0,
      price: service.basePrice || "",
      minimumPrice: service.minPrice || "",
      estimatedDuration: "",
      requirements: "",
      serviceZone: service.serviceArea || "",
      isActive: service.isActive || false,
    });
    setIsEditServiceOpen(true);
  };

  const getPricingTypeText = (type: string) => {
    switch (type) {
      case 'fixed':
        return 'Preço Fixo';
      case 'hourly':
        return 'Por Hora';
      case 'negotiable':
        return 'Negociável';
      default:
        return type;
    }
  };

  const getPricingTypeColor = (type: string) => {
    switch (type) {
      case 'fixed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'hourly':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'negotiable':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  };

  // Filter services
  const filteredServices = services?.filter(service => {
    const matchesSearch = service.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.provider?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.category?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || service.categoryId?.toString() === selectedCategory;
    const matchesStatus = selectedStatus === "all" || 
                         (selectedStatus === "active" && service.isActive) ||
                         (selectedStatus === "inactive" && !service.isActive);
    
    return matchesSearch && matchesCategory && matchesStatus;
  }) || [];

  if (isLoading) {
    return (
      <ModernAdminLayout>
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </ModernAdminLayout>
    );
  }

  const totalServices = services?.length || 0;
  const activeServices = services?.filter(s => s.isActive).length || 0;
  const inactiveServices = totalServices - activeServices;
  const totalRequests = services?.reduce((sum, service) => sum + (service._count?.serviceRequests || 0), 0) || 0;

  return (
    <ModernAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gerenciamento de Serviços</h1>
            <p className="text-muted-foreground mt-1">
              Todos os serviços oferecidos pelos prestadores
            </p>
          </div>
          <Dialog open={isNewServiceOpen} onOpenChange={setIsNewServiceOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Serviço
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Serviço</DialogTitle>
                <DialogDescription>
                  Adicione um novo serviço ao sistema
                </DialogDescription>
              </DialogHeader>
              <Form {...serviceForm}>
                <form onSubmit={serviceForm.handleSubmit(onServiceSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={serviceForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Serviço</FormLabel>
                          <FormControl>
                            <Input placeholder="Digite o nome do serviço" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={serviceForm.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoria</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma categoria" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories?.map((category) => (
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
                  </div>
                  <FormField
                    control={serviceForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Descreva o serviço..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={serviceForm.control}
                      name="providerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prestador</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um prestador" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {providers?.map((provider) => (
                                <SelectItem key={provider.id} value={provider.id.toString()}>
                                  {provider.user.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={serviceForm.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preço Base</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: 50.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={serviceForm.control}
                      name="minimumPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preço Mínimo</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: 30.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={serviceForm.control}
                      name="serviceZone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zona de Atendimento</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Zona Sul" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsNewServiceOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      Criar Serviço
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Serviços</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalServices}</div>
              <p className="text-xs text-muted-foreground">
                Serviços cadastrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Serviços Ativos</CardTitle>
              <Star className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeServices}</div>
              <p className="text-xs text-muted-foreground">
                Disponíveis para contratação
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Serviços Inativos</CardTitle>
              <Star className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{inactiveServices}</div>
              <p className="text-xs text-muted-foreground">
                Desabilitados temporariamente
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Solicitações</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{totalRequests}</div>
              <p className="text-xs text-muted-foreground">
                Solicitações de serviços
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar serviços..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Todas as Categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Categorias</SelectItem>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              Mostrando {filteredServices.length} de {totalServices} serviços
            </div>
          </CardContent>
        </Card>

        {/* Services Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Serviços</CardTitle>
            <CardDescription>
              Gerencie todos os serviços oferecidos na plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredServices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum serviço encontrado
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SL</TableHead>
                    <TableHead>Nome do Serviço</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Prestador</TableHead>
                    <TableHead>Zona de Atendimento</TableHead>
                    <TableHead>Preço Mínimo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.map((service, index) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{service.title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {service.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{service.category?.name || "Sem categoria"}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{service.provider?.user?.name || "Prestador não encontrado"}</p>
                          <p className="text-sm text-muted-foreground">
                            {service.provider?.user?.email || "Email não disponível"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">
                            {service.serviceArea || "Não especificado"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold">R$ {parseFloat(service.minPrice || "0").toFixed(2)}</p>
                          <Badge className={getPricingTypeColor(service.pricingType)} variant="outline">
                            {getPricingTypeText(service.pricingType)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(service.isActive)}>
                          {service.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(service.id, service.isActive)}
                          >
                            {service.isActive ? "Desativar" : "Ativar"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditService(service)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteService(service.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit Service Dialog */}
        <Dialog open={isEditServiceOpen} onOpenChange={setIsEditServiceOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Serviço</DialogTitle>
              <DialogDescription>
                Edite as informações do serviço
              </DialogDescription>
            </DialogHeader>
            <Form {...editServiceForm}>
              <form onSubmit={editServiceForm.handleSubmit(onEditServiceSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editServiceForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Serviço</FormLabel>
                        <FormControl>
                          <Input placeholder="Digite o nome do serviço" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editServiceForm.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories?.map((category) => (
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
                </div>
                <FormField
                  control={editServiceForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Descreva o serviço..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editServiceForm.control}
                    name="providerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prestador</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um prestador" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {providers?.map((provider) => (
                              <SelectItem key={provider.id} value={provider.id.toString()}>
                                {provider.user.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editServiceForm.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço Base</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: 50.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editServiceForm.control}
                    name="minimumPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço Mínimo</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: 30.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editServiceForm.control}
                    name="serviceZone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zona de Atendimento</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Zona Sul" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditServiceOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    Salvar Alterações
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </ModernAdminLayout>
  );
}