import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ProviderLayout from "@/components/layout/provider-layout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  Calendar,
  DollarSign,
  Package,
  FileText,
  Eye,
  Edit,
  Plus
} from "lucide-react";

interface ProviderService {
  id: number;
  providerId: number;
  categoryId: number;
  name: string;
  description: string;
  price: string;
  minimumPrice: string | null;
  estimatedDuration: string | null;
  requirements: string | null;
  serviceZone: string;
  images: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category: {
    id: number;
    name: string;
    description: string;
  };
  chargingTypes: ServiceChargingType[];
}

interface ServiceChargingType {
  id: number;
  providerServiceId: number;
  chargingType: 'visit' | 'hour' | 'daily' | 'package' | 'quote';
  price: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ChargingTypeForm {
  chargingType: 'visit' | 'hour' | 'daily' | 'package' | 'quote';
  price: string | null;
  description: string;
}

const chargingTypeLabels = {
  visit: 'Por Visita/Consultoria',
  hour: 'Por Hora',
  daily: 'Por Diária',
  package: 'Pacote/Projeto',
  quote: 'Orçamento Personalizado'
};

const chargingTypeIcons = {
  visit: Eye,
  hour: Clock, 
  daily: Calendar,
  package: Package,
  quote: FileText
};

function ServiceChargingTypeCard({ service, onEdit }: { service: ProviderService; onEdit: (service: ProviderService) => void }) {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{service.name}</CardTitle>
            <CardDescription className="text-sm">
              {service.category.name} • {service.description}
            </CardDescription>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              Preço Admin: R$ {service.price}
              {service.minimumPrice && (
                <span className="text-xs">• Mín: R$ {service.minimumPrice}</span>
              )}
            </div>
          </div>
          <Badge variant={service.isActive ? "default" : "secondary"}>
            {service.isActive ? "Ativo" : "Inativo"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Tipos de Cobrança Configurados</h4>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onEdit(service)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Gerenciar
            </Button>
          </div>
          
          {service.chargingTypes.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum tipo de cobrança configurado</p>
              <p className="text-xs">Clique em "Gerenciar" para adicionar preços</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {service.chargingTypes.map((chargingType) => {
                const Icon = chargingTypeIcons[chargingType.chargingType];
                return (
                  <div key={chargingType.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" />
                      <div>
                        <span className="text-sm font-medium">
                          {chargingTypeLabels[chargingType.chargingType]}
                        </span>
                        {chargingType.description && (
                          <p className="text-xs text-muted-foreground">{chargingType.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium">
                        {chargingType.chargingType === 'quote' ? 'Sob consulta' : `R$ ${chargingType.price}`}
                      </span>
                      <Badge variant={chargingType.isActive ? "default" : "secondary"} className="ml-2 text-xs">
                        {chargingType.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ChargingTypeManager({ service, onClose }: { service: ProviderService; onClose: () => void }) {
  const [form, setForm] = useState<ChargingTypeForm>({
    chargingType: 'visit',
    price: '',
    description: ''
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: ChargingTypeForm) => 
      apiRequest("POST", `/api/services/${service.id}/charging-types`, {
        ...data,
        isActive: true
      }),
    onSuccess: () => {
      toast({ title: "Tipo de cobrança adicionado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/providers/services"] });
      queryClient.refetchQueries({ queryKey: ["/api/providers/services"] });
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Erro ao adicionar tipo de cobrança", description: error.message, variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ChargingTypeForm> }) => 
      apiRequest("PUT", `/api/services/${service.id}/charging-types/${id}`, data),
    onSuccess: () => {
      toast({ title: "Tipo de cobrança atualizado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/providers/services"] });
      queryClient.refetchQueries({ queryKey: ["/api/providers/services"] });
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Erro ao atualizar tipo de cobrança", description: error.message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest("DELETE", `/api/services/${service.id}/charging-types/${id}`),
    onSuccess: () => {
      toast({ title: "Tipo de cobrança removido com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/providers/services"] });
      queryClient.refetchQueries({ queryKey: ["/api/providers/services"] });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao remover tipo de cobrança", description: error.message, variant: "destructive" });
    }
  });

  const resetForm = () => {
    setForm({ chargingType: 'visit', price: '', description: '' });
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (form.chargingType !== 'quote' && !form.price) {
      toast({ title: "Preço é obrigatório", variant: "destructive" });
      return;
    }

    const submitData = {
      ...form,
      price: form.chargingType === 'quote' && !form.price ? null : form.price
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (chargingType: ServiceChargingType) => {
    setForm({
      chargingType: chargingType.chargingType,
      price: chargingType.price,
      description: chargingType.description || ''
    });
    setEditingId(chargingType.id);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Gerenciar Tipos de Cobrança</CardTitle>
            <CardDescription>
              {service.name} • {service.category.name}
            </CardDescription>
          </div>
          <Button variant="outline" onClick={onClose}>
            Voltar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Formulário */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {editingId ? "Editar Tipo de Cobrança" : "Adicionar Novo Tipo de Cobrança"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Cobrança</Label>
                  <Select 
                    value={form.chargingType} 
                    onValueChange={(value: any) => setForm({ ...form, chargingType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(chargingTypeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Preço {form.chargingType === 'quote' ? '(Opcional)' : '*'}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={form.chargingType === 'quote' ? "Deixe vazio para 'sob consulta'" : "0.00"}
                    value={form.price || ''}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descrição (Opcional)</Label>
                <Input
                  placeholder="Ex: Inclui deslocamento, Mínimo 2 horas, etc."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {editingId ? "Atualizar" : "Adicionar"}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Lista de tipos configurados */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tipos Configurados</CardTitle>
          </CardHeader>
          <CardContent>
            {service.chargingTypes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum tipo de cobrança configurado ainda</p>
                <p className="text-sm">Adicione seu primeiro tipo de cobrança acima</p>
              </div>
            ) : (
              <div className="space-y-2">
                {service.chargingTypes.map((chargingType) => {
                  const Icon = chargingTypeIcons[chargingType.chargingType];
                  return (
                    <div key={chargingType.id} className="flex items-center justify-between p-3 border rounded-md">
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-primary" />
                        <div>
                          <div className="font-medium">
                            {chargingTypeLabels[chargingType.chargingType]}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {chargingType.chargingType === 'quote' ? 'Sob consulta' : `R$ ${chargingType.price}`}
                            {chargingType.description && ` • ${chargingType.description}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={chargingType.isActive ? "default" : "secondary"}>
                          {chargingType.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(chargingType)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteMutation.mutate(chargingType.id)}
                          disabled={deleteMutation.isPending}
                        >
                          Remover
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}

export default function MeusServicos() {
  const { user } = useAuth();
  const [selectedService, setSelectedService] = useState<ProviderService | null>(null);

  // Buscar serviços do prestador
  const { data: services = [], isLoading } = useQuery<ProviderService[]>({
    queryKey: ["/api/providers/services"],
    enabled: user?.userType === "provider",
  });

  if (!user || user.userType !== "provider") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Acesso Negado</h1>
          <p className="text-muted-foreground">Você precisa ser um prestador para acessar esta página.</p>
        </div>
      </div>
    );
  }

  if (selectedService) {
    return (
      <ProviderLayout>
        <div className="p-6">
          <ChargingTypeManager 
            service={selectedService} 
            onClose={() => setSelectedService(null)} 
          />
        </div>
      </ProviderLayout>
    );
  }

  return (
    <ProviderLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Meus Serviços</h1>
            <p className="text-muted-foreground">
              Configure os tipos de cobrança para os serviços em que você se inscreveu
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-5/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : services.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">Nenhum serviço encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Você ainda não se inscreveu em nenhum serviço. Acesse "Serviços → Inscrever" para se inscrever em serviços.
              </p>
              <Button asChild>
                <a href="/services">Explorar Serviços</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <ServiceChargingTypeCard
                key={service.id}
                service={service}
                onEdit={setSelectedService}
              />
            ))}
          </div>
        )}
      </div>
    </ProviderLayout>
  );
}