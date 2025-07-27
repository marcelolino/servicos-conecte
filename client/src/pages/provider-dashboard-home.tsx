import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { DollarSign, Package, Star, Calendar, TrendingUp, User, MapPin, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Link } from "wouter";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, BarChart, Bar } from "recharts";

// Mock data matching the images
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
  const { data: provider, isLoading: providerLoading } = useQuery({
    queryKey: ["/api/providers/me"],
    enabled: user?.userType === "provider",
  });

  // Fetch provider statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats/provider"],
    enabled: !!provider,
  });

  // Fetch recent bookings for "Reservas recentes" section
  const { data: recentBookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ["/api/service-requests/provider", "recent"],
    queryFn: () => 
      // Mock recent booking data
      Promise.resolve([
        {
          id: 19,
          clientName: "Pedro Norris",
          date: "24 de julho de 2025 15:37",
          status: "Em Andamento"
        }
      ]),
    enabled: !!provider,
  });

  return (
    <div className="space-y-6">
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

      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {user?.name || "Félix Harris"}
          </h1>
          <p className="text-muted-foreground">
            {user?.email || "demo@provider.com"}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {(user?.name?.charAt(0) || "F").toUpperCase()}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-4 bg-yellow-400 rounded-sm"></div>
            <span className="text-sm text-muted-foreground">🇺🇸</span>
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <User className="h-4 w-4" />
            </div>
            <span className="text-sm">1</span>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-indigo-100">Reserva total</p>
                <p className="text-2xl font-bold">17</p>
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
                <p className="text-2xl font-bold">68</p>
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
                <p className="text-2xl font-bold">R$ 0,00</p>
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
                <p className="text-2xl font-bold">R$ 0,00</p>
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
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">Reservas recentes</h3>
              <Link href="/provider-bookings">
                <Button variant="link" className="text-indigo-600 hover:text-indigo-700 p-0 h-auto font-medium">
                  Ver tudo
                </Button>
              </Link>
            </div>

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
                recentBookings.map((booking) => (
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

      {/* Better Top Performers and Recent Services */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Better Top Performers */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">Melhor faz-tudo</h3>
              <Link href="/employee-management">
                <Button variant="link" className="text-indigo-600 hover:text-indigo-700 p-0 h-auto font-medium">
                  Ver tudo
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg border">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">Desconhecido</div>
                  <div className="text-xs text-muted-foreground">© 2024 Todos os direitos reservados por IONIC Design</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Services */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">Reservas recentes</h3>
              <Link href="/provider-bookings">
                <Button variant="link" className="text-indigo-600 hover:text-indigo-700 p-0 h-auto font-medium">
                  Ver tudo
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg border">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">#19</div>
                  <div className="text-xs text-muted-foreground">24 de julho de 2025 15:37</div>
                </div>
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1">
                  Em Andamento
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}