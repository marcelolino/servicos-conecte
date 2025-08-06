import {
  Calendar,
  Package,
  CreditCard,
  DollarSign,
  Users,
  Settings,
  BookOpen,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Wallet,
  MessageCircle,
  Home,
  FileText,
  BellRing,
  Wrench,
  Eye,
  Gift
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
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { ChevronRight, LogOut, User } from "lucide-react";

const menuData = {
  principal: [
    {
      title: "Painel",
      url: "/provider-dashboard",
      icon: Home,
    },
    {
      title: "Reservas",
      url: "/provider-bookings",
      icon: Calendar,
      items: [
        {
          title: "Todas Reservas",
          url: "/provider-bookings",
          icon: BookOpen,
        },
        {
          title: "Solicitações Pendentes",
          url: "/provider-bookings/pending",
          icon: Clock,
        },
        {
          title: "Reservas Aceitas",
          url: "/provider-bookings/accepted",
          icon: CheckCircle,
        },
        {
          title: "Em Andamento",
          url: "/provider-bookings/ongoing",
          icon: AlertTriangle,
        },
        {
          title: "Concluídas",
          url: "/provider-bookings/completed",
          icon: CheckCircle,
        },
        {
          title: "Canceladas",
          url: "/provider-bookings/cancelled",
          icon: XCircle,
        },
      ],
    },
  ],
  servico: [
    {
      title: "Serviços",
      url: "/provider-all-services",
      icon: Package,
      items: [
        {
          title: "Todos De Serviços",
          url: "/provider-all-services",
        },
        {
          title: "Pacotes",
          url: "/provider-packages",
        },
        {
          title: "Complementos",
          url: "/provider-add-ons",
        },
        {
          title: "Lista De Solicitações De Serviço",
          url: "/provider-services",
        },
      ],
    },
    {
      title: "Meus Serviços",
      url: "/meus-servicos",
      icon: Wrench,
    },
  ],
  utilizador: [
    {
      title: "Funcionários",
      url: "/employee-management",
      icon: Users,
    },
  ],
  comunicacao: [
    {
      title: "Mensagens",
      url: "/provider-chat",
      icon: MessageCircle,
    },
  ],
  carteira: [
    {
      title: "Carteira",
      url: "/provider-wallet",
      icon: Wallet,
    },
    {
      title: "Métodos de Pagamento",
      url: "/provider-payment-methods",
      icon: CreditCard,
    },
  ],
  promocao: [
    {
      title: "Banner Promocional Do Provedor",
      url: "/provider-promotional-banners",
      icon: BellRing,
    },
  ],
};

export function ProviderSidebar() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const isActiveUrl = (url: string) => {
    if (url === "/provider-dashboard") {
      return location === url;
    }
    return location.startsWith(url);
  };

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Package className="h-4 w-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">Qserviços</span>
            <span className="truncate text-xs text-muted-foreground">Painel do Prestador</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>PRINCIPAL</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuData.principal.map((item) => (
                <Collapsible key={item.title} asChild defaultOpen={item.items && location.startsWith(item.url)}>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={isActiveUrl(item.url)}
                    >
                      {item.items ? (
                        <CollapsibleTrigger className="w-full">
                          <item.icon />
                          <span>{item.title}</span>
                          <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </CollapsibleTrigger>
                      ) : (
                        <Link href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      )}
                    </SidebarMenuButton>
                    {item.items && (
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isActiveUrl(subItem.url)}
                              >
                                <Link href={subItem.url}>
                                  {subItem.icon && <subItem.icon />}
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    )}
                  </SidebarMenuItem>
                </Collapsible>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>SERVIÇO</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuData.servico.map((item) => (
                <Collapsible key={item.title} asChild defaultOpen={item.items && location.startsWith(item.url)}>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={isActiveUrl(item.url)}
                    >
                      {item.items ? (
                        <CollapsibleTrigger className="w-full">
                          <item.icon />
                          <span>{item.title}</span>
                          <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </CollapsibleTrigger>
                      ) : (
                        <Link href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      )}
                    </SidebarMenuButton>
                    {item.items && (
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isActiveUrl(subItem.url)}
                              >
                                <Link href={subItem.url}>
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    )}
                  </SidebarMenuItem>
                </Collapsible>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>UTILIZADOR</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuData.utilizador.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={isActiveUrl(item.url)}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>COMUNICAÇÃO</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuData.comunicacao.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={isActiveUrl(item.url)}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>CARTEIRA DO PROVEDOR</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuData.carteira.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={isActiveUrl(item.url)}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>PROMOÇÃO</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuData.promocao.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={isActiveUrl(item.url)}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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
                    <AvatarImage src="" alt={user?.name} />
                    <AvatarFallback className="rounded-lg">
                      {user?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user?.name || "Usuário"}</span>
                    <span className="truncate text-xs">{user?.email}</span>
                  </div>
                  <ChevronRight className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}