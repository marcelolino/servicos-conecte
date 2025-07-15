import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { User, Settings, MapPin, DollarSign, FileText } from "lucide-react";

const createProviderSchema = z.object({
  serviceRadius: z.string().min(1, "Raio de atendimento é obrigatório").transform(Number),
  basePrice: z.string().min(1, "Preço base é obrigatório"),
  description: z.string().min(20, "Descrição deve ter pelo menos 20 caracteres"),
  experience: z.string().min(10, "Experiência deve ter pelo menos 10 caracteres"),
});

type CreateProviderForm = z.infer<typeof createProviderSchema>;

interface CreateProviderProfileProps {
  userId: number;
  onSuccess: () => void;
}

export default function CreateProviderProfile({ userId, onSuccess }: CreateProviderProfileProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreateProviderForm>({
    resolver: zodResolver(createProviderSchema),
    defaultValues: {
      serviceRadius: "",
      basePrice: "",
      description: "",
      experience: "",
    },
  });

  const createProviderMutation = useMutation({
    mutationFn: (data: CreateProviderForm) => 
      apiRequest("POST", "/api/providers", {
        userId,
        ...data,
        basePrice: parseFloat(data.basePrice).toFixed(2),
        status: "pending",
      }),
    onSuccess: () => {
      toast({
        title: "Perfil criado com sucesso!",
        description: "Seu perfil foi enviado para aprovação. Você receberá uma notificação quando for aprovado.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/providers/me"] });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar perfil",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateProviderForm) => {
    createProviderMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <User className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Complete seu Perfil de Prestador</CardTitle>
          <p className="text-muted-foreground">
            Preencha as informações abaixo para começar a receber solicitações de serviços.
          </p>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="serviceRadius"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Raio de Atendimento (km)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="100"
                          placeholder="Ex: 15"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="basePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Preço Base (R$)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Ex: 50.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Descrição dos Serviços
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva os serviços que você oferece, suas especialidades e diferenciais..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="experience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Experiência Profissional
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Conte sobre sua experiência profissional, tempo de atuação, certificações..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Próximos Passos
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Seu perfil será enviado para análise da equipe</li>
                  <li>• Você receberá uma notificação quando for aprovado</li>
                  <li>• Após aprovação, você poderá adicionar serviços específicos</li>
                  <li>• Novos prestadores têm 7 dias de teste gratuito</li>
                </ul>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={createProviderMutation.isPending}
              >
                {createProviderMutation.isPending ? "Criando Perfil..." : "Criar Perfil de Prestador"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}