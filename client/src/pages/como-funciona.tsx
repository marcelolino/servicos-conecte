import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Calendar, 
  CreditCard, 
  Star, 
  CheckCircle, 
  MessageSquare,
  ShoppingCart,
  Clock,
  MapPin,
  Shield,
  Users,
  Smartphone
} from "lucide-react";

export default function ComoFunciona() {
  const etapasCliente = [
    {
      numero: "1",
      titulo: "Encontre o Serviço",
      descricao: "Navegue pela nossa ampla lista de serviços ou use os filtros por categoria",
      icone: <Search className="h-8 w-8 text-primary" />,
      detalhes: [
        "Mais de 50 tipos diferentes de serviços",
        "Filtros por categoria, localização e preço",
        "Veja avaliações e portfólio dos prestadores"
      ]
    },
    {
      numero: "2",
      titulo: "Duas Formas de Solicitar",
      descricao: "Escolha entre fazer uma solicitação aberta ou contratar diretamente",
      icone: <MessageSquare className="h-8 w-8 text-primary" />,
      detalhes: [
        "Solicitação: Descreva sua necessidade e receba propostas",
        "Contratação direta: Adicione serviços ao carrinho",
        "Compare preços e prestadores"
      ]
    },
    {
      numero: "3",
      titulo: "Agendamento",
      descricao: "Escolha data, horário e confirme o endereço do serviço",
      icone: <Calendar className="h-8 w-8 text-primary" />,
      detalhes: [
        "Agenda flexível do prestador",
        "Confirmação automática da disponibilidade",
        "Notificações de lembrete por email/SMS"
      ]
    },
    {
      numero: "4",
      titulo: "Pagamento Seguro",
      descricao: "Pague de forma segura através da plataforma",
      icone: <CreditCard className="h-8 w-8 text-primary" />,
      detalhes: [
        "Cartão de crédito, débito ou PIX",
        "Pagamento protegido pela plataforma",
        "Dinheiro liberado após conclusão do serviço"
      ]
    },
    {
      numero: "5",
      titulo: "Serviço Realizado",
      descricao: "Acompanhe o progresso e avalie o prestador",
      icone: <CheckCircle className="h-8 w-8 text-primary" />,
      detalhes: [
        "Notificações em tempo real",
        "Chat direto com o prestador",
        "Sistema de avaliação pós-serviço"
      ]
    }
  ];

  const tiposServico = [
    {
      titulo: "Solicitações",
      descricao: "Publique sua necessidade e receba propostas de prestadores interessados",
      icone: <MessageSquare className="h-6 w-6" />,
      fluxo: [
        "Você descreve o que precisa",
        "Prestadores fazem propostas",
        "Você escolhe a melhor oferta",
        "Formaliza como pedido"
      ],
      exemplo: "Preciso de limpeza da casa com 3 quartos"
    },
    {
      titulo: "Pedidos Diretos",
      descricao: "Contrate serviços específicos diretamente do catálogo ou prestador",
      icone: <ShoppingCart className="h-6 w-6" />,
      fluxo: [
        "Navegue pelo catálogo",
        "Adicione serviços ao carrinho",
        "Escolha data e horário", 
        "Efetue o pagamento"
      ],
      exemplo: "Limpeza de Sofá por R$ 80,00"
    }
  ];

  const vantagens = [
    {
      icone: <Shield className="h-6 w-6 text-green-600" />,
      titulo: "Pagamento Protegido",
      descricao: "Seu dinheiro fica protegido até a conclusão do serviço"
    },
    {
      icone: <Users className="h-6 w-6 text-blue-600" />,
      titulo: "Prestadores Verificados",
      descricao: "Todos os prestadores passam por processo de aprovação"
    },
    {
      icone: <Star className="h-6 w-6 text-yellow-600" />,
      titulo: "Sistema de Avaliações",
      descricao: "Avaliações reais de clientes para sua segurança"
    },
    {
      icone: <Clock className="h-6 w-6 text-purple-600" />,
      titulo: "Agendamento Flexível",
      descricao: "Escolha o melhor horário para você"
    },
    {
      icone: <Smartphone className="h-6 w-6 text-indigo-600" />,
      titulo: "App Mobile",
      descricao: "Gerencie tudo pelo celular (em breve)"
    },
    {
      icone: <MapPin className="h-6 w-6 text-red-600" />,
      titulo: "Cobertura Local",
      descricao: "Prestadores da sua região para atendimento rápido"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Como Funciona o Qserviços</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Conectamos você com prestadores de serviços qualificados de forma simples, 
            rápida e segura. Entenda como funciona nossa plataforma.
          </p>
        </div>

        {/* Tipos de Serviço */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-center">Duas Formas de Contratar</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {tiposServico.map((tipo, index) => (
              <Card key={index} className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    {tipo.icone}
                    {tipo.titulo}
                  </CardTitle>
                  <p className="text-muted-foreground">{tipo.descricao}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Como funciona:</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      {tipo.fluxo.map((etapa, i) => (
                        <li key={i} className="text-muted-foreground">{etapa}</li>
                      ))}
                    </ol>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm"><strong>Exemplo:</strong> {tipo.exemplo}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Etapas do Processo */}
        <section className="space-y-8">
          <h2 className="text-3xl font-bold text-center">Passo a Passo</h2>
          <div className="space-y-6">
            {etapasCliente.map((etapa, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-lg">
                        {etapa.numero}
                      </div>
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        {etapa.icone}
                        <h3 className="text-xl font-bold">{etapa.titulo}</h3>
                      </div>
                      <p className="text-muted-foreground">{etapa.descricao}</p>
                      <div className="grid gap-2">
                        {etapa.detalhes.map((detalhe, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm">{detalhe}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Diferença entre Solicitação e Pedido */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-center">Solicitação vs Pedido</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-blue-700 dark:text-blue-300">
                  Solicitação (ServiceRequest)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Pedido inicial onde você descreve sua necessidade
                </p>
                <div className="space-y-2">
                  <Badge variant="outline">Flexível</Badge>
                  <Badge variant="outline">Recebe Propostas</Badge>
                </div>
                <ul className="text-sm space-y-1">
                  <li>• Você descreve o que precisa</li>
                  <li>• Prestadores fazem propostas</li>
                  <li>• Você escolhe a melhor oferta</li>
                  <li>• Status: pendente → aceita → concluída</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle className="text-green-700 dark:text-green-300">
                  Pedido (Order)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Transação formalizada com prestador definido
                </p>
                <div className="space-y-2">
                  <Badge variant="outline">Estruturado</Badge>
                  <Badge variant="outline">Pagamento</Badge>
                </div>
                <ul className="text-sm space-y-1">
                  <li>• Carrinho de serviços</li>
                  <li>• Prestador já definido</li>
                  <li>• Valores e pagamento formalizados</li>
                  <li>• Status: carrinho → pago → executado</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Vantagens */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-center">Por Que Escolher o Qserviços?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vantagens.map((vantagem, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6 space-y-3">
                  <div className="flex justify-center">
                    {vantagem.icone}
                  </div>
                  <h3 className="font-semibold">{vantagem.titulo}</h3>
                  <p className="text-sm text-muted-foreground">
                    {vantagem.descricao}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ Rápido */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-center">Dúvidas Frequentes</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Como é garantida a qualidade?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Todos os prestadores passam por verificação de documentos e avaliação. 
                  Além disso, o sistema de avaliações permite que você veja a experiência 
                  de outros clientes.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">E se o serviço não atender?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Seu pagamento fica protegido até a conclusão satisfatória do serviço. 
                  Em caso de problemas, nossa equipe de suporte mediará a situação.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Posso cancelar um agendamento?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Sim, você pode cancelar com antecedência conforme política de cancelamento. 
                  Cancelamentos de última hora podem ter taxas aplicadas.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Como funciona o pagamento?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Aceitamos cartão de crédito, débito e PIX. O pagamento é processado 
                  pela plataforma e só é liberado ao prestador após a conclusão do serviço.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center space-y-6 py-12">
          <h2 className="text-3xl font-bold">Pronto para Começar?</h2>
          <p className="text-lg text-muted-foreground">
            Encontre o serviço que você precisa em nossa plataforma
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/"
              className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Ver Serviços Disponíveis
            </a>
            <a 
              href="/register"
              className="inline-flex items-center justify-center rounded-full border border-primary px-8 py-3 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              Criar Conta Grátis
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}