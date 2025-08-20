import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ModernAdminLayout } from '@/components/layout/modern-admin-layout';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { 
  Plus, 
  Edit, 
  Trash2,
  Package,
  Tag,
  Clock,
  DollarSign,
  Search,
  Filter,
  X
} from 'lucide-react';
import type { Service, ServiceCategory, CustomChargingType } from '@shared/schema';

const serviceSchema = z.object({
  categoryId: z.number().min(1, "Categoria é obrigatória"),
  subcategoryId: z.number().optional(),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
  shortDescription: z.string().optional(),
  estimatedDuration: z.string().optional(),
  durationType: z.enum(['hours', 'days', 'visits']).default('hours'),
  materialsIncluded: z.boolean().default(false),
  materialsDescription: z.string().optional(),
  visibleOnHome: z.boolean().default(false),
  isOnSale: z.boolean().default(false),
  salePercentage: z.string().optional(),
  defaultChargingType: z.enum(['visit', 'hour', 'daily', 'package', 'quote', 'servico']).default('visit'),
  suggestedMinPrice: z.string().optional(),
  suggestedMaxPrice: z.string().optional(),
  tags: z.string().optional(),
  requirements: z.string().optional(),
  imageUrl: z.string().optional(),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

export default function AdminServicesCatalog() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedChargingType, setSelectedChargingType] = useState("all");

  const { data: services = [], isLoading: servicesLoading } = useQuery<(Service & { category: ServiceCategory })[]>({
    queryKey: ['/api/admin/services-catalog'],
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<ServiceCategory[]>({
    queryKey: ['/api/categories'],
  });

  const { data: chargingTypes = [] } = useQuery<CustomChargingType[]>({
    queryKey: ['/api/admin/charging-types'],
  });

  const { data: mediaFiles = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/media'],
    select: (data) => data.filter((file: any) => 
      file.category === 'service' && file.type.startsWith('image/')
    ),
  });

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      categoryId: 0,
      name: '',
      description: '',
      shortDescription: '',
      estimatedDuration: '',
      durationType: 'hours',
      materialsIncluded: false,
      materialsDescription: '',
      visibleOnHome: false,
      isOnSale: false,
      salePercentage: '',
      defaultChargingType: 'visit',
      suggestedMinPrice: '',
      suggestedMaxPrice: '',
      tags: '',
      requirements: '',
      imageUrl: 'none',
    },
  });

  const createServiceMutation = useMutation({
    mutationFn: (data: ServiceFormData) =>
      apiRequest('/api/admin/services-catalog', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/services-catalog'] });
      form.reset();
      setIsCreateDialogOpen(false);
      toast({
        title: 'Sucesso',
        description: 'Serviço criado com sucesso',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Erro ao criar serviço',
        variant: 'destructive',
      });
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ServiceFormData }) =>
      apiRequest(`/api/admin/services-catalog/${id}`, 'PUT', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/services-catalog'] });
      form.reset();
      setIsEditDialogOpen(false);
      setEditingService(null);
      toast({
        title: 'Sucesso',
        description: 'Serviço atualizado com sucesso',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar serviço',
        variant: 'destructive',
      });
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (serviceId: number) =>
      apiRequest(`/api/admin/services-catalog/${serviceId}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/services-catalog'] });
      toast({
        title: 'Sucesso',
        description: 'Serviço excluído com sucesso',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir serviço',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ServiceFormData) => {
    if (editingService) {
      updateServiceMutation.mutate({ id: editingService.id, data });
    } else {
      createServiceMutation.mutate(data);
    }
  };

  const handleEdit = (service: Service & { category: ServiceCategory }) => {
    setEditingService(service);
    form.reset({
      categoryId: service.categoryId,
      subcategoryId: service.subcategoryId || undefined,
      name: service.name,
      description: service.description,
      shortDescription: service.shortDescription || '',
      estimatedDuration: service.estimatedDuration || '',
      durationType: (service.durationType as 'hours' | 'days' | 'visits') || 'hours',
      materialsIncluded: service.materialsIncluded || false,
      materialsDescription: service.materialsDescription || '',
      visibleOnHome: (service as any).visibleOnHome || false,
      isOnSale: (service as any).isOnSale || false,
      salePercentage: (service as any).salePercentage || '',
      defaultChargingType: (service.defaultChargingType as any) || 'visit',
      suggestedMinPrice: service.suggestedMinPrice || '',
      suggestedMaxPrice: service.suggestedMaxPrice || '',
      tags: service.tags || '',
      requirements: service.requirements || '',
      imageUrl: service.imageUrl || 'none',
    });
    setIsEditDialogOpen(true);
  };

  const handleCreateNew = () => {
    setEditingService(null);
    form.reset({
      categoryId: 0,
      name: '',
      description: '',
      shortDescription: '',
      estimatedDuration: '',
      durationType: 'hours',
      materialsIncluded: false,
      materialsDescription: '',
      visibleOnHome: false,
      isOnSale: false,
      salePercentage: '',
      defaultChargingType: 'visit',
      suggestedMinPrice: '',
      suggestedMaxPrice: '',
      tags: '',
      requirements: '',
      imageUrl: 'none',
    });
    setIsCreateDialogOpen(true);
  };

  // Filter services based on search and filters
  const filteredServices = services.filter((service) => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.category?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || 
      service.categoryId.toString() === selectedCategory;
    
    const matchesStatus = selectedStatus === "all" || 
      (selectedStatus === "active" && service.isActive) ||
      (selectedStatus === "inactive" && !service.isActive);
    
    const matchesChargingType = selectedChargingType === "all" || 
      service.defaultChargingType === selectedChargingType;
    
    return matchesSearch && matchesCategory && matchesStatus && matchesChargingType;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedStatus("all");
    setSelectedChargingType("all");
  };

  if (servicesLoading || categoriesLoading) {
    return (
      <ModernAdminLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </ModernAdminLayout>
    );
  }

  return (
    <ModernAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Catálogo de Serviços</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie o catálogo global de serviços que os prestadores podem adotar
            </p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Serviço
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Novo Serviço no Catálogo</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoria</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma categoria" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id.toString()}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="defaultChargingType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Cobrança</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {chargingTypes.map((type) => (
                                <SelectItem key={type.key} value={type.key}>
                                  {type.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Serviço</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Limpeza Residencial Completa" {...field} />
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
                        <FormLabel>Descrição Completa</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descrição detalhada do que inclui o serviço..." 
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="estimatedDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duração Estimada</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: 2-3" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="durationType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Duração</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="hours">Horas</SelectItem>
                              <SelectItem value="days">Dias</SelectItem>
                              <SelectItem value="visits">Visitas</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="suggestedMinPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preço Mínimo Sugerido</FormLabel>
                          <FormControl>
                            <Input placeholder="50.00" type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="suggestedMaxPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preço Máximo Sugerido</FormLabel>
                          <FormControl>
                            <Input placeholder="150.00" type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Imagem do Serviço</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma imagem" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Nenhuma imagem</SelectItem>
                            {mediaFiles.map((file: any) => (
                              <SelectItem key={file.id} value={file.url}>
                                <div className="flex items-center gap-2">
                                  <img src={file.url} alt={file.name} className="w-8 h-8 object-cover rounded" />
                                  <span>{file.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {field.value && field.value !== 'none' && (
                          <div className="mt-2">
                            <img src={field.value} alt="Preview" className="w-20 h-20 object-cover rounded" />
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags/Palavras-chave</FormLabel>
                        <FormControl>
                          <Input placeholder="limpeza, residencial, completa (separadas por vírgula)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="visibleOnHome"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Visível na Página Inicial
                          </FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Quando ativado, este serviço ficará visível na home para que clientes possam solicitar mesmo sem prestadores específicos.
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isOnSale"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Em Oferta
                          </FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Ative para aplicar um desconto em porcentagem neste serviço.
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {form.watch('isOnSale') && (
                    <FormField
                      control={form.control}
                      name="salePercentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Porcentagem de Desconto (%)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: 15 (para 15% de desconto)"
                              type="number"
                              min="1"
                              max="99"
                              {...field}
                            />
                          </FormControl>
                          <p className="text-sm text-muted-foreground">
                            Informe a porcentagem de desconto (1-99%)
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={createServiceMutation.isPending}
                  >
                    {createServiceMutation.isPending ? 'Criando...' : 'Criar Serviço'}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar Serviço do Catálogo</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {/* Same form fields as create dialog */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoria</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma categoria" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id.toString()}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="defaultChargingType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Cobrança</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {chargingTypes.map((type) => (
                                <SelectItem key={type.key} value={type.key}>
                                  {type.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Serviço</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Limpeza Residencial Completa" {...field} />
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
                        <FormLabel>Descrição Completa</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descrição detalhada do que inclui o serviço..." 
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="estimatedDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duração Estimada</FormLabel>
                          <FormControl>
                            <Input placeholder="2-3" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="durationType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Duração</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="hours">Horas</SelectItem>
                              <SelectItem value="days">Dias</SelectItem>
                              <SelectItem value="visits">Visitas</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="suggestedMinPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preço Mínimo Sugerido</FormLabel>
                          <FormControl>
                            <Input placeholder="50.00" type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="suggestedMaxPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preço Máximo Sugerido</FormLabel>
                          <FormControl>
                            <Input placeholder="150.00" type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Imagem do Serviço</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma imagem" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Nenhuma imagem</SelectItem>
                            {mediaFiles.map((file: any) => (
                              <SelectItem key={file.id} value={file.url}>
                                <div className="flex items-center gap-2">
                                  <img src={file.url} alt={file.name} className="w-8 h-8 object-cover rounded" />
                                  <span>{file.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {field.value && field.value !== 'none' && (
                          <div className="mt-2">
                            <img src={field.value} alt="Preview" className="w-20 h-20 object-cover rounded" />
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags/Palavras-chave</FormLabel>
                        <FormControl>
                          <Input placeholder="limpeza, residencial, completa (separadas por vírgula)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="visibleOnHome"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Visível na Página Inicial
                          </FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Quando ativado, este serviço ficará visível na home para que clientes possam solicitar mesmo sem prestadores específicos.
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isOnSale"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Em Oferta
                          </FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Ative para aplicar um desconto em porcentagem neste serviço.
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {form.watch('isOnSale') && (
                    <FormField
                      control={form.control}
                      name="salePercentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Porcentagem de Desconto (%)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: 15 (para 15% de desconto)"
                              type="number"
                              min="1"
                              max="99"
                              {...field}
                            />
                          </FormControl>
                          <p className="text-sm text-muted-foreground">
                            Informe a porcentagem de desconto (1-99%)
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={updateServiceMutation.isPending}
                  >
                    {updateServiceMutation.isPending ? 'Atualizando...' : 'Atualizar Serviço'}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Serviços</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{services.length}</div>
              <p className="text-xs text-muted-foreground">
                Serviços no catálogo
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Por Categoria</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories.length}</div>
              <p className="text-xs text-muted-foreground">
                Categorias ativas
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Com Preços</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {services.filter(s => s.suggestedMinPrice).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Com preços sugeridos
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Com Duração</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {services.filter(s => s.estimatedDuration).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Com tempo estimado
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filter Section */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Pesquisar por categoria ou nome do serviço..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>

              {/* Charging Type Filter */}
              <Select value={selectedChargingType} onValueChange={setSelectedChargingType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de Cobrança" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {chargingTypes.map((type) => (
                    <SelectItem key={type.key} value={type.key}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters Button */}
            {(searchTerm || selectedCategory !== "all" || selectedStatus !== "all" || selectedChargingType !== "all") && (
              <div className="mt-4 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Limpar
                </Button>
              </div>
            )}

            {/* Results Summary */}
            <div className="mt-4 text-sm text-muted-foreground">
              Mostrando {filteredServices.length} de {services.length} serviços
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Serviços do Catálogo</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredServices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {services.length === 0 ? "Nenhum serviço cadastrado no catálogo" : "Nenhum serviço encontrado com os filtros aplicados"}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Preço Sugerido</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Home</TableHead>
                    <TableHead>Em Oferta</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold">{service.name}</div>
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {service.shortDescription || service.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {service.category?.name || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {service.estimatedDuration ? (
                          <span className="text-sm">
                            {service.estimatedDuration} {service.durationType === 'hours' ? 'h' : service.durationType === 'days' ? 'd' : 'v'}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {service.suggestedMinPrice && service.suggestedMaxPrice ? (
                          <span className="text-sm">
                            R$ {service.suggestedMinPrice} - R$ {service.suggestedMaxPrice}
                          </span>
                        ) : service.suggestedMinPrice ? (
                          <span className="text-sm">R$ {service.suggestedMinPrice}+</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {chargingTypes.find(type => type.key === service.defaultChargingType)?.name || service.defaultChargingType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={(service as any).visibleOnHome ? "default" : "outline"}>
                          {(service as any).visibleOnHome ? "Visível" : "Oculto"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {(service as any).isOnSale ? (
                          <div className="flex items-center gap-1">
                            <Badge variant="destructive">
                              {(service as any).salePercentage}% OFF
                            </Badge>
                          </div>
                        ) : (
                          <Badge variant="outline">
                            Sem oferta
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEdit(service)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => deleteServiceMutation.mutate(service.id)}
                            disabled={deleteServiceMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </ModernAdminLayout>
  );
}