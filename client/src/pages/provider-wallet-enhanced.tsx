import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Wallet, 
  TrendingUp, 
  CreditCard, 
  Building2, 
  Download, 
  Eye, 
  Calendar,
  DollarSign,
  Plus,
  Edit,
  Trash2,
  ArrowRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ProviderLayout from "@/components/layout/provider-layout";
import { Link } from "wouter";

// Schemas
const withdrawalSchema = z.object({
  amount: z.string().min(1, "Valor é obrigatório").refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    },
    "Valor deve ser maior que zero"
  ),
  paymentMethod: z.enum(["bank", "pix"], {
    required_error: "Método de pagamento é obrigatório",
  }),
  bankAccountId: z.number().optional(),
  pixKeyId: z.number().optional(),
  requestNotes: z.string().optional(),
});

type WithdrawalData = z.infer<typeof withdrawalSchema>;

export default function ProviderWalletEnhanced() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [withdrawalDialogOpen, setWithdrawalDialogOpen] = useState(false);

  // Fetch provider data
  const { data: provider } = useQuery({
    queryKey: ["/api/providers/me"],
    enabled: user?.userType === "provider",
  });

  // Fetch earnings data
  const { data: earnings, isLoading: loadingEarnings } = useQuery({
    queryKey: ["/api/provider/earnings"],
    enabled: !!provider,
  });

  // Fetch withdrawal requests
  const { data: withdrawalRequests = [], isLoading: loadingWithdrawals } = useQuery({
    queryKey: ["/api/provider/withdrawal-requests"],
    enabled: !!provider,
  });

  // Fetch bank accounts
  const { data: bankAccounts = [] } = useQuery({
    queryKey: ["/api/provider/bank-accounts"],
    enabled: !!provider,
  });

  // Fetch PIX keys
  const { data: pixKeys = [] } = useQuery({
    queryKey: ["/api/provider/pix-keys"],
    enabled: !!provider,
  });

  // Withdrawal form
  const withdrawalForm = useForm<WithdrawalData>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: "",
      paymentMethod: "pix",
      requestNotes: "",
    },
  });

  const selectedPaymentMethod = withdrawalForm.watch("paymentMethod");

  // Withdrawal mutation
  const withdrawalMutation = useMutation({
    mutationFn: async (data: WithdrawalData) => {
      const response = await apiRequest("POST", "/api/provider/withdrawal-requests", {
        ...data,
        amount: parseFloat(data.amount).toFixed(2),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/provider/withdrawal-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/provider/earnings"] });
      setWithdrawalDialogOpen(false);
      withdrawalForm.reset();
      toast({
        title: "Solicitação enviada",
        description: "Sua solicitação de saque foi enviada para análise.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao solicitar saque",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  const onWithdrawalSubmit = (data: WithdrawalData) => {
    // Validate payment method and selected account/key
    if (data.paymentMethod === "bank" && !data.bankAccountId) {
      toast({
        title: "Erro",
        description: "Selecione uma conta bancária.",
        variant: "destructive",
      });
      return;
    }
    
    if (data.paymentMethod === "pix" && !data.pixKeyId) {
      toast({
        title: "Erro",
        description: "Selecione uma chave PIX.",
        variant: "destructive",
      });
      return;
    }

    withdrawalMutation.mutate(data);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pendente</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejeitado</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800">Concluído</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const availableBalance = earnings?.availableBalance || 0;
  const totalEarnings = earnings?.earnings?.reduce((sum: number, earning: any) => sum + parseFloat(earning.providerAmount), 0) || 0;
  const totalWithdrawn = earnings?.earnings?.filter((e: any) => e.isWithdrawn).reduce((sum: number, earning: any) => sum + parseFloat(earning.providerAmount), 0) || 0;

  return (
    <ProviderLayout>
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Wallet className="h-6 w-6" />
              Carteira
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Gerencie seus ganhos e solicitações de saque
            </p>
          </div>
          <Link href="/provider-payment-methods">
            <Button variant="outline">
              <CreditCard className="h-4 w-4 mr-2" />
              Métodos de Pagamento
            </Button>
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Disponível</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(availableBalance)}
              </div>
              <p className="text-xs text-muted-foreground">
                Disponível para saque
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Ganhos</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(totalEarnings)}
              </div>
              <p className="text-xs text-muted-foreground">
                Ganhos acumulados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sacado</CardTitle>
              <Download className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(totalWithdrawn)}
              </div>
              <p className="text-xs text-muted-foreground">
                Já retirado
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Withdrawal Action */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Solicitação de Saque</span>
              <Dialog open={withdrawalDialogOpen} onOpenChange={setWithdrawalDialogOpen}>
                <DialogTrigger asChild>
                  <Button disabled={availableBalance <= 0}>
                    <Download className="h-4 w-4 mr-2" />
                    Solicitar Saque
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Solicitar Saque</DialogTitle>
                  </DialogHeader>
                  <Form {...withdrawalForm}>
                    <form onSubmit={withdrawalForm.handleSubmit(onWithdrawalSubmit)} className="space-y-4">
                      <div className="text-sm text-muted-foreground mb-4">
                        Saldo disponível: <span className="font-medium text-green-600">{formatCurrency(availableBalance)}</span>
                      </div>

                      <FormField
                        control={withdrawalForm.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor do Saque</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="0,00" 
                                type="number" 
                                step="0.01"
                                max={availableBalance}
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={withdrawalForm.control}
                        name="paymentMethod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Método de Pagamento</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o método" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="pix">PIX</SelectItem>
                                <SelectItem value="bank">Transferência Bancária</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {selectedPaymentMethod === "bank" && (
                        <FormField
                          control={withdrawalForm.control}
                          name="bankAccountId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Conta Bancária</FormLabel>
                              <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma conta" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {bankAccounts.length === 0 ? (
                                    <div className="p-2 text-sm text-muted-foreground">
                                      Nenhuma conta cadastrada. <Link href="/provider-payment-methods">Adicionar conta</Link>
                                    </div>
                                  ) : (
                                    bankAccounts.map((account: any) => (
                                      <SelectItem key={account.id} value={account.id.toString()}>
                                        {account.bankName} - {account.agency} / {account.accountNumber}
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {selectedPaymentMethod === "pix" && (
                        <FormField
                          control={withdrawalForm.control}
                          name="pixKeyId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Chave PIX</FormLabel>
                              <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma chave PIX" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {pixKeys.length === 0 ? (
                                    <div className="p-2 text-sm text-muted-foreground">
                                      Nenhuma chave PIX cadastrada. <Link href="/provider-payment-methods">Adicionar chave</Link>
                                    </div>
                                  ) : (
                                    pixKeys.map((key: any) => (
                                      <SelectItem key={key.id} value={key.id.toString()}>
                                        {key.pixType.toUpperCase()}: {key.pixKey}
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <FormField
                        control={withdrawalForm.control}
                        name="requestNotes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Observações (opcional)</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Adicione observações se necessário" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-2 pt-4">
                        <Button
                          type="submit"
                          disabled={withdrawalMutation.isPending}
                          className="flex-1"
                        >
                          {withdrawalMutation.isPending ? "Enviando..." : "Solicitar Saque"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setWithdrawalDialogOpen(false)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {availableBalance <= 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Não há saldo disponível para saque</p>
                <p className="text-sm">Complete mais serviços para acumular ganhos</p>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-2">
                  Você tem <span className="font-medium text-green-600">{formatCurrency(availableBalance)}</span> disponível para saque
                </p>
                <p className="text-sm text-muted-foreground">
                  Saques são processados em até 2 dias úteis
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs for History */}
        <Tabs defaultValue="withdrawals" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="withdrawals">Histórico de Saques</TabsTrigger>
            <TabsTrigger value="earnings">Histórico de Ganhos</TabsTrigger>
          </TabsList>

          <TabsContent value="withdrawals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Solicitações de Saque</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingWithdrawals ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Carregando...</p>
                  </div>
                ) : withdrawalRequests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Download className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma solicitação de saque</p>
                    <p className="text-sm">Suas solicitações aparecerão aqui</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Observações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {withdrawalRequests.map((request: any) => (
                        <TableRow key={request.id}>
                          <TableCell>
                            {new Date(request.createdAt).toLocaleDateString("pt-BR")}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(parseFloat(request.amount))}
                          </TableCell>
                          <TableCell>
                            {request.paymentMethod === "bank" ? "Banco" : "PIX"}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(request.status)}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {request.requestNotes || request.adminNotes || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="earnings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Ganhos</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingEarnings ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Carregando...</p>
                  </div>
                ) : !earnings?.earnings || earnings.earnings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum ganho registrado</p>
                    <p className="text-sm">Complete serviços para começar a ganhar</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Serviço</TableHead>
                        <TableHead>Valor Total</TableHead>
                        <TableHead>Taxa</TableHead>
                        <TableHead>Seu Ganho</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {earnings.earnings.map((earning: any) => (
                        <TableRow key={earning.id}>
                          <TableCell>
                            {new Date(earning.createdAt).toLocaleDateString("pt-BR")}
                          </TableCell>
                          <TableCell>
                            Serviço #{earning.serviceRequestId}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(parseFloat(earning.totalAmount))}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(parseFloat(earning.commissionAmount))}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(parseFloat(earning.providerAmount))}
                          </TableCell>
                          <TableCell>
                            {earning.isWithdrawn ? (
                              <Badge className="bg-gray-100 text-gray-800">Sacado</Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-800">Disponível</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProviderLayout>
  );
}