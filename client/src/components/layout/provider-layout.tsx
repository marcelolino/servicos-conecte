import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
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
  AlertTriangle
} from "lucide-react";
import { useState } from "react";

interface ProviderLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
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
    section: "TRANSAÇÕES",
    items: [
      { icon: CreditCard, label: "Pagamentos", href: "/provider-payments" },
      { 
        icon: FileText, 
        label: "Pagamentos Em Dinheiro", 
        href: "/provider-cash-payments",
      },
      { 
        icon: DollarSign, 
        label: "Solicitações De Retirada Do Provedor", 
        href: "/provider-withdrawal-requests",
      },
    ]
  },
  {
    section: "PROMOÇÃO",
    items: [
      { icon: BellRing, label: "Banner Promocional Do Provedor", href: "/provider-promotional-banners" },
    ]
  },
];

export default function ProviderLayout({ children }: ProviderLayoutProps) {
  const { user } = useAuth();
  const [location] = useLocation();
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
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 shadow-lg z-50">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3 px-6 py-6 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Wrench className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-foreground">Provedor</span>
          </div>
        </div>

        {/* User Profile Section */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.avatar || ""} />
              <AvatarFallback className="bg-indigo-100 text-indigo-600">
                {user?.name?.charAt(0).toUpperCase() || "P"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.email?.split('@')[0] || "demo@provider.com"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.name || "Félix Harris"}
              </p>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
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
      <main className="ml-64">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}