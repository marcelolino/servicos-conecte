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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CreditCard, Plus, Edit, Trash2, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ProviderLayout from "@/components/layout/provider-layout";

// Schemas
const bankAccountSchema = z.object({
  bankName: z.string().min(1, "Nome do banco é obrigatório"),
  agency: z.string().min(1, "Agência é obrigatória"),
  accountNumber: z.string().min(1, "Número da conta é obrigatório"),
  accountHolder: z.string().min(1, "Nome do titular é obrigatório"),
});

const pixKeySchema = z.object({
  pixKey: z.string().min(1, "Chave PIX é obrigatória"),
  pixType: z.enum(["cpf", "email", "phone", "random"], {
    required_error: "Tipo da chave PIX é obrigatório",
  }),
  accountHolder: z.string().min(1, "Nome do titular é obrigatório"),
});

type BankAccountData = z.infer<typeof bankAccountSchema>;
type PixKeyData = z.infer<typeof pixKeySchema>;

export default function ProviderPaymentMethods() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bankDialogOpen, setBankDialogOpen] = useState(false);
  const [pixDialogOpen, setPixDialogOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<any>(null);
  const [editingPix, setEditingPix] = useState<any>(null);

  // Fetch provider data
  const { data: provider } = useQuery({
    queryKey: ["/api/providers/me"],
    enabled: user?.userType === "provider",
  });

  // Fetch bank accounts
  const { data: bankAccounts = [], isLoading: loadingBanks } = useQuery({
    queryKey: ["/api/provider/bank-accounts"],
    enabled: !!provider,
  });

  // Fetch PIX keys
  const { data: pixKeys = [], isLoading: loadingPix } = useQuery({
    queryKey: ["/api/provider/pix-keys"],
    enabled: !!provider,
  });

  // Bank account form
  const bankForm = useForm<BankAccountData>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: {
      bankName: "",
      agency: "",
      accountNumber: "",
      accountHolder: "",
    },
  });

  // PIX form
  const pixForm = useForm<PixKeyData>({
    resolver: zodResolver(pixKeySchema),
    defaultValues: {
      pixKey: "",
      pixType: "cpf",
      accountHolder: "",
    },
  });

  // Mutations
  const createBankMutation = useMutation({
    mutationFn: (data: BankAccountData) =>
      apiRequest("/api/provider/bank-accounts", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/provider/bank-accounts"] });
      setBankDialogOpen(false);
      bankForm.reset();
      setEditingBank(null);
      toast({
        title: "Conta bancária salva",
        description: "Sua conta bancária foi salva com sucesso.",
      });
    },
  });

  const updateBankMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: BankAccountData }) =>
      apiRequest(`/api/provider/bank-accounts/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/provider/bank-accounts"] });
      setBankDialogOpen(false);
      bankForm.reset();
      setEditingBank(null);
      toast({
        title: "Conta bancária atualizada",
        description: "Sua conta bancária foi atualizada com sucesso.",
      });
    },
  });

  const deleteBankMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/provider/bank-accounts/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/provider/bank-accounts"] });
      toast({
        title: "Conta bancária removida",
        description: "Sua conta bancária foi removida com sucesso.",
      });
    },
  });

  const createPixMutation = useMutation({
    mutationFn: (data: PixKeyData) =>
      apiRequest("/api/provider/pix-keys", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/provider/pix-keys"] });
      setPixDialogOpen(false);
      pixForm.reset();
      setEditingPix(null);
      toast({
        title: "Chave PIX salva",
        description: "Sua chave PIX foi salva com sucesso.",
      });
    },
  });

  const updatePixMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: PixKeyData }) =>
      apiRequest(`/api/provider/pix-keys/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/provider/pix-keys"] });
      setPixDialogOpen(false);
      pixForm.reset();
      setEditingPix(null);
      toast({
        title: "Chave PIX atualizada",
        description: "Sua chave PIX foi atualizada com sucesso.",
      });
    },
  });

  const deletePixMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/provider/pix-keys/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/provider/pix-keys"] });
      toast({
        title: "Chave PIX removida",
        description: "Sua chave PIX foi removida com sucesso.",
      });
    },
  });

  const handleEditBank = (account: any) => {
    setEditingBank(account);
    bankForm.reset({
      bankName: account.bankName,
      agency: account.agency,
      accountNumber: account.accountNumber,
      accountHolder: account.accountHolder,
    });
    setBankDialogOpen(true);
  };

  const handleEditPix = (key: any) => {
    setEditingPix(key);
    pixForm.reset({
      pixKey: key.pixKey,
      pixType: key.pixType,
      accountHolder: key.accountHolder,
    });
    setPixDialogOpen(true);
  };

  const onBankSubmit = (data: BankAccountData) => {
    if (editingBank) {
      updateBankMutation.mutate({ id: editingBank.id, data });
    } else {
      createBankMutation.mutate(data);
    }
  };

  const onPixSubmit = (data: PixKeyData) => {
    if (editingPix) {
      updatePixMutation.mutate({ id: editingPix.id, data });
    } else {
      createPixMutation.mutate(data);
    }
  };

  const getPixTypeLabel = (type: string) => {
    switch (type) {
      case "cpf":
        return "CPF";
      case "email":
        return "E-mail";
      case "phone":
        return "Telefone";
      case "random":
        return "Chave Aleatória";
      default:
        return type;
    }
  };

  return (
    <ProviderLayout>
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Métodos de Pagamento
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Gerencie suas contas bancárias e chaves PIX para receber pagamentos
          </p>
        </div>

        {/* Bank Accounts Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Contas Bancárias
            </CardTitle>
            <Dialog open={bankDialogOpen} onOpenChange={setBankDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingBank(null);
                    bankForm.reset();
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Banco
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingBank ? "Editar Conta Bancária" : "Nova Conta Bancária"}
                  </DialogTitle>
                </DialogHeader>
                <Form {...bankForm}>
                  <form onSubmit={bankForm.handleSubmit(onBankSubmit)} className="space-y-4">
                    <FormField
                      control={bankForm.control}
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
                      control={bankForm.control}
                      name="agency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Agência</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: 1234-5" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={bankForm.control}
                      name="accountNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número da Conta</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: 12345-6" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={bankForm.control}
                      name="accountHolder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Titular</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome completo do titular" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-2 pt-4">
                      <Button
                        type="submit"
                        disabled={createBankMutation.isPending || updateBankMutation.isPending}
                      >
                        {createBankMutation.isPending || updateBankMutation.isPending
                          ? "Salvando..."
                          : editingBank
                          ? "Atualizar"
                          : "Salvar"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setBankDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {loadingBanks ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Carregando contas...</p>
              </div>
            ) : bankAccounts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma conta bancária cadastrada</p>
                <p className="text-sm">Adicione uma conta para receber pagamentos</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bankAccounts.map((account: any) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{account.bankName}</p>
                        {account.isActive && (
                          <Badge variant="secondary" className="text-xs">
                            Ativo
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Agência: {account.agency} • Conta: {account.accountNumber}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Titular: {account.accountHolder}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditBank(account)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteBankMutation.mutate(account.id)}
                        disabled={deleteBankMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* PIX Keys Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Chaves PIX
            </CardTitle>
            <Dialog open={pixDialogOpen} onOpenChange={setPixDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingPix(null);
                    pixForm.reset();
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar PIX
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingPix ? "Editar Chave PIX" : "Nova Chave PIX"}
                  </DialogTitle>
                </DialogHeader>
                <Form {...pixForm}>
                  <form onSubmit={pixForm.handleSubmit(onPixSubmit)} className="space-y-4">
                    <FormField
                      control={pixForm.control}
                      name="pixType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo da Chave</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="cpf">CPF</SelectItem>
                              <SelectItem value="email">E-mail</SelectItem>
                              <SelectItem value="phone">Telefone</SelectItem>
                              <SelectItem value="random">Chave Aleatória</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={pixForm.control}
                      name="pixKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chave PIX</FormLabel>
                          <FormControl>
                            <Input placeholder="Digite sua chave PIX" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={pixForm.control}
                      name="accountHolder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Titular</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome completo do titular" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-2 pt-4">
                      <Button
                        type="submit"
                        disabled={createPixMutation.isPending || updatePixMutation.isPending}
                      >
                        {createPixMutation.isPending || updatePixMutation.isPending
                          ? "Salvando..."
                          : editingPix
                          ? "Atualizar"
                          : "Salvar"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setPixDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {loadingPix ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Carregando chaves PIX...</p>
              </div>
            ) : pixKeys.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma chave PIX cadastrada</p>
                <p className="text-sm">Adicione uma chave PIX para receber pagamentos</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pixKeys.map((key: any) => (
                  <div
                    key={key.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{getPixTypeLabel(key.pixType)}</p>
                        {key.isActive && (
                          <Badge variant="secondary" className="text-xs">
                            Ativo
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Chave: {key.pixKey}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Titular: {key.accountHolder}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditPix(key)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deletePixMutation.mutate(key.id)}
                        disabled={deletePixMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProviderLayout>
  );
}