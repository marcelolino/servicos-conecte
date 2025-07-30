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
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ImageUpload from "@/components/image-upload";
import { ServiceChargingTypes } from "@/components/service-charging-types";
import { 
  Plus, 
  Search, 
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  MapPin,
  DollarSign,
  Clock,
  Users,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ServiceCategory, ProviderService } from "@shared/schema";

const serviceSchema = z.object({
  categoryId: z.number().min(1, "Categoria é obrigatória"),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
  price: z.string().min(1, "Preço é obrigatório"),
  serviceZone: z.string().min(1, "Zona de atendimento é obrigatória"),
  minimumPrice: z.string().optional(),
  estimatedDuration: z.string().optional(),
  requirements: z.string().optional(),
  isActive: z.boolean().default(true),
});

type ServiceForm = z.infer<typeof serviceSchema>;

interface ServiceWithCategory extends ProviderService {
  category: ServiceCategory;
}

export default function ServiceManagement() {
  const { user, loading: authLoading, isLoggingOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("list");
  const [isNewServiceOpen, setIsNewServiceOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedService, setSelectedService] = useState<ServiceWithCategory | null>(null);
  const [editingService, setEditingService] = useState<ServiceWithCategory | null>(null);
  const [isEditServiceOpen, setIsEditServiceOpen] = useState(false);
  const [serviceImages, setServiceImages] = useState<string[]>([]);
  const [editServiceImages, setEditServiceImages] = useState<string[]>([]);
  const [selectedServiceForCharging, setSelectedServiceForCharging] = useState<ServiceWithCategory | null>(null);

  const form = useForm<ServiceForm>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      categoryId: 0,
      name: "",
      description: "",
      price: "",
      serviceZone: "",
      minimumPrice: "",
      estimatedDuration: "",
      requirements: "",
      isActive: true,
    },
  });

  const editForm = useForm<ServiceForm>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      categoryId: 0,
      name: "",
      description: "",
      price: "",
      serviceZone: "",
      minimumPrice: "",
      estimatedDuration: "",
      requirements: "",
      isActive: true,
    },
  });

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Fetch provider services
  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ["/api/providers/services"],
    enabled: !!user,
  });

  // Fetch service requests
  const { data: serviceRequests, isLoading: requestsLoading } = useQuery({
    queryKey: ["/api/service-requests/provider"],
    enabled: user?.userType === "provider",
  });

  // Create service mutation
  const createServiceMutation = useMutation({
    mutationFn: (data: ServiceForm) => apiRequest("POST", "/api/services", data),
    onSuccess: () => {
      toast({
        title: "Serviço criado com sucesso!",
        description: "Seu novo serviço está disponível para solicitações.",
      });
      setIsNewServiceOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/providers/services"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar serviço",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update service status mutation
  const updateServiceMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ServiceForm> }) =>
      apiRequest("PUT", `/api/services/${id}`, data),
    onSuccess: () => {
      toast({
        title: "Serviço atualizado com sucesso!",
      });
      setIsEditServiceOpen(false);
      setEditingService(null);
      editForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/providers/services"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar serviço",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (imageUrl: string) => {
    setServiceImages(prev => [...prev, imageUrl]);
  };

  const handleImageRemove = (imageUrl: string) => {
    setServiceImages(prev => prev.filter(img => img !== imageUrl));
  };

  const handleEditImageUpload = (imageUrl: string) => {
    setEditServiceImages(prev => [...prev, imageUrl]);
  };

  const handleEditImageRemove = (imageUrl: string) => {
    setEditServiceImages(prev => prev.filter(img => img !== imageUrl));
  };

  const onSubmit = (data: ServiceForm) => {
    const serviceData = {
      ...data,
      images: serviceImages,
    };
    createServiceMutation.mutate(serviceData);
  };

  const onEditSubmit = (data: ServiceForm) => {
    if (editingService) {
      const serviceData = {
        ...data,
        images: editServiceImages,
      };
      updateServiceMutation.mutate({
        id: editingService.id,
        data: serviceData,
      });
    }
  };

  const handleEditService = (service: ServiceWithCategory) => {
    setEditingService(service);
    editForm.reset({
      categoryId: service.categoryId,
      name: service.description || "",
      description: service.description || "",
      price: service.price?.toString() || "",
      serviceZone: "Em todo o mundo",
      minimumPrice: service.price?.toString() || "",
      estimatedDuration: "",
      requirements: "",
      isActive: service.isActive || false,
    });
    setIsEditServiceOpen(true);
  };

  const toggleServiceStatus = (service: ServiceWithCategory) => {
    updateServiceMutation.mutate({
      id: service.id,
      data: { isActive: !service.isActive },
    });
  };

  // Filter services
  const filteredServices = services?.filter((service: ServiceWithCategory) => {
    const matchesSearch = service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.category?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || service.categoryId.toString() === filterCategory;
    const matchesStatus = filterStatus === "all" || 
                         (filterStatus === "active" && service.isActive) ||
                         (filterStatus === "inactive" && !service.isActive);
    return matchesSearch && matchesCategory && matchesStatus;
  }) || [];

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
        <CheckCircle className="h-3 w-3 mr-1" />
        Ativo
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
        <XCircle className="h-3 w-3 mr-1" />
        Inativo
      </Badge>
    );
  };

  const renderServiceList = () => (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gerenciamento de Serviços</h2>
          <p className="text-muted-foreground">Gerencie seus serviços disponíveis</p>
        </div>
        <Button onClick={() => setIsNewServiceOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Serviço
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar serviços..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Categorias</SelectItem>
            {categories?.map((category: ServiceCategory) => (
              <SelectItem key={category.id} value={category.id.toString()}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Services Table */}
      <Card>
        <CardContent className="p-0">
          {servicesLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[150px]" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SL</TableHead>
                  <TableHead>Nome do Serviço</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Zona de Atendimento</TableHead>
                  <TableHead>Preço Mínimo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {searchTerm || filterCategory !== "all" || filterStatus !== "all"
                          ? "Nenhum serviço encontrado com os filtros aplicados."
                          : "Nenhum serviço cadastrado ainda."}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredServices.map((service: ServiceWithCategory, index: number) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{service.description}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {service.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{service.category?.name}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Em todo o mundo</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            R$ {Number(service.price || 0).toFixed(2)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(service.isActive || false)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={service.isActive || false}
                            onCheckedChange={() => toggleServiceStatus(service)}
                          />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedService(service)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditService(service)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderServiceRequests = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Solicitações de Serviço</h2>
        <p className="text-muted-foreground">Gerencie as solicitações recebidas</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {requestsLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <Skeleton className="h-16 w-16" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[300px]" />
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[150px]" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SL</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Descrição do Serviço</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serviceRequests?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Nenhuma solicitação encontrada
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  serviceRequests?.map((request: any, index: number) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{request.category?.name}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{request.client?.name}</p>
                          <p className="text-sm text-muted-foreground">{request.client?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{request.title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {request.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{request.city || "Não informado"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            Ver Detalhes
                          </Button>
                          <Button size="sm">
                            Aceitar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderChargingTypesManagement = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Gerenciamento de Tipos de Cobrança</h2>
        <p className="text-muted-foreground">Configure diferentes formas de cobrança para seus serviços</p>
      </div>

      {selectedServiceForCharging ? (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setSelectedServiceForCharging(null)}
            >
              ← Voltar para Lista de Serviços
            </Button>
            <div>
              <h3 className="text-lg font-semibold">{selectedServiceForCharging.description}</h3>
              <p className="text-sm text-muted-foreground">
                Categoria: {selectedServiceForCharging.category?.name}
              </p>
            </div>
          </div>
          
          <ServiceChargingTypes 
            serviceId={selectedServiceForCharging.id} 
            serviceName={selectedServiceForCharging.description || "Serviço sem nome"} 
          />
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            {servicesLoading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <Skeleton className="h-16 w-16" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-[300px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Preço Mínimo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          Nenhum serviço cadastrado ainda.
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Vá para a aba "Lista de Serviços" para criar seus primeiros serviços.
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    services?.map((service: ServiceWithCategory) => (
                      <TableRow key={service.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{service.description}</p>
                            <p className="text-sm text-muted-foreground">
                              ID: {service.id}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{service.category?.name}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              R$ {Number(service.price || 0).toFixed(2)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(service.isActive || false)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => setSelectedServiceForCharging(service)}
                            disabled={!service.isActive}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Gerenciar Tipos
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Show loading while checking authentication or logging out
  if (authLoading || isLoggingOut) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{isLoggingOut ? "Saindo..." : "Carregando..."}</p>
        </div>
      </div>
    );
  }

  if (!user || user.userType !== "provider") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-4">Acesso Negado</h1>
          <p className="text-muted-foreground">Você precisa ser um prestador para acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 p-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">Lista de Serviços</TabsTrigger>
          <TabsTrigger value="requests">Solicitações</TabsTrigger>
          <TabsTrigger value="charging-types">Tipos de Cobrança</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          {renderServiceList()}
        </TabsContent>

        <TabsContent value="requests" className="space-y-6">
          {renderServiceRequests()}
        </TabsContent>

        <TabsContent value="charging-types" className="space-y-6">
          {renderChargingTypesManagement()}
        </TabsContent>
      </Tabs>

      {/* New Service Dialog */}
      <Dialog open={isNewServiceOpen} onOpenChange={setIsNewServiceOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Novo Serviço</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria *</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Escolha a categoria" />
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
                  name="serviceZone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zona de Atendimento *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Em todo o mundo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Serviço (Padrão) *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Instalação elétrica" {...field} />
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
                    <FormLabel>Descrição Breve (Padrão) *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva o serviço oferecido..."
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
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço Mínimo de Licitação *</FormLabel>
                      <FormControl>
                        <Input placeholder="0.00" type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estimatedDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duração Estimada</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 2-4 horas" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="requirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requisitos</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Requisitos específicos para este serviço..."
                        className="resize-none"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Service Images Upload */}
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
                  disabled={createServiceMutation.isPending}
                  showPreview={true}
                />
                <p className="text-sm text-muted-foreground">
                  Adicione até 5 imagens para mostrar exemplos do seu trabalho
                </p>
              </div>

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Serviço Ativo</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        O serviço estará disponível para solicitações
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsNewServiceOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createServiceMutation.isPending}>
                  {createServiceMutation.isPending ? "Criando..." : "Criar Serviço"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Service Dialog */}
      <Dialog open={isEditServiceOpen} onOpenChange={setIsEditServiceOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Serviço</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria *</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Escolha a categoria" />
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
                  control={editForm.control}
                  name="serviceZone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zona de Atendimento *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Em todo o mundo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Serviço (Padrão) *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Instalação elétrica" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição Breve (Padrão) *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva o serviço oferecido..."
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
                  control={editForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço Mínimo de Licitação *</FormLabel>
                      <FormControl>
                        <Input placeholder="0.00" type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="estimatedDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duração Estimada</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 2-4 horas" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="requirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requisitos</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Requisitos específicos para este serviço..."
                        className="resize-none"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Edit Service Images Upload */}
              <div className="space-y-2">
                <Label>Imagens do Serviço (Opcional)</Label>
                <ImageUpload
                  category="service"
                  onUpload={handleEditImageUpload}
                  onRemove={handleEditImageRemove}
                  currentImages={editServiceImages.map(url => ({ id: url, url, name: '' }))}
                  multiple={true}
                  maxFiles={5}
                  accept="image/*"
                  maxSize={5}
                  disabled={updateServiceMutation.isPending}
                  showPreview={true}
                />
                <p className="text-sm text-muted-foreground">
                  Atualize as imagens do seu serviço para mostrar exemplos do seu trabalho
                </p>
              </div>

              <FormField
                control={editForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Serviço Ativo</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        O serviço estará disponível para solicitações
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditServiceOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateServiceMutation.isPending}>
                  {updateServiceMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Service Details Modal */}
      {selectedService && (
        <Dialog open={!!selectedService} onOpenChange={() => setSelectedService(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Detalhes do Serviço</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Categoria</Label>
                <p className="text-sm text-muted-foreground">{selectedService.category?.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Descrição</Label>
                <p className="text-sm text-muted-foreground">{selectedService.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Preço</Label>
                  <p className="text-sm text-muted-foreground">
                    R$ {Number(selectedService.price || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedService.isActive || false)}
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}