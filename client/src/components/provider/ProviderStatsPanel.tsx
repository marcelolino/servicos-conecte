import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { 
  TrendingUp, 
  Users, 
  Star, 
  Calendar,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface ProviderService {
  id: number;
  categoryId: number;
  name: string;
  price: string;
  isActive: boolean;
  category: {
    id: number;
    name: string;
    imageUrl: string;
  };
}

interface Employee {
  id: number;
  name: string;
  phone: string;
  email: string;
  specialization: string;
  isActive: boolean;
}

interface ProviderStatsPanelProps {
  providerId?: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

// Mock data for the chart
const monthlyData = [
  { month: 'Jan', earnings: 0 },
  { month: 'Fev', earnings: 20 },
  { month: 'Mar', earnings: 45 },
  { month: 'Abr', earnings: 30 },
  { month: 'Mai', earnings: 60 },
  { month: 'Jun', earnings: 80 },
  { month: 'Jul', earnings: 100 },
  { month: 'Ago', earnings: 85 },
  { month: 'Set', earnings: 90 },
  { month: 'Out', earnings: 75 },
];

export default function ProviderStatsPanel({ providerId }: ProviderStatsPanelProps) {
  // Fetch provider's services (subscriptions)
  const { data: providerServices, isLoading: servicesLoading } = useQuery<ProviderService[]>({
    queryKey: ["/api/providers", providerId, "services"],
    enabled: !!providerId,
  });

  // Fetch provider's employees
  const { data: employees, isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ["/api/providers", providerId, "employees"],
    enabled: !!providerId,
  });

  const serviceStats = providerServices?.reduce((acc, service) => {
    const categoryName = service.category.name;
    acc[categoryName] = (acc[categoryName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const pieData = Object.entries(serviceStats).map(([name, value], index) => ({
    name,
    value,
    color: COLORS[index % COLORS.length]
  }));

  return (
    <div className="space-y-6">
      {/* Chart Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Demandium
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
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
                  fill="#8884d8" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-center">
            <div className="text-2xl font-bold text-foreground">100</div>
            <div className="text-sm text-muted-foreground">Ganho Total</div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Section */}
      <Tabs defaultValue="subscriptions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="subscriptions" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Minhas assinaturas
          </TabsTrigger>
          <TabsTrigger value="workers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Trabalhadores
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Minhas assinaturas</h3>
            <Button variant="link" className="text-blue-500 hover:text-blue-600 p-0">
              Ver tudo
            </Button>
          </div>

          {servicesLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border animate-pulse">
                  <div className="w-12 h-12 bg-muted rounded-lg" />
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : providerServices && providerServices.length > 0 ? (
            <div className="space-y-3">
              {providerServices.map((service) => (
                <div key={service.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                    {service.category.imageUrl ? (
                      <img
                        src={service.category.imageUrl}
                        alt={service.category.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-semibold text-primary">
                          {service.category.name.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{service.category.name}</h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>1 serviços</span>
                      <span>•</span>
                      <span>0 recente concluída</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={service.isActive ? "default" : "secondary"} className="text-xs">
                      {service.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                    <Button
                      variant="link"
                      size="sm"
                      className="text-blue-500 hover:text-blue-600 p-0 h-auto text-xs"
                    >
                      Veja detalhes (1)
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma assinatura</h3>
              <p className="text-muted-foreground">
                Você ainda não se inscreveu em nenhuma categoria de serviço.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="workers" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Trabalhadores</h3>
            <Button variant="link" className="text-blue-500 hover:text-blue-600 p-0">
              Ver tudo
            </Button>
          </div>

          {employeesLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border animate-pulse">
                  <div className="w-10 h-10 bg-muted rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-2/3 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : employees && employees.length > 0 ? (
            <div className="space-y-3">
              {employees.map((employee) => (
                <div key={employee.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-semibold text-sm">
                    {employee.name.slice(0, 2).toUpperCase()}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{employee.name}</h4>
                    <p className="text-xs text-muted-foreground">{employee.phone}</p>
                  </div>
                  
                  <Badge variant={employee.isActive ? "default" : "secondary"} className="text-xs">
                    {employee.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg border">
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-semibold text-sm">
                  RS
                </div>
                
                <div className="flex-1">
                  <h4 className="font-medium text-sm">Ronan Silva</h4>
                  <p className="text-xs text-muted-foreground">+5511999666666</p>
                </div>
                
                <Badge variant="default" className="text-xs">
                  Ativo
                </Badge>
              </div>
              
              <div className="text-center py-4 text-muted-foreground text-sm">
                Nenhum outro trabalhador encontrado
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}