/**
 * QSERVIÇOS - SEED DAS CONTAS DE TESTE
 * Data: 30/08/2025
 * 
 * Script para popular o banco com as contas de teste do CONTAS_TESTE.md
 * Uso: npx tsx server/seeds/seed-users.ts
 */

import { db } from '../db';
import { users, providers, type InsertUser, type InsertProvider } from '@shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

// Função para hash da senha
async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

// Contas principais do sistema
const MAIN_ACCOUNTS: InsertUser[] = [
  {
    email: 'admin@qservicos.com',
    name: 'Administrador do Sistema',
    password: '', // Será preenchido
    role: 'admin',
    isActive: true,
  },
  {
    email: 'cliente@teste.com',
    name: 'Cliente de Teste',
    password: '', // Será preenchido
    role: 'client',
    isActive: true,
  },
  {
    email: 'prestador@teste.com',
    name: 'Prestador de Teste',
    password: '', // Será preenchido
    role: 'provider',
    isActive: true,
  },
];

// Prestadores especializados
const PROVIDER_ACCOUNTS: Array<{user: Omit<InsertUser, 'password'>, provider: Omit<InsertProvider, 'userId'>}> = [
  {
    user: {
      email: 'joao.silva@email.com',
      name: 'João Silva',
      role: 'provider',
      isActive: true,
    },
    provider: {
      businessName: 'João Silva - Encanador',
      description: 'Encanamento e reparos hidráulicos com mais de 10 anos de experiência',
      specialties: ['Encanamento', 'Reparos hidráulicos', 'Instalação de tubulações'],
      serviceRadius: 15,
      isApproved: true,
      rating: 4.8,
      totalReviews: 125,
      completedServices: 350,
    }
  },
  {
    user: {
      email: 'maria.santos@email.com',
      name: 'Maria Santos',
      role: 'provider',
      isActive: true,
    },
    provider: {
      businessName: 'Maria Santos - Limpeza',
      description: 'Limpeza residencial e comercial com produtos ecológicos',
      specialties: ['Limpeza residencial', 'Limpeza comercial', 'Limpeza pós-obra'],
      serviceRadius: 20,
      isApproved: true,
      rating: 4.9,
      totalReviews: 200,
      completedServices: 500,
    }
  },
  {
    user: {
      email: 'carlos.oliveira@email.com',
      name: 'Carlos Oliveira',
      role: 'provider',
      isActive: true,
    },
    provider: {
      businessName: 'Carlos Oliveira - Transporte',
      description: 'Transporte particular e entregas rápidas na região metropolitana',
      specialties: ['Transporte particular', 'Entregas', 'Mudanças pequenas'],
      serviceRadius: 50,
      isApproved: true,
      rating: 4.7,
      totalReviews: 89,
      completedServices: 220,
    }
  },
  {
    user: {
      email: 'ana.pereira@email.com',
      name: 'Ana Pereira',
      role: 'provider',
      isActive: true,
    },
    provider: {
      businessName: 'Ana Pereira - Soldagem',
      description: 'Soldagem TIG, MIG e estruturas metálicas certificada',
      specialties: ['Soldagem TIG', 'Soldagem MIG', 'Estruturas metálicas'],
      serviceRadius: 30,
      isApproved: true,
      rating: 4.95,
      totalReviews: 65,
      completedServices: 180,
    }
  },
  {
    user: {
      email: 'pedro.costa@email.com',
      name: 'Pedro Costa',
      role: 'provider',
      isActive: true,
    },
    provider: {
      businessName: 'Pedro Costa - Diarista',
      description: 'Limpeza e organização doméstica com agendamento flexível',
      specialties: ['Limpeza doméstica', 'Organização', 'Faxina geral'],
      serviceRadius: 25,
      isApproved: true,
      rating: 4.6,
      totalReviews: 150,
      completedServices: 400,
    }
  },
  {
    user: {
      email: 'lucia.fernandes@email.com',
      name: 'Lúcia Fernandes',
      role: 'provider',
      isActive: true,
    },
    provider: {
      businessName: 'Lúcia Fernandes - Faxina',
      description: 'Faxina pesada e pós-obra com equipamentos profissionais',
      specialties: ['Faxina pesada', 'Limpeza pós-obra', 'Limpeza de vidros'],
      serviceRadius: 20,
      isApproved: true,
      rating: 4.85,
      totalReviews: 110,
      completedServices: 280,
    }
  },
  {
    user: {
      email: 'roberto.machado@email.com',
      name: 'Roberto Machado',
      role: 'provider',
      isActive: true,
    },
    provider: {
      businessName: 'Roberto Machado - Entregas',
      description: 'Entregas rápidas com moto, disponível 24h',
      specialties: ['Entregas rápidas', 'Motoboy', 'Entrega de documentos'],
      serviceRadius: 40,
      isApproved: true,
      rating: 4.7,
      totalReviews: 95,
      completedServices: 450,
    }
  },
  {
    user: {
      email: 'fernanda.alves@email.com',
      name: 'Fernanda Alves',
      role: 'provider',
      isActive: true,
    },
    provider: {
      businessName: 'Fernanda Alves - Cuidadora',
      description: 'Cuidados especializados para terceira idade com carinho e dedicação',
      specialties: ['Cuidados com idosos', 'Acompanhamento médico', 'Auxiliar de enfermagem'],
      serviceRadius: 15,
      isApproved: true,
      rating: 4.9,
      totalReviews: 75,
      completedServices: 120,
    }
  },
  {
    user: {
      email: 'ricardo.souza@email.com',
      name: 'Ricardo Souza',
      role: 'provider',
      isActive: true,
    },
    provider: {
      businessName: 'Ricardo Souza - Pet Care',
      description: 'Pet sitting e cuidados veterinários para seu melhor amigo',
      specialties: ['Pet sitting', 'Cuidados veterinários', 'Passeio com pets'],
      serviceRadius: 25,
      isApproved: true,
      rating: 4.8,
      totalReviews: 60,
      completedServices: 150,
    }
  },
  {
    user: {
      email: 'claudia.lima@email.com',
      name: 'Claudia Lima',
      role: 'provider',
      isActive: true,
    },
    provider: {
      businessName: 'Claudia Lima - Enfermagem',
      description: 'Curativos e cuidados de enfermagem domiciliar',
      specialties: ['Curativos', 'Cuidados de enfermagem', 'Aplicação de medicamentos'],
      serviceRadius: 20,
      isApproved: true,
      rating: 4.95,
      totalReviews: 85,
      completedServices: 200,
    }
  },
  {
    user: {
      email: 'marcos.rodrigues@email.com',
      name: 'Marcos Rodrigues',
      role: 'provider',
      isActive: true,
    },
    provider: {
      businessName: 'Marcos Rodrigues - Chef',
      description: 'Culinária e eventos gastronômicos para ocasiões especiais',
      specialties: ['Chef particular', 'Eventos gastronômicos', 'Consultoria culinária'],
      serviceRadius: 35,
      isApproved: true,
      rating: 4.9,
      totalReviews: 45,
      completedServices: 80,
    }
  },
  {
    user: {
      email: 'patricia.rocha@email.com',
      name: 'Patricia Rocha',
      role: 'provider',
      isActive: true,
    },
    provider: {
      businessName: 'Patricia Rocha - Manutenção',
      description: 'Reparos elétricos e hidráulicos com garantia de qualidade',
      specialties: ['Reparos elétricos', 'Reparos hidráulicos', 'Manutenção predial'],
      serviceRadius: 20,
      isApproved: true,
      rating: 4.75,
      totalReviews: 130,
      completedServices: 320,
    }
  },
  {
    user: {
      email: 'antonio.silva@email.com',
      name: 'Antonio Silva',
      role: 'provider',
      isActive: true,
    },
    provider: {
      businessName: 'Antonio Silva - Montagem',
      description: 'Montagem e desmontagem de móveis com eficiência',
      specialties: ['Montagem de móveis', 'Desmontagem', 'Instalação de prateleiras'],
      serviceRadius: 25,
      isApproved: true,
      rating: 4.65,
      totalReviews: 100,
      completedServices: 250,
    }
  },
];

