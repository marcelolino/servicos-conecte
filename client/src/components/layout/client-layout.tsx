import { useAuth } from "@/hooks/use-auth";
import ClientSidebar from "./client-sidebar";
import { Loader2, Calendar } from "lucide-react";
import { ChatNotification } from "@/components/chat/chat-notification";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface ClientLayoutProps {
  children: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const { user, loading: authLoading, isLoggingOut } = useAuth();

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
      <ClientSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with notifications */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Painel do Cliente
            </h1>
            <div className="flex items-center gap-3">
              <Link href="/client-bookings">
                <Button variant="default" size="sm" className="bg-primary hover:bg-primary/90">
                  <Calendar className="h-4 w-4 mr-2" />
                  Reservas
                </Button>
              </Link>
              <ChatNotification userType="client" />
            </div>
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