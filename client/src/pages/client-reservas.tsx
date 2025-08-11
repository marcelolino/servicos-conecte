import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getAuthToken } from "@/lib/auth";
import { ModernClientLayout } from "@/components/layout/modern-client-layout";
import RatingModal from "@/components/rating-modal";
import { 
  Search, 
  Plus, 
  Clock, 
  CheckCircle, 
  Star,
  MapPin,
  Calendar,
  DollarSign,
  Play,
  XCircle,
  MessageCircle,
  Filter
} from "lucide-react";
import type { ServiceRequest, ServiceCategory } from "@shared/schema";

export default function ClientReservas() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState("all");
  const itemsPerPage = 6;

  const createChatMutation = useMutation({
    mutationFn: async ({ participantId, serviceRequestId }: { participantId: number; serviceRequestId: number }) => {
      return apiRequest('POST', '/api/chat/conversations', { 
        participantId, 
        serviceRequestId,
        title: `Serviço #${serviceRequestId}`
      });
    },
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
      window.location.href = '/client-chat';
      toast({
        title: "Chat iniciado",
        description: "Conversa iniciada com o prestador. Você foi redirecionado para o chat.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível iniciar o chat",
        variant: "destructive",
      });
    },
  });

  const handleStartChat = (providerId: number, serviceRequestId: number) => {
    createChatMutation.mutate({ participantId: providerId, serviceRequestId });
  };

  // Reset page when navigating or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [location, activeFilter]);



  // Fetch client's service requests
  const { data: serviceRequests, isLoading: requestsLoading } = useQuery({
    queryKey: ["/api/service-requests/client"],
    enabled: !!user,
  });



  // Start service mutation
  const startServiceMutation = useMutation({
    mutationFn: (requestId: string) =>
      apiRequest("PUT", `/api/service-requests/${requestId}/start`),
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Serviço iniciado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests/client"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao iniciar serviço.",
        variant: "destructive",
      });
    },
  });

  // Complete service mutation
  const completeServiceMutation = useMutation({
    mutationFn: (requestId: string) =>
      apiRequest("PUT", `/api/service-requests/${requestId}/complete`),
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Serviço finalizado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests/client"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao finalizar serviço.",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "accepted":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "in_progress":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendente";
      case "accepted":
        return "Aceita";
      case "in_progress":
        return "Em Andamento";
      case "completed":
        return "Concluída";
      case "cancelled":
        return "Cancelada";
      default:
        return "Pendente";
    }
  };

  const getFilterStatusText = (filter: string) => {
    switch (filter) {
      case "pending":
        return "pendentes";
      case "accepted":
        return "aceitas";
      case "in_progress":
        return "em andamento";
      case "completed":
        return "concluídas";
      case "cancelled":
        return "canceladas";
      default:
        return "";
    }
  };

  const canStartService = (request: any) => request.status === "accepted";
  const canCompleteService = (request: any) => request.status === "in_progress";

  const getServiceActionButton = (request: any) => {
    if (canStartService(request)) {
      return (
        <Button
          size="sm"
          onClick={() => startServiceMutation.mutate(request.id)}
          disabled={startServiceMutation.isPending}
          className="bg-green-600 hover:bg-green-700"
        >
          {startServiceMutation.isPending ? (
            <Clock className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Play className="h-4 w-4 mr-1" />
          )}
          Iniciar Serviço
        </Button>
      );
    }

    if (canCompleteService(request)) {
      return (
        <Button
          size="sm"
          onClick={() => completeServiceMutation.mutate(request.id)}
          disabled={completeServiceMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {completeServiceMutation.isPending ? (
            <CheckCircle className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4 mr-1" />
          )}
          Finalizar Serviço
        </Button>
      );
    }

    if (request.status === "completed" && request.provider) {
      return (
        <RatingModal
          serviceRequestId={request.id}
          providerId={request.provider.id}
          providerName={request.provider.user?.name || "Prestador"}
          trigger={
            <Button variant="outline" size="sm">
              <Star className="h-4 w-4 mr-1" />
              Avaliar
            </Button>
          }
          onSuccess={() => {
            toast({
              title: "Avaliação enviada!",
              description: "Sua avaliação foi registrada com sucesso.",
            });
          }}
        />
      );
    }

    return null;
  };

  const getFilteredRequests = () => {
    if (!serviceRequests || !Array.isArray(serviceRequests)) return [];
    
    if (activeFilter === "all") return serviceRequests;
    
    return serviceRequests.filter(request => {
      switch (activeFilter) {
        case "pending":
          return request.status === "pending";
        case "accepted":
          return request.status === "accepted";
        case "in_progress":
          return request.status === "in_progress";
        case "completed":
          return request.status === "completed";
        case "cancelled":
          return request.status === "cancelled";
        default:
          return true;
      }
    });
  };

  const getStatusCounts = () => {
    if (!serviceRequests || !Array.isArray(serviceRequests)) {
      return {
        all: 0,
        pending: 0,
        accepted: 0,
        in_progress: 0,
        completed: 0,
        cancelled: 0
      };
    }

    return {
      all: serviceRequests.length,
      pending: serviceRequests.filter(r => r.status === "pending").length,
      accepted: serviceRequests.filter(r => r.status === "accepted").length,
      in_progress: serviceRequests.filter(r => r.status === "in_progress").length,
      completed: serviceRequests.filter(r => r.status === "completed").length,
      cancelled: serviceRequests.filter(r => r.status === "cancelled").length,
    };
  };

  const getPaginatedRequests = () => {
    const filteredRequests = getFilteredRequests();
    
    const totalItems = filteredRequests.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = filteredRequests.slice(startIndex, endIndex);
    
    return {
      currentItems,
      totalPages,
      totalItems
    };
  };



  const { currentItems, totalPages, totalItems } = getPaginatedRequests();

  const renderRequestList = () => {
    if (requestsLoading) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Skeleton className="h-6 w-64 mb-2" />
                    <Skeleton className="h-4 w-32 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (currentItems.length === 0 && !requestsLoading) {
      return (
        <Card>
          <CardContent className="p-12 text-center">
            <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {activeFilter === "all" ? "Nenhuma solicitação encontrada" : `Nenhuma reserva ${getFilterStatusText(activeFilter)} encontrada`}
            </h3>
            <p className="text-muted-foreground">
              {activeFilter === "all" 
                ? "Você ainda não criou nenhuma solicitação de serviço. Acesse a página inicial para fazer uma nova solicitação."
                : `Não há reservas com status "${getFilterStatusText(activeFilter)}" no momento.`
              }
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {currentItems.map((request: ServiceRequest & { category: ServiceCategory; provider?: any }) => (
          <div key={request.id} className="reservation-card">
            <div className="space-y-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-foreground">{request.title || 'Sem título'}</h3>
                    <Badge className={`px-3 py-1 rounded-full text-xs ${getStatusColor(request.status || 'pending')}`}>
                      {getStatusText(request.status || 'pending')}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {request.category?.name} • {request.createdAt ? new Date(request.createdAt).toLocaleDateString('pt-BR') : ''}
                  </p>
                  <p className="text-sm text-foreground mb-3">{request.description}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {request.city}, {request.state}
                    </div>
                    {request.estimatedPrice && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        R$ {Number(request.estimatedPrice).toFixed(2)}
                      </div>
                    )}
                    {request.scheduledAt && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(request.scheduledAt).toLocaleDateString('pt-BR')} às {new Date(request.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLocation(`/client-booking-details/${request.id}`)}
                  >
                    Ver Detalhes
                  </Button>
                  {(request.status === 'accepted' || request.status === 'in_progress' || request.status === 'completed') && request.provider && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-blue-600 hover:text-blue-700"
                      onClick={() => handleStartChat(request.provider.userId, request.id)}
                      disabled={createChatMutation.isPending}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Chat
                    </Button>
                  )}
                  {getServiceActionButton(request)}
                </div>
              </div>
              
              {request.provider && (
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">
                          {request.provider.user?.name?.charAt(0) || "P"}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {request.provider.user?.name || "Prestador"}
                        </p>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-400 fill-current" />
                          <span className="text-xs text-muted-foreground">
                            {Number(request.provider.rating || 0).toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <ModernClientLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Meu Histórico
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Acompanhe o status dos seus serviços solicitados
          </p>
        </div>

        <div className="space-y-6">
          {/* Summary Header */}
          <div className="flex items-center justify-end">
            <div className="text-sm text-muted-foreground">
              {totalItems > 0 && `${totalItems} solicitaç${totalItems === 1 ? 'ão' : 'ões'} encontrada${totalItems === 1 ? '' : 's'}`}
            </div>
          </div>

          {/* Status Filter Tabs */}
          <Tabs value={activeFilter} onValueChange={setActiveFilter} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-6 h-auto p-1">
              <TabsTrigger value="all" className="flex items-center gap-1 justify-center text-xs sm:text-sm px-2 py-2">
                <span className="hidden sm:inline">Todas Reservas</span>
                <span className="sm:hidden">Todas</span>
                {(() => {
                  const counts = getStatusCounts();
                  return counts.all > 0 && (
                    <Badge variant="secondary" className="ml-1 h-4 min-w-[16px] text-[10px]">
                      {counts.all}
                    </Badge>
                  );
                })()}
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex items-center gap-1 justify-center text-xs sm:text-sm px-2 py-2">
                <span className="hidden md:inline">Solicitações Pendentes</span>
                <span className="md:hidden">Pendentes</span>
                {(() => {
                  const counts = getStatusCounts();
                  return counts.pending > 0 && (
                    <Badge variant="secondary" className="ml-1 h-4 min-w-[16px] text-[10px] bg-yellow-100 text-yellow-800">
                      {counts.pending}
                    </Badge>
                  );
                })()}
              </TabsTrigger>
              <TabsTrigger value="accepted" className="flex items-center gap-1 justify-center text-xs sm:text-sm px-2 py-2">
                <span className="hidden md:inline">Reservas Aceitas</span>
                <span className="md:hidden">Aceitas</span>
                {(() => {
                  const counts = getStatusCounts();
                  return counts.accepted > 0 && (
                    <Badge variant="secondary" className="ml-1 h-4 min-w-[16px] text-[10px] bg-blue-100 text-blue-800">
                      {counts.accepted}
                    </Badge>
                  );
                })()}
              </TabsTrigger>
              <TabsTrigger value="in_progress" className="flex items-center gap-1 justify-center text-xs sm:text-sm px-2 py-2">
                <span className="hidden sm:inline">Em Andamento</span>
                <span className="sm:hidden">Em Andamento</span>
                {(() => {
                  const counts = getStatusCounts();
                  return counts.in_progress > 0 && (
                    <Badge variant="secondary" className="ml-1 h-4 min-w-[16px] text-[10px] bg-purple-100 text-purple-800">
                      {counts.in_progress}
                    </Badge>
                  );
                })()}
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center gap-1 justify-center text-xs sm:text-sm px-2 py-2">
                <span>Concluídas</span>
                {(() => {
                  const counts = getStatusCounts();
                  return counts.completed > 0 && (
                    <Badge variant="secondary" className="ml-1 h-4 min-w-[16px] text-[10px] bg-green-100 text-green-800">
                      {counts.completed}
                    </Badge>
                  );
                })()}
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="flex items-center gap-1 justify-center text-xs sm:text-sm px-2 py-2">
                <span>Canceladas</span>
                {(() => {
                  const counts = getStatusCounts();
                  return counts.cancelled > 0 && (
                    <Badge variant="secondary" className="ml-1 h-4 min-w-[16px] text-[10px] bg-red-100 text-red-800">
                      {counts.cancelled}
                    </Badge>
                  );
                })()}
              </TabsTrigger>
            </TabsList>

            {/* Tab Contents */}
            <TabsContent value={activeFilter} className="mt-0">
              {/* Request List */}
              {renderRequestList()}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <Button
                        key={page}
                        variant={page === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Próxima
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>


      </div>
    </ModernClientLayout>
  );
}