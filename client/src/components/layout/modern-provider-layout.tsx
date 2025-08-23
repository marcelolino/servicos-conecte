import { ProviderSidebar } from "@/components/layout/provider-sidebar";
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
import { ProviderNotifications } from "@/components/notifications/provider-notifications";

interface ModernProviderLayoutProps {
  children: React.ReactNode;
}

const routeBreadcrumbs: Record<string, { title: string; parent?: string }> = {
  "/provider-dashboard": { title: "Painel" },
  "/provider-bookings": { title: "Todas Reservas", parent: "Reservas" },
  "/provider-bookings/pending": { title: "Solicitações Pendentes", parent: "Reservas" },
  "/provider-bookings/accepted": { title: "Reservas Aceitas", parent: "Reservas" },
  "/provider-bookings/ongoing": { title: "Em Andamento", parent: "Reservas" },
  "/provider-bookings/completed": { title: "Concluídas", parent: "Reservas" },
  "/provider-bookings/cancelled": { title: "Canceladas", parent: "Reservas" },
  "/provider-all-services": { title: "Todos De Serviços", parent: "Serviços" },
  "/provider-packages": { title: "Pacotes", parent: "Serviços" },
  "/provider-add-ons": { title: "Complementos", parent: "Serviços" },
  "/provider-service-requests": { title: "Solicitações de Serviço", parent: "Serviços" },
  "/provider-service-subscriptions": { title: "Minhas Inscrições", parent: "Serviços" },
  "/meus-servicos": { title: "Tipos de Cobrança", parent: "Serviços" },
  "/employee-management": { title: "Funcionários" },
  "/provider-chat": { title: "Mensagens" },
  "/provider-wallet": { title: "Carteira" },
  "/provider-payment-methods": { title: "Métodos de Pagamento", parent: "Carteira" },
  "/provider-promotional-banners": { title: "Banner Promocional Do Provedor" },
};

export function ModernProviderLayout({ children }: ModernProviderLayoutProps) {
  const [location] = useLocation();
  
  const getCurrentBreadcrumb = () => {
    const current = routeBreadcrumbs[location];
    return current || { title: "Painel" };
  };

  const breadcrumb = getCurrentBreadcrumb();

  return (
    <SidebarProvider>
      <ProviderSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center justify-between gap-2 px-4 w-full">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/provider-dashboard">
                      Painel do Prestador
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
            <div className="flex items-center gap-2">
              <ProviderNotifications />
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}