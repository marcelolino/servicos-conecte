import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Edit } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Define the charging type schema
const chargingTypeSchema = z.object({
  chargingType: z.enum(["per_visit", "hourly", "daily", "package", "custom_quote"]),
  price: z.string().min(1, "Preço é obrigatório"),
  description: z.string().optional(),
  minimumQuantity: z.coerce.number().min(1).default(1),
  maximumQuantity: z.coerce.number().optional(),
});

type ChargingTypeFormData = z.infer<typeof chargingTypeSchema>;

interface ServiceChargingType {
  id: number;
  providerServiceId: number;
  chargingType: "per_visit" | "hourly" | "daily" | "package" | "custom_quote";
  price: string;
  description?: string;
  minimumQuantity?: number;
  maximumQuantity?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ServiceChargingTypesProps {
  serviceId: number;
  serviceName: string;
}

const chargingTypeLabels = {
  per_visit: "Por Visita",
  hourly: "Por Hora",
  daily: "Por Dia",
  package: "Pacote",
  custom_quote: "Orçamento Personalizado"
};

const chargingTypeDescriptions = {
  per_visit: "Cobrança única por visita/atendimento",
  hourly: "Cobrança por hora trabalhada",
  daily: "Cobrança por dia de trabalho",
  package: "Pacote com quantidade específica de serviços",
  custom_quote: "Preço a ser definido individualmente com cada cliente"
};

export function ServiceChargingTypes({ serviceId, serviceName }: ServiceChargingTypesProps) {
  const [editingType, setEditingType] = useState<ServiceChargingType | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ChargingTypeFormData>({
    resolver: zodResolver(chargingTypeSchema),
    defaultValues: {
      chargingType: "per_visit",
      price: "",
      description: "",
      minimumQuantity: 1,
    },
  });

  // Get charging types for this service
  const { data: chargingTypes = [], isLoading } = useQuery<ServiceChargingType[]>({
    queryKey: [`/api/services/${serviceId}/charging-types`],
    enabled: !!serviceId,
  });

  // Create charging type mutation
  const createMutation = useMutation({
    mutationFn: (data: ChargingTypeFormData) =>
      apiRequest(`/api/services/${serviceId}/charging-types`, "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/services/${serviceId}/charging-types`] });
      toast({
        title: "Sucesso",
        description: "Tipo de cobrança criado com sucesso!",
      });
      setShowForm(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar tipo de cobrança",
        variant: "destructive",
      });
    },
  });

  // Update charging type mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ChargingTypeFormData }) =>
      apiRequest(`/api/services/${serviceId}/charging-types/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/services/${serviceId}/charging-types`] });
      toast({
        title: "Sucesso",
        description: "Tipo de cobrança atualizado com sucesso!",
      });
      setEditingType(null);
      setShowForm(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar tipo de cobrança",
        variant: "destructive",
      });
    },
  });

  // Delete charging type mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/services/${serviceId}/charging-types/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/services/${serviceId}/charging-types`] });
      toast({
        title: "Sucesso",
        description: "Tipo de cobrança excluído com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir tipo de cobrança",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ChargingTypeFormData) => {
    if (editingType) {
      updateMutation.mutate({ id: editingType.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (chargingType: ServiceChargingType) => {
    setEditingType(chargingType);
    setShowForm(true);
    form.reset({
      chargingType: chargingType.chargingType,
      price: chargingType.price,
      description: chargingType.description || "",
      minimumQuantity: chargingType.minimumQuantity || 1,
      maximumQuantity: chargingType.maximumQuantity || undefined,
    });
  };

  const handleCancel = () => {
    setEditingType(null);
    setShowForm(false);
    form.reset();
  };

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(price));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando tipos de cobrança...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tipos de Cobrança - {serviceName}</CardTitle>
        <CardDescription>
          Configure diferentes formas de cobrança para este serviço. O preço mínimo definido pelo admin serve como referência.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing charging types */}
        {chargingTypes.length > 0 && (
          <div className="grid gap-4">
            {chargingTypes.map((type) => (
              <div key={type.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {chargingTypeLabels[type.chargingType]}
                    </Badge>
                    <span className="font-semibold">{formatPrice(type.price)}</span>
                  </div>
                  {type.description && (
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  )}
                  {type.chargingType === "package" && (
                    <p className="text-xs text-muted-foreground">
                      Quantidade: {type.minimumQuantity}
                      {type.maximumQuantity && ` - ${type.maximumQuantity}`}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(type)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteMutation.mutate(type.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add new charging type button */}
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Tipo de Cobrança
          </Button>
        )}

        {/* Form for adding/editing charging types */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>
                {editingType ? "Editar Tipo de Cobrança" : "Novo Tipo de Cobrança"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="chargingType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Cobrança</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo de cobrança" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(chargingTypeLabels).map(([key, label]) => (
                              <SelectItem key={key} value={key}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {chargingTypeDescriptions[form.watch("chargingType")]}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço (R$)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição (Opcional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Descreva detalhes adicionais sobre este tipo de cobrança"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("chargingType") === "package" && (
                    <>
                      <FormField
                        control={form.control}
                        name="minimumQuantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantidade Mínima</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="maximumQuantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantidade Máxima (Opcional)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {editingType ? "Atualizar" : "Criar"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {chargingTypes.length === 0 && !showForm && (
          <div className="text-center text-muted-foreground py-8">
            Nenhum tipo de cobrança configurado para este serviço.
          </div>
        )}
      </CardContent>
    </Card>
  );
}