export async function seedUsers(reset = false) {
  console.log('👥 Iniciando seed das contas de teste...');

  try {
    // Opcional: Reset dos dados se solicitado
    if (reset) {
      console.log('🗑️  Removendo usuários e prestadores existentes...');
      await db.delete(providers);
      await db.delete(users);
    }

    const hashedPassword = await hashPassword('password');

    // 1. Criar contas principais
    console.log('🔑 Criando contas principais...');
    const createdUsers = new Map<string, number>();

    for (const accountData of MAIN_ACCOUNTS) {
      const userData = {
        ...accountData,
        password: hashedPassword,
      };

      try {
        const [user] = await db
          .insert(users)
          .values(userData)
          .onConflictDoNothing()
          .returning();

        if (user) {
          createdUsers.set(userData.email, user.id);
          console.log(`   ✓ ${userData.name} (${userData.email})`);
        } else {
          // Usuário já existe, buscar ID
          const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.email, userData.email))
            .limit(1);
          
          if (existingUser[0]) {
            createdUsers.set(userData.email, existingUser[0].id);
            console.log(`   ≈ ${userData.name} (já existe)`);
          }
        }
      } catch (error) {
        console.error(`   ✗ Erro ao criar ${userData.name}:`, error);
      }
    }

    // 2. Criar prestadores especializados
    console.log('🔧 Criando prestadores especializados...');
    let totalProviders = 0;

    for (const providerData of PROVIDER_ACCOUNTS) {
      try {
        // Criar usuário do prestador
        const userData = {
          ...providerData.user,
          password: hashedPassword,
        };

        const [user] = await db
          .insert(users)
          .values(userData)
          .onConflictDoNothing()
          .returning();

        let userId: number;
        if (user) {
          userId = user.id;
          console.log(`   ✓ Usuário: ${userData.name}`);
        } else {
          // Usuário já existe, buscar ID
          const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.email, userData.email))
            .limit(1);
          
          if (existingUser[0]) {
            userId = existingUser[0].id;
            console.log(`   ≈ Usuário: ${userData.name} (já existe)`);
          } else {
            console.error(`   ✗ Não foi possível criar/encontrar usuário: ${userData.name}`);
            continue;
          }
        }

        // Criar perfil de prestador
        const providerProfileData = {
          ...providerData.provider,
          userId,
        };

        await db
          .insert(providers)
          .values(providerProfileData)
          .onConflictDoNothing();

        console.log(`      ✓ Prestador: ${providerData.provider.businessName}`);
        totalProviders++;

      } catch (error) {
        console.error(`   ✗ Erro ao criar prestador ${providerData.user.name}:`, error);
      }
    }

    // 3. Estatísticas finais
    console.log('\n📊 Estatísticas do seed:');
    console.log(`   • ${MAIN_ACCOUNTS.length} contas principais`);
    console.log(`   • ${totalProviders} prestadores especializados`);

    // Verificar total no banco
    const totalUsersInDb = await db.select().from(users);
    const totalProvidersInDb = await db.select().from(providers);
    
    console.log(`   • ${totalUsersInDb.length} usuários total no banco`);
    console.log(`   • ${totalProvidersInDb.length} prestadores total no banco`);

    console.log('\n✅ Seed das contas concluído com sucesso!');
    console.log('🔐 Senha universal: password');
    
    return {
      mainAccountsProcessed: MAIN_ACCOUNTS.length,
      providersProcessed: totalProviders,
      totalUsersInDb: totalUsersInDb.length,
      totalProvidersInDb: totalProvidersInDb.length,
    };

  } catch (error) {
    console.error('❌ Erro durante o seed de usuários:', error);
    throw error;
  }
}

// Executar apenas se chamado diretamente (ES modules)
if (import.meta.url === `file://${process.argv[1]}`) {
  seedUsers(process.argv.includes('--reset'))
    .then((stats) => {
      console.log('\n🎉 Seed de usuários concluído:', stats);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro fatal:', error);
      process.exit(1);
    });
}