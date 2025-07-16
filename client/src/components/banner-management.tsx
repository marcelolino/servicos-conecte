import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import ImageUpload from '@/components/image-upload';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar,
  Tag,
  MousePointer,
  BarChart3,
  Image as ImageIcon,
  ExternalLink
} from 'lucide-react';

const bannerSchema = z.object({
  title: z.string().min(2, 'Título deve ter pelo menos 2 caracteres'),
  description: z.string().optional(),
  imageUrl: z.string().min(1, 'Imagem é obrigatória'),
  categoryId: z.string().optional(),
  targetUrl: z.string().optional(),
  status: z.enum(['active', 'inactive', 'scheduled']).default('active'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  displayOrder: z.number().min(0).default(0),
});

type BannerForm = z.infer<typeof bannerSchema>;

export default function BannerManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);

  const form = useForm<BannerForm>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      title: '',
      description: '',
      imageUrl: '',
      categoryId: '',
      targetUrl: '',
      status: 'active',
      startDate: '',
      endDate: '',
      displayOrder: 0,
    },
  });

  const editForm = useForm<BannerForm>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      title: '',
      description: '',
      imageUrl: '',
      categoryId: '',
      targetUrl: '',
      status: 'active',
      startDate: '',
      endDate: '',
      displayOrder: 0,
    },
  });

  const { data: banners, isLoading: bannersLoading } = useQuery({
    queryKey: ['/api/admin/banners'],
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/categories'],
  });

  const createBannerMutation = useMutation({
    mutationFn: (data: BannerForm) =>
      apiRequest('/api/admin/banners', { method: 'POST', body: data }),
    onSuccess: () => {
      toast({ title: 'Banner criado com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/banners'] });
      queryClient.invalidateQueries({ queryKey: ['/api/banners'] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar banner',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateBannerMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<BannerForm> }) =>
      apiRequest(`/api/admin/banners/${id}`, { method: 'PUT', body: data }),
    onSuccess: () => {
      toast({ title: 'Banner atualizado com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/banners'] });
      queryClient.invalidateQueries({ queryKey: ['/api/banners'] });
      setIsEditDialogOpen(false);
      setEditingBanner(null);
      editForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar banner',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteBannerMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/admin/banners/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast({ title: 'Banner removido com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/banners'] });
      queryClient.invalidateQueries({ queryKey: ['/api/banners'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover banner',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: BannerForm) => {
    const processedData = {
      ...data,
      categoryId: data.categoryId ? parseInt(data.categoryId) : null,
      startDate: data.startDate ? new Date(data.startDate).toISOString() : null,
      endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
    };
    createBannerMutation.mutate(processedData);
  };

  const onEditSubmit = (data: BannerForm) => {
    if (editingBanner) {
      const processedData = {
        ...data,
        categoryId: data.categoryId ? parseInt(data.categoryId) : null,
        startDate: data.startDate ? new Date(data.startDate).toISOString() : null,
        endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
      };
      updateBannerMutation.mutate({ id: editingBanner.id, data: processedData });
    }
  };

  const handleEdit = (banner: any) => {
    setEditingBanner(banner);
    editForm.reset({
      title: banner.title,
      description: banner.description || '',
      imageUrl: banner.imageUrl || '',
      categoryId: banner.categoryId?.toString() || '',
      targetUrl: banner.targetUrl || '',
      status: banner.status,
      startDate: banner.startDate ? new Date(banner.startDate).toISOString().split('T')[0] : '',
      endDate: banner.endDate ? new Date(banner.endDate).toISOString().split('T')[0] : '',
      displayOrder: banner.displayOrder || 0,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Tem certeza que deseja remover este banner?')) {
      deleteBannerMutation.mutate(id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'inactive':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'inactive':
        return 'Inativo';
      case 'scheduled':
        return 'Agendado';
      default:
        return status;
    }
  };

  const handleImageUpload = (imageUrl: string, formType: 'create' | 'edit') => {
    if (formType === 'create') {
      form.setValue('imageUrl', imageUrl);
    } else {
      editForm.setValue('imageUrl', imageUrl);
    }
    toast({
      title: 'Imagem carregada!',
      description: 'A imagem do banner foi carregada com sucesso.',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gerenciamento de Banners</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Novo Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Banner</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Título do banner" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="displayOrder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ordem de Exibição</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="0"
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            placeholder="0"
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
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Descrição do banner" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Imagem do Banner</FormLabel>
                      <FormControl>
                        <div className="space-y-4">
                          <ImageUpload
                            category="banner"
                            onUpload={(url) => handleImageUpload(url, 'create')}
                            currentImages={field.value ? [field.value] : []}
                            multiple={false}
                            maxFiles={1}
                          />
                          <Input
                            {...field}
                            placeholder="URL da imagem será preenchida automaticamente"
                            className="hidden"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Nenhuma categoria</SelectItem>
                            {categories?.map((category: any) => (
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
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Ativo</SelectItem>
                            <SelectItem value="inactive">Inativo</SelectItem>
                            <SelectItem value="scheduled">Agendado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="targetUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL de Destino</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Início</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Fim</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createBannerMutation.isPending}>
                    {createBannerMutation.isPending ? 'Criando...' : 'Criar Banner'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Banners List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bannersLoading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <Card key={index}>
              <div className="aspect-[3/1] bg-gray-200 animate-pulse rounded-t-lg"></div>
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
              </CardContent>
            </Card>
          ))
        ) : banners?.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Nenhum banner encontrado
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Crie seu primeiro banner promocional
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeiro Banner
            </Button>
          </div>
        ) : (
          banners?.map((banner: any) => (
            <Card key={banner.id} className="group hover:shadow-lg transition-shadow">
              <div className="aspect-[3/1] relative overflow-hidden rounded-t-lg">
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/api/placeholder/600/200';
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => window.open(banner.imageUrl, '_blank')}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleEdit(banner)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(banner.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge className={getStatusColor(banner.status)}>
                    {getStatusText(banner.status)}
                  </Badge>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MousePointer className="h-4 w-4" />
                    <span>{banner.clickCount || 0}</span>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {banner.title}
                </h3>
                {banner.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                    {banner.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Ordem: {banner.displayOrder || 0}</span>
                  {banner.targetUrl && (
                    <ExternalLink className="h-4 w-4" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Banner Dialog - Similar structure to create dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Banner</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Título do banner" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="displayOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ordem de Exibição</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="0"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          placeholder="0"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Descrição do banner" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Imagem do Banner</FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        <ImageUpload
                          category="banner"
                          onUpload={(url) => handleImageUpload(url, 'edit')}
                          currentImages={field.value ? [field.value] : []}
                          multiple={false}
                          maxFiles={1}
                        />
                        <Input
                          {...field}
                          placeholder="URL da imagem será preenchida automaticamente"
                          className="hidden"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateBannerMutation.isPending}>
                  {updateBannerMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}