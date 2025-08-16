import { AppSidebar } from "@/components/layout/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";

interface ModernAdminLayoutProps {
  children: React.ReactNode;
}

const routeBreadcrumbs: Record<string, { title: string; parent?: string }> = {
  "/admin-dashboard": { title: "Dashboard" },
  "/admin-clients": { title: "Os Clientes", parent: "Principal" },
  "/admin-users": { title: "Todos Os Usuários", parent: "Principal" },
  "/admin-providers": { title: "Gestão de Prestadores", parent: "Principal" },
  "/admin-services": { title: "Gerenciamento de Serviços", parent: "Serviços" },
  "/admin-provider-service-requests": { title: "Solicitações de Serviço", parent: "Serviços" },
  "/admin-categories": { title: "Categorias de Serviços", parent: "Serviços" },
  "/admin-charging-types": { title: "Tipos de Cobrança", parent: "Serviços" },
  "/admin-media": { title: "Gerenciamento de Mídia", parent: "Serviços" },
  "/admin-bookings": { title: "Reservas", parent: "Gerenciamento de Reservas" },
  "/admin-chat": { title: "Chat com Usuários", parent: "Comunicação" },
  "/admin-payments": { title: "Pagamentos", parent: "Transações" },
  "/admin-cash-payments": { title: "Pagamentos Em Dinheiro", parent: "Transações" },
  "/admin-earnings": { title: "Ganhos", parent: "Transações" },
  "/admin-withdrawal-requests": { title: "Solicitações De Retirada", parent: "Transações" },
  "/admin-banners": { title: "Banner Promocional", parent: "Promoção" },
  "/admin-coupons": { title: "Lista De Cupons", parent: "Promoção" },
  "/admin-sliders": { title: "Lista De Sliders", parent: "Promoção" },
  "/admin-reports-transactions": { title: "Relatórios de Transações", parent: "Relatórios" },
  "/admin-reports-business": { title: "Relatórios de Negócios", parent: "Relatórios" },
  "/admin-reports-bookings": { title: "Relatórios de Reservas", parent: "Relatórios" },
  "/admin-reports-providers": { title: "Relatórios dos Provedores", parent: "Relatórios" },
  "/admin-page-configurations": { title: "Configuração de Páginas", parent: "Configuração" },
  "/admin-settings": { title: "Configurações Gerais", parent: "Configurações" },
  "/admin-page-settings": { title: "Configurações da Página", parent: "Configurações" },
  "/admin-social-settings": { title: "Redes Sociais", parent: "Configurações" },
  "/admin-notification-settings": { title: "Notificações", parent: "Configurações" },
};

export function ModernAdminLayout({ children }: ModernAdminLayoutProps) {
  const [location] = useLocation();
  
  const getCurrentBreadcrumb = () => {
    const current = routeBreadcrumbs[location];
    return current || { title: "Painel" };
  };

  const breadcrumb = getCurrentBreadcrumb();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/admin-dashboard">
                    Administração
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {breadcrumb.parent && (
                  <>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbPage>{breadcrumb.parent}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{breadcrumb.title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}