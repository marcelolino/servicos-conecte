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

## A Qserviços

Bem-vindos à **Qserviços**, a plataforma brasileira que revoluciona a contratação de serviços domiciliares e empresariais. Somos uma empresa 100% nacional, fundada com o propósito de conectar pessoas que precisam de serviços com profissionais qualificados de forma rápida, segura e transparente.

## Nossa História

Fundada em 2024, a Qserviços nasceu da necessidade de simplificar a busca e contratação de serviços no Brasil. Percebemos que tanto clientes quanto prestadores enfrentavam dificuldades para se conectar de forma eficiente e segura. Nossa plataforma digital foi desenvolvida para resolver essas questões, oferecendo uma experiência moderna e confiável.

## Nossa Missão

Facilitar o acesso a serviços de qualidade, conectando clientes e prestadores através de uma plataforma digital segura, transparente e eficiente, contribuindo para o crescimento econômico e profissional de ambas as partes.

## Nossa Visão

Ser a principal plataforma de serviços do Brasil, reconhecida pela excelência, confiabilidade e inovação, transformando a forma como os brasileiros contratam e oferecem serviços.

## Nossos Valores

### 🛡️ **Segurança e Confiança**
Todos os prestadores passam por rigoroso processo de verificação, incluindo análise de documentos e antecedentes.

### ⚡ **Agilidade e Eficiência**
Conectamos você ao prestador ideal em minutos, com agendamento flexível e atendimento rápido.

### 💎 **Qualidade Garantida**
Sistema de avaliações e feedback garante que apenas os melhores profissionais permaneçam na plataforma.

### 💰 **Preços Justos**
Transparência total nos valores, sem taxas ocultas ou surpresas no final.

### 🤝 **Atendimento Humanizado**
Suporte dedicado para esclarecer dúvidas e resolver problemas de forma rápida e eficaz.

## Como Funcionamos

### Para Clientes
1. **Busque** o serviço que precisa
2. **Compare** profissionais e preços
3. **Contrate** com segurança
4. **Avalie** a experiência

### Para Prestadores
1. **Cadastre-se** na plataforma
2. **Seja verificado** pela nossa equipe
3. **Receba pedidos** de clientes
4. **Cresça** seu negócio

## Nossas Categorias de Serviços

- 🏠 **Limpeza Residencial e Comercial**
- 🔧 **Manutenção e Reparos**
- 🏗️ **Reformas e Construção**
- 💻 **Serviços de Tecnologia**
- 🚗 **Automotivos**
- 🎓 **Educação e Consultoria**
- 🌿 **Jardinagem e Paisagismo**
- 👥 **Cuidados Pessoais**

## Nosso Compromisso

A Qserviços está comprometida em:

- Manter os mais altos padrões de segurança e privacidade
- Oferecer uma plataforma acessível e fácil de usar
- Garantir preços justos e transparência total
- Fornecer suporte técnico e atendimento de qualidade
- Apoiar o crescimento profissional dos prestadores
- Contribuir para a economia digital brasileira

## Certificações e Compliance

- ✅ Registro no CNPJ: XX.XXX.XXX/0001-XX
- ✅ Compliance com a Lei Geral de Proteção de Dados (LGPD)
- ✅ Certificação SSL para transações seguras
- ✅ Parcerias com gateways de pagamento licenciados
- ✅ Políticas de segurança auditadas

## Contato

**Qserviços Tecnologia Ltda.**
CNPJ: XX.XXX.XXX/0001-XX
Endereço: Rua da Inovação, 123 - São Paulo/SP
CEP: 01234-567
Telefone: (11) 9999-9999
E-mail: contato@qservicos.com.br

**Atendimento ao Cliente:**
Segunda a Sexta: 8h às 18h
Sábados: 8h às 14h
WhatsApp: (11) 99999-9999

---

*Última atualização: ${new Date().toLocaleDateString('pt-BR')}*`,

  cancellation_policy: `# Política de Cancelamento

A Qserviços entende que imprevistos acontecem e que às vezes é necessário cancelar ou remarcar um serviço. Esta política estabelece as regras e condições para cancelamentos em nossa plataforma.

## 1. Cancelamento pelo Cliente

