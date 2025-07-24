import { useAuth } from "@/hooks/use-auth";
import ClientSidebar from "./client-sidebar";
import { Loader2 } from "lucide-react";
import { ChatNotification } from "@/components/chat/chat-notification";

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
    window.location.href = "/login";
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