import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Calendar } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

interface ChatNotificationProps {
  userType: "client" | "provider" | "admin";
}

export function ChatNotification({ userType }: ChatNotificationProps) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  // Buscar conversas não lidas
  const { data: conversations } = useQuery({
    queryKey: ["/api/chat/conversations"],
    enabled: !!user,
    refetchInterval: 3000, // Atualizar a cada 3 segundos
  });

  // Buscar contagem de mensagens não lidas
  const { data: unreadData } = useQuery({
    queryKey: ["/api/chat/unread-count"],
    enabled: !!user,
    refetchInterval: 3000, // Atualizar a cada 3 segundos
  });

  useEffect(() => {
    if (unreadData?.count) {
      setUnreadCount(unreadData.count);
    } else {
      setUnreadCount(0);
    }
  }, [unreadData]);

  const getChatPath = () => {
    switch (userType) {
      case "client":
        return "/client-chat";
      case "provider":
        return "/provider-chat";
      case "admin":
        return "/admin-dashboard?tab=chat";
      default:
        return "/chat";
    }
  };

  const getReservasPath = () => {
    switch (userType) {
      case "client":
        return "/client-reservas";
      case "provider":
        return "/provider-bookings";
      default:
        return "/reservas";
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Botão Reservas para cliente */}
      {userType === "client" && (
        <Link href={getReservasPath()}>
          <Button variant="ghost" size="sm" className="relative">
            <Calendar className="h-4 w-4 mr-2" />
            Reservas
          </Button>
        </Link>
      )}

      {/* Notificação de Chat */}
      <Link href={getChatPath()}>
        <Button variant="ghost" size="sm" className="relative">
          <MessageCircle className="h-4 w-4 mr-2" />
          Chat
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </Link>
    </div>
  );
}

export default ChatNotification;