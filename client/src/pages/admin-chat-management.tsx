import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageCircle, Search, Users, UserCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface User {
  id: number;
  name: string;
  email: string;
  userType: 'client' | 'provider' | 'admin';
  avatar?: string;
  phone?: string;
  isActive: boolean;
}

interface Conversation {
  id: number;
  participantOneId: number;
  participantTwoId: number;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
  participantOne: User;
  participantTwo: User;
}

export default function AdminChatManagement() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState<string>("all");

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    enabled: user?.userType === 'admin'
  });

  const { data: conversations = [], isLoading: conversationsLoading } = useQuery<Conversation[]>({
    queryKey: ['/api/chat/conversations'],
    enabled: user?.userType === 'admin'
  });

  if (!user || user.userType !== 'admin') {
    return <div>Acesso negado</div>;
  }

  const filteredUsers = users.filter((u) => {
    if (u.id === user.id) return false; // Don't show admin themselves
    
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = userTypeFilter === "all" || u.userType === userTypeFilter;
    
    return matchesSearch && matchesType;
  });

  const handleStartChat = async (targetUserId: number) => {
    try {
      const response = await apiRequest('/api/chat/conversations', 'POST', { targetUserId });
      
      if (response.conversationId) {
        setLocation(`/admin-chat/${response.conversationId}`);
      }
    } catch (error) {
      console.error('Erro ao iniciar conversa:', error);
    }
  };

  const getExistingConversation = (targetUserId: number) => {
    return conversations.find((conv) => 
      conv.participantOneId === targetUserId || conv.participantTwoId === targetUserId
    );
  };

  const getUserTypeLabel = (userType: string) => {
    switch (userType) {
      case 'client': return 'Cliente';
      case 'provider': return 'Prestador';
      case 'admin': return 'Admin';
      default: return userType;
    }
  };

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case 'client': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'provider': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'admin': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Chat com Usuários</h1>
          <p className="text-gray-600 dark:text-gray-400">Comunique-se com clientes e prestadores</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversas Ativas</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{conversations.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários Online</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.filter((u) => u.isActive).length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Existing Conversations */}
        {conversations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Conversas Existentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {conversations.map((conversation) => {
                  const otherUser = conversation.participantOneId === user.id 
                    ? conversation.participantTwo 
                    : conversation.participantOne;
                  
                  return (
                    <div key={conversation.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={otherUser.avatar} />
                          <AvatarFallback>{otherUser.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{otherUser.name}</p>
                          <p className="text-sm text-gray-500">{otherUser.email}</p>
                          {conversation.lastMessage && (
                            <p className="text-sm text-gray-400 truncate max-w-xs">
                              {conversation.lastMessage}
                            </p>
                          )}
                        </div>
                        <Badge className={getUserTypeColor(otherUser.userType)}>
                          {getUserTypeLabel(otherUser.userType)}
                        </Badge>
                      </div>
                      <Button 
                        onClick={() => setLocation(`/admin-chat/${conversation.id}`)}
                        variant="outline"
                        size="sm"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Abrir Chat
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* User Search and Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Iniciar Nova Conversa</CardTitle>
            <div className="flex space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar usuários por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os usuários</SelectItem>
                  <SelectItem value="client">Clientes</SelectItem>
                  <SelectItem value="provider">Prestadores</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {usersLoading || conversationsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredUsers.map((targetUser) => {
                  const existingConv = getExistingConversation(targetUser.id);
                  
                  return (
                    <div key={targetUser.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={targetUser.avatar} />
                          <AvatarFallback>{targetUser.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{targetUser.name}</p>
                          <p className="text-sm text-gray-500">{targetUser.email}</p>
                          {targetUser.phone && (
                            <p className="text-sm text-gray-400">{targetUser.phone}</p>
                          )}
                        </div>
                        <Badge className={getUserTypeColor(targetUser.userType)}>
                          {getUserTypeLabel(targetUser.userType)}
                        </Badge>
                        {!targetUser.isActive && (
                          <Badge variant="secondary">Inativo</Badge>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        {existingConv ? (
                          <Button 
                            onClick={() => setLocation(`/admin-chat/${existingConv.id}`)}
                            variant="outline"
                            size="sm"
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Continuar Chat
                          </Button>
                        ) : (
                          <Button 
                            onClick={() => handleStartChat(targetUser.id)}
                            size="sm"
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Iniciar Chat
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {filteredUsers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? 'Nenhum usuário encontrado com os critérios de busca.' : 'Nenhum usuário disponível.'}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}