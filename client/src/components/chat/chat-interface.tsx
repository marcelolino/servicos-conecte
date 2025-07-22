import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Send, 
  Search, 
  MessageCircle, 
  MoreVertical,
  User,
  Settings
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ChatConversation {
  id: number;
  participantOneId: number;
  participantTwoId: number;
  serviceRequestId?: number;
  title?: string;
  status: string;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
  participantOne: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    userType: string;
  };
  participantTwo: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    userType: string;
  };
  lastMessage?: {
    id: number;
    content: string;
    messageType: string;
    createdAt: string;
    senderId: number;
  };
}

interface ChatMessage {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  messageType: string;
  attachmentUrl?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  sender: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    userType: string;
  };
}

interface ChatInterfaceProps {
  currentUserId: number;
  userType: string;
}

export function ChatInterface({ currentUserId, userType }: ChatInterfaceProps) {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ['/api/chat/conversations'],
    queryFn: () => apiRequest('GET', '/api/chat/conversations'),
  });

  // Fetch selected conversation with messages
  const { data: conversationDetails, isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/chat/conversations', selectedConversation],
    queryFn: () => apiRequest('GET', `/api/chat/conversations/${selectedConversation}`),
    enabled: !!selectedConversation,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (data: { content: string; messageType?: string }) =>
      apiRequest('POST', `/api/chat/conversations/${selectedConversation}/messages`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations', selectedConversation] });
      setNewMessage("");
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationDetails?.messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    sendMessageMutation.mutate({
      content: newMessage.trim(),
      messageType: 'text'
    });
  };

  const getOtherParticipant = (conversation: ChatConversation) => {
    return conversation.participantOneId === currentUserId 
      ? conversation.participantTwo 
      : conversation.participantOne;
  };

  const filteredConversations = conversations.filter((conv: ChatConversation) => {
    const otherParticipant = getOtherParticipant(conv);
    return otherParticipant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           otherParticipant.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getUserTypeLabel = (type: string) => {
    switch (type) {
      case 'admin': return 'Admin';
      case 'provider': return 'Prestador';
      case 'client': return 'Cliente';
      default: return type;
    }
  };

  const getUserTypeColor = (type: string) => {
    switch (type) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'provider': return 'bg-blue-100 text-blue-800';
      case 'client': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex h-[600px] bg-white rounded-lg border shadow-sm">
      {/* Conversations List */}
      <div className="w-1/3 border-r">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Mensagens
            </h2>
            <Button size="sm" variant="outline">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar conversas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <ScrollArea className="h-[calc(600px-120px)]">
          {conversationsLoading ? (
            <div className="p-4 text-center text-gray-500">
              Carregando conversas...
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {searchTerm ? "Nenhuma conversa encontrada" : "Nenhuma conversa ainda"}
            </div>
          ) : (
            <div className="divide-y">
              {filteredConversations.map((conversation: ChatConversation) => {
                const otherParticipant = getOtherParticipant(conversation);
                const isSelected = selectedConversation === conversation.id;
                
                return (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation.id)}
                    className={cn(
                      "p-3 cursor-pointer hover:bg-gray-50 transition-colors",
                      isSelected && "bg-blue-50 border-r-2 border-blue-500"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={otherParticipant.avatar} />
                        <AvatarFallback>
                          {otherParticipant.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-sm truncate">
                            {otherParticipant.name}
                          </h3>
                          <Badge 
                            variant="secondary" 
                            className={cn("text-xs", getUserTypeColor(otherParticipant.userType))}
                          >
                            {getUserTypeLabel(otherParticipant.userType)}
                          </Badge>
                        </div>
                        
                        {conversation.lastMessage && (
                          <p className="text-xs text-gray-500 truncate mt-1">
                            {conversation.lastMessage.content}
                          </p>
                        )}
                        
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(conversation.lastMessageAt), {
                            addSuffix: true,
                            locale: ptBR
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            {conversationDetails && (
              <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={getOtherParticipant(conversationDetails).avatar} />
                      <AvatarFallback>
                        {getOtherParticipant(conversationDetails).name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">
                        {getOtherParticipant(conversationDetails).name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {getUserTypeLabel(getOtherParticipant(conversationDetails).userType)}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {messagesLoading ? (
                <div className="text-center text-gray-500">
                  Carregando mensagens...
                </div>
              ) : conversationDetails?.messages?.length === 0 ? (
                <div className="text-center text-gray-500">
                  Nenhuma mensagem ainda. Seja o primeiro a enviar uma mensagem!
                </div>
              ) : (
                <div className="space-y-4">
                  {conversationDetails?.messages?.map((message: ChatMessage) => {
                    const isOwnMessage = message.senderId === currentUserId;
                    
                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "flex",
                          isOwnMessage ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[70%] rounded-lg px-3 py-2",
                            isOwnMessage 
                              ? "bg-blue-500 text-white" 
                              : "bg-gray-200 text-gray-900"
                          )}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className={cn(
                            "text-xs mt-1",
                            isOwnMessage ? "text-blue-100" : "text-gray-500"
                          )}>
                            {formatDistanceToNow(new Date(message.createdAt), {
                              addSuffix: true,
                              locale: ptBR
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Digite sua mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  type="submit" 
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Selecione uma conversa</h3>
              <p className="text-sm">Escolha uma conversa da lista para começar a conversar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}