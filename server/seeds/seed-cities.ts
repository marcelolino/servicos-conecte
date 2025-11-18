/**
 * QSERVIÇOS - SEED DAS CIDADES DE GOIÁS
 * Data: 18/11/2025
 * 
 * Script para popular o banco com as principais cidades do estado de Goiás
 * Uso: npx tsx server/seeds/seed-cities.ts
 */

import { db } from '../db';
import { cities, type InsertCity } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

// Principais cidades do estado de Goiás
const GOIAS_CITIES: InsertCity[] = [
  // Região Metropolitana de Goiânia
  {
    name: 'Goiânia',
    state: 'Goiás',
    stateCode: 'GO',
    isActive: true,
    isHighlighted: true, // Capital
  },
  {
    name: 'Aparecida de Goiânia',
    state: 'Goiás',
    stateCode: 'GO',
    isActive: true,
    isHighlighted: true,
  },
  {
    name: 'Senador Canedo',
    state: 'Goiás',
    stateCode: 'GO',
    isActive: true,
    isHighlighted: true,
  },
  {
    name: 'Trindade',
    state: 'Goiás',
    stateCode: 'GO',
    isActive: true,
    isHighlighted: true,
  },
  {
    name: 'Goianira',
    state: 'Goiás',
    stateCode: 'GO',
    isActive: true,
    isHighlighted: false,
  },
  {
    name: 'Nerópolis',
    state: 'Goiás',
    stateCode: 'GO',
    isActive: true,
    isHighlighted: false,
  },
  {
    name: 'Hidrolândia',
    state: 'Goiás',
    stateCode: 'GO',
    isActive: true,
    isHighlighted: false,
  },
  
  // Entorno do Distrito Federal
  {
    name: 'Luziânia',
    state: 'Goiás',
    stateCode: 'GO',
    isActive: true,
    isHighlighted: true,
  },
  {
    name: 'Águas Lindas de Goiás',
    state: 'Goiás',
    stateCode: 'GO',
    isActive: true,
    isHighlighted: true,
  },
  {
    name: 'Valparaíso de Goiás',
    state: 'Goiás',
    stateCode: 'GO',
    isActive: true,
    isHighlighted: true,
  },
  {
    name: 'Novo Gama',
    state: 'Goiás',
    stateCode: 'GO',
    isActive: true,
    isHighlighted: true,
  },
  {
    name: 'Formosa',
    state: 'Goiás',
    stateCode: 'GO',
    isActive: true,
    isHighlighted: true,
  },
  {
    name: 'Planaltina',
    state: 'Goiás',
    stateCode: 'GO',
    isActive: true,
    isHighlighted: true,
  },
  {
    name: 'Santo Antônio do Descoberto',
    state: 'Goiás',
    stateCode: 'GO',
    isActive: true,
    isHighlighted: true,
  },
  {
    name: 'Cidade Ocidental',
    state: 'Goiás',
    stateCode: 'GO',
    isActive: true,
    isHighlighted: true,
  },
  
  // Outras cidades importantes
  {
    name: 'Anápolis',
    state: 'Goiás',
    stateCode: 'GO',
    isActive: true,
    isHighlighted: true,
  },
  {
    name: 'Rio Verde',
    state: 'Goiás',
    stateCode: 'GO',
    isActive: true,
    isHighlighted: true,
  },
  {
    name: 'Itumbiara',
    state: 'Goiás',
    stateCode: 'GO',
    isActive: true,
    isHighlighted: true,
  },
  {
    name: 'Catalão',
    state: 'Goiás',
    stateCode: 'GO',
    isActive: true,
    isHighlighted: true,
  },
  {
    name: 'Jataí',
    state: 'Goiás',
    stateCode: 'GO',
    isActive: true,
    isHighlighted: true,
  },
  {
    name: 'Caldas Novas',
    state: 'Goiás',
    stateCode: 'GO',
    isActive: true,
    isHighlighted: true,
  },
  {
    name: 'Goianésia',
    state: 'Goiás',
    stateCode: 'GO',
    isActive: true,
    isHighlighted: false,
  },
  {
    name: 'Mineiros',
    state: 'Goiás',
    stateCode: 'GO',
    isActive: true,
    isHighlighted: false,
  },
  {
    name: 'Inhumas',
    state: 'Goiás',
    stateCode: 'GO',
    isActive: true,
    isHighlighted: false,
  },
  {
    name: 'Morrinhos',
    state: 'Goiás',
    stateCode: 'GO',
    isActive: true,
    isHighlighted: false,
  },
  {
    name: 'Cristalina',
    state: 'Goiás',
    stateCode: 'GO',
    isActive: true,
    isHighlighted: false,
  },
  {
    name: 'Quirinópolis',
    state: 'Goiás',
    stateCode: 'GO',
    isActive: true,
    isHighlighted: false,
  },
  {
    name: 'Itaberaí',
    state: 'Goiás',
    stateCode: 'GO',
    isActive: true,
    isHighlighted: false,
  },
  {
    name: 'Posse',
    state: 'Goiás',
    stateCode: 'GO',
    isActive: true,
    isHighlighted: false,
  },
  {
    name: 'Jaraguá',
    state: 'Goiás',
    stateCode: 'GO',
    isActive: true,
    isHighlighted: false,
  },
];