### 1.1 Prazo para Cancelamento Gratuito
- **Serviços únicos**: Cancelamento gratuito até 24 horas antes do horário agendado
- **Serviços recorrentes**: Cancelamento gratuito até 24 horas antes da primeira prestação
- **Serviços de emergência**: Não se aplicam cancelamentos gratuitos

### 1.2 Cancelamento com Cobrança
- **Entre 12h e 24h antes**: Cobrança de 25% do valor do serviço
- **Entre 6h e 12h antes**: Cobrança de 50% do valor do serviço
- **Menos de 6h antes**: Cobrança de 75% do valor do serviço
- **Após o prestador ter se deslocado**: Cobrança de 100% do valor

### 1.3 Como Cancelar
1. Acesse sua conta na Qserviços
2. Vá em "Meus Agendamentos"
3. Selecione o serviço a ser cancelado
4. Clique em "Cancelar Serviço"
5. Informe o motivo do cancelamento
6. Confirme o cancelamento

## 2. Cancelamento pelo Prestador

### 2.1 Cancelamento com Antecedência
- Prestadores podem cancelar até 12 horas antes sem penalidade
- Cliente será notificado imediatamente
- Qserviços oferecerá prestador substituto quando possível

### 2.2 Cancelamento de Última Hora
- Cancelamentos com menos de 12 horas resultam em advertência
- Cancelamentos frequentes podem resultar em suspensão da conta
- Cliente receberá compensação conforme política de ressarcimento

## 3. Cancelamento por Força Maior

### 3.1 Situações Cobertas
- Condições climáticas extremas
- Emergências médicas (mediante comprovação)
- Problemas de segurança pública
- Decreto governamental

### 3.2 Procedimento
- Comunicação imediata à Qserviços
- Apresentação de documentação quando solicitado
- Cancelamento sem cobrança de taxas

## 4. Reagendamento

### 4.1 Reagendamento Gratuito
- Até 24 horas antes do serviço agendado
- Sujeito à disponibilidade do prestador
- Máximo de 2 reagendamentos por serviço

### 4.2 Reagendamento com Taxa
- Entre 12h e 24h antes: Taxa de R$ 10,00
- Menos de 12h antes: Taxa de R$ 25,00

## 5. Reembolsos

### 5.1 Prazo para Reembolso
- Cartão de crédito: até 2 faturas
- PIX/Transferência: até 5 dias úteis
- Débito em conta: até 5 dias úteis

### 5.2 Valor do Reembolso
- Será descontada a taxa de cancelamento aplicável
- Taxas de processamento não são reembolsáveis
- Promoções seguem regras específicas

## 6. Casos Especiais

### 6.1 No-show do Cliente
- Cliente ausente no horário agendado sem cancelamento prévio
- Cobrança de 100% do valor do serviço
- Prestador terá direito a compensação integral

### 6.2 No-show do Prestador
- Prestador ausente sem comunicação prévia
- Cliente isento de qualquer cobrança
- Prestador sujeito a penalidades contratuais

## 7. Contato para Cancelamentos

**Central de Atendimento:**
- Telefone: (11) 9999-9999
- WhatsApp: (11) 99999-9999
- E-mail: cancelamentos@qservicos.com.br
- Chat online: Disponível 24/7

**Horário de Atendimento:**
- Segunda a Sexta: 6h às 22h
- Sábados: 7h às 20h
- Domingos: 8h às 18h

---
*Esta política está em conformidade com o Código de Defesa do Consumidor e a legislação brasileira.*
*Última atualização: ${new Date().toLocaleDateString('pt-BR')}*`,

  privacy_policy: `# Política de Privacidade

A **Qserviços Tecnologia Ltda.** ("Qserviços", "nós", "nosso" ou "nossa") está comprometida com a proteção da privacidade e dos dados pessoais de seus usuários. Esta Política de Privacidade está em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018) e descreve como coletamos, usamos, armazenamos e protegemos suas informações.

## 1. Definições e Responsabilidades

### 1.1 Controlador de Dados
A Qserviços atua como **controladora** dos dados pessoais coletados através de nossa plataforma.

### 1.2 Encarregado de Dados (DPO)
**Nome:** [Nome do DPO]
**E-mail:** dpo@qservicos.com.br
**Telefone:** (11) 9999-9999

## 2. Dados Pessoais Coletados

### 2.1 Dados de Identificação
- Nome completo
- CPF/CNPJ
- RG/Documentos de identificação
- Data de nascimento
- Foto do perfil

