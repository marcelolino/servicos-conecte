import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { ClientLayout } from "@/components/layout/client-layout";
import { ChatInterface } from "@/components/chat/chat-interface";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  Users, 
  MessageSquare,
  Bell,
  Plus
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function ClientChatPage() {
  const { user, loading: isLoading } = useAuth();

  // Fetch unread message count
  const { data: unreadData } = useQuery({
    queryKey: ['/api/chat/unread-count'],
    queryFn: () => apiRequest('GET', '/api/chat/unread-count'),
    refetchInterval: 10000, // Check every 10 seconds
  });

  // Fetch conversations for stats
  const { data: conversations = [] } = useQuery({
    queryKey: ['/api/chat/conversations'],
    queryFn: () => apiRequest('GET', '/api/chat/conversations'),
  });

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <ClientLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Verificando acesso...</p>
          </div>
        </div>
      </ClientLayout>
    );
  }

  // Handle case where user is not authenticated or not a client
  if (!user || user.userType !== "client") {
    return (
      <ClientLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
          <p className="text-gray-600">Você precisa ser um cliente para acessar esta página.</p>
        </div>
      </ClientLayout>
    );
  }

  const totalConversations = conversations?.length || 0;
  const activeConversations = conversations?.filter((conv: any) => conv.status === 'active').length || 0;
  const unreadCount = unreadData?.unreadCount || 0;

  return (
    <ClientLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mensagens</h1>
            <p className="text-gray-600 mt-1">
              Converse com prestadores de serviços e suporte
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Conversa
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Conversas</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalConversations}</div>
              <p className="text-xs text-muted-foreground">
                Todas as suas conversas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversas Ativas</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeConversations}</div>
              <p className="text-xs text-muted-foreground">
                Conversas em andamento
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mensagens Não Lidas</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">{unreadCount}</div>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    Nova{unreadCount > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Requer sua atenção
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Chat Interface */}
        <Card>
          <CardContent className="p-0">
            <ChatInterface 
              currentUserId={user.id} 
              userType={user.userType} 
            />
          </CardContent>
        </Card>
      </div>
    </ClientLayout>
  );
}