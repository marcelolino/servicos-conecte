/**
 * QSERVIÇOS - SEED DO CATÁLOGO DE SERVIÇOS
 * Data: 19/08/2025
 * 
 * Script para popular o banco com o catálogo completo de serviços
 * Uso: npm run seed:services
 */

import { db } from '../db';
import { serviceCategories, services, type InsertServiceCategory, type InsertService } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Categorias base do sistema
const CATEGORIES: InsertServiceCategory[] = [
  { name: 'Limpeza', description: 'Serviços de limpeza residencial e comercial', icon: 'mop-icon', color: '#4CAF50', level: 0, isActive: true },
  { name: 'Manutenção', description: 'Reparos e manutenção em geral', icon: 'wrench-icon', color: '#FF9800', level: 0, isActive: true },
  { name: 'Beleza', description: 'Serviços de beleza e estética', icon: 'beauty-icon', color: '#E91E63', level: 0, isActive: true },
  { name: 'Educação', description: 'Aulas particulares e cursos', icon: 'education-icon', color: '#2196F3', level: 0, isActive: true },
  { name: 'Tecnologia', description: 'Serviços de TI e tecnologia', icon: 'tech-icon', color: '#9C27B0', level: 0, isActive: true },
  { name: 'Saúde', description: 'Cuidados de saúde e bem-estar', icon: 'health-icon', color: '#F44336', level: 0, isActive: true },
  { name: 'Jardinagem', description: 'Serviços de jardinagem e paisagismo', icon: 'leaf-icon', color: '#4CAF50', level: 0, isActive: true },
  { name: 'Desentupimento', description: 'Serviços especializados em desentupimento', icon: 'wrench-icon', color: '#FF5722', level: 0, isActive: true },
  { name: 'Elétrica', description: 'Serviços elétricos residenciais e comerciais', icon: 'zap-icon', color: '#FFC107', level: 0, isActive: true },
  { name: 'Encanador', description: 'Serviços de encanamento e hidráulica', icon: 'droplets-icon', color: '#2196F3', level: 0, isActive: true },
  { name: 'Pintor', description: 'Serviços de pintura residencial e comercial', icon: 'brush-icon', color: '#9C27B0', level: 0, isActive: true },
];