### 2.2 Dados de Contato
- Endereço residencial/comercial
- Telefone/Celular
- E-mail
- CEP e localização

### 2.3 Dados Financeiros
- Informações de cartão de crédito/débito (tokenizadas)
- Dados bancários para transferências
- Histórico de transações
- Informações de faturamento

### 2.4 Dados de Navegação e Uso
- Endereço IP
- Dados de geolocalização
- Cookies e tecnologias similares
- Logs de acesso e uso da plataforma
- Preferências e comportamento de navegação

### 2.5 Dados de Prestadores de Serviço
- Qualificações profissionais
- Certificações e licenças
- Avaliações e comentários
- Portfólio de trabalhos
- Histórico de prestação de serviços

## 3. Finalidades do Tratamento

### 3.1 Execução de Contratos
- Processamento de pedidos de serviços
- Facilitação da comunicação entre clientes e prestadores
- Processamento de pagamentos
- Cumprimento de obrigações contratuais

### 3.2 Legítimo Interesse
- Melhoria da experiência do usuário
- Personalização de conteúdo e ofertas
- Análise de dados para aprimoramento da plataforma
- Marketing direto de produtos e serviços relacionados

### 3.3 Cumprimento de Obrigação Legal
- Emissão de notas fiscais
- Cumprimento de determinações judiciais
- Prestação de informações a órgãos reguladores
- Combate à fraude e lavagem de dinheiro

### 3.4 Consentimento
- Marketing por e-mail e SMS
- Uso de dados para pesquisas de mercado
- Compartilhamento com parceiros comerciais
- Uso de dados para publicidade direcionada

## 4. Base Legal para o Tratamento

Nosso tratamento de dados está baseado nas seguintes hipóteses legais da LGPD:

- **Art. 7º, I** - Consentimento do titular
- **Art. 7º, V** - Execução de contrato
- - **Art. 7º, VI** - Exercício regular de direitos
- **Art. 7º, VII** - Proteção da vida
- **Art. 7º, IX** - Legítimo interesse
- **Art. 7º, X** - Proteção do crédito

## 5. Compartilhamento de Dados

### 5.1 Com Terceiros Autorizados
- Gateways de pagamento (Stripe, MercadoPago)
- Provedores de serviços de TI e hospedagem
- Empresas de análise de dados e marketing
- Prestadores de serviços contratados pelo cliente

### 5.2 Transferência Internacional
Alguns de nossos parceiros podem estar localizados fora do Brasil. Garantimos que:
- A transferência atende aos requisitos da LGPD
- Existem salvaguardas adequadas de proteção
- O país de destino oferece grau de proteção adequado

## 6. Direitos dos Titulares

Você tem os seguintes direitos sobre seus dados pessoais:

### 6.1 Confirmação e Acesso
- Confirmar a existência de tratamento
- Acessar seus dados pessoais

### 6.2 Correção e Atualização
- Corrigir dados incompletos ou inexatos
- Atualizar dados desatualizados

### 6.3 Anonimização e Eliminação
- Solicitar anonimização de dados desnecessários
- Eliminar dados tratados com base no consentimento

### 6.4 Portabilidade
- Solicitar portabilidade dos dados a outro prestador

### 6.5 Revogação de Consentimento
- Revogar consentimento a qualquer momento
- Não prejudica a licitude do tratamento anterior

### 6.6 Como Exercer seus Direitos
- E-mail: privacidade@qservicos.com.br
- Telefone: (11) 9999-9999
- Portal do usuário na plataforma
- Formulário online específico

## 7. Proteção e Segurança

### 7.1 Medidas de Segurança
- Criptografia SSL/TLS para transmissão de dados
- Criptografia de dados sensíveis em repouso
- Controle de acesso baseado em funções
- Monitoramento contínuo de segurança
- Backup regular dos dados

### 7.2 Incidentes de Segurança
- Notificação à ANPD em até 72 horas
- Comunicação aos titulares quando necessário
- Plano de resposta a incidentes implementado

## 8. Retenção de Dados

### 8.1 Critérios de Retenção
- **Dados de conta ativa:** Durante a vigência do relacionamento
- **Dados financeiros:** 5 anos após a última transação
- **Dados de prestadores:** 5 anos após desligamento
- **Logs de acesso:** 6 meses
- **Dados de marketing:** Até revogação do consentimento

