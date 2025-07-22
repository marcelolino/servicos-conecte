import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, MapPin, DollarSign, Clock, FileText, CreditCard, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ServiceRequest, ServiceCategory, User } from "@shared/schema";

type BookingWithDetails = ServiceRequest & {
  client: User;
  provider?: any;
  category: ServiceCategory;
};

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  accepted: "bg-blue-100 text-blue-800 border-blue-200", 
  in_progress: "bg-purple-100 text-purple-800 border-purple-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200"
};

const statusLabels = {
  pending: "Pendente",
  accepted: "Aceito",
  in_progress: "Em Andamento", 
  completed: "Concluído",
  cancelled: "Cancelado"
};

const paymentStatusLabels = {
  pending: "Não pago",
  completed: "Pago",
  failed: "Falhou",
  refunded: "Reembolsado"
};

const paymentMethodLabels = {
  pix: "PIX",
  credit_card: "Cartão de Crédito",
  debit_card: "Cartão de Débito",
  cash: "Dinheiro"
};

export default function ClientBookingDetails() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("detalhes");

  const { data: booking, isLoading } = useQuery<BookingWithDetails>({
    queryKey: [`/api/service-requests/${id}`],
    enabled: !!id && !!user,
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="bg-white rounded-lg p-6">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/client-dashboard")}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Dashboard
          </Button>
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">Reserva não encontrada</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue || 0);
  };

  const formatDate = (date: string | Date) => {
    if (!date) return "Não definido";
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  const getServiceInfo = () => {
    const serviceAmount = 5.00; // Taxa de serviço padrão
    const subtotal = parseFloat(booking.totalAmount || "0") - serviceAmount;
    const total = parseFloat(booking.totalAmount || "0");

    return {
      servicePrice: subtotal,
      serviceAmount,
      total
    };
  };

  const serviceInfo = getServiceInfo();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/client-dashboard")}
            className="text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Detalhes da reserva
          </Button>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-gray-200">
              <TabsList className="grid w-full grid-cols-2 bg-transparent h-auto p-0">
                <TabsTrigger 
                  value="detalhes" 
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 rounded-none py-4 px-6 text-gray-600 hover:text-gray-900"
                >
                  Detalhes da reserva
                </TabsTrigger>
                <TabsTrigger 
                  value="status" 
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 rounded-none py-4 px-6 text-gray-600 hover:text-gray-900"
                >
                  Status
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="detalhes" className="p-6 mt-0">
              <div className="space-y-6">
                {/* Reserva Info */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Reserva #{booking.id.toString().padStart(6, '0')}
                    </h2>
                  </div>
                  <Badge className={`${statusColors[booking.status]} border`}>
                    {statusLabels[booking.status]}
                  </Badge>
                </div>

                {/* Status Info */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                    <span className="font-medium">Data da reserva:</span>
                    <span className="ml-2">{formatDate(booking.createdAt)}</span>
                  </div>
                  
                  {booking.scheduledAt && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2 text-blue-500" />
                      <span className="font-medium">Data do cronograma do serviço:</span>
                      <span className="ml-2">{formatDate(booking.scheduledAt)}</span>
                    </div>
                  )}

                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2 text-blue-500" />
                    <span className="font-medium">Endereço:</span>
                    <span className="ml-2">{booking?.address}, {booking?.city}, {booking?.state}</span>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Forma de pagamento</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CreditCard className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {paymentMethodLabels[booking?.paymentMethod] || "Não informado"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 mr-2">Status do pagamento:</span>
                      <Badge 
                        variant={booking?.paymentStatus === 'completed' ? 'default' : 'secondary'}
                        className={booking?.paymentStatus === 'completed' ? 'bg-red-100 text-red-700 border-red-200' : ''}
                      >
                        {paymentStatusLabels[booking?.paymentStatus] || "Não pago"}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-sm font-medium text-gray-900">
                      Quantia: {formatCurrency(booking.totalAmount || 0)}
                    </span>
                  </div>
                </div>

                {/* Service Summary */}
                <div className="border-t pt-6">
                  <h3 className="font-medium text-gray-900 mb-4">Resumo</h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Service Info */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Informações de serviço</h4>
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium text-gray-900">{booking?.category?.name}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Descrição:</span>
                          <div className="mt-1">{booking?.description}</div>
                        </div>
                        {booking?.notes && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Observações:</span>
                            <div className="mt-1">{booking.notes}</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Cost Breakdown */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Custo do Serviço</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">{booking?.category?.name}</span>
                          <span>{formatCurrency(serviceInfo.servicePrice)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Quantidade:</span>
                          <span>1</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Custo:</span>
                          <span>{formatCurrency(serviceInfo.servicePrice)}</span>
                        </div>
                        
                        <Separator className="my-2" />
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal</span>
                          <span>{formatCurrency(serviceInfo.servicePrice)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Desconto de serviço</span>
                          <span className="text-red-600">(-) R$0,00</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Cupom de Desconto</span>
                          <span className="text-red-600">(-) R$0,00</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Desconto de campanha</span>
                          <span className="text-red-600">(-) R$0,00</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Taxa de serviço</span>
                          <span className="text-blue-600">(+) {formatCurrency(serviceInfo.serviceAmount)}</span>
                        </div>
                        
                        <Separator className="my-2" />
                        
                        <div className="flex justify-between font-medium">
                          <span>Total geral</span>
                          <span>{formatCurrency(serviceInfo.total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="status" className="p-6 mt-0">
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Status da Reserva</h3>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-900">
                      Lugar de Reserva: {formatDate(booking?.createdAt)}
                    </span>
                  </div>
                  
                  {booking?.scheduledAt && (
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-gray-900">
                        Data Agendada do Serviço: {formatDate(booking.scheduledAt)}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-900">
                      Status do pagamento: 
                    </span>
                    <Badge 
                      variant={booking?.paymentStatus === 'completed' ? 'default' : 'secondary'}
                      className={booking?.paymentStatus === 'completed' ? 'bg-red-100 text-red-700 border-red-200' : ''}
                    >
                      {paymentStatusLabels[booking?.paymentStatus] || "Não pago"}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      Status da reserva: 
                    </span>
                    <Badge className={`${statusColors[booking?.status]} border`}>
                      {statusLabels[booking?.status]}
                    </Badge>
                  </div>
                </div>

                {booking?.status === 'completed' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mr-3" />
                      <div>
                        <h4 className="font-medium text-green-900">Serviço Reservado Pelo Cliente</h4>
                        <p className="text-sm text-green-700 mt-1">
                          Hora agendada: {booking?.scheduledAt ? formatDate(booking.scheduledAt) : "Não definido"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}