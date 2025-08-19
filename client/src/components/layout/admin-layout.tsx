import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMobileMenu } from "@/hooks/use-mobile-menu";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
  Calendar,
  MessageCircle,
  Menu,
  X,
  Folder,
  ChevronDown,
  ChevronRight
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface SubMenuItem {
  label: string;
  href: string;
}

interface MenuItem {
  icon: any;
  label: string;
  href: string;
  exact?: boolean;
  subItems?: SubMenuItem[];
}

interface MenuSection {
  section: string;
  items: MenuItem[];
}

const menuItems: MenuSection[] = [
  {
    section: "PRINCIPAL",
    items: [
      { icon: Home, label: "Dashboard", href: "/admin-dashboard", exact: true },
      { icon: Users, label: "Os Clientes", href: "/admin-clients" },
      { icon: Users, label: "Todos Os Usuários", href: "/admin-users" },
      { icon: Users, label: "Prestadores", href: "/admin-providers" },
    ]
  },
  {
    section: "GERENCIAMENTO DE RESERVAS",
    items: [
      { icon: Calendar, label: "Reservas", href: "/admin-bookings" },
    ]
  },
  {
    section: "SERVIÇOS",
    items: [
      { icon: Package, label: "Todos os Serviços", href: "/admin-services" },
      { icon: FileText, label: "Solicitações de Serviço", href: "/admin-provider-service-requests" },
      { icon: Folder, label: "Categorias", href: "/admin-categories" },
    ]
  },
  {
    section: "COMUNICAÇÃO",
    items: [
      { icon: MessageCircle, label: "Chat com Usuários", href: "/admin-chat-management" },
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
    section: "CONFIGURAÇÕES",
    items: [
      { icon: Settings, label: "Configurações", href: "/admin-settings", 
        subItems: [
          { label: "Configurações Gerais", href: "/admin-settings" },
          { label: "Configuração da Página", href: "/admin-page-settings" },
          { label: "Redes Sociais", href: "/admin-social-settings" },
          { label: "Notificações", href: "/admin-notification-settings" }
        ]
      },
    ]
  },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const { isMobile, isMobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useMobileMenu();
  const [openSubmenus, setOpenSubmenus] = useState<string[]>([]);

  // Auto-open submenus when a sub-page is active
  React.useEffect(() => {
    menuItems.forEach(section => {
      section.items.forEach(item => {
        if (item.subItems) {
          const hasActiveSubItem = item.subItems.some(subItem => isActiveLink(subItem.href));
          if (hasActiveSubItem && !openSubmenus.includes(item.label)) {
            setOpenSubmenus(prev => [...prev, item.label]);
          }
        }
      });
    });
  }, [location]);

  const isActiveLink = (href: string, exact: boolean = false) => {
    if (exact) {
      return location === href;
    }
    return location.startsWith(href);
  };

  const toggleSubmenu = (label: string) => {
    setOpenSubmenus(prev => 
      prev.includes(label) 
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  const isSubmenuOpen = (label: string) => openSubmenus.includes(label);

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 shadow-lg z-50 transition-transform duration-300",
        isMobile ? (isMobileMenuOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0"
      )}>
        {/* Logo & Brand */}
        <div className="flex items-center gap-3 px-6 py-6 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-bold text-primary">Qserviços Admin</h2>
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
                  const hasSubItems = item.subItems && item.subItems.length > 0;
                  const isActive = hasSubItems 
                    ? item.subItems?.some(subItem => isActiveLink(subItem.href))
                    : isActiveLink(item.href, item.exact || false);
                  const isOpen = isSubmenuOpen(item.label);
                  
                  return (
                    <div key={item.href}>
                      {hasSubItems ? (
                        <Button
                          variant={isActive ? "secondary" : "ghost"}
                          className={`w-full justify-between gap-3 ${
                            isActive 
                              ? "bg-primary/10 text-primary hover:bg-primary/20" 
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                          onClick={() => toggleSubmenu(item.label)}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="h-4 w-4" />
                            <span className="text-sm">{item.label}</span>
                          </div>
                          {isOpen ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      ) : (
                        <Link href={item.href}>
                          <Button
                            variant={isActive ? "secondary" : "ghost"}
                            className={`w-full justify-start gap-3 ${
                              isActive 
                                ? "bg-primary/10 text-primary hover:bg-primary/20" 
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                            onClick={() => isMobile && closeMobileMenu()}
                          >
                            <Icon className="h-4 w-4" />
                            <span className="text-sm">{item.label}</span>
                          </Button>
                        </Link>
                      )}
                      
                      {hasSubItems && isOpen && item.subItems && (
                        <div className="ml-6 mt-1 space-y-1">
                          {item.subItems.map((subItem: SubMenuItem) => {
                            const isSubActive = isActiveLink(subItem.href);
                            return (
                              <Link key={subItem.href} href={subItem.href}>
                                <Button
                                  variant={isSubActive ? "secondary" : "ghost"}
                                  size="sm"
                                  className={`w-full justify-start ${
                                    isSubActive 
                                      ? "bg-primary/10 text-primary hover:bg-primary/20" 
                                      : "text-muted-foreground hover:text-foreground"
                                  }`}
                                  onClick={() => isMobile && closeMobileMenu()}
                                >
                                  <span className="text-xs">{subItem.label}</span>
                                </Button>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
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
      <main className={cn(
        "transition-all duration-300",
        isMobile ? "ml-0" : "ml-64"
      )}>
        {/* Header with hamburger menu */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMobileMenu}
                className="p-2"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            )}
            <h1 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white">
              Painel Administrativo
            </h1>
          </div>
        </header>
        <div className="px-4 lg:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}

export default AdminLayout;