import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ProviderLayout from "@/components/layout/provider-layout";
import { 
  DollarSign, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  CreditCard,
  Banknote,
  Smartphone
} from "lucide-react";

const withdrawalRequestSchema = z.object({
  amount: z.string().min(1, "Valor é obrigatório").refine(val => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "Valor deve ser maior que zero"),
  paymentMethod: z.enum(["bank_transfer", "pix"], {
    required_error: "Método de pagamento é obrigatório",
  }),
  bankName: z.string().min(1, "Nome do banco é obrigatório"),
  accountNumber: z.string().min(1, "Número da conta é obrigatório"),
  accountHolderName: z.string().min(1, "Nome do titular é obrigatório"),
  cpfCnpj: z.string().min(11, "CPF/CNPJ é obrigatório"),
  pixKey: z.string().optional(),
  requestNotes: z.string().optional(),
}).refine((data) => {
  if (data.paymentMethod === "pix" && !data.pixKey) {
    return false;
  }
  return true;
}, {
  message: "Chave PIX é obrigatória para pagamento via PIX",
  path: ["pixKey"],
});

type WithdrawalRequestForm = z.infer<typeof withdrawalRequestSchema>;

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending": return "bg-yellow-500";
    case "approved": return "bg-green-500";
    case "rejected": return "bg-red-500";
    default: return "bg-gray-500";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "pending": return "Pendente";
    case "approved": return "Aprovado";
    case "rejected": return "Rejeitado";
    default: return status;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "pending": return Clock;
    case "approved": return CheckCircle;
    case "rejected": return XCircle;
    default: return AlertCircle;
  }
};

const getPaymentMethodLabel = (method: string) => {
  switch (method) {
    case "bank_transfer": return "Transferência Bancária";
    case "pix": return "PIX";
    default: return method;
  }
};

const getPaymentMethodIcon = (method: string) => {
  switch (method) {
    case "bank_transfer": return CreditCard;
    case "pix": return Smartphone;
    default: return Banknote;
  }
};

export default function ProviderWithdrawalRequests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);

  const form = useForm<WithdrawalRequestForm>({
    resolver: zodResolver(withdrawalRequestSchema),
    defaultValues: {
      amount: "",
      paymentMethod: undefined,
      bankName: "",
      accountNumber: "",
      accountHolderName: "",
      cpfCnpj: "",
      pixKey: "",
      requestNotes: "",
    },
  });

  const paymentMethod = form.watch("paymentMethod");

  // Fetch provider earnings
  const { data: earnings, isLoading: earningsLoading } = useQuery({
    queryKey: ["/api/provider/earnings"],
    enabled: user?.userType === "provider",
  });

  // Fetch withdrawal requests
  const { data: withdrawalRequests, isLoading: requestsLoading } = useQuery({
    queryKey: ["/api/provider/withdrawal-requests"],
    enabled: user?.userType === "provider",
  });

  // Create withdrawal request mutation
  const createRequestMutation = useMutation({
    mutationFn: (data: WithdrawalRequestForm) => 
      apiRequest("POST", "/api/provider/withdrawal-requests", {
        ...data,
        amount: parseFloat(data.amount),
      }),
    onSuccess: () => {
      toast({
        title: "Solicitação de retirada criada!",
        description: "Sua solicitação será analisada pela administração.",
      });
      setIsNewRequestOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/provider/withdrawal-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/provider/earnings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar solicitação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: WithdrawalRequestForm) => {
    createRequestMutation.mutate(data);
  };

  const availableBalance = (earnings as any)?.availableBalance || 0;
  const totalEarnings = (earnings as any)?.earnings?.reduce((sum: number, earning: any) => sum + parseFloat(earning.providerAmount || 0), 0) || 0;
  const withdrawnAmount = (earnings as any)?.earnings?.filter((e: any) => e.isWithdrawn).reduce((sum: number, earning: any) => sum + parseFloat(earning.providerAmount || 0), 0) || 0;

  return (
    <ProviderLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Solicitações De Retirada</h1>
            <p className="text-muted-foreground">
              Gerencie suas solicitações de retirada de ganhos
            </p>
          </div>
          <Dialog open={isNewRequestOpen} onOpenChange={setIsNewRequestOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nova Solicitação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nova Solicitação de Retirada</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor (R$)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            {...field}
                          />
                        </FormControl>
                        <p className="text-sm text-muted-foreground">
                          Saldo disponível: R$ {availableBalance.toFixed(2)}
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
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
                            <SelectItem value="bank_transfer">Transferência Bancária</SelectItem>
                            <SelectItem value="pix">PIX</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Banco</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Banco do Brasil" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="accountHolderName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Titular da Conta</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="accountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número da Conta</FormLabel>
                        <FormControl>
                          <Input placeholder="Agência e conta" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cpfCnpj"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF/CNPJ</FormLabel>
                        <FormControl>
                          <Input placeholder="Digite seu CPF ou CNPJ" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {paymentMethod === "pix" && (
                    <FormField
                      control={form.control}
                      name="pixKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chave PIX</FormLabel>
                          <FormControl>
                            <Input placeholder="CPF, telefone, email ou chave aleatória" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="requestNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações (opcional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Informações adicionais..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsNewRequestOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createRequestMutation.isPending}
                    >
                      {createRequestMutation.isPending ? "Criando..." : "Criar Solicitação"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ganhos Totais</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {earningsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">R$ {totalEarnings.toFixed(2)}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Disponível</CardTitle>
              <Banknote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {earningsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold text-green-600">R$ {availableBalance.toFixed(2)}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Retirado</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {earningsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">R$ {withdrawnAmount.toFixed(2)}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Withdrawal Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Solicitações</CardTitle>
          </CardHeader>
          <CardContent>
            {requestsLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : !(withdrawalRequests as any[])?.length ? (
              <div className="text-center py-12">
                <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Nenhuma solicitação encontrada
                </h3>
                <p className="text-muted-foreground mb-4">
                  Você ainda não fez nenhuma solicitação de retirada
                </p>
                <Button onClick={() => setIsNewRequestOpen(true)}>
                  Fazer primeira solicitação
                </Button>
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
                  {(withdrawalRequests as any[]).map((request: any) => {
                    const StatusIcon = getStatusIcon(request.status);
                    const PaymentIcon = getPaymentMethodIcon(request.paymentMethod);
                    
                    return (
                      <TableRow key={request.id}>
                        <TableCell>
                          {new Date(request.createdAt).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="font-medium">
                          R$ {parseFloat(request.amount || '0').toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <PaymentIcon className="h-4 w-4" />
                            {getPaymentMethodLabel(request.paymentMethod)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-white ${getStatusColor(request.status)}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {getStatusLabel(request.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="text-sm text-muted-foreground">
                            {request.adminNotes && (
                              <p className="mb-1"><strong>Admin:</strong> {request.adminNotes}</p>
                            )}
                            {request.requestNotes && <p>{request.requestNotes}</p>}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </ProviderLayout>
  );
}