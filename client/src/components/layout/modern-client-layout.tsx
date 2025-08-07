import { ClientSidebarModern } from "@/components/layout/client-sidebar-modern";
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

interface ModernClientLayoutProps {
  children: React.ReactNode;
}

const routeBreadcrumbs: Record<string, { title: string; parent?: string }> = {
  "/client-dashboard": { title: "Painel" },
  "/client-reservas": { title: "Reservas" },
  "/client-orders": { title: "Meu Histórico de Reservas" },
  "/client-chat": { title: "Mensagens" },
  "/client-offers": { title: "Ofertas" },
  "/client-booking-details": { title: "Detalhes da Reserva", parent: "Reservas" },
  "/client-order-details": { title: "Detalhes do Pedido", parent: "Histórico" },
};

export function ModernClientLayout({ children }: ModernClientLayoutProps) {
  const [location] = useLocation();
  
  const getCurrentBreadcrumb = () => {
    // Check for dynamic routes first
    if (location.startsWith("/client-booking-details/")) {
      return { title: "Detalhes da Reserva", parent: "Reservas" };
    }
    if (location.startsWith("/client-order-details/")) {
      return { title: "Detalhes do Pedido", parent: "Histórico" };
    }
    
    const current = routeBreadcrumbs[location];
    return current || { title: "Painel" };
  };

  const breadcrumb = getCurrentBreadcrumb();

  return (
    <SidebarProvider>
      <ClientSidebarModern />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/client-dashboard">
                    Painel do Cliente
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