// Serviços do catálogo organizado por categoria
const SERVICES_BY_CATEGORY: Record<string, Omit<InsertService, 'categoryId'>[]> = {
  'Limpeza': [
    {
      name: 'Limpeza Residencial Completa',
      description: 'Limpeza completa de residências incluindo todos os cômodos',
      estimatedDuration: '3-4 horas',
      suggestedMinPrice: '80.00',
      suggestedMaxPrice: '150.00',
      defaultChargingType: 'visit',
      isActive: true,
      visibleOnHome: true,
    },
    {
      name: 'Limpeza de Escritório',
      description: 'Limpeza de ambientes comerciais e escritórios',
      estimatedDuration: '2-3 horas',
      suggestedMinPrice: '60.00',
      suggestedMaxPrice: '120.00',
      defaultChargingType: 'visit',
      isActive: true,
      visibleOnHome: true,
    },
    {
      name: 'Limpeza Pós-Obra',
      description: 'Limpeza especializada para remoção de resíduos de obra',
      estimatedDuration: '6-8 h',
      suggestedMinPrice: '150.00',
      suggestedMaxPrice: '300.00',
      defaultChargingType: 'visit',
      isActive: true,
      visibleOnHome: true,
    },
    {
      name: 'Limpeza de Carpete e Estofados',
      description: 'Limpeza profunda de carpetes e estofados',
      estimatedDuration: '2-4 h',
      suggestedMinPrice: '120.00',
      suggestedMaxPrice: '300.00',
      defaultChargingType: 'visit',
      isActive: true,
      visibleOnHome: true,
    },
    {
      name: 'Limpeza de Vidros e Janelas',
      description: 'Vidros limpos e cristalinos',
      estimatedDuration: '1-3 h',
      suggestedMinPrice: '50.00',
      suggestedMaxPrice: '150.00',
      defaultChargingType: 'visit',
      isActive: true,
      visibleOnHome: false,
    },
  ],
  'Jardinagem': [
    {
      name: 'Poda de Árvores',
      description: 'Poda profissional e segura de árvores',
      estimatedDuration: '3-6 h',
      suggestedMinPrice: '135.00',
      suggestedMaxPrice: '340.00',
      defaultChargingType: 'visit',
      isActive: true,
      visibleOnHome: true,
    },
    {
      name: 'Irrigação Automática',
      description: 'Sistema de irrigação automática',
      estimatedDuration: '1-2 d',
      suggestedMinPrice: '500.00',
      suggestedMaxPrice: '2000.00',
      defaultChargingType: 'quote',
      isActive: true,
      visibleOnHome: false,
    },
    {
      name: 'Limpeza de Piscina',
      description: 'Piscina sempre limpa e cristalina',
      estimatedDuration: '1-2 h',
      suggestedMinPrice: '60.00',
      suggestedMaxPrice: '130.00',
      defaultChargingType: 'visit',
      isActive: true,
      visibleOnHome: true,
    },
  ],
  'Desentupimento': [
    {
      name: 'Desentupimento de Pia',
      description: 'Desentupimento rápido da sua pia',
      estimatedDuration: '30-60 min',
      suggestedMinPrice: '60.00',
      suggestedMaxPrice: '120.00',
      defaultChargingType: 'visit',
      isActive: true,
      visibleOnHome: true,
    },
    {
      name: 'Desentupimento de Vaso Sanitário',
      description: 'Desentupimento eficaz do vaso sanitário',
      estimatedDuration: '30-90 min',
      suggestedMinPrice: '60.00',
      suggestedMaxPrice: '150.00',
      defaultChargingType: 'visit',
      isActive: true,
      visibleOnHome: true,
    },
    {
      name: 'Limpeza de Caixa D\'água',
      description: 'Água limpa e segura na sua casa',
      estimatedDuration: '2-4 h',
      suggestedMinPrice: '120.00',
      suggestedMaxPrice: '250.00',
      defaultChargingType: 'visit',
      isActive: true,
      visibleOnHome: true,
    },
    {
      name: 'Desentupimento de Ralo',
      description: 'Desentupimento eficaz de ralos',
      estimatedDuration: '30-60 min',
      suggestedMinPrice: '50.00',
      suggestedMaxPrice: '100.00',
      defaultChargingType: 'visit',
      isActive: true,
      visibleOnHome: false,
    },
    {
      name: 'Desentupimento de Rede de Esgoto',
      description: 'Desentupimento de rede de esgoto com equipamentos industriais',
      estimatedDuration: '2-4 h',
      suggestedMinPrice: '200.00',
      suggestedMaxPrice: '500.00',
      defaultChargingType: 'visit',
      isActive: true,
      visibleOnHome: false,
    },
  ],
  'Elétrica': [
    {
      name: 'Instalação Elétrica Residencial',
      description: 'Instalação elétrica residencial',
      estimatedDuration: '1-2 h',
      suggestedMinPrice: '70.00',
      suggestedMaxPrice: '90.00',
      defaultChargingType: 'hour',
      isActive: true,
      visibleOnHome: true,
    },
    {
      name: 'Instalação de Luminária',
      description: 'Instalação profissional de luminárias',
      estimatedDuration: '1-2 h',
      suggestedMinPrice: '70.00',
      suggestedMaxPrice: '130.00',
      defaultChargingType: 'visit',
      isActive: true,
      visibleOnHome: true,
    },
    {
      name: 'Manutenção de Quadro Elétrico',
      description: 'Manutenção do seu quadro elétrico',
      estimatedDuration: '1-2 h',
      suggestedMinPrice: '100.00',
      suggestedMaxPrice: '200.00',
      defaultChargingType: 'visit',
      isActive: true,
      visibleOnHome: false,
    },
  ],
  'Encanador': [
    {
      name: 'Instalação de Registro',
      description: 'Instalação de registros hidráulicos',
      estimatedDuration: '1-2 h',
      suggestedMinPrice: '70.00',
      suggestedMaxPrice: '120.00',
      defaultChargingType: 'visit',
      isActive: true,
      visibleOnHome: true,
    },
    {
      name: 'Troca de Sifão',
      description: 'Troca rápida de sifões',
      estimatedDuration: '30-60 min',
      suggestedMinPrice: '60.00',
      suggestedMaxPrice: '100.00',
      defaultChargingType: 'visit',
      isActive: true,
      visibleOnHome: false,
    },
  ],
  'Pintor': [
    {
      name: 'Pintura de Móveis',
      description: 'Renovação de móveis com pintura',
      estimatedDuration: '1-2 d',
      suggestedMinPrice: '150.00',
      suggestedMaxPrice: '400.00',
      defaultChargingType: 'visit',
      isActive: true,
      visibleOnHome: true,
    },
    {
      name: 'Textura em Parede',
      description: 'Texturas decorativas para suas paredes',
      estimatedDuration: '1-3 d',
      suggestedMinPrice: '300.00',
      suggestedMaxPrice: '800.00',
      defaultChargingType: 'visit',
      isActive: true,
      visibleOnHome: false,
    },
  ],
  'Manutenção': [
    {
      name: 'Reparo de Torneira',
      description: 'Conserto e substituição de torneiras',
      estimatedDuration: '1 hora',
      suggestedMinPrice: '40.00',
      suggestedMaxPrice: '80.00',
      defaultChargingType: 'visit',
      isActive: true,
      visibleOnHome: true,
    },
    {
      name: 'Instalação Elétrica',
      description: 'Instalação e reparo de sistemas elétricos',
      estimatedDuration: '2-4 horas',
      suggestedMinPrice: '50.00',
      suggestedMaxPrice: '100.00',
      defaultChargingType: 'hour',
      isActive: true,
      visibleOnHome: true,
    },
  ],
  'Beleza': [
    {
      name: 'Corte de Cabelo',
      description: 'Corte e penteado profissional',
      estimatedDuration: '1 hora',
      suggestedMinPrice: '30.00',
      suggestedMaxPrice: '80.00',
      defaultChargingType: 'visit',
      isActive: true,
      visibleOnHome: true,
    },
    {
      name: 'Manicure e Pedicure',
      description: 'Cuidados completos para unhas',
      estimatedDuration: '1.5 horas',
      suggestedMinPrice: '25.00',
      suggestedMaxPrice: '60.00',
      defaultChargingType: 'visit',
      isActive: true,
      visibleOnHome: true,
    },
  ],
  'Educação': [
    {
      name: 'Aula de Matemática',
      description: 'Aulas particulares de matemática',
      estimatedDuration: '1 hora',
      suggestedMinPrice: '40.00',
      suggestedMaxPrice: '80.00',
      defaultChargingType: 'hour',
      isActive: true,
      visibleOnHome: true,
    },
  ],
  'Tecnologia': [
    {
      name: 'Manutenção de Computador',
      description: 'Limpeza e otimização de computadores',
      estimatedDuration: '2 horas',
      suggestedMinPrice: '60.00',
      suggestedMaxPrice: '120.00',
      defaultChargingType: 'visit',
      isActive: true,
      visibleOnHome: true,
    },
  ],
};

