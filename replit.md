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

### 19/08/2025 - Sistema de Aprovação de Serviços e Layout Admin

**Sistema de Aprovação Corrigido**:
- **Serviços aprovados** automaticamente adicionados ao catálogo global
- **Vinculação automática** entre prestador e catálogo após aprovação
- **Fluxo completo**: Solicitação → Aprovação → Catálogo → Vinculação
- **Layout "Administrador de demonstração"** removido e substituído por "Qserviços Admin"

**Correções Implementadas**:
- ✅ Aprovação de "Assistência médica domiciliar" funcionando
- ✅ Serviço aparece no catálogo admin
- ✅ Prestador vinculado corretamente ao catálogo
- ✅ 48 serviços no catálogo (31 visíveis na home)
- ✅ 36 serviços de prestadores 100% vinculados

### 19/08/2025 - Catálogo Completo de Serviços e Sistema de Seeds

**Catálogo de Serviços Completo**:
- **27 serviços no catálogo** distribuídos em 11 categorias
- **Sistema de seed robusto** para preservação de dados
- **Scripts SQL e TypeScript** para backup e restauração
- **Documentação técnica** completa do catálogo

**Distribuição por Categoria**:
- **Limpeza**: 6 serviços (5 visíveis na home)
- **Desentupimento**: 5 serviços (3 visíveis na home)
- **Elétrica**: 3 serviços (2 visíveis na home)
- **Jardinagem**: 3 serviços (2 visíveis na home)
- **Manutenção**: 2 serviços (2 visíveis na home)
- **Pintor**: 2 serviços (1 visível na home)
- **Encanador**: 2 serviços (1 visível na home)
- **Beleza**: 2 serviços (2 visíveis na home)
- **Educação**: 1 serviço (1 visível na home)
- **Tecnologia**: 1 serviço (1 visível na home)
- **Saúde**: 0 serviços (categoria preparada)

**Dados de Teste Mantidos**:
- **21 usuários totais**: 1 admin, 3 clientes, 17 prestadores
- **17 prestadores aprovados** com perfis completos e serviços
- **34 serviços de prestadores** vinculados ao catálogo
- **Todas as contas de teste do CONTAS_TESTE.md** funcionais

**Contas de Teste Principais**:
- **Admin**: `admin@qservicos.com` | senha: `password`
- **Cliente**: `cliente@teste.com` | senha: `password` 
- **Prestador**: `prestador@teste.com` | senha: `password`

**Prestadores Especializados**:
- João Silva (Encanamento): `joao.silva@email.com`
- Maria Santos (Limpeza): `maria.santos@email.com`
- Carlos Oliveira (Transporte): `carlos.oliveira@email.com`
- Ana Pereira (Soldagem): `ana.pereira@email.com`
- Pedro Costa (Diarista): `pedro.costa@email.com`
- Lúcia Fernandes (Faxina): `lucia.fernandes@email.com`
- Roberto Machado (Entregador): `roberto.machado@email.com`
- Fernanda Alves (Cuidadora): `fernanda.alves@email.com`
- Ricardo Souza (Pet Care): `ricardo.souza@email.com`
- Claudia Lima (Enfermagem): `claudia.lima@email.com`
- Marcos Rodrigues (Chef): `marcos.rodrigues@email.com`
- Patricia Rocha (Manutenção): `patricia.rocha@email.com`
- Antonio Silva (Montagem): `antonio.silva@email.com`

**Senha universal**: Todos os usuários usam a senha `password`

**Sistema de Seeds Implementado**:
- `server/seeds/services-catalog-seed.sql` - Seed SQL completo
- `server/seeds/run-seed.ts` - Script TypeScript para execução
- Backup e restauração automática de dados
- Integridade referencial preservada

**Dados Realísticos**:
- Ratings variados (4.50 a 4.95 estrelas)
- Histórico de avaliações (25 a 200 reviews)
- Serviços concluídos (35 a 500 serviços)
- Preços diversificados por especialidade
- Descrições detalhadas e realísticas
- Catálogo baseado em dados reais do mercado

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