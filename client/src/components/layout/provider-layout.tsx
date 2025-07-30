import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useMobileMenu } from "@/hooks/use-mobile-menu";
import { ChatNotification } from "@/components/chat/chat-notification";
import {
  Home,
  Calendar,
  Package,
  CreditCard,
  FileText,
  DollarSign,
  Users,
  Settings,
  ChevronDown,
  ChevronRight,
  BellRing,
  Wrench,
  BookOpen,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  AlertTriangle,
  Wallet,
  MessageCircle,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";

interface ProviderLayoutProps {
  children: React.ReactNode;
}

interface MenuItem {
  icon: React.ComponentType<any>;
  label: string;
  href: string;
  exact?: boolean;
  subItems?: { icon?: React.ComponentType<any>; label: string; href: string }[];
}

interface MenuSection {
  section: string;
  items: MenuItem[];
}

const menuItems: MenuSection[] = [
  {
    section: "PRINCIPAL",
    items: [
      { icon: Home, label: "Painel", href: "/provider-dashboard", exact: true },
      {
        icon: Calendar,
        label: "Reservas",
        href: "/provider-bookings",
        subItems: [
          { icon: BookOpen, label: "Todas Reservas", href: "/provider-bookings" },
          { icon: Clock, label: "Solicitações Pendentes", href: "/provider-bookings/pending" },
          { icon: CheckCircle, label: "Reservas Aceitas", href: "/provider-bookings/accepted" },
          { icon: AlertTriangle, label: "Em Andamento", href: "/provider-bookings/ongoing" },
          { icon: CheckCircle, label: "Concluídas", href: "/provider-bookings/completed" },
          { icon: XCircle, label: "Canceladas", href: "/provider-bookings/cancelled" }
        ]
      },
    ]
  },
  {
    section: "SERVIÇO", 
    items: [
      { 
        icon: Package, 
        label: "Serviços", 
        href: "/provider-all-services",
        subItems: [
          { label: "Todos De Serviços", href: "/provider-all-services" },
          { label: "Pacotes", href: "/provider-packages" },
          { label: "Complementos", href: "/provider-add-ons" },
          { label: "Lista De Solicitações De Serviço", href: "/provider-services" },
        ]
      },
      { 
        icon: Wrench, 
        label: "Meus Serviços", 
        href: "/meus-servicos",
        subItems: [
          { label: "Gerenciar Preços", href: "/meus-servicos" },
        ]
      },
    ]
  },
  {
    section: "UTILIZADOR",
    items: [
      { 
        icon: Users, 
        label: "Faz-Tudo", 
        href: "/provider-handyman",
        subItems: [
          { label: "Lista de Funcionários", href: "/employee-management" },
        ]
      },
    ]
  },
  {
    section: "COMUNICAÇÃO",
    items: [
      { icon: MessageCircle, label: "Mensagens", href: "/provider-chat" },
    ]
  },
  {
    section: "CARTEIRA DO PROVEDOR",
    items: [
      { icon: Wallet, label: "Carteira", href: "/provider-wallet" },
      { icon: CreditCard, label: "Métodos de Pagamento", href: "/provider-payment-methods" },
    ]
  },
  {
    section: "PROMOÇÃO",
    items: [
      { icon: BellRing, label: "Banner Promocional Do Provedor", href: "/provider-promotional-banners" },
    ]
  },
];

export function ProviderLayout({ children }: ProviderLayoutProps) {
  const { user } = useAuth();
  const [location] = useLocation();
  const { isMobile, isMobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useMobileMenu();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(() => {
    // Auto-expand Reservas menu if on any booking page
    if (location.startsWith('/provider-bookings')) {
      return ['Reservas'];
    }
    return [];
  });

  const toggleMenu = (label: string) => {
    setExpandedMenus(prev => 
      prev.includes(label) 
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  const isActiveLink = (href: string, exact: boolean = false) => {
    if (exact) {
      return location === href;
    }
    return location.startsWith(href);
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
        "fixed top-0 bottom-0 left-0 w-64 bg-white dark:bg-gray-800 shadow-lg z-50 transition-transform duration-300",
        isMobile ? (isMobileMenuOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0"
      )}>


        {/* Header with modern logo */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Wrench className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Qserviços
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Painel do Prestador
              </p>
            </div>
          </div>
        </div>

        {/* User Profile Section */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user?.avatar || ""} />
              <AvatarFallback className="bg-indigo-100 text-indigo-600 text-lg font-semibold">
                {user?.name?.charAt(0).toUpperCase() || "P"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {user?.name || "Félix Harris"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email?.split('@')[0] || "demo@provider.com"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="px-3 py-4 space-y-1 overflow-y-auto h-[calc(100vh-160px)]">
          {menuItems.map((section) => (
            <div key={section.section} className="space-y-1">
              <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {section.section}
              </h3>
              {section.items.map((item) => (
                <div key={item.label}>
                  {item.subItems ? (
                    <>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-between text-left font-normal px-3 py-2 h-auto",
                          isActiveLink(item.href) && "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                        )}
                        onClick={() => toggleMenu(item.label)}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="h-4 w-4" />
                          <span className="text-sm">{item.label}</span>
                        </div>
                        {expandedMenus.includes(item.label) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                      {expandedMenus.includes(item.label) && (
                        <div className="ml-7 space-y-1 mt-1">
                          {item.subItems.map((subItem) => (
                            <Link key={subItem.href} href={subItem.href}>
                              <Button
                                variant="ghost"
                                className={cn(
                                  "w-full justify-start text-left font-normal px-3 py-1.5 h-auto text-sm",
                                  isActiveLink(subItem.href) && "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                                )}
                                onClick={() => isMobile && closeMobileMenu()}
                              >
                                {subItem.label}
                              </Button>
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link href={item.href}>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start text-left font-normal px-3 py-2 h-auto",
                          isActiveLink(item.href, item.exact) && "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                        )}
                        onClick={() => isMobile && closeMobileMenu()}
                      >
                        <item.icon className="h-4 w-4 mr-3" />
                        <span className="text-sm">{item.label}</span>
                      </Button>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex flex-col transition-all duration-300",
        isMobile ? "ml-0" : "ml-64"
      )}>
        {/* Header with hamburger menu and notifications */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
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
                Painel do Prestador
              </h1>
            </div>
            <ChatNotification userType="provider" />
          </div>
        </header>
        {/* Content Area */}
        <div className="flex-1 p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

export default ProviderLayout;