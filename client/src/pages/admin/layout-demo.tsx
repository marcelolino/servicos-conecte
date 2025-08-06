import { useState } from "react";
import { ModernAdminLayout } from "@/components/layout/modern-admin-layout";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  BarChart, 
  Users, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  Star,
  Clock,
  CheckCircle,
  ArrowRight
} from "lucide-react";

export default function LayoutDemoPage() {
  const [useModernLayout, setUseModernLayout] = useState(true);

  // Demo dashboard content
  const DemoContent = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard de Demonstração</h1>
          <p className="text-muted-foreground">
            Demonstração do novo layout administrativo com componentes shadcn/ui
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant={useModernLayout ? "default" : "secondary"}>
            {useModernLayout ? "Layout Moderno" : "Layout Atual"}
          </Badge>
          <div className="flex items-center space-x-2">
            <span className="text-sm">Alternar Layout:</span>
            <Switch
              checked={useModernLayout}
              onCheckedChange={setUseModernLayout}
            />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,847</div>
            <p className="text-xs text-muted-foreground">
              +12% em relação ao mês passado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reservas Ativas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">
              +8 novas hoje
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita do Mês</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 45.231</div>
            <p className="text-xs text-muted-foreground">
              +20.1% em relação ao mês passado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Crescimento</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+24%</div>
            <p className="text-xs text-muted-foreground">
              Crescimento mensal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Features Comparison */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Recursos do Layout Moderno
            </CardTitle>
            <CardDescription>
              Benefícios do novo sistema baseado em shadcn/ui
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Sidebar colapsível com atalho de teclado (Ctrl+B)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Navegação hierárquica com breadcrumbs</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Menu responsivo com sheet em mobile</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Dropdown do usuário com opções avançadas</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Suporte completo a dark/light theme</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Arquitetura modular e acessibilidade</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Atividade Recente
            </CardTitle>
            <CardDescription>
              Últimas ações no painel administrativo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm">Novo prestador aprovado</p>
                <p className="text-xs text-muted-foreground">João Silva - Limpeza</p>
              </div>
              <span className="text-xs text-muted-foreground">2h atrás</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm">Pagamento confirmado</p>
                <p className="text-xs text-muted-foreground">R$ 250,00 - PIX</p>
              </div>
              <span className="text-xs text-muted-foreground">3h atrás</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm">Nova categoria criada</p>
                <p className="text-xs text-muted-foreground">Jardinagem</p>
              </div>
              <span className="text-xs text-muted-foreground">5h atrás</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Call to Action */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Atualizar Layout da Dashboard</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Substitua o layout atual pelos novos componentes shadcn/ui para uma experiência moderna e mais funcional.
              </p>
            </div>
            <Button className="gap-2">
              Aplicar Layout Moderno
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render with the selected layout
  return useModernLayout ? (
    <ModernAdminLayout>
      <DemoContent />
    </ModernAdminLayout>
  ) : (
    <AdminLayout>
      <DemoContent />
    </AdminLayout>
  );
}