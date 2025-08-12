import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ModernAdminLayout } from "@/components/layout/modern-admin-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Eye, FileText } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";

interface PageConfiguration {
  id: number;
  pageKey: string;
  title: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const pageConfigSchema = z.object({
  pageKey: z.string().min(1, "Chave da página é obrigatória"),
  title: z.string().min(1, "Título é obrigatório"),
  content: z.string().min(1, "Conteúdo é obrigatório"),
  isActive: z.boolean().default(true),
});

type PageConfigForm = z.infer<typeof pageConfigSchema>;

const defaultPages = [
  {
    key: "about_us",
    title: "Quem Somos",
    description: "Informações sobre a empresa"
  },
  {
    key: "cancellation_policy",
    title: "Política de Cancelamento",
    description: "Regras para cancelamento de serviços"
  },
  {
    key: "privacy_policy",
    title: "Política de Privacidade",
    description: "Como tratamos os dados dos usuários"
  },
  {
    key: "refund_policy",
    title: "Política de Reembolso",
    description: "Condições para reembolsos"
  },
  {
    key: "terms_and_conditions",
    title: "Termos e Condições",
    description: "Termos de uso da plataforma"
  }
];

const defaultContent = {
  about_us: `# Quem Somos

Bem-vindos à Qserviços, sua plataforma premium de serviços sob demanda. Na Qserviços, nos dedicamos a revolucionar como você acessa e experimenta serviços essenciais. Nossa plataforma conecta você facilmente com profissionais qualificados, proporcionando os serviços que você precisa quando precisa.

## Nossa Missão

A Qserviços foi fundada com uma missão simples e poderosa: capacitar indivíduos e empresas, facilitando serviços de alta qualidade e sob demanda acessíveis a todos. Acreditamos que eficiência, confiabilidade e conveniência devem estar no centro de toda experiência de serviço.`,

  cancellation_policy: `# Política de Cancelamento

Na Qserviços, entendemos que planos podem mudar. Para cancelar uma reserva, siga a seguinte política:

## Janela de Cancelamento

Os usuários podem cancelar uma reserva até 24 horas antes do serviço agendado. Isso permite que se ajuste a programação digital e acomodem mudanças.`,

  privacy_policy: `# Política de Privacidade da Qserviços

Bem-vindos à Qserviços, sua loja de serviços sob demanda. Esta Política de Privacidade descreve como a Qserviços coleta, usa e protege suas informações pessoais. Ao usar a Qserviços, você concorda com os termos descritos nesta política.

## Informações que Coletamos

Quando você se cadastra na Qserviços, coletamos informações pessoais como seu nome, detalhes de contato e informações de pagamento. Também reunimos dados sobre seu dispositivo, endereço IP e padrões de uso para melhorar nossos serviços.`,

  refund_policy: `# Política de Reembolso

Na Qserviços, priorizamos a satisfação do cliente e nos esforçamos para fornecer uma política de reembolso clara e justa. Familiarize-se com nossa política de reembolso abaixo:

## Elegibilidade para Reembolsos

Reembolsos são aplicáveis para cancelamentos de serviços dentro de 24 horas antes do serviço agendado. Isso permite que os usuários tenham a flexibilidade de ajustar planos.`,

  terms_and_conditions: `# Termos e Condições da Qserviços

Bem-vindos à Qserviços, a plataforma de serviços sob demanda. Os seguintes termos e condições delineiam as regras e regulamentos que regem o uso dos serviços da Qserviços. Ao acessar ou usar a Qserviços, você concorda em cumprir estes termos.

## Uso do Serviço

A Qserviços fornece serviços sob demanda conectando usuários com prestadores de serviços. Os usuários concordam em usar a plataforma para fins legais e cumprir todos os regulamentos aplicáveis.`
};

export default function AdminPageConfigurations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPage, setSelectedPage] = useState<PageConfiguration | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);

  const { data: pageConfigs = [], isLoading } = useQuery({
    queryKey: ["/api/admin/page-configurations"],
    refetchOnWindowFocus: false,
  });

  const createPageMutation = useMutation({
    mutationFn: (data: PageConfigForm) => 
      apiRequest("/api/admin/page-configurations", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/page-configurations"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Configuração de página criada com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar configuração de página",
        variant: "destructive",
      });
    },
  });

  const updatePageMutation = useMutation({
    mutationFn: ({ pageKey, data }: { pageKey: string; data: Partial<PageConfigForm> }) => 
      apiRequest(`/api/admin/page-configurations/${pageKey}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/page-configurations"] });
      setIsEditDialogOpen(false);
      setSelectedPage(null);
      toast({
        title: "Sucesso",
        description: "Configuração de página atualizada com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar configuração de página",
        variant: "destructive",
      });
    },
  });

  const deletePageMutation = useMutation({
    mutationFn: (pageKey: string) => 
      apiRequest(`/api/admin/page-configurations/${pageKey}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/page-configurations"] });
      toast({
        title: "Sucesso",
        description: "Configuração de página excluída com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir configuração de página",
        variant: "destructive",
      });
    },
  });

  const createForm = useForm<PageConfigForm>({
    resolver: zodResolver(pageConfigSchema),
    defaultValues: {
      pageKey: "",
      title: "",
      content: "",
      isActive: true,
    },
  });

  const editForm = useForm<PageConfigForm>({
    resolver: zodResolver(pageConfigSchema),
    defaultValues: {
      pageKey: "",
      title: "",
      content: "",
      isActive: true,
    },
  });

  const handleCreateDefaultPages = async () => {
    for (const page of defaultPages) {
      const existingConfig = pageConfigs.find((config: PageConfiguration) => config.pageKey === page.key);
      if (!existingConfig) {
        try {
          await createPageMutation.mutateAsync({
            pageKey: page.key,
            title: page.title,
            content: defaultContent[page.key as keyof typeof defaultContent] || `# ${page.title}\n\nConteúdo da página ${page.title}.`,
            isActive: true,
          });
        } catch (error) {
          console.error(`Erro ao criar página ${page.key}:`, error);
        }
      }
    }
  };

  const handleCreate = (data: PageConfigForm) => {
    createPageMutation.mutate(data);
  };

  const handleEdit = (pageConfig: PageConfiguration) => {
    setSelectedPage(pageConfig);
    editForm.reset({
      pageKey: pageConfig.pageKey,
      title: pageConfig.title,
      content: pageConfig.content,
      isActive: pageConfig.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = (data: PageConfigForm) => {
    if (selectedPage) {
      updatePageMutation.mutate({
        pageKey: selectedPage.pageKey,
        data,
      });
    }
  };

  const handlePreview = (pageConfig: PageConfiguration) => {
    setSelectedPage(pageConfig);
    setIsPreviewDialogOpen(true);
  };

  if (!user || user.userType !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Você não tem permissão para acessar esta página.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ModernAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Configuração de Páginas</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie o conteúdo das páginas do sistema
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreateDefaultPages} variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Criar Páginas Padrão
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Página
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Criar Nova Página</DialogTitle>
                  <DialogDescription>
                    Crie uma nova configuração de página para o sistema.
                  </DialogDescription>
                </DialogHeader>
                <Form {...createForm}>
                  <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={createForm.control}
                        name="pageKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Chave da Página</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="ex: about_us" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Título</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="ex: Quem Somos" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={createForm.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Conteúdo</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Conteúdo da página em Markdown..."
                              className="min-h-[300px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Página Ativa</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Determina se a página está visível no sistema
                            </div>
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
                    <DialogFooter>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsCreateDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createPageMutation.isPending}
                      >
                        {createPageMutation.isPending ? "Criando..." : "Criar Página"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="pages">Gerenciar Páginas</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {defaultPages.map((page) => {
                const config = pageConfigs.find((c: PageConfiguration) => c.pageKey === page.key);
                return (
                  <Card key={page.key}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {page.title}
                      </CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-xs text-muted-foreground">
                        {page.description}
                      </div>
                      <div className="mt-2">
                        {config ? (
                          <Badge variant={config.isActive ? "default" : "secondary"}>
                            {config.isActive ? "Ativa" : "Inativa"}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Não Configurada</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="pages">
            <Card>
              <CardHeader>
                <CardTitle>Páginas Configuradas</CardTitle>
                <CardDescription>
                  Lista de todas as páginas configuradas no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-4">Carregando páginas...</div>
                ) : (
                  <div className="space-y-4">
                    {pageConfigs.map((config: PageConfiguration) => (
                      <div 
                        key={config.id} 
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{config.title}</h3>
                            <Badge variant={config.isActive ? "default" : "secondary"}>
                              {config.isActive ? "Ativa" : "Inativa"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Chave: {config.pageKey}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Atualizada em: {new Date(config.updatedAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePreview(config)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(config)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deletePageMutation.mutate(config.pageKey)}
                            disabled={deletePageMutation.isPending}
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
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Página</DialogTitle>
              <DialogDescription>
                Edite a configuração da página selecionada.
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="pageKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chave da Página</FormLabel>
                        <FormControl>
                          <Input {...field} disabled />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={editForm.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conteúdo</FormLabel>
                      <FormControl>
                        <Textarea 
                          className="min-h-[300px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Página Ativa</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Determina se a página está visível no sistema
                        </div>
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
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updatePageMutation.isPending}
                  >
                    {updatePageMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Pré-visualização: {selectedPage?.title}</DialogTitle>
              <DialogDescription>
                Visualização do conteúdo da página
              </DialogDescription>
            </DialogHeader>
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap text-sm">
                {selectedPage?.content}
              </pre>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsPreviewDialogOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ModernAdminLayout>
  );
}