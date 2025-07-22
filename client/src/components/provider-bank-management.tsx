import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  Plus, 
  Edit, 
  Trash2, 
  Building2, 
  Key,
  CheckCircle
} from "lucide-react";
import { z } from "zod";

// Form schemas
const bankAccountSchema = z.object({
  bankName: z.string().min(1, "Nome do banco é obrigatório"),
  agency: z.string().min(1, "Agência é obrigatória"),
  accountNumber: z.string().min(1, "Número da conta é obrigatório"),
  accountHolder: z.string().min(1, "Nome do titular é obrigatório"),
});

const pixKeySchema = z.object({
  pixKey: z.string().min(1, "Chave PIX é obrigatória"),
  pixType: z.enum(["cpf", "email", "phone", "random"], {
    required_error: "Tipo da chave é obrigatório",
  }),
  accountHolder: z.string().min(1, "Nome do titular é obrigatório"),
});

type BankAccountForm = z.infer<typeof bankAccountSchema>;
type PixKeyForm = z.infer<typeof pixKeySchema>;

interface BankAccount {
  id: number;
  bankName: string;
  agency: string;
  accountNumber: string;
  accountHolder: string;
  isActive: boolean;
}

interface PixKey {
  id: number;
  pixKey: string;
  pixType: string;
  accountHolder: string;
  isActive: boolean;
}

