import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
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
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MenuItem {
  title: string;
  icon: any;
  href?: string;
  items?: { title: string; href: string; }[];
}

const menuData: MenuItem[] = [
  {
    title: "Principal",
    icon: Home,
    items: [
      { title: "Dashboard", href: "/admin-dashboard" },
      { title: "Gestão de Usuários", href: "/admin-users" },
      { title: "Gestão de Prestadores", href: "/admin-providers" },
    ]
  },
  {
    title: "Serviços",
    icon: Package,
    items: [
      { title: "Categorias de Serviços", href: "/admin-categories" },
      { title: "Gerenciamento de Mídia", href: "/admin-media" },
    ]
  },
  {
    title: "Gerenciamento de Reservas",
    icon: Calendar,
    items: [
      { title: "Reservas", href: "/admin-bookings" },
    ]
  },
  {
    title: "Comunicação",
    icon: MessageCircle,
    items: [
      { title: "Chat com Usuários", href: "/admin-chat" },
    ]
  },
  {
    title: "Transações",
    icon: CreditCard,
    items: [
      { title: "Pagamentos", href: "/admin-payments" },
      { title: "Pagamentos Em Dinheiro", href: "/admin-cash-payments" },
      { title: "Ganhos", href: "/admin-earnings" },
      { title: "Solicitações De Retirada", href: "/admin-withdrawal-requests" },
    ]
  },
  {
    title: "Promoção",
    icon: TrendingUp,
    items: [
      { title: "Banner Promocional", href: "/admin-banners" },
      { title: "Lista De Cupons", href: "/admin-coupons" },
      { title: "Lista De Sliders", href: "/admin-sliders" },
    ]
  },
  {
    title: "Configurações",
    icon: Settings,
    href: "/admin-settings",
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const isActiveLink = (href: string) => {
    if (href === "/admin-dashboard") {
      return location === href;
    }
    return location.startsWith(href);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Package className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Qserviços Admin</span>
                <span className="truncate text-xs">Painel Administrativo</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {menuData.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel>{section.title.toUpperCase()}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.href ? (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      tooltip={section.title}
                      isActive={isActiveLink(section.href)}
                      asChild
                    >
                      <Link href={section.href}>
                        <section.icon />
                        <span>{section.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ) : section.items ? (
                  <Collapsible
                    key={section.title}
                    asChild
                    defaultOpen={section.items.some(item => isActiveLink(item.href))}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={section.title}>
                          <section.icon />
                          <span>{section.title}</span>
                          <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {section.items.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isActiveLink(subItem.href)}
                              >
                                <Link href={subItem.href}>
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ) : null}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg">
                      {user?.name?.charAt(0) || "A"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user?.name || "Administrador"}
                    </span>
                    <span className="truncate text-xs">
                      Admin
                    </span>
                  </div>
                  <MoreHorizontal className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem className="gap-2">
                  <Settings className="h-4 w-4" />
                  Configurações da Conta
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="gap-2 text-destructive focus:text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}