### 8.2 Eliminação Segura
- Eliminação física e lógica dos dados
- Certificados de destruição quando aplicável
- Anonimização irreversível como alternativa

## 9. Cookies e Tecnologias Similares

### 9.1 Tipos de Cookies
- **Essenciais:** Necessários para funcionamento da plataforma
- **Funcionais:** Lembram preferências do usuário
- **Analíticos:** Coletam informações sobre uso da plataforma
- **Publicitários:** Personalizam anúncios

### 9.2 Gerenciamento de Cookies
Você pode gerenciar cookies através:
- Configurações do navegador
- Painel de controle de privacidade da plataforma
- Ferramentas de opt-out de terceiros

## 10. Menores de Idade

### 10.1 Restrições
- Não coletamos dados de menores de 13 anos
- Menores entre 13-18 anos precisam de autorização dos pais
- Verificação da idade é obrigatória no cadastro

### 10.2 Dados Coletados Inadvertidamente
- Eliminação imediata quando identificados
- Notificação aos responsáveis legais
- Revisão dos processos de verificação

## 11. Alterações nesta Política

### 11.1 Notificação de Mudanças
- Comunicação por e-mail para alterações substanciais
- Aviso na plataforma para alterações menores
- Histórico de versões disponível

### 11.2 Vigência
Esta política entra em vigor na data de sua publicação e permanece válida até ser substituída.

## 12. Contato

Para questões sobre privacidade e proteção de dados:

**Qserviços Tecnologia Ltda.**
**Encarregado de Dados (DPO):** [Nome]
**E-mail:** dpo@qservicos.com.br
**Telefone:** (11) 9999-9999
**Endereço:** Rua da Inovação, 123 - São Paulo/SP - CEP: 01234-567

**Autoridade Supervisora:**
Autoridade Nacional de Proteção de Dados (ANPD)
Website: gov.br/anpd

---
*Esta política está em conformidade com a Lei Geral de Proteção de Dados (LGPD).*
*Última atualização: ${new Date().toLocaleDateString('pt-BR')}*`,

  refund_policy: `# Política de Reembolso

A Qserviços se compromete a oferecer uma experiência justa e transparente para todos os usuários. Esta política estabelece as condições para solicitação e processamento de reembolsos em nossa plataforma, em conformidade com o Código de Defesa do Consumidor brasileiro.

## 1. Direito de Arrependimento

### 1.1 Serviços Não Prestados
Em conformidade com o Art. 49 do CDC, você tem **7 dias corridos** para desistir da contratação de serviços, contados a partir:
- Da confirmação da contratação para serviços contratados online
- Do primeiro atendimento para serviços já iniciados

### 1.2 Exceções ao Direito de Arrependimento
- Serviços já executados integralmente
- Serviços de urgência/emergência
- Serviços personalizados/customizados já iniciados

## 2. Situações que Garantem Reembolso

### 2.1 Falha na Prestação do Serviço
- **Prestador não compareceu:** Reembolso integral
- **Serviço não conforme:** Reembolso integral ou represtação
- **Interrupção sem conclusão:** Reembolso proporcional
- **Qualidade insatisfatória:** Avaliação caso a caso

### 2.2 Problemas Técnicos da Plataforma
- Falhas no sistema que impediram a prestação
- Erro de cobrança dupla ou incorreta
- Problemas de agendamento causados pela plataforma

### 2.3 Cancelamento Justificado
- Emergência médica (com comprovação)
- Óbito na família (com comprovação)
- Caso fortuito ou força maior
- Problemas climáticos extremos

## 3. Prazo para Solicitação

### 3.1 Prazos Gerais
- **Serviços não prestados:** Até 7 dias após contratação
- **Falha na prestação:** Até 30 dias após data agendada
- **Problemas de qualidade:** Até 15 dias após conclusão
- **Erro de cobrança:** Até 90 dias após lançamento

### 3.2 Documentação Necessária
- Número do pedido/agendamento
- Descrição detalhada do problema
- Fotos/vídeos quando aplicável
- Comprovantes médicos (se aplicável)

## 4. Processo de Reembolso