export default function ProviderBankManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isBankDialogOpen, setIsBankDialogOpen] = useState(false);
  const [isPixDialogOpen, setIsPixDialogOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null);
  const [editingPix, setEditingPix] = useState<PixKey | null>(null);

  // Forms
  const bankForm = useForm<BankAccountForm>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: {
      bankName: "",
      agency: "",
      accountNumber: "",
      accountHolder: "",
    },
  });

  const pixForm = useForm<PixKeyForm>({
    resolver: zodResolver(pixKeySchema),
    defaultValues: {
      pixKey: "",
      pixType: "cpf",
      accountHolder: "",
    },
  });

  // Fetch bank accounts
  const { data: bankAccounts } = useQuery<BankAccount[]>({
    queryKey: ["/api/provider/bank-accounts"],
    enabled: !!user && user.userType === "provider",
  });

  // Fetch PIX keys
  const { data: pixKeys } = useQuery<PixKey[]>({
    queryKey: ["/api/provider/pix-keys"],
    enabled: !!user && user.userType === "provider",
  });

  // Create/Update bank account mutation
  const bankAccountMutation = useMutation({
    mutationFn: (data: BankAccountForm & { id?: number }) => {
      if (data.id) {
        return apiRequest("PUT", `/api/provider/bank-accounts/${data.id}`, data);
      }
      return apiRequest("POST", "/api/provider/bank-accounts", data);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: editingBank ? "Conta bancária atualizada com sucesso." : "Conta bancária adicionada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/provider/bank-accounts"] });
      setIsBankDialogOpen(false);
      setEditingBank(null);
      bankForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar conta bancária.",
        variant: "destructive",
      });
    },
  });

  // Create/Update PIX key mutation
  const pixKeyMutation = useMutation({
    mutationFn: (data: PixKeyForm & { id?: number }) => {
      if (data.id) {
        return apiRequest("PUT", `/api/provider/pix-keys/${data.id}`, data);
      }
      return apiRequest("POST", "/api/provider/pix-keys", data);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: editingPix ? "Chave PIX atualizada com sucesso." : "Chave PIX adicionada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/provider/pix-keys"] });
      setIsPixDialogOpen(false);
      setEditingPix(null);
      pixForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar chave PIX.",
        variant: "destructive",
      });
    },
  });

  // Delete bank account mutation
  const deleteBankMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/provider/bank-accounts/${id}`),
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Conta bancária removida com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/provider/bank-accounts"] });
    },
  });

  // Delete PIX key mutation
  const deletePixMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/provider/pix-keys/${id}`),
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Chave PIX removida com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/provider/pix-keys"] });
    },
  });

  const handleBankSubmit = (data: BankAccountForm) => {
    bankAccountMutation.mutate({
      ...data,
      ...(editingBank && { id: editingBank.id }),
    });
  };

  const handlePixSubmit = (data: PixKeyForm) => {
    pixKeyMutation.mutate({
      ...data,
      ...(editingPix && { id: editingPix.id }),
    });
  };

  const handleEditBank = (account: BankAccount) => {
    setEditingBank(account);
    bankForm.reset({
      bankName: account.bankName,
      agency: account.agency,
      accountNumber: account.accountNumber,
      accountHolder: account.accountHolder,
    });
    setIsBankDialogOpen(true);
  };

  const handleEditPix = (pixKey: PixKey) => {
    setEditingPix(pixKey);
    pixForm.reset({
      pixKey: pixKey.pixKey,
      pixType: pixKey.pixType as "cpf" | "email" | "phone" | "random",
      accountHolder: pixKey.accountHolder,
    });
    setIsPixDialogOpen(true);
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
    <div className="space-y-6">
      {/* Bank Account Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-indigo-600" />
            Dados Bancários
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bankAccounts && bankAccounts.length > 0 ? (
            <div className="space-y-4">
              {bankAccounts.map((account) => (
                <div key={account.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{account.bankName}</h3>
                        {account.isActive && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Ativo
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>Agência: {account.agency}</p>
                        <p>Conta: {account.accountNumber}</p>
                        <p>Titular: {account.accountHolder}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditBank(account)}
                      >
                        <Edit className="h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteBankMutation.mutate(account.id)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remover
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p>Nenhuma conta bancária cadastrada</p>
            </div>
          )}

          <Dialog open={isBankDialogOpen} onOpenChange={setIsBankDialogOpen}>
            <DialogTrigger asChild>
              <Button className="mt-4 w-full">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Conta Bancária
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingBank ? "Editar" : "Adicionar"} Conta Bancária
                </DialogTitle>
              </DialogHeader>
              <Form {...bankForm}>
                <form onSubmit={bankForm.handleSubmit(handleBankSubmit)} className="space-y-4">
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
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsBankDialogOpen(false);
                        setEditingBank(null);
                        bankForm.reset();
                      }}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={bankAccountMutation.isPending}
                      className="flex-1"
                    >
                      {bankAccountMutation.isPending ? "Salvando..." : "Salvar"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* PIX Key Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Key className="h-5 w-5 text-indigo-600" />
            Chave PIX
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pixKeys && pixKeys.length > 0 ? (
            <div className="space-y-4">
              {pixKeys.map((pixKey) => (
                <div key={pixKey.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{getPixTypeLabel(pixKey.pixType)}</h3>
                        {pixKey.isActive && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Ativo
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>Chave: {pixKey.pixKey}</p>
                        <p>Titular: {pixKey.accountHolder}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditPix(pixKey)}
                      >
                        <Edit className="h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deletePixMutation.mutate(pixKey.id)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remover
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Key className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p>Nenhuma chave PIX cadastrada</p>
            </div>
          )}

          <Dialog open={isPixDialogOpen} onOpenChange={setIsPixDialogOpen}>
            <DialogTrigger asChild>
              <Button className="mt-4 w-full">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Chave PIX
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingPix ? "Editar" : "Adicionar"} Chave PIX
                </DialogTitle>
              </DialogHeader>
              <Form {...pixForm}>
                <form onSubmit={pixForm.handleSubmit(handlePixSubmit)} className="space-y-4">
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
                          <Input placeholder="Digite a chave PIX" {...field} />
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
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsPixDialogOpen(false);
                        setEditingPix(null);
                        pixForm.reset();
                      }}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={pixKeyMutation.isPending}
                      className="flex-1"
                    >
                      {pixKeyMutation.isPending ? "Salvando..." : "Salvar"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}