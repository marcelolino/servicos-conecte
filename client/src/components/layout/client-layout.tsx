import { useAuth } from "@/hooks/use-auth";
import { useMobileMenu } from "@/hooks/use-mobile-menu";
import ClientSidebar from "./client-sidebar";
import { Loader2, Calendar, Menu, X } from "lucide-react";
import { ChatNotification } from "@/components/chat/chat-notification";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface ClientLayoutProps {
  children: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const { user, loading: authLoading, isLoggingOut } = useAuth();
  const { isMobile, isMobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useMobileMenu();

  // Show loading while checking authentication or logging out
  if (authLoading || isLoggingOut) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{isLoggingOut ? "Saindo..." : "Carregando..."}</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    // Use React Router navigation instead of window.location
    setTimeout(() => {
      window.location.href = "/login";
    }, 100);
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      {/* Mobile Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "transition-transform duration-300 z-50",
        isMobile ? (isMobileMenuOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0",
        isMobile ? "fixed inset-y-0 left-0" : ""
      )}>
        <ClientSidebar onMobileMenuClose={closeMobileMenu} isMobile={isMobile} />
      </div>

      <div className={cn(
        "flex-1 flex flex-col overflow-hidden transition-all duration-300",
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
                Painel do Cliente
              </h1>
            </div>
            <ChatNotification userType="client" />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default ClientLayout;