### 4.1 Como Solicitar
1. **Pelo aplicativo/site:**
   - Acesse "Meus Pedidos"
   - Selecione o serviço
   - Clique em "Solicitar Reembolso"
   - Preencha o formulário

2. **Por atendimento:**
   - WhatsApp: (11) 99999-9999
   - E-mail: reembolso@qservicos.com.br
   - Telefone: (11) 9999-9999

### 4.2 Análise da Solicitação
- **Prazo:** Até 5 dias úteis para análise
- **Investigação:** Contato com prestador quando necessário
- **Resposta:** Por e-mail ou notificação no app
- **Recurso:** Possível em caso de negativa

## 5. Modalidades de Reembolso

### 5.1 Reembolso Integral (100%)
- Prestador não compareceu sem justificativa
- Falha grave na prestação do serviço
- Erro da plataforma
- Exercício do direito de arrependimento

### 5.2 Reembolso Parcial
- Serviço parcialmente executado
- Cancelamento fora do prazo gratuito
- Problemas de qualidade menores
- Acordo entre as partes

### 5.3 Crédito na Plataforma
- Alternativa ao reembolso financeiro
- Valor acrescido de 10% de bônus
- Validade de 12 meses
- Transferível entre serviços

## 6. Métodos e Prazos de Reembolso

### 6.1 Forma de Reembolso
O reembolso será realizado **preferencialmente** na mesma forma de pagamento original:

**Cartão de Crédito:**
- Prazo: 5 a 15 dias úteis
- Aparece como estorno na fatura
- Pode levar até 2 faturas para aparecer

**PIX:**
- Prazo: 1 a 3 dias úteis
- Mesma chave PIX utilizada no pagamento
- Processamento instantâneo após aprovação

**Transferência Bancária:**
- Prazo: 3 a 5 dias úteis
- Mesma conta utilizada no pagamento
- Taxas bancárias por conta da Qserviços

**Dinheiro/Débito:**
- Prazo: 5 a 10 dias úteis
- Via PIX ou transferência
- Dados bancários necessários

### 6.2 Taxas de Reembolso
- **Reembolso por falha nossa:** Sem taxa
- **Reembolso por desistência:** Taxa de 3% do valor
- **Reembolso em crédito:** Sem taxa + 10% bônus

## 7. Situações Especiais

### 7.1 Prestadores Premium
- Política diferenciada para prestadores VIP
- Análise mais rigorosa da qualidade
- Compensação adicional em caso de problemas

### 7.2 Serviços Recorrentes
- Cancelamento afeta apenas próximas prestações
- Reembolso proporcional quando aplicável
- Possibilidade de suspensão temporária

### 7.3 Pacotes e Promoções
- Reembolso calculado sobre valor promocional
- Perda de desconto em reembolso parcial
- Análise específica para cada caso

## 8. Garantia de Qualidade

### 8.1 Compromisso Qserviços
- **Garantia de 30 dias** para defeitos em serviços
- **Represtação gratuita** quando aplicável
- **Compensação** por transtornos causados

### 8.2 Processo de Avaliação
1. Análise técnica do problema
2. Contato com prestador para esclarecimentos
3. Vistoria no local quando necessário
4. Decisão baseada em evidências

## 9. Resolução de Conflitos

### 9.1 Mediação Interna
- Equipe especializada em resolução de conflitos
- Busca por acordo entre as partes
- Priorização da satisfação do cliente

### 9.2 Arbitragem
- Câmara de Arbitragem disponível
- Processo mais rápido que judicial
- Decisão definitiva e obrigatória

### 9.3 Órgãos de Defesa
Em caso de não resolução:
- **Procon:** 151 ou procon.sp.gov.br
- **Consumidor.gov.br:** Portal oficial
- **Reclame Aqui:** Portal de reclamações

## 10. Contato para Reembolsos

**Central de Reembolsos:**
- **E-mail:** reembolso@qservicos.com.br
- **WhatsApp:** (11) 99999-9999
- **Telefone:** (11) 9999-9999
- **Horário:** Segunda a Sexta, 8h às 18h

**Documentos necessários:**
- Número do pedido
- CPF do titular
- Comprovante de pagamento
- Descrição detalhada do problema

---
*Esta política está em conformidade com o Código de Defesa do Consumidor (Lei 8.078/90).*
*Última atualização: ${new Date().toLocaleDateString('pt-BR')}*`,

  terms_and_conditions: `# Termos e Condições de Uso

