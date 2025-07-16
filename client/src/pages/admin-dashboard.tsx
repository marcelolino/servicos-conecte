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
import ImageUpload from "@/components/image-upload";
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
  Shield,
  Home,
  BarChart3,
  FileText,
  Star,
  MapPin,
  Calendar,
  Cog,
  ImageIcon,
  Upload,
  Download,
  Trash2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { ServiceCategory, User, Provider } from "@shared/schema";

const categorySchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
  icon: z.string().optional(),
  imageUrl: z.string().optional(),
  color: z.string().optional(),
});

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

type CategoryForm = z.infer<typeof categorySchema>;
type ServiceForm = z.infer<typeof serviceSchema>;

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [isNewCategoryOpen, setIsNewCategoryOpen] = useState(false);
  const [isNewServiceOpen, setIsNewServiceOpen] = useState(false);
  const [isEditServiceOpen, setIsEditServiceOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<(Provider & { user: User }) | null>(null);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [editingService, setEditingService] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userFilterType, setUserFilterType] = useState<string>("all");
  const [serviceSearchTerm, setServiceSearchTerm] = useState("");
  const [serviceFilterStatus, setServiceFilterStatus] = useState<string>("all");
  const [serviceFilterCategory, setServiceFilterCategory] = useState<string>("all");
  const [bookingSearchTerm, setBookingSearchTerm] = useState("");
  const [bookingFilterStatus, setBookingFilterStatus] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [categoryImage, setCategoryImage] = useState<string>("");
  const [serviceImages, setServiceImages] = useState<string[]>([]);
  const [companySettings, setCompanySettings] = useState({
    name: "",
    description: "",
    address: "",
    city: "",
    state: "",
    cep: "",
    phone: "",
    email: "",
    website: "",
    logo: "",
    primaryColor: "#3B82F6",
    secondaryColor: "#6B7280",
    currency: "BRL",
    timezone: "America/Sao_Paulo",
    workingHours: {
      monday: { start: "08:00", end: "18:00", active: true },
      tuesday: { start: "08:00", end: "18:00", active: true },
      wednesday: { start: "08:00", end: "18:00", active: true },
      thursday: { start: "08:00", end: "18:00", active: true },
      friday: { start: "08:00", end: "18:00", active: true },
      saturday: { start: "08:00", end: "12:00", active: true },
      sunday: { start: "08:00", end: "12:00", active: false },
    },
    features: {
      emailNotifications: true,
      smsNotifications: false,
      automaticApproval: false,
      requireVerification: true,
      allowCancellation: true,
      allowReschedule: true,
    },
    paymentMethods: {
      creditCard: true,
      debitCard: true,
      pix: true,
      cash: true,
      bankTransfer: false,
    },
    commissionRate: 5,
    cancellationPolicy: "24",
    reschedulePolicy: "12",
  });

  const form = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      icon: "",
      imageUrl: "",
      color: "",
    },
  });

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

  // Fetch users
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: user?.userType === "admin",
  });

  // Fetch all services for admin
  const { data: allServices, isLoading: allServicesLoading } = useQuery({
    queryKey: ["/api/admin/services"],
    enabled: user?.userType === "admin",
  });

  // Fetch all bookings for admin
  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ["/api/admin/bookings"],
    enabled: user?.userType === "admin",
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: (data: CategoryForm) => apiRequest("POST", "/api/categories", {
      ...data,
      imageUrl: categoryImage,
    }),
    onSuccess: () => {
      toast({
        title: "Categoria criada com sucesso!",
        description: "A nova categoria está disponível para os prestadores.",
      });
      setIsNewCategoryOpen(false);
      form.reset();
      setCategoryImage("");
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

  // Create service mutation
  const createServiceMutation = useMutation({
    mutationFn: (data: ServiceForm) => 
      apiRequest("POST", "/api/admin/services", {
        ...data,
        images: JSON.stringify(serviceImages),
      }),
    onSuccess: () => {
      toast({
        title: "Serviço criado com sucesso!",
        description: "O novo serviço foi adicionado ao sistema.",
      });
      setIsNewServiceOpen(false);
      serviceForm.reset();
      setServiceImages([]);
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

  // Delete service mutation
  const deleteServiceMutation = useMutation({
    mutationFn: (serviceId: number) => 
      apiRequest("DELETE", `/api/admin/services/${serviceId}`, {}),
    onSuccess: () => {
      toast({
        title: "Serviço removido",
        description: "O serviço foi removido do sistema.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/services"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover serviço",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Image handling functions
  const handleCategoryImageUpload = (imageUrl: string) => {
    setCategoryImage(imageUrl);
  };

  const handleCategoryImageRemove = () => {
    setCategoryImage("");
  };

  // Service image handling functions
  const handleServiceImageUpload = (imageUrl: string) => {
    setServiceImages(prev => [...prev, imageUrl]);
  };

  const handleServiceImageRemove = (imageUrl: string) => {
    setServiceImages(prev => prev.filter(img => img !== imageUrl));
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

  const getBookingStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendente";
      case "accepted":
        return "Aceito";
      case "in_progress":
        return "Em Andamento";
      case "completed":
        return "Concluído";
      case "cancelled":
        return "Cancelado";
      default:
        return "Desconhecido";
    }
  };

  const getBookingStatusVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "accepted":
        return "default";
      case "in_progress":
        return "default";
      case "completed":
        return "default";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getUserTypeText = (userType: string) => {
    switch (userType) {
      case "client":
        return "Cliente";
      case "provider":
        return "Prestador";
      case "admin":
        return "Administrador";
      default:
        return "Cliente";
    }
  };

  const getUserTypeBadgeColor = (userType: string) => {
    switch (userType) {
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "provider":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "client":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const onSubmit = (data: CategoryForm) => {
    createCategoryMutation.mutate(data);
  };

  const onServiceSubmit = (data: ServiceForm) => {
    const serviceData = {
      name: data.name || "",
      description: data.description || "",
      categoryId: data.categoryId,
      providerId: data.providerId,
      price: data.price ? data.price : null,
      minimumPrice: data.minimumPrice ? data.minimumPrice : null,
      estimatedDuration: data.estimatedDuration || null,
      requirements: data.requirements || null,
      serviceZone: data.serviceZone || null,
      isActive: data.isActive ?? true,
    };
    createServiceMutation.mutate(serviceData);
  };

  const onEditServiceSubmit = (data: ServiceForm) => {
    if (editingService) {
      const serviceData = {
        name: data.name || "",
        description: data.description || "",
        categoryId: data.categoryId,
        providerId: data.providerId,
        price: data.price ? data.price : null,
        minimumPrice: data.minimumPrice ? data.minimumPrice : null,
        estimatedDuration: data.estimatedDuration || null,
        requirements: data.requirements || null,
        serviceZone: data.serviceZone || null,
        isActive: data.isActive ?? true,
      };
      updateServiceMutation.mutate({ id: editingService.id, data: serviceData });
    }
  };

  const handleEditService = (service: any) => {
    setEditingService(service);
    editServiceForm.reset({
      name: service.name || "",
      description: service.description || "",
      categoryId: service.categoryId || 0,
      providerId: service.providerId || 0,
      price: service.price || "",
      minimumPrice: service.minimumPrice || "",
      estimatedDuration: service.estimatedDuration || "",
      requirements: service.requirements || "",
      serviceZone: service.serviceZone || "",
      isActive: service.isActive ?? true,
    });
    setIsEditServiceOpen(true);
  };

  const handleDeleteService = (serviceId: number) => {
    if (confirm("Tem certeza que deseja remover este serviço?")) {
      deleteServiceMutation.mutate(serviceId);
    }
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

  // Filter providers based on search and status
  const filteredProviders = providers?.filter((provider: Provider & { user: User }) => {
    const matchesSearch = provider.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         provider.user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || provider.status === filterStatus;
    return matchesSearch && matchesStatus;
  }) || [];

  // Filter users based on search and type
  const filteredUsers = users?.filter((user: User) => {
    const matchesSearch = user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(userSearchTerm.toLowerCase());
    const matchesType = userFilterType === "all" || user.userType === userFilterType;
    return matchesSearch && matchesType;
  }) || [];

  // Filter services based on search, status, and category
  const filteredServices = allServices?.filter((service: any) => {
    const matchesSearch = service.name?.toLowerCase().includes(serviceSearchTerm.toLowerCase()) ||
                         service.description?.toLowerCase().includes(serviceSearchTerm.toLowerCase()) ||
                         service.provider?.user?.name?.toLowerCase().includes(serviceSearchTerm.toLowerCase());
    const matchesStatus = serviceFilterStatus === "all" || 
                         (serviceFilterStatus === "active" && service.isActive) ||
                         (serviceFilterStatus === "inactive" && !service.isActive);
    const matchesCategory = serviceFilterCategory === "all" || 
                           service.categoryId?.toString() === serviceFilterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  }) || [];

  // Filter bookings based on search and status
  const filteredBookings = bookings?.filter((booking: any) => {
    const matchesSearch = booking.title?.toLowerCase().includes(bookingSearchTerm.toLowerCase()) ||
                         booking.client?.name?.toLowerCase().includes(bookingSearchTerm.toLowerCase()) ||
                         booking.provider?.user?.name?.toLowerCase().includes(bookingSearchTerm.toLowerCase());
    const matchesStatus = bookingFilterStatus === "all" || booking.status === bookingFilterStatus;
    return matchesSearch && matchesStatus;
  }) || [];

  const sidebarItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: BarChart3,
      description: "Visão geral do sistema"
    },
    {
      id: "providers",
      label: "Prestadores",
      icon: UserCheck,
      description: "Gerenciar prestadores",
      badge: stats?.pendingApprovals
    },
    {
      id: "services",
      label: "Serviços",
      icon: Settings,
      description: "Gerenciar serviços"
    },
    {
      id: "bookings",
      label: "Agendamentos",
      icon: Calendar,
      description: "Gerenciar reservas"
    },
    {
      id: "categories",
      label: "Categorias",
      icon: FileText,
      description: "Categorias de serviços"
    },
    {
      id: "media",
      label: "Mídia",
      icon: ImageIcon,
      description: "Gerenciar imagens"
    },
    {
      id: "users",
      label: "Usuários",
      icon: Users,
      description: "Gerenciar usuários"
    },
    {
      id: "reports",
      label: "Relatórios",
      icon: BarChart3,
      description: "Relatórios e estatísticas"
    },
    {
      id: "settings",
      label: "Configurações",
      icon: Cog,
      description: "Configurações do sistema"
    }
  ];

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
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

      {/* Charts and Recent Activity */}
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
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  <span className="font-semibold text-foreground">
                    {statsLoading ? <Skeleton className="h-4 w-12" /> : "4.8"}
                  </span>
                </div>
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
                <span className="text-xs text-muted-foreground ml-auto">2min</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm text-muted-foreground">
                  Serviço concluído
                </span>
                <span className="text-xs text-muted-foreground ml-auto">5min</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <span className="text-sm text-muted-foreground">
                  Nova avaliação recebida
                </span>
                <span className="text-xs text-muted-foreground ml-auto">10min</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderProviders = () => (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestão de Prestadores</h2>
          <p className="text-muted-foreground">Gerencie e aprove prestadores de serviços</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar prestadores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="approved">Aprovado</SelectItem>
              <SelectItem value="rejected">Rejeitado</SelectItem>
              <SelectItem value="suspended">Suspenso</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Providers Table */}
      <Card className="dashboard-card">
        <CardContent className="p-0">
          {providersLoading ? (
            <div className="space-y-4 p-6">
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
          ) : filteredProviders.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchTerm || filterStatus !== "all" ? "Nenhum prestador encontrado" : "Nenhum prestador cadastrado"}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm || filterStatus !== "all" 
                  ? "Tente ajustar os filtros de busca"
                  : "Aguarde novos prestadores se cadastrarem na plataforma"
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prestador</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Avaliação</TableHead>
                  <TableHead>Experiência</TableHead>
                  <TableHead>Data de Cadastro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProviders.map((provider: Provider & { user: User }) => (
                  <TableRow key={provider.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {provider.user.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{provider.user.name}</div>
                          <div className="text-sm text-muted-foreground">ID: {provider.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">{provider.user.email}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {provider.user.city || "Não informado"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getProviderStatusColor(provider.status)}>
                        {getProviderStatusText(provider.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm font-medium">
                          {provider.rating && typeof provider.rating === 'number' ? provider.rating.toFixed(1) : "N/A"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({provider.totalReviews || 0})
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {provider.experience ? `${provider.experience} anos` : "Não informado"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(provider.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedProvider(provider)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          {provider.status === "pending" && (
                            <>
                              <DropdownMenuItem 
                                onClick={() => approveProviderMutation.mutate(provider.id)}
                                disabled={approveProviderMutation.isPending}
                              >
                                <UserCheck className="mr-2 h-4 w-4" />
                                Aprovar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => rejectProviderMutation.mutate(provider.id)}
                                disabled={rejectProviderMutation.isPending}
                                className="text-red-600"
                              >
                                <UserX className="mr-2 h-4 w-4" />
                                Rejeitar
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestão de Usuários</h2>
          <p className="text-muted-foreground">Gerencie todos os usuários da plataforma</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuários..."
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Select value={userFilterType} onValueChange={setUserFilterType}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="client">Clientes</SelectItem>
              <SelectItem value="provider">Prestadores</SelectItem>
              <SelectItem value="admin">Administradores</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Users Table */}
      <Card className="dashboard-card">
        <CardContent className="p-0">
          {usersLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
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
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {userSearchTerm || userFilterType !== "all" 
                          ? "Nenhum usuário encontrado com os filtros aplicados."
                          : "Nenhum usuário cadastrado."}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user: User) => (
                    <TableRow key={user.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="text-sm">
                              {user.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">{user.name}</p>
                            <p className="text-sm text-muted-foreground">ID: {user.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <Badge className={getUserTypeBadgeColor(user.userType)}>
                          {getUserTypeText(user.userType)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.phone || "Não informado"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.city || "Não informado"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? "default" : "secondary"}>
                          {user.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(user.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            {user.isActive ? (
                              <DropdownMenuItem className="text-yellow-600">
                                <UserX className="h-4 w-4 mr-2" />
                                Desativar
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem className="text-green-600">
                                <UserCheck className="h-4 w-4 mr-2" />
                                Ativar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      {!usersLoading && filteredUsers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="dashboard-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Usuários</p>
                  <p className="text-2xl font-bold text-foreground">{filteredUsers.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="dashboard-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Clientes</p>
                  <p className="text-2xl font-bold text-foreground">
                    {filteredUsers.filter(u => u.userType === 'client').length}
                  </p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Prestadores</p>
                  <p className="text-2xl font-bold text-foreground">
                    {filteredUsers.filter(u => u.userType === 'provider').length}
                  </p>
                </div>
                <UserCheck className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Administradores</p>
                  <p className="text-2xl font-bold text-foreground">
                    {filteredUsers.filter(u => u.userType === 'admin').length}
                  </p>
                </div>
                <Shield className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

  const renderCategories = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Categorias de Serviços</h2>
          <p className="text-muted-foreground">Gerencie as categorias disponíveis na plataforma</p>
        </div>
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

                <div className="space-y-2">
                  <Label>Imagem da Categoria (Opcional)</Label>
                  <ImageUpload
                    category="category"
                    onUpload={handleCategoryImageUpload}
                    onRemove={handleCategoryImageRemove}
                    currentImages={categoryImage ? [{ id: categoryImage, url: categoryImage, name: '' }] : []}
                    multiple={false}
                    maxFiles={1}
                    accept="image/*"
                    maxSize={5}
                    disabled={createCategoryMutation.isPending}
                    showPreview={true}
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

      <Card className="dashboard-card">
        <CardContent className="p-6">
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
                <div key={category.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  {category.imageUrl && (
                    <div className="mb-3 rounded-lg overflow-hidden bg-muted">
                      <img
                        src={category.imageUrl}
                        alt={category.name}
                        className="w-full h-32 object-cover"
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-foreground">{category.name}</h3>
                    <Badge variant={category.isActive ? "default" : "secondary"}>
                      {category.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {category.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>ID: {category.id}</span>
                    <span>{new Date(category.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderServices = () => (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gerenciamento de Serviços</h2>
          <p className="text-muted-foreground">Todos os serviços oferecidos pelos prestadores</p>
        </div>
        <Button onClick={() => setIsNewServiceOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Serviço
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar serviços..."
            value={serviceSearchTerm}
            onChange={(e) => setServiceSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={serviceFilterCategory} onValueChange={setServiceFilterCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Categorias</SelectItem>
            {categories?.map((category: ServiceCategory) => (
              <SelectItem key={category.id} value={category.id.toString()}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={serviceFilterStatus} onValueChange={setServiceFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Services Table */}
      <Card className="dashboard-card">
        <CardContent className="p-0">
          {allServicesLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 8 }).map((_, index) => (
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
                  <TableHead>Prestador</TableHead>
                  <TableHead>Zona de Atendimento</TableHead>
                  <TableHead>Preço Mínimo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {serviceSearchTerm || serviceFilterStatus !== "all" || serviceFilterCategory !== "all"
                          ? "Nenhum serviço encontrado com os filtros aplicados."
                          : "Nenhum serviço cadastrado ainda."}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredServices?.map((service: any, index: number) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{service.name || service.category?.name}</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {service.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{service.category?.name}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{service.provider?.user?.name}</p>
                          <p className="text-xs text-muted-foreground">{service.provider?.user?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{service.serviceZone || "Não especificado"}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            R$ {Number(service.minimumPrice || service.price || 0).toFixed(2)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={service.isActive ? "default" : "secondary"}>
                          {service.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
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
                              <Settings className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteService(service.id)}
                              className="text-red-600"
                            >
                              <AlertCircle className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* New Service Dialog */}
      <Dialog open={isNewServiceOpen} onOpenChange={setIsNewServiceOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Serviço</DialogTitle>
          </DialogHeader>
          <Form {...serviceForm}>
            <form onSubmit={serviceForm.handleSubmit(onServiceSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={serviceForm.control}
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
                  control={serviceForm.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <FormControl>
                        <Select value={field.value?.toString()} onValueChange={(value) => field.onChange(parseInt(value))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories?.map((category: ServiceCategory) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={serviceForm.control}
                name="providerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prestador</FormLabel>
                    <FormControl>
                      <Select value={field.value?.toString()} onValueChange={(value) => field.onChange(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o prestador" />
                        </SelectTrigger>
                        <SelectContent>
                          {providers?.map((provider: any) => (
                            <SelectItem key={provider.id} value={provider.id.toString()}>
                              {provider.user?.name} - {provider.user?.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={serviceForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Descreva o serviço em detalhes..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={serviceForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço</FormLabel>
                      <FormControl>
                        <Input placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={serviceForm.control}
                  name="minimumPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço Mínimo</FormLabel>
                      <FormControl>
                        <Input placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={serviceForm.control}
                  name="estimatedDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duração Estimada</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 2 horas" {...field} />
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

              <FormField
                control={serviceForm.control}
                name="requirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requisitos</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Requisitos especiais para o serviço..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <Label>Imagens do Serviço (Opcional)</Label>
                <ImageUpload
                  category="service"
                  onUpload={handleServiceImageUpload}
                  onRemove={handleServiceImageRemove}
                  currentImages={serviceImages.map((url, index) => ({ 
                    id: url, 
                    url, 
                    name: `Serviço ${index + 1}` 
                  }))}
                  multiple={true}
                  maxFiles={5}
                  accept="image/*"
                  maxSize={5}
                  disabled={createServiceMutation.isPending}
                  showPreview={true}
                />
                <p className="text-sm text-muted-foreground">
                  Adicione até 5 imagens para ilustrar o serviço.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2">
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Serviço</DialogTitle>
          </DialogHeader>
          <Form {...editServiceForm}>
            <form onSubmit={editServiceForm.handleSubmit(onEditServiceSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editServiceForm.control}
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
                  control={editServiceForm.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <FormControl>
                        <Select value={field.value?.toString()} onValueChange={(value) => field.onChange(parseInt(value))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories?.map((category: ServiceCategory) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={editServiceForm.control}
                name="providerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prestador</FormLabel>
                    <FormControl>
                      <Select value={field.value?.toString()} onValueChange={(value) => field.onChange(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o prestador" />
                        </SelectTrigger>
                        <SelectContent>
                          {providers?.map((provider: any) => (
                            <SelectItem key={provider.id} value={provider.id.toString()}>
                              {provider.user?.name} - {provider.user?.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editServiceForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Descreva o serviço em detalhes..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editServiceForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço</FormLabel>
                      <FormControl>
                        <Input placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editServiceForm.control}
                  name="minimumPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço Mínimo</FormLabel>
                      <FormControl>
                        <Input placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editServiceForm.control}
                  name="estimatedDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duração Estimada</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 2 horas" {...field} />
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

              <FormField
                control={editServiceForm.control}
                name="requirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requisitos</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Requisitos especiais para o serviço..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-end gap-2">
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
    </div>
  );

  const renderBookings = () => (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gerenciamento de Agendamentos</h2>
          <p className="text-muted-foreground">Todas as reservas e agendamentos de serviços</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar agendamentos..."
            value={bookingSearchTerm}
            onChange={(e) => setBookingSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={bookingFilterStatus} onValueChange={setBookingFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="accepted">Aceito</SelectItem>
            <SelectItem value="in_progress">Em Andamento</SelectItem>
            <SelectItem value="completed">Concluído</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bookings Table */}
      <Card className="dashboard-card">
        <CardContent className="p-0">
          {bookingsLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 8 }).map((_, index) => (
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
                  <TableHead>ID</TableHead>
                  <TableHead>Data da Reserva</TableHead>
                  <TableHead>Onde o serviço será prestado</TableHead>
                  <TableHead>Data do Agendamento</TableHead>
                  <TableHead>Informações do Cliente</TableHead>
                  <TableHead>Informações do Prestador</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {bookingSearchTerm || bookingFilterStatus !== "all"
                          ? "Nenhum agendamento encontrado com os filtros aplicados."
                          : "Nenhum agendamento cadastrado ainda."}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBookings?.map((booking: any, index: number) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">{booking.id}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString('pt-BR') : "-"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {booking.createdAt ? new Date(booking.createdAt).toLocaleTimeString('pt-BR') : "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm max-w-xs">
                          <p className="font-medium">{booking.address}</p>
                          <p className="text-muted-foreground">{booking.city}, {booking.state}</p>
                          <p className="text-muted-foreground">CEP: {booking.cep}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {booking.scheduledAt ? new Date(booking.scheduledAt).toLocaleDateString('pt-BR') : "A agendar"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {booking.scheduledAt ? new Date(booking.scheduledAt).toLocaleTimeString('pt-BR') : "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium">{booking.client?.name || "N/A"}</p>
                          <p className="text-muted-foreground">{booking.client?.email || "N/A"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium">{booking.provider?.user?.name || "Não atribuído"}</p>
                          <p className="text-muted-foreground">{booking.provider?.user?.email || "N/A"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            R$ {Number(booking.finalPrice || booking.estimatedPrice || 0).toFixed(2)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getBookingStatusVariant(booking.status)}>
                          {getBookingStatusText(booking.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedBooking(booking)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Calendar className="h-4 w-4 mr-2" />
                              Reagendar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <AlertCircle className="h-4 w-4 mr-2" />
                              Cancelar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Booking Details Dialog */}
      {selectedBooking && (
        <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Agendamento #{selectedBooking.id}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Serviço</Label>
                  <p className="text-sm text-muted-foreground">{selectedBooking.title}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Categoria</Label>
                  <p className="text-sm text-muted-foreground">{selectedBooking.category?.name || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Cliente</Label>
                  <p className="text-sm text-muted-foreground">{selectedBooking.client?.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Prestador</Label>
                  <p className="text-sm text-muted-foreground">{selectedBooking.provider?.user?.name || "Não atribuído"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant={getBookingStatusVariant(selectedBooking.status)}>
                    {getBookingStatusText(selectedBooking.status)}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Valor</Label>
                  <p className="text-sm text-muted-foreground">
                    R$ {Number(selectedBooking.finalPrice || selectedBooking.estimatedPrice || 0).toFixed(2)}
                  </p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Endereço</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedBooking.address}, {selectedBooking.city}, {selectedBooking.state} - CEP: {selectedBooking.cep}
                </p>
              </div>

              {selectedBooking.description && (
                <div>
                  <Label className="text-sm font-medium">Descrição</Label>
                  <p className="text-sm text-muted-foreground">{selectedBooking.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Data de Criação</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedBooking.createdAt ? new Date(selectedBooking.createdAt).toLocaleString('pt-BR') : "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Data Agendada</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedBooking.scheduledAt ? new Date(selectedBooking.scheduledAt).toLocaleString('pt-BR') : "A agendar"}
                  </p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );

  const renderMedia = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gerenciamento de Mídia</h2>
          <p className="text-muted-foreground">Gerencie todas as imagens do sistema</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Upload em Massa
          </Button>
        </div>
      </div>

      {/* Upload Area */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Upload de Imagens
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUpload
            category="general"
            onUpload={(imageUrl) => {
              toast({
                title: "Imagem enviada com sucesso!",
                description: "A imagem foi processada e está disponível no sistema.",
              });
            }}
            onRemove={() => {}}
            currentImages={[]}
            multiple={true}
            maxFiles={10}
            accept="image/*"
            maxSize={10}
            showPreview={true}
          />
        </CardContent>
      </Card>

      {/* Image Categories */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="dashboard-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Categorias</h3>
              <Badge variant="secondary">{categories?.length || 0}</Badge>
            </div>
            <div className="space-y-2">
              {categories?.slice(0, 3).map((category: ServiceCategory) => (
                <div key={category.id} className="flex items-center gap-2">
                  {category.imageUrl ? (
                    <img
                      src={category.imageUrl}
                      alt={category.name}
                      className="w-8 h-8 rounded object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <span className="text-sm truncate">{category.name}</span>
                </div>
              ))}
              {(categories?.length || 0) > 3 && (
                <p className="text-xs text-muted-foreground">
                  +{(categories?.length || 0) - 3} mais
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Serviços</h3>
              <Badge variant="secondary">{allServices?.length || 0}</Badge>
            </div>
            <div className="space-y-2">
              {allServices?.slice(0, 3).map((service: any) => {
                const images = service.images ? JSON.parse(service.images) : [];
                return (
                  <div key={service.id} className="flex items-center gap-2">
                    {images.length > 0 ? (
                      <img
                        src={images[0]}
                        alt={service.name}
                        className="w-8 h-8 rounded object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <span className="text-sm truncate">{service.name}</span>
                  </div>
                );
              })}
              {(allServices?.length || 0) > 3 && (
                <p className="text-xs text-muted-foreground">
                  +{(allServices?.length || 0) - 3} mais
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Prestadores</h3>
              <Badge variant="secondary">{providers?.length || 0}</Badge>
            </div>
            <div className="space-y-2">
              {providers?.slice(0, 3).map((provider: any) => {
                const images = provider.portfolioImages ? JSON.parse(provider.portfolioImages) : [];
                return (
                  <div key={provider.id} className="flex items-center gap-2">
                    {images.length > 0 ? (
                      <img
                        src={images[0]}
                        alt={provider.user?.name}
                        className="w-8 h-8 rounded object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <span className="text-sm truncate">{provider.user?.name}</span>
                  </div>
                );
              })}
              {(providers?.length || 0) > 3 && (
                <p className="text-xs text-muted-foreground">
                  +{(providers?.length || 0) - 3} mais
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Estatísticas</h3>
              <Badge variant="outline">Resumo</Badge>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total de Imagens</span>
                <span className="font-medium">
                  {(categories?.filter(c => c.imageUrl).length || 0) + 
                   (allServices?.reduce((acc: number, service: any) => {
                     const images = service.images ? JSON.parse(service.images) : [];
                     return acc + images.length;
                   }, 0) || 0) + 
                   (providers?.reduce((acc: number, provider: any) => {
                     const images = provider.portfolioImages ? JSON.parse(provider.portfolioImages) : [];
                     return acc + images.length;
                   }, 0) || 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Categorias c/ Imagem</span>
                <span className="font-medium">{categories?.filter(c => c.imageUrl).length || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Serviços c/ Imagem</span>
                <span className="font-medium">
                  {allServices?.filter((service: any) => {
                    const images = service.images ? JSON.parse(service.images) : [];
                    return images.length > 0;
                  }).length || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Storage Management */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle>Gestão de Armazenamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <Upload className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <h4 className="font-semibold mb-1">Upload</h4>
              <p className="text-sm text-muted-foreground">
                Envie novas imagens para o sistema
              </p>
            </div>
            <div className="text-center">
              <ImageIcon className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <h4 className="font-semibold mb-1">Otimização</h4>
              <p className="text-sm text-muted-foreground">
                Imagens são automaticamente otimizadas
              </p>
            </div>
            <div className="text-center">
              <Trash2 className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <h4 className="font-semibold mb-1">Limpeza</h4>
              <p className="text-sm text-muted-foreground">
                Remova imagens não utilizadas
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Configurações do Sistema</h2>
        <p className="text-muted-foreground">Gerencie as configurações e dados da sua empresa</p>
      </div>

      <Tabs defaultValue="company" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="company">Empresa</TabsTrigger>
          <TabsTrigger value="appearance">Aparência</TabsTrigger>
          <TabsTrigger value="hours">Horários</TabsTrigger>
          <TabsTrigger value="features">Funcionalidades</TabsTrigger>
          <TabsTrigger value="payment">Pagamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Empresa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company-name">Nome da Empresa</Label>
                  <Input
                    id="company-name"
                    value={companySettings.name}
                    onChange={(e) => setCompanySettings({ ...companySettings, name: e.target.value })}
                    placeholder="Ex: Qserviços Ltda"
                  />
                </div>
                <div>
                  <Label htmlFor="company-email">Email</Label>
                  <Input
                    id="company-email"
                    type="email"
                    value={companySettings.email}
                    onChange={(e) => setCompanySettings({ ...companySettings, email: e.target.value })}
                    placeholder="contato@qservicos.com"
                  />
                </div>
                <div>
                  <Label htmlFor="company-phone">Telefone</Label>
                  <Input
                    id="company-phone"
                    value={companySettings.phone}
                    onChange={(e) => setCompanySettings({ ...companySettings, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div>
                  <Label htmlFor="company-website">Website</Label>
                  <Input
                    id="company-website"
                    value={companySettings.website}
                    onChange={(e) => setCompanySettings({ ...companySettings, website: e.target.value })}
                    placeholder="https://qservicos.com"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="company-description">Descrição da Empresa</Label>
                <Textarea
                  id="company-description"
                  value={companySettings.description}
                  onChange={(e) => setCompanySettings({ ...companySettings, description: e.target.value })}
                  placeholder="Descreva sua empresa..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company-address">Endereço</Label>
                  <Input
                    id="company-address"
                    value={companySettings.address}
                    onChange={(e) => setCompanySettings({ ...companySettings, address: e.target.value })}
                    placeholder="Rua da Empresa, 123"
                  />
                </div>
                <div>
                  <Label htmlFor="company-city">Cidade</Label>
                  <Input
                    id="company-city"
                    value={companySettings.city}
                    onChange={(e) => setCompanySettings({ ...companySettings, city: e.target.value })}
                    placeholder="São Paulo"
                  />
                </div>
                <div>
                  <Label htmlFor="company-state">Estado</Label>
                  <Input
                    id="company-state"
                    value={companySettings.state}
                    onChange={(e) => setCompanySettings({ ...companySettings, state: e.target.value })}
                    placeholder="SP"
                  />
                </div>
                <div>
                  <Label htmlFor="company-cep">CEP</Label>
                  <Input
                    id="company-cep"
                    value={companySettings.cep}
                    onChange={(e) => setCompanySettings({ ...companySettings, cep: e.target.value })}
                    placeholder="01234-567"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="commission-rate">Taxa de Comissão (%)</Label>
                  <Input
                    id="commission-rate"
                    type="number"
                    value={companySettings.commissionRate}
                    onChange={(e) => setCompanySettings({ ...companySettings, commissionRate: Number(e.target.value) })}
                    placeholder="5"
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Moeda</Label>
                  <Select value={companySettings.currency} onValueChange={(value) => setCompanySettings({ ...companySettings, currency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">Real (BRL)</SelectItem>
                      <SelectItem value="USD">Dólar (USD)</SelectItem>
                      <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button className="w-full">
                <Settings className="h-4 w-4 mr-2" />
                Salvar Configurações da Empresa
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Aparência e Branding</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="primary-color">Cor Primária</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="primary-color"
                      type="color"
                      value={companySettings.primaryColor}
                      onChange={(e) => setCompanySettings({ ...companySettings, primaryColor: e.target.value })}
                      className="w-12 h-10"
                    />
                    <Input
                      value={companySettings.primaryColor}
                      onChange={(e) => setCompanySettings({ ...companySettings, primaryColor: e.target.value })}
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="secondary-color">Cor Secundária</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="secondary-color"
                      type="color"
                      value={companySettings.secondaryColor}
                      onChange={(e) => setCompanySettings({ ...companySettings, secondaryColor: e.target.value })}
                      className="w-12 h-10"
                    />
                    <Input
                      value={companySettings.secondaryColor}
                      onChange={(e) => setCompanySettings({ ...companySettings, secondaryColor: e.target.value })}
                      placeholder="#6B7280"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="logo-url">URL do Logo</Label>
                <Input
                  id="logo-url"
                  value={companySettings.logo}
                  onChange={(e) => setCompanySettings({ ...companySettings, logo: e.target.value })}
                  placeholder="https://exemplo.com/logo.png"
                />
              </div>

              <div>
                <Label htmlFor="timezone">Fuso Horário</Label>
                <Select value={companySettings.timezone} onValueChange={(value) => setCompanySettings({ ...companySettings, timezone: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/Sao_Paulo">São Paulo (UTC-3)</SelectItem>
                    <SelectItem value="America/Manaus">Manaus (UTC-4)</SelectItem>
                    <SelectItem value="America/Rio_Branco">Rio Branco (UTC-5)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full">
                <Eye className="h-4 w-4 mr-2" />
                Salvar Configurações de Aparência
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hours" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Horários de Funcionamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(companySettings.workingHours).map(([day, hours]) => (
                <div key={day} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 min-w-[120px]">
                    <input
                      type="checkbox"
                      checked={hours.active}
                      onChange={(e) => setCompanySettings({
                        ...companySettings,
                        workingHours: {
                          ...companySettings.workingHours,
                          [day]: { ...hours, active: e.target.checked }
                        }
                      })}
                      className="rounded"
                    />
                    <Label className="capitalize">{day === 'monday' ? 'Segunda' : 
                                                  day === 'tuesday' ? 'Terça' :
                                                  day === 'wednesday' ? 'Quarta' :
                                                  day === 'thursday' ? 'Quinta' :
                                                  day === 'friday' ? 'Sexta' :
                                                  day === 'saturday' ? 'Sábado' :
                                                  'Domingo'}</Label>
                  </div>
                  
                  {hours.active && (
                    <div className="flex items-center space-x-2">
                      <Input
                        type="time"
                        value={hours.start}
                        onChange={(e) => setCompanySettings({
                          ...companySettings,
                          workingHours: {
                            ...companySettings.workingHours,
                            [day]: { ...hours, start: e.target.value }
                          }
                        })}
                        className="w-24"
                      />
                      <span>até</span>
                      <Input
                        type="time"
                        value={hours.end}
                        onChange={(e) => setCompanySettings({
                          ...companySettings,
                          workingHours: {
                            ...companySettings.workingHours,
                            [day]: { ...hours, end: e.target.value }
                          }
                        })}
                        className="w-24"
                      />
                    </div>
                  )}
                </div>
              ))}

              <Button className="w-full">
                <Clock className="h-4 w-4 mr-2" />
                Salvar Horários de Funcionamento
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Funcionalidades do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(companySettings.features).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2 p-3 border rounded-lg">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => setCompanySettings({
                        ...companySettings,
                        features: {
                          ...companySettings.features,
                          [key]: e.target.checked
                        }
                      })}
                      className="rounded"
                    />
                    <Label className="flex-1">
                      {key === 'emailNotifications' ? 'Notificações por Email' :
                       key === 'smsNotifications' ? 'Notificações por SMS' :
                       key === 'automaticApproval' ? 'Aprovação Automática' :
                       key === 'requireVerification' ? 'Verificação Obrigatória' :
                       key === 'allowCancellation' ? 'Permitir Cancelamento' :
                       key === 'allowReschedule' ? 'Permitir Reagendamento' : key}
                    </Label>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cancellation-policy">Política de Cancelamento (horas)</Label>
                  <Input
                    id="cancellation-policy"
                    value={companySettings.cancellationPolicy}
                    onChange={(e) => setCompanySettings({ ...companySettings, cancellationPolicy: e.target.value })}
                    placeholder="24"
                  />
                </div>
                <div>
                  <Label htmlFor="reschedule-policy">Política de Reagendamento (horas)</Label>
                  <Input
                    id="reschedule-policy"
                    value={companySettings.reschedulePolicy}
                    onChange={(e) => setCompanySettings({ ...companySettings, reschedulePolicy: e.target.value })}
                    placeholder="12"
                  />
                </div>
              </div>

              <Button className="w-full">
                <Shield className="h-4 w-4 mr-2" />
                Salvar Configurações de Funcionalidades
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Métodos de Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(companySettings.paymentMethods).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2 p-3 border rounded-lg">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => setCompanySettings({
                        ...companySettings,
                        paymentMethods: {
                          ...companySettings.paymentMethods,
                          [key]: e.target.checked
                        }
                      })}
                      className="rounded"
                    />
                    <Label className="flex-1">
                      {key === 'creditCard' ? 'Cartão de Crédito' :
                       key === 'debitCard' ? 'Cartão de Débito' :
                       key === 'pix' ? 'PIX' :
                       key === 'cash' ? 'Dinheiro' :
                       key === 'bankTransfer' ? 'Transferência Bancária' : key}
                    </Label>
                  </div>
                ))}
              </div>

              <Button className="w-full">
                <DollarSign className="h-4 w-4 mr-2" />
                Salvar Configurações de Pagamento
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return renderDashboard();
      case "providers":
        return renderProviders();
      case "services":
        return renderServices();
      case "bookings":
        return renderBookings();
      case "categories":
        return renderCategories();
      case "media":
        return renderMedia();
      case "users":
        return renderUsers();
      case "reports":
        return (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Relatórios
            </h3>
            <p className="text-muted-foreground">
              Funcionalidade em desenvolvimento
            </p>
          </div>
        );
      case "settings":
        return renderSettings();
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r border-border">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Admin Panel</h2>
          <p className="text-sm text-muted-foreground">Qserviços</p>
        </div>
        
        <nav className="p-4 space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeSection === item.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <div className="flex-1">
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs opacity-70">{item.description}</div>
                </div>
                {item.badge && item.badge > 0 && (
                  <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                    {item.badge}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {renderContent()}
        </div>
      </div>

      {/* Provider Details Modal */}
      {selectedProvider && (
        <Dialog open={!!selectedProvider} onOpenChange={() => setSelectedProvider(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Detalhes do Prestador</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg">
                    {selectedProvider.user.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedProvider.user.name}</h3>
                  <p className="text-muted-foreground">{selectedProvider.user.email}</p>
                  <Badge className={getProviderStatusColor(selectedProvider.status)}>
                    {getProviderStatusText(selectedProvider.status)}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Telefone</Label>
                  <p className="text-sm text-muted-foreground">{selectedProvider.user.phone || "Não informado"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Cidade</Label>
                  <p className="text-sm text-muted-foreground">{selectedProvider.user.city || "Não informado"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Experiência</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedProvider.experience ? `${selectedProvider.experience} anos` : "Não informado"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Avaliação</Label>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm">
                      {selectedProvider.rating && typeof selectedProvider.rating === 'number' ? selectedProvider.rating.toFixed(1) : "N/A"} 
                      ({selectedProvider.totalReviews || 0} avaliações)
                    </span>
                  </div>
                </div>
              </div>

              {selectedProvider.description && (
                <div>
                  <Label className="text-sm font-medium">Descrição</Label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedProvider.description}</p>
                </div>
              )}

              {selectedProvider.status === "pending" && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    onClick={() => {
                      approveProviderMutation.mutate(selectedProvider.id);
                      setSelectedProvider(null);
                    }}
                    disabled={approveProviderMutation.isPending}
                    className="flex-1"
                  >
                    <UserCheck className="mr-2 h-4 w-4" />
                    Aprovar
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => {
                      rejectProviderMutation.mutate(selectedProvider.id);
                      setSelectedProvider(null);
                    }}
                    disabled={rejectProviderMutation.isPending}
                    className="flex-1"
                  >
                    <UserX className="mr-2 h-4 w-4" />
                    Rejeitar
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