export async function seedCities(reset = false) {
  console.log('🏙️  Iniciando seed das cidades de Goiás...');

  try {
    // Opcional: Reset dos dados se solicitado
    if (reset) {
      console.log('🗑️  Removendo cidades existentes de Goiás...');
      await db.delete(cities).where(eq(cities.stateCode, 'GO'));
    }

    console.log('📍 Criando cidades...');
    let createdCount = 0;
    let skippedCount = 0;

    for (const cityData of GOIAS_CITIES) {
      try {
        const [city] = await db
          .insert(cities)
          .values(cityData)
          .onConflictDoNothing()
          .returning();

        if (city) {
          const highlighted = cityData.isHighlighted ? '⭐' : '  ';
          console.log(`   ${highlighted} ${cityData.name}`);
          createdCount++;
        } else {
          // Cidade já existe
          const existingCity = await db
            .select()
            .from(cities)
            .where(
              and(
                eq(cities.name, cityData.name),
                eq(cities.stateCode, cityData.stateCode)
              )
            )
            .limit(1);
          
          if (existingCity[0]) {
            console.log(`   ≈ ${cityData.name} (já existe)`);
            skippedCount++;
          }
        }
      } catch (error) {
        console.error(`   ✗ Erro ao criar ${cityData.name}:`, error);
      }
    }

    // Verificar total no banco
    const totalCitiesInDb = await db
      .select()
      .from(cities)
      .where(eq(cities.stateCode, 'GO'));
    
    const highlightedCities = await db
      .select()
      .from(cities)
      .where(
        and(
          eq(cities.stateCode, 'GO'),
          eq(cities.isHighlighted, true)
        )
      );

    console.log('\n📊 Estatísticas do seed:');
    console.log(`   • ${createdCount} cidades criadas`);
    console.log(`   • ${skippedCount} cidades já existiam`);
    console.log(`   • ${totalCitiesInDb.length} cidades de Goiás no banco`);
    console.log(`   • ${highlightedCities.length} cidades em destaque`);

    console.log('\n✅ Seed das cidades concluído com sucesso!');
    
    return {
      citiesCreated: createdCount,
      citiesSkipped: skippedCount,
      totalCitiesInDb: totalCitiesInDb.length,
      highlightedCities: highlightedCities.length,
    };

  } catch (error) {
    console.error('❌ Erro durante o seed de cidades:', error);
    throw error;
  }
}

// Executar apenas se chamado diretamente (ES modules)
if (import.meta.url === `file://${process.argv[1]}`) {
  seedCities(process.argv.includes('--reset'))
    .then((stats) => {
      console.log('\n🎉 Seed de cidades concluído:', stats);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro fatal:', error);
      process.exit(1);
    });
}
