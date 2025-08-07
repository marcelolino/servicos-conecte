import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { 
  Home,
  Calendar,
  Package,
  MessageCircle,
  Gift,
  User,
  LogOut,
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
  SidebarRail,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  href: string;
}

const menuData: MenuItem[] = [
  {
    title: "Painel",
    icon: Home,
    href: "/client-dashboard",
  },
  {
    title: "Reservas",
    icon: Calendar,
    href: "/client-reservas",
  },
  {
    title: "Meu Histórico de Reservas", 
    icon: Package,
    href: "/client-orders",
  },
  {
    title: "Mensagens",
    icon: MessageCircle,
    href: "/client-chat",
  },
  {
    title: "Ofertas",
    icon: Gift,
    href: "/client-offers",
  },
];

export function ClientSidebarModern({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const isActiveLink = (href: string) => {
    if (href === "/client-dashboard") {
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
                <span className="truncate font-semibold">Qserviços Cliente</span>
                <span className="truncate text-xs">Painel do Cliente</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>PRINCIPAL</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuData.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={isActiveLink(item.href)}
                    asChild
                  >
                    <Link href={item.href}>
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
                    <AvatarFallback className="rounded-lg">
                      {user?.name?.charAt(0) || "C"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user?.name || "Cliente"}
                    </span>
                    <span className="truncate text-xs">
                      Cliente
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
                <DropdownMenuItem className="gap-2" asChild>
                  <Link href="/profile">
                    <User className="h-4 w-4" />
                    Perfil
                  </Link>
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