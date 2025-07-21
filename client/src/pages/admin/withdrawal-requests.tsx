import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Wallet, Clock, CheckCircle, XCircle, DollarSign, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";

interface WithdrawalRequest {
  id: number;
  providerId: number;
  amount: string;
  bankInfo: string;
  pixKey?: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  processedBy?: number;
  processedAt?: string;
  adminNotes?: string;
  createdAt: string;
  provider: {
    id: number;
    user: {
      name: string;
      email: string;
    };
  };
}

export default function WithdrawalRequestsPage() {
  const { data: requests, isLoading } = useQuery<WithdrawalRequest[]>({
    queryKey: ["/api/admin/withdrawal-requests"],
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const processRequestMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: number; status: 'approved' | 'rejected'; notes?: string }) => {
      return apiRequest("PUT", `/api/admin/withdrawal-requests/${id}`, { status, adminNotes: notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawal-requests"] });
      toast({
        title: "Solicitação processada",
        description: "A solicitação de retirada foi processada com sucesso.",
      });
      setSelectedRequest(null);
      setAdminNotes("");
      setIsProcessing(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar a solicitação.",
        variant: "destructive",
      });
      setIsProcessing(false);
    },
  });

  const handleProcessRequest = async (status: 'approved' | 'rejected') => {
    if (!selectedRequest) return;
    
    setIsProcessing(true);
    processRequestMutation.mutate({
      id: selectedRequest.id,
      status,
      notes: adminNotes || undefined,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Aprovado';
      case 'rejected':
        return 'Rejeitado';
      case 'pending':
        return 'Pendente';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalRequests = requests?.length || 0;
  const pendingRequests = requests?.filter(r => r.status === 'pending') || [];
  const approvedRequests = requests?.filter(r => r.status === 'approved') || [];
  const rejectedRequests = requests?.filter(r => r.status === 'rejected') || [];
  
  const totalPendingAmount = pendingRequests.reduce((sum, req) => sum + parseFloat(req.amount), 0);
  const totalApprovedAmount = approvedRequests.reduce((sum, req) => sum + parseFloat(req.amount), 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Solicitações De Retirada</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Gerencie as solicitações de retirada dos prestadores
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Solicitações</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRequests}</div>
            <p className="text-xs text-muted-foreground">
              Todas as solicitações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              R$ {totalPendingAmount.toFixed(2)} aguardando
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              R$ {totalApprovedAmount.toFixed(2)} aprovado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejeitadas</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              Não processadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Withdrawal Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Solicitações</CardTitle>
          <CardDescription>
            Todas as solicitações de retirada dos prestadores
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!requests || requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma solicitação encontrada</p>
              <p className="text-sm">Solicitações de retirada aparecerão aqui</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prestador</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Informações Bancárias</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data da Solicitação</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{request.provider.user.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {request.provider.user.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-green-600">
                      R$ {parseFloat(request.amount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="text-sm truncate">{request.bankInfo}</p>
                        {request.pixKey && (
                          <p className="text-xs text-muted-foreground">
                            PIX: {request.pixKey}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(request.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(request.status)}
                          {getStatusText(request.status)}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{format(new Date(request.createdAt), "dd/MM/yyyy", { locale: ptBR })}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(request.createdAt), "HH:mm", { locale: ptBR })}
                        </p>
                        {request.processedAt && (
                          <p className="text-xs text-gray-600">
                            Processado: {format(new Date(request.processedAt), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {request.status === 'pending' ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedRequest(request);
                                setAdminNotes("");
                              }}
                            >
                              Processar
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Processar Solicitação de Retirada</DialogTitle>
                              <DialogDescription>
                                Revise os detalhes e aprove ou rejeite a solicitação
                              </DialogDescription>
                            </DialogHeader>
                            
                            {selectedRequest && (
                              <div className="space-y-4">
                                <div className="grid gap-4">
                                  <div>
                                    <Label className="text-sm font-medium">Prestador</Label>
                                    <p className="text-sm">{selectedRequest.provider.user.name}</p>
                                    <p className="text-xs text-muted-foreground">{selectedRequest.provider.user.email}</p>
                                  </div>
                                  
                                  <div>
                                    <Label className="text-sm font-medium">Valor Solicitado</Label>
                                    <p className="text-lg font-semibold text-green-600">
                                      R$ {parseFloat(selectedRequest.amount).toFixed(2)}
                                    </p>
                                  </div>
                                  
                                  <div>
                                    <Label className="text-sm font-medium">Informações Bancárias</Label>
                                    <p className="text-sm bg-gray-50 dark:bg-gray-900 p-2 rounded">
                                      {selectedRequest.bankInfo}
                                    </p>
                                  </div>
                                  
                                  {selectedRequest.pixKey && (
                                    <div>
                                      <Label className="text-sm font-medium">Chave PIX</Label>
                                      <p className="text-sm bg-gray-50 dark:bg-gray-900 p-2 rounded">
                                        {selectedRequest.pixKey}
                                      </p>
                                    </div>
                                  )}
                                  
                                  {selectedRequest.notes && (
                                    <div>
                                      <Label className="text-sm font-medium">Observações do Prestador</Label>
                                      <p className="text-sm bg-gray-50 dark:bg-gray-900 p-2 rounded">
                                        {selectedRequest.notes}
                                      </p>
                                    </div>
                                  )}
                                  
                                  <div>
                                    <Label htmlFor="adminNotes" className="text-sm font-medium">
                                      Observações Administrativas (Opcional)
                                    </Label>
                                    <Textarea
                                      id="adminNotes"
                                      value={adminNotes}
                                      onChange={(e) => setAdminNotes(e.target.value)}
                                      placeholder="Adicione observações sobre a decisão..."
                                      className="mt-1"
                                    />
                                  </div>
                                </div>
                                
                                <div className="flex gap-2 pt-4">
                                  <Button
                                    onClick={() => handleProcessRequest('approved')}
                                    disabled={isProcessing}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Aprovar
                                  </Button>
                                  <Button
                                    onClick={() => handleProcessRequest('rejected')}
                                    disabled={isProcessing}
                                    variant="destructive"
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Rejeitar
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {getStatusText(request.status)}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}