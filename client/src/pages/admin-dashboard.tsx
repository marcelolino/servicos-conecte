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
  Shield,
  Home,
  BarChart3,
  FileText,
  Star,
  MapPin,
  Calendar
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
  color: z.string().optional(),
});

type CategoryForm = z.infer<typeof categorySchema>;

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [isNewCategoryOpen, setIsNewCategoryOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<(Provider & { user: User }) | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userFilterType, setUserFilterType] = useState<string>("all");

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
      id: "categories",
      label: "Categorias",
      icon: FileText,
      description: "Categorias de serviços"
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gerenciamento de Serviços</h2>
          <p className="text-muted-foreground">Todos os serviços oferecidos pelos prestadores</p>
        </div>
      </div>

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
                  <TableHead>Prestador</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allServices?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Nenhum serviço cadastrado ainda.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  allServices?.map((service: any, index: number) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{service.provider?.user?.name}</p>
                          <p className="text-sm text-muted-foreground">{service.provider?.user?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{service.category?.name}</Badge>
                      </TableCell>
                      <TableCell>
                        <p className="line-clamp-2 max-w-xs">{service.description}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            R$ {Number(service.price || 0).toFixed(2)}
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
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Settings className="h-4 w-4 mr-2" />
                              Editar Status
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
      case "categories":
        return renderCategories();
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
