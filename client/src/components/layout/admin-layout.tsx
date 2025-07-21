import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Users, 
  Package, 
  Settings, 
  CreditCard, 
  FileText, 
  DollarSign,
  TrendingUp,
  LogOut,
  Calendar
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  {
    section: "PRINCIPAL",
    items: [
      { icon: Home, label: "Dashboard", href: "/admin-dashboard", exact: true },
      { icon: Users, label: "Os Clientes", href: "/admin-clients" },
      { icon: Users, label: "Todos Os Usuários", href: "/admin-users" },
    ]
  },
  {
    section: "GERENCIAMENTO DE RESERVAS",
    items: [
      { icon: Calendar, label: "Reservas", href: "/admin-bookings" },
    ]
  },
  {
    section: "TRANSAÇÕES",
    items: [
      { icon: CreditCard, label: "Pagamentos", href: "/admin-payments" },
      { icon: FileText, label: "Pagamentos Em Dinheiro", href: "/admin-cash-payments" },
      { icon: TrendingUp, label: "Ganhos", href: "/admin-earnings" },
      { icon: DollarSign, label: "Solicitações De Retirada Do Provedor", href: "/admin-withdrawal-requests" },
    ]
  },
  {
    section: "A PROMOÇÃO",
    items: [
      { icon: Package, label: "Banner Promocional Do Provedor", href: "/admin-banners" },
      { icon: Package, label: "Lista De Cupons", href: "/admin-coupons" },
      { icon: Package, label: "Lista De Sliders", href: "/admin-sliders" },
    ]
  },
  {
    section: "AS PONTUAÇÕES",
    items: [
      { icon: Settings, label: "Configurações", href: "/admin-settings" },
    ]
  },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const isActiveLink = (href: string, exact: boolean = false) => {
    if (exact) {
      return location === href;
    }
    return location.startsWith(href);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 shadow-lg z-50">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3 px-6 py-6 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-bold text-primary">Administrador de demonstração</h2>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
          {menuItems.map((section) => (
            <div key={section.section}>
              <h3 className="px-3 mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {section.section}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = isActiveLink(item.href, item.exact);
                  
                  return (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        className={`w-full justify-start gap-3 ${
                          isActive 
                            ? "bg-primary/10 text-primary hover:bg-primary/20" 
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-sm">{item.label}</span>
                      </Button>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile & Logout */}
        <div className="border-t p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.name || "Administrador"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                ADMINISTRADOR DE DEMONSTRAÇÃO
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start gap-2"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64">
        <div className="px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}