## 1. Disposições Gerais

### 1.1 Empresa
**Qserviços Tecnologia Ltda.**, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº XX.XXX.XXX/0001-XX, com sede na Rua da Inovação, 123, São Paulo/SP, CEP 01234-567 ("Qserviços", "nós", "nossa" ou "Empresa").

### 1.2 Definições
- **Plataforma:** Aplicativo móvel e site web da Qserviços
- **Usuário/Cliente:** Pessoa física ou jurídica que contrata serviços
- **Prestador:** Profissional autônomo que oferece serviços
- **Serviços:** Atividades prestadas através da plataforma

### 1.3 Aceitação dos Termos
Ao criar uma conta ou usar nossos serviços, você declara:
- Ter lido e compreendido estes termos
- Concordar integralmente com todas as cláusulas
- Ter capacidade legal para contratar
- Fornecer informações verdadeiras e atualizadas

## 2. Da Plataforma e Serviços

### 2.1 Natureza da Plataforma
A Qserviços é uma **plataforma digital** que:
- Conecta clientes e prestadores de serviços
- Facilita a contratação e pagamento
- Não executa diretamente os serviços
- Atua como intermediária tecnológica

### 2.2 Responsabilidades da Qserviços
- Manter a plataforma funcionando adequadamente
- Verificar documentação básica dos prestadores
- Processar pagamentos com segurança
- Oferecer suporte técnico e atendimento
- Manter políticas de qualidade e segurança

### 2.3 Limitações de Responsabilidade
A Qserviços **NÃO se responsabiliza** por:
- Qualidade técnica da prestação dos serviços
- Danos causados durante a execução
- Problemas entre cliente e prestador
- Caso fortuito ou força maior
- Uso inadequado da plataforma

## 3. Cadastro e Conta de Usuário

### 3.1 Requisitos para Cadastro
**Para Clientes:**
- Ser maior de 18 anos ou ter autorização dos pais
- Possuir CPF ou CNPJ válido
- Fornecer informações verdadeiras
- Aceitar estes termos e a política de privacidade

**Para Prestadores:**
- Ser maior de 18 anos
- Possuir qualificação técnica para os serviços
- Apresentar documentação exigida
- Passar por processo de verificação

### 3.2 Verificação de Conta
- Análise de documentos enviados
- Verificação de antecedentes quando aplicável
- Confirmação de dados bancários
- Aprovação sujeita aos critérios da Qserviços

### 3.3 Responsabilidades do Usuário
- Manter dados atualizados
- Usar credenciais de acesso com segurança
- Não compartilhar conta com terceiros
- Comunicar imediatamente qualquer uso não autorizado

## 4. Prestação dos Serviços

### 4.1 Contratação
- Cliente escolhe prestador e agenda serviço
- Prestador aceita ou recusa a solicitação
- Contrato formado entre cliente e prestador
- Qserviços facilita a transação

### 4.2 Preços e Pagamento
- Preços definidos pelos prestadores
- Taxa de serviço cobrada pela Qserviços
- Pagamento processado pela plataforma
- Repasse ao prestador conforme política

### 4.3 Execução dos Serviços
- Prestador responsável pela qualidade técnica
- Cumprimento de horários acordados
- Uso de materiais adequados quando necessário
- Seguimento de normas de segurança

### 4.4 Avaliação e Feedback
- Sistema obrigatório de avaliação mútua
- Comentários devem ser verdadeiros e respeitosos
- Proibido avaliações falsas ou maliciosas
- Qserviços pode remover conteúdo inadequado

## 5. Política Financeira

### 5.1 Formas de Pagamento
- Cartão de crédito e débito
- PIX (transferência instantânea)
- Dinheiro (quando disponível)
- Outros métodos aprovados pela Qserviços

### 5.2 Taxas da Plataforma
**Para Clientes:**
- Taxa de conveniência: [X]% do valor do serviço
- Taxas de processamento de pagamento
- Sem cobrança de cadastro ou mensalidade

**Para Prestadores:**
- Comissão: [X]% do valor recebido
- Taxa de saque antecipado: R$ [X]
- Período trial gratuito para novos prestadores

### 5.3 Política de Reembolso
- Regida pela Política de Reembolso específica
- Análise caso a caso
- Conformidade com Código de Defesa do Consumidor