export async function seedServicesCatalog(reset = false) {
  console.log('🌱 Iniciando seed do catálogo de serviços...');

  try {
    // Opcional: Reset dos dados se solicitado
    if (reset) {
      console.log('🗑️  Removendo dados existentes...');
      await db.delete(services);
      await db.delete(serviceCategories);
    }

    // 1. Inserir/atualizar categorias
    console.log('📁 Processando categorias...');
    const categoryMap = new Map<string, number>();
    
    for (const categoryData of CATEGORIES) {
      const [category] = await db
        .insert(serviceCategories)
        .values(categoryData)
        .onConflictDoNothing()
        .returning();

      if (category) {
        categoryMap.set(categoryData.name, category.id);
        console.log(`   ✓ Categoria criada: ${categoryData.name}`);
      } else {
        // Se já existe, buscar o ID
        const existingCategory = await db
          .select()
          .from(serviceCategories)
          .where(eq(serviceCategories.name, categoryData.name))
          .limit(1);
        
        if (existingCategory[0]) {
          categoryMap.set(categoryData.name, existingCategory[0].id);
          console.log(`   ≈ Categoria existente: ${categoryData.name}`);
        }
      }
    }

    // 2. Inserir serviços do catálogo
    console.log('🛠️  Processando serviços...');
    let totalServices = 0;
    
    for (const [categoryName, servicesList] of Object.entries(SERVICES_BY_CATEGORY)) {
      const categoryId = categoryMap.get(categoryName);
      if (!categoryId) {
        console.warn(`⚠️  Categoria não encontrada: ${categoryName}`);
        continue;
      }

      console.log(`   📋 Categoria: ${categoryName}`);
      
      for (const serviceData of servicesList) {
        const serviceWithCategory = {
          ...serviceData,
          categoryId,
        };

        try {
          await db
            .insert(services)
            .values(serviceWithCategory)
            .onConflictDoNothing();
          
          console.log(`      ✓ ${serviceData.name}`);
          totalServices++;
        } catch (error) {
          console.error(`      ✗ Erro ao inserir ${serviceData.name}:`, error);
        }
      }
    }

    // 3. Estatísticas finais
    console.log('\n📊 Estatísticas do seed:');
    console.log(`   • ${CATEGORIES.length} categorias processadas`);
    console.log(`   • ${totalServices} serviços processados`);

    // Verificar total de serviços no banco
    const totalInDb = await db.select().from(services);
    console.log(`   • ${totalInDb.length} serviços total no banco`);

    console.log('\n✅ Seed do catálogo concluído com sucesso!');
    
    return {
      categoriesProcessed: CATEGORIES.length,
      servicesProcessed: totalServices,
      totalServicesInDb: totalInDb.length,
    };

  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    throw error;
  }
}

// Executar apenas se chamado diretamente (ES modules)
if (import.meta.url === `file://${process.argv[1]}`) {
  seedServicesCatalog(process.argv.includes('--reset'))
    .then((stats) => {
      console.log('\n🎉 Seed concluído:', stats);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro fatal:', error);
      process.exit(1);
    });
}