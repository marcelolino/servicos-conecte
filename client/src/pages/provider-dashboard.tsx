import { useAuth } from "@/hooks/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ProviderLayout from "@/components/layout/provider-layout";
import ProviderDashboardHome from "./provider-dashboard-home";
import CreateProviderProfile from "@/components/create-provider-profile";

export default function ProviderDashboard() {
  const { user, loading: authLoading, isLoggingOut } = useAuth();
  const queryClient = useQueryClient();

  // Fetch provider data
  const { data: provider, isLoading: providerLoading } = useQuery({
    queryKey: ["/api/providers/me"],
    enabled: user?.userType === "provider",
  });

  // Show loading while checking authentication or logging out
  if (authLoading || isLoggingOut) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{isLoggingOut ? "Saindo..." : "Carregando..."}</p>
        </div>
      </div>
    );
  }

  if (!user || user.userType !== "provider") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Acesso Negado</h1>
          <p className="text-muted-foreground">Você precisa ser um prestador para acessar esta página.</p>
        </div>
      </div>
    );
  }

  if (providerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <CreateProviderProfile
        userId={user.id}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/providers/me"] });
        }}
      />
    );
  }

  return (
    <ProviderLayout>
      <ProviderDashboardHome />
    </ProviderLayout>
  );
}