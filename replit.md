# Qserviços - Marketplace de Serviços

## Visão Geral
Plataforma marketplace que conecta prestadores de serviços e clientes através de um ecossistema móvel inteligente, oferecendo descoberta de serviços, agendamento e gerenciamento.

## Tecnologias Principais
- **Frontend**: React com TypeScript, TanStack Query, Shadcn/ui, Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Banco de Dados**: PostgreSQL com Drizzle ORM
- **Autenticação**: JWT + Express Session
- **Arquivo/Upload**: Multer com suporte a antivírus
- **UI**: Componentes modernos com dark mode

## Arquitetura do Projeto

### Estrutura de Diretórios
- `client/src/` - Frontend React
- `server/` - Backend Express API
- `shared/` - Tipos e esquemas compartilhados
- `attached_assets/` - Assets e uploads

### Principais Entidades
- **Users**: Usuários (clientes, prestadores, admin, funcionários)
- **Providers**: Prestadores de serviços
- **ServiceCategories**: Categorias de serviços
- **Services**: Catálogo global de serviços
- **ProviderServices**: Serviços oferecidos por prestadores específicos
- **ServiceRequests**: Solicitações de serviços/reservas
- **Orders**: Pedidos e carrinho de compras

## Alterações Recentes

### 18/08/2025 - Sistema de Exclusão Segura de Serviços

**Problema Identificado**: 
O sistema permitia exclusão de serviços sem verificar dependências, causando problemas de integridade referencial quando serviços tinham pedidos, reservas ou outros vínculos.

**Solução Implementada**:

#### Backend (`server/storage.ts`)
- **Nova função**: `checkProviderServiceDependencies(id)` - Verifica todas as dependências de um serviço
- **Nova função**: `deleteProviderServiceSafe(id, force)` - Exclusão segura com verificação de dependências
- **Verificações implementadas**:
  - Pedidos ativos vinculados ao serviço
  - Histórico de pedidos completados
  - Tipos de cobrança associados
  - Warnings informativos para o usuário

#### Backend (`server/routes.ts`)
- **Nova rota**: `GET /api/provider-services/:id/dependencies` - Verifica dependências
- **Rota atualizada**: `DELETE /api/provider-services/:id` - Usa exclusão segura
- **Parâmetro**: `?force=true` para forçar exclusão (somente admin)

#### Frontend (`client/src/pages/admin/services.tsx`)
- **Nova funcionalidade**: Verificação de dependências antes da exclusão
- **Modal informativo**: Mostra detalhes das dependências quando não é possível excluir
- **Opção para administradores**: Forçar exclusão com confirmação dupla
- **UX melhorada**: Avisos claros sobre consequências da exclusão

**Fluxo da Exclusão**:
1. Usuário clica em "Excluir"
2. Sistema verifica dependências automaticamente
3. Se pode excluir: Confirma com avisos (se houver)
4. Se não pode excluir: Mostra modal com detalhes e opção de forçar
5. Exclusão segura mantém integridade dos dados históricos

**Benefícios**:
- ✅ Integridade referencial preservada
- ✅ Dados históricos mantidos
- ✅ Interface clara para o usuário
- ✅ Opção administrativa para casos especiais
- ✅ Prevenção de erros no sistema

## Preferências do Usuário

### Estilo de Código
- Usar TypeScript com tipagem forte
- Preferir async/await sobre Promises
- Componentes funcionais com hooks
- Drizzle ORM para queries de banco

### Comunicação
- Respostas concisas e técnicas
- Focar em soluções práticas
- Documentar mudanças arquiteturais importantes
- Explicar o "porquê" das decisões técnicas

### Prioridades
- Integridade de dados é crítica
- UX/UI intuitiva para prestadores e clientes
- Performance e escalabilidade
- Manutenibilidade do código

## Próximas Melhorias Sugeridas
- Implementar sistema de auditoria para exclusões
- Adicionar logs detalhados de operações críticas
- Criar dashboard de dependências para administradores
- Implementar soft delete para dados críticos