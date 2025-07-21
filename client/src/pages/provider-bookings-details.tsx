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
              Detalhes da Reserva #{booking.id.toString().padStart(5, '0')}
            </h1>
            <p className="text-muted-foreground">
              Informações detalhadas da solicitação de serviço
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={getStatusColor(booking.status)}>
              {getStatusText(booking.status)}
            </Badge>
            {booking.paymentStatus === 'completed' && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Pagamento Confirmado
              </Badge>
            )}
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
                  Informações do Serviço
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Categoria</Label>
                    <p className="text-base font-medium">{booking.category.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Valor Total</Label>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="text-base font-semibold text-green-600">
                        R$ {parseFloat(booking.totalAmount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Método de Pagamento</Label>
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      <span className="capitalize">{booking.paymentMethod}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Data/Hora Agendada</Label>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4" />
                      <div>
                        <p>{format(new Date(booking.scheduledAt), 'dd/MM/yyyy', { locale: ptBR })}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(booking.scheduledAt), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Local do Serviço</Label>
                  <div className="flex items-start gap-2 mt-1">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">{booking.address}</p>
                      <p className="text-sm text-muted-foreground">
                        {booking.city}, {booking.state} - CEP: {booking.cep}
                      </p>
                    </div>
                  </div>
                </div>

                {booking.notes && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Observações do Cliente</Label>
                    <p className="mt-1 p-3 bg-muted rounded-md text-sm">{booking.notes}</p>
                  </div>
                )}
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
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{booking.client.name}</p>
                      <p className="text-sm text-muted-foreground">Cliente</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{booking.client.email}</span>
                    </div>
                    {booking.client.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{booking.client.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Booking Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status da Reserva</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Badge className={getStatusColor(booking.status)} size="lg">
                    {getStatusText(booking.status)}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-2">
                    Criada em {format(new Date(booking.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </p>
                </div>
                
                <Separator />

                {/* Action Buttons */}
                <div className="space-y-2">
                  {canAccept && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full" variant="default">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Aceitar Reserva
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Aceitar Reserva</DialogTitle>
                          <DialogDescription>
                            Confirme que você pode realizar este serviço na data e horário solicitados.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Label htmlFor="accept-notes">Observações (opcional)</Label>
                          <Textarea
                            id="accept-notes"
                            placeholder="Adicione observações sobre a aceitação..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                          />
                        </div>
                        <DialogFooter>
                          <Button
                            onClick={() => handleStatusUpdate('accepted')}
                            disabled={isProcessing}
                          >
                            {isProcessing ? "Processando..." : "Confirmar Aceitação"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}

                  {canStart && (
                    <Button
                      className="w-full"
                      variant="default"
                      onClick={() => handleStatusUpdate('in_progress')}
                      disabled={isProcessing}
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Iniciar Serviço
                    </Button>
                  )}

                  {canComplete && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full" variant="default">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Finalizar Serviço
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Finalizar Serviço</DialogTitle>
                          <DialogDescription>
                            Confirme a conclusão do serviço. Esta ação não poderá ser desfeita.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Label htmlFor="complete-notes">Observações finais (opcional)</Label>
                          <Textarea
                            id="complete-notes"
                            placeholder="Descreva os trabalhos realizados..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                          />
                        </div>
                        <DialogFooter>
                          <Button
                            onClick={() => handleStatusUpdate('completed')}
                            disabled={isProcessing}
                          >
                            {isProcessing ? "Processando..." : "Finalizar Serviço"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}

                  {canCancel && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full" variant="destructive">
                          <XCircle className="w-4 h-4 mr-2" />
                          Cancelar Reserva
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Cancelar Reserva</DialogTitle>
                          <DialogDescription>
                            Tem certeza que deseja cancelar esta reserva? Esta ação não poderá ser desfeita.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Label htmlFor="cancel-notes">Motivo do cancelamento</Label>
                          <Textarea
                            id="cancel-notes"
                            placeholder="Explique o motivo do cancelamento..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                          />
                        </div>
                        <DialogFooter>
                          <Button
                            variant="destructive"
                            onClick={() => handleStatusUpdate('cancelled')}
                            disabled={isProcessing}
                          >
                            {isProcessing ? "Processando..." : "Confirmar Cancelamento"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Service Location */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Localização</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <MapPin className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">Mapa da localização</p>
                    <p className="text-xs">Você precisa ir para o local do cliente para realizar este serviço</p>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <p className="font-medium text-sm">{booking.address}</p>
                  <p className="text-xs text-muted-foreground">{booking.city}, {booking.state}</p>
                  <p className="text-xs text-muted-foreground">CEP: {booking.cep}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProviderLayout>
  );
}