## 6. Obrigações dos Usuários

### 6.1 Obrigações Gerais
- Usar a plataforma de forma lícita e adequada
- Respeitar direitos de terceiros
- Não violar leis ou regulamentos
- Colaborar com investigações da Qserviços

### 6.2 Proibições
É **expressamente proibido**:
- Criar contas falsas ou usar dados de terceiros
- Burlar sistemas de segurança
- Fazer transações fora da plataforma
- Solicitar ou oferecer serviços ilegais
- Discriminar por raça, religião, gênero ou orientação sexual
- Assediar outros usuários
- Usar a plataforma para fins comerciais não autorizados

### 6.3 Consequências por Violação
- Advertência por escrito
- Suspensão temporária da conta
- Banimento permanente da plataforma
- Responsabilização civil e criminal

## 7. Privacidade e Proteção de Dados

### 7.1 Coleta de Dados
- Regida pela Lei Geral de Proteção de Dados (LGPD)
- Detalhada em nossa Política de Privacidade
- Consentimento específico quando necessário

### 7.2 Uso das Informações
- Processamento de transações
- Melhoria dos serviços
- Comunicação com usuários
- Cumprimento de obrigações legais

### 7.3 Compartilhamento
- Dados mínimos necessários entre usuários
- Parceiros técnicos sob acordo de confidencialidade
- Autoridades competentes quando exigido por lei

## 8. Propriedade Intelectual

### 8.1 Direitos da Qserviços
- Marca, logotipo e identidade visual
- Código-fonte e tecnologia da plataforma
- Conteúdo produzido pela empresa
- Base de dados e algoritmos

### 8.2 Conteúdo do Usuário
- Usuário mantém direitos sobre conteúdo próprio
- Concede licença de uso à Qserviços
- Responsabilidade por originalidade e legalidade
- Qserviços pode usar para fins promocionais

## 9. Modificações dos Termos

### 9.1 Alterações
- Qserviços pode alterar estes termos a qualquer tempo
- Notificação aos usuários com antecedência mínima de 30 dias
- Uso continuado implica aceitação das mudanças
- Usuário pode encerrar conta em caso de discordância

### 9.2 Comunicação
- Por e-mail cadastrado na conta
- Notificação na plataforma
- Publicação no site oficial

## 10. Suspensão e Encerramento

### 10.1 Pela Qserviços
- Violação destes termos
- Atividade suspeita ou fraudulenta
- Inatividade prolongada
- Decisão comercial fundamentada

### 10.2 Pelo Usuário
- Solicitação de exclusão da conta
- Cessação do uso dos serviços
- Migração para outro provedor

### 10.3 Efeitos do Encerramento
- Perda de acesso à plataforma
- Cancelamento de agendamentos futuros
- Manutenção de dados conforme LGPD
- Cumprimento de obrigações pendentes

## 11. Resolução de Conflitos

### 11.1 Foro e Jurisdição
- Comarca de São Paulo/SP para pessoas jurídicas
- Domicílio do consumidor para pessoas físicas
- Lei brasileira aplicável

### 11.2 Mediação e Arbitragem
- Preferência por resolução amigável
- Mediação através de câmara especializada
- Arbitragem para valores acima de R$ 10.000

### 11.3 Órgãos de Defesa
- Procon: 151
- Consumidor.gov.br
- Reclame Aqui
- Poder Judiciário como última instância

## 12. Disposições Finais

### 12.1 Independência das Cláusulas
- Invalidade de uma cláusula não afeta as demais
- Interpretação conforme a lei brasileira
- Prevalência da legislação em caso de conflito

### 12.2 Tolerância
- Não exercício de direito não implica renúncia
- Qserviços pode exercer direitos a qualquer tempo
- Interpretação restritiva das concessões

### 12.3 Contato
**Qserviços Tecnologia Ltda.**
- **E-mail:** juridico@qservicos.com.br
- **Telefone:** (11) 9999-9999
- **Endereço:** Rua da Inovação, 123 - São Paulo/SP

---
*Estes termos estão em conformidade com o Marco Civil da Internet, Código de Defesa do Consumidor e demais leis brasileiras.*
*Última atualização: ${new Date().toLocaleDateString('pt-BR')}*
*Versão: 2.0*`
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