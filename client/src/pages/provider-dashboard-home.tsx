import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { DollarSign, Package, Star, Calendar, TrendingUp, User, MapPin, AlertCircle, CheckCircle, XCircle, Eye } from "lucide-react";
import { Link } from "wouter";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

interface Provider {
  id: number;
  status: "pending" | "approved" | "rejected";
  userId: number;
}

interface ProviderStats {
  totalBookings: number;
  totalServices: number;
  pendingPayments: number;
  totalEarnings: number;
}

interface RecentBooking {
  id: number;
  clientName: string;
  date: string;
  status: string;
}

// Monthly earnings data for chart
const monthlyData = [
  { month: "Jan", earnings: 30 },
  { month: "Fev", earnings: 35 },
  { month: "Mar", earnings: 25 },
  { month: "Abr", earnings: 40 },
  { month: "Mai", earnings: 50 },
  { month: "Jun", earnings: 45 },
  { month: "Jul", earnings: 60 },
  { month: "Ago", earnings: 55 },
  { month: "Set", earnings: 65 },
  { month: "Out", earnings: 70 },
  { month: "Nov", earnings: 80 },
  { month: "Dez", earnings: 75 },
];

export default function ProviderDashboardHome() {
  const { user } = useAuth();

  // Fetch provider data
  const { data: provider, isLoading: providerLoading } = useQuery<Provider>({
    queryKey: ["/api/providers/me"],
    enabled: user?.userType === "provider",
  });

  // Fetch provider statistics
  const { data: stats, isLoading: statsLoading } = useQuery<ProviderStats>({
    queryKey: ["/api/stats/provider"],
    enabled: !!provider,
  });

  // Fetch recent bookings for "Reservas recentes" section
  const { data: recentBookings, isLoading: bookingsLoading } = useQuery<RecentBooking[]>({
    queryKey: ["/api/service-requests/provider", "recent"],
    enabled: !!provider,
  });

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Painel do Prestador</h1>
          <p className="text-muted-foreground">
            Bem-vindo de volta, {user?.name || "Prestador"}!
          </p>
        </div>
      </div>

      {/* Provider Status Alert */}
      {provider && provider.status !== "approved" && (
        <Alert className={`${
          provider.status === "pending" ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20" :
          provider.status === "rejected" ? "border-red-500 bg-red-50 dark:bg-red-950/20" :
          "border-gray-500 bg-gray-50 dark:bg-gray-950/20"
        }`}>
          <div className="flex items-center gap-2">
            {provider.status === "pending" ? (
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            ) : provider.status === "rejected" ? (
              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            ) : (
              <AlertCircle className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            )}
          </div>
          <AlertDescription className={`${
            provider.status === "pending" ? "text-yellow-800 dark:text-yellow-200" :
            provider.status === "rejected" ? "text-red-800 dark:text-red-200" :
            "text-gray-800 dark:text-gray-200"
          }`}>
            {provider.status === "pending" && (
              <>
                <strong>Aguardando aprovação:</strong> Seu perfil está sendo analisado pela equipe. 
                Você poderá aceitar reservas após a aprovação. Tempo estimado: 24-48 horas.
              </>
            )}
            {provider.status === "rejected" && (
              <>
                <strong>Perfil rejeitado:</strong> Infelizmente seu perfil não foi aprovado. 
                Entre em contato conosco para mais informações sobre como resolver pendências.
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* User Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {user?.name || "Prestador"}
          </h2>
          <p className="text-muted-foreground">
            {user?.email || "prestador@email.com"}
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-indigo-100">Reserva total</p>
                <p className="text-2xl font-bold">{stats?.totalBookings || 17}</p>
              </div>
              <Calendar className="h-8 w-8 text-indigo-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-100">Serviço total</p>
                <p className="text-2xl font-bold">{stats?.totalServices || 68}</p>
              </div>
              <Package className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-100">Pagamento restante</p>
                <p className="text-2xl font-bold">R$ {(stats?.pendingPayments || 0).toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-100">Receita total</p>
                <p className="text-2xl font-bold">R$ {(stats?.totalEarnings || 0).toFixed(2)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">Receita mensal</h3>
            </div>
            
            <div className="space-y-4">
              <div className="text-xs text-muted-foreground">R$</div>
              <div className="text-xs text-muted-foreground">po R1,50</div>
              <div className="text-xs text-muted-foreground">po R0,50</div>
              <div className="text-xs text-muted-foreground">R0</div>
            </div>
            
            <div className="h-64 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    fontSize={12}
                  />
                  <YAxis hide />
                  <Bar 
                    dataKey="earnings" 
                    fill="#8b5cf6" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex justify-between text-xs text-muted-foreground mt-4">
              <span>Jan</span>
              <span>Fev</span>
              <span>Mar</span>
              <span>Abr</span>
              <span>Mai</span>
              <span>Jun</span>
              <span>Jul</span>
              <span>Ago</span>
              <span>Set</span>
              <span>Out</span>
              <span>Nov</span>
              <span>Dez</span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Reservas recentes</span>
              <Link href="/provider-bookings">
                <Button variant="link" className="text-indigo-600 hover:text-indigo-700 p-0 h-auto font-medium">
                  Ver tudo <Eye className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bookingsLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                ))
              ) : recentBookings && recentBookings.length > 0 ? (
                recentBookings.map((booking: RecentBooking) => (
                  <div key={booking.id} className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground">#{booking.id}</div>
                      <div className="text-xs text-muted-foreground">{booking.date}</div>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1">
                      {booking.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhuma reserva recente</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>Gerencie seu negócio rapidamente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/provider-services">
              <Button className="w-full" variant="outline">
                <Package className="h-4 w-4 mr-2" />
                Gerenciar Serviços
              </Button>
            </Link>
            <Link href="/provider-bookings">
              <Button className="w-full" variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Ver Reservas
              </Button>
            </Link>
            <Link href="/employee-management">
              <Button className="w-full" variant="outline">
                <User className="h-4 w-4 mr-2" />
                Funcionários
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status da Conta</CardTitle>
            <CardDescription>Informações do seu perfil</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {provider?.status === "approved" ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-green-600 font-medium">Aprovado</span>
                </>
              ) : provider?.status === "pending" ? (
                <>
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <span className="text-yellow-600 font-medium">Pendente</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="text-red-600 font-medium">Rejeitado</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximos Passos</CardTitle>
            <CardDescription>Continue configurando seu perfil</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {provider?.status !== "approved" && (
                <p className="text-muted-foreground">
                  Aguarde a aprovação do seu perfil para começar a receber reservas.
                </p>
              )}
              {provider?.status === "approved" && (
                <p className="text-muted-foreground">
                  Seu perfil está aprovado! Comece a gerenciar seus serviços.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}