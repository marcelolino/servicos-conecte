import React, { useState } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  CalendarDays,
  MapPin,
  DollarSign,
  User,
  Phone,
  Mail,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
  CreditCard
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ProviderLayout from "@/components/layout/provider-layout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface BookingDetailsData {
  id: number;
  clientId: number;
  categoryId: number;
  providerId: number;
  status: string;
  totalAmount: string;
  paymentMethod: string;
  paymentStatus: string;
  address: string;
  cep: string;
  city: string;
  state: string;
  scheduledAt: string;
  notes?: string;
  createdAt: string;
  client: {
    id: number;
    name: string;
    email: string;
    phone?: string;
  };
  category: {
    id: number;
    name: string;
    description?: string;
  };
  provider: {
    id: number;
    rating: string;
    totalReviews: number;
  };
}

export default function ProviderBookingDetailsPage() {
  const [match] = useRoute("/provider-bookings/details/:id");
  const bookingId = match?.id;
  const [notes, setNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: booking, isLoading } = useQuery<BookingDetailsData>({
    queryKey: [`/api/service-requests/${bookingId}`],
    enabled: !!bookingId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, notes }: { status: string; notes?: string }) => {
      return apiRequest("PUT", `/api/service-requests/${bookingId}`, { status, notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/service-requests/${bookingId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests/provider"] });
      toast({
        title: "Status atualizado",
        description: "O status da reserva foi atualizado com sucesso.",
      });
      setNotes("");
      setIsProcessing(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao atualizar o status.",
        variant: "destructive",
      });
      setIsProcessing(false);
    },
  });

  const handleStatusUpdate = async (status: string) => {
    setIsProcessing(true);
    updateStatusMutation.mutate({ status, notes: notes || undefined });
  };

  if (isLoading) {
    return (
      <ProviderLayout>
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </ProviderLayout>
    );
  }

  if (!booking) {
    return (
      <ProviderLayout>
        <div className="p-6">
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Reserva não encontrada</p>
            <Button variant="outline" className="mt-4" onClick={() => window.history.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>
        </div>
      </ProviderLayout>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'accepted':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'in_progress':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'accepted':
        return 'Aceita';
      case 'in_progress':
        return 'Em Andamento';
      case 'completed':
        return 'Concluída';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  const canAccept = booking.status === 'pending';
  const canStart = booking.status === 'accepted';
  const canComplete = booking.status === 'in_progress';
  const canCancel = ['pending', 'accepted'].includes(booking.status);

  return (
    <ProviderLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              Reserva #{booking.id.toString().padStart(5, '0')}
            </h1>
            <p className="text-muted-foreground">
              Período da Reserva: {format(new Date(booking.scheduledAt), 'dd-MMM-yyyy HH:mm', { locale: ptBR })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={getStatusColor(booking.status)}>
              {getStatusText(booking.status)}
            </Badge>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Status de Pagamento: 
              <span className={booking.paymentStatus === 'completed' ? 'text-green-600 font-medium' : 'text-yellow-600 font-medium'}>
                {booking.paymentStatus === 'completed' ? 'Pago' : 'Não Pago'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Data Agendada: {format(new Date(booking.scheduledAt), 'dd-MMM-yyyy', { locale: ptBR })}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Data da Reserva: {format(new Date(booking.createdAt), 'dd-MMM-yyyy HH:mm', { locale: ptBR })}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Resumo da Reserva
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Serviço</Label>
                    <p className="text-base font-medium">{booking.category.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Preço</Label>
                    <div className="flex items-center gap-1">
                      <span className="text-base font-semibold">
                        {parseFloat(booking.totalAmount).toLocaleString('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL' 
                        })}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Quantidade</Label>
                    <span className="text-base">1</span>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Desconto</Label>
                    <span className="text-base">
                      {(0).toLocaleString('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                      })}
                    </span>
                  </div>
                </div>

                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Valor do Serviço (Não Incluído):</span>
                    <span>{(parseFloat(booking.totalAmount) * 0.9).toLocaleString('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL' 
                    })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Desconto de Serviço:</span>
                    <span>{(0).toLocaleString('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL' 
                    })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Desconto de Cupom:</span>
                    <span>-{(0).toLocaleString('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL' 
                    })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Desconto de Campanha:</span>
                    <span>-{(0).toLocaleString('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL' 
                    })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Desconto de Referência:</span>
                    <span>{(0).toLocaleString('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL' 
                    })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IVA / Taxa:</span>
                    <span>+{(parseFloat(booking.totalAmount) * 0.1).toLocaleString('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL' 
                    })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxa de Serviço:</span>
                    <span>+{(0).toLocaleString('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL' 
                    })}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total Geral:</span>
                    <span>{parseFloat(booking.totalAmount).toLocaleString('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL' 
                    })}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Service Location */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Local do Serviço
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm font-medium text-yellow-800">
                    Você precisa ir ao Local do Cliente para fornecer este serviço
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Local do Serviço</Label>
                  <p className="font-medium">{booking.address}</p>
                  <p className="text-sm text-muted-foreground">
                    {booking.city}, {booking.state} - {booking.cep}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Informações do Cliente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{booking.client.name}</p>
                    <p className="text-xs text-muted-foreground">+••••••••••</p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {booking.address}
                </div>
              </CardContent>
            </Card>

            {/* Serviceman Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Informações do Prestador
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <User className="w-6 h-6" />
                  </div>
                  <p className="text-sm">Sem informações do prestador</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    ATRIBUIR PRESTADOR
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Booking Setup */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg">Configuração da Reserva</span>
                  <Button size="sm" variant="outline" className="bg-blue-600 text-white hover:bg-blue-700">
                    FATURA
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status de Pagamento:</span>
                  <Badge className={booking.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                    {booking.paymentStatus === 'completed' ? 'Pago' : 'Não Pago'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Data Agendada:</span>
                  <span className="text-sm">{format(new Date(booking.scheduledAt), 'dd-MMM-yyyy HH:mm', { locale: ptBR })}</span>
                </div>
                
                <Separator />

                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    size="sm" 
                    variant="destructive"
                    disabled={booking.status !== 'pending'}
                  >
                    IGNORAR
                  </Button>
                  <Button 
                    size="sm"
                    variant="default"
                    className="bg-green-600 hover:bg-green-700"
                    disabled={booking.status !== 'pending'}
                    onClick={() => handleStatusUpdate('accepted')}
                  >
                    ACEITAR
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProviderLayout>
  );
}