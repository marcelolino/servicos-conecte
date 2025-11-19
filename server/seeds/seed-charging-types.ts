/**
 * QSERVIÇOS - SEED DE TIPOS DE COBRANÇA
 * Data: 19/11/2025
 * 
 * Script para popular a tabela de tipos de cobrança
 */

import { db } from "../db";
import { customChargingTypes } from "@shared/schema";
import { eq } from "drizzle-orm";

const chargingTypesData = [
  {
    name: "Por Diária",
    key: "daily",
    description: "Cobrança por dia de trabalho. Ideal para serviços que demoram um ou mais dias para serem concluídos.",
    isActive: true,
  },
  {
    name: "Por Serviço",
    key: "servico",
    description: "Cobrança por serviço completo. Preço fixo independente do tempo ou complexidade.",
    isActive: true,
  },
  {
    name: "Por Visita",
    key: "visit",
    description: "Cobrança por visita técnica ou atendimento. Cada ida ao local é cobrada separadamente.",
    isActive: true,
  },
  {
    name: "Por Projeto",
    key: "project",
    description: "Cobrança por projeto completo. Valor acordado para todo o escopo do trabalho.",
    isActive: true,
  },
];

export async function seedChargingTypes(reset = false) {
  console.log('📦 Iniciando seed de tipos de cobrança...');
  
  try {
    // Se reset, limpar dados existentes
    if (reset) {
      console.log('🗑️  Limpando tipos de cobrança existentes...');
      await db.delete(customChargingTypes);
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const chargingType of chargingTypesData) {
      // Verificar se já existe
      const existing = await db
        .select()
        .from(customChargingTypes)
        .where(eq(customChargingTypes.key, chargingType.key))
        .limit(1);

      if (existing.length > 0) {
        if (reset) {
          // Se reset, atualizar
          await db
            .update(customChargingTypes)
            .set({
              name: chargingType.name,
              description: chargingType.description,
              isActive: chargingType.isActive,
              updatedAt: new Date(),
            })
            .where(eq(customChargingTypes.key, chargingType.key));
          updated++;
          console.log(`   ✏️  Atualizado: ${chargingType.name}`);
        } else {
          skipped++;
          console.log(`   ⏭️  Já existe: ${chargingType.name}`);
        }
      } else {
        // Criar novo
        await db.insert(customChargingTypes).values(chargingType);
        created++;
        console.log(`   ✅ Criado: ${chargingType.name}`);
      }
    }

    console.log('\n📊 Resumo do seed de tipos de cobrança:');
    console.log(`   • Criados: ${created}`);
    console.log(`   • Atualizados: ${updated}`);
    console.log(`   • Ignorados: ${skipped}`);
    console.log(`   • Total: ${chargingTypesData.length}`);

    return {
      created,
      updated,
      skipped,
      total: chargingTypesData.length,
    };

  } catch (error) {
    console.error('❌ Erro ao fazer seed de tipos de cobrança:', error);
    throw error;
  }
}

// Executar apenas se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  seedChargingTypes(process.argv.includes('--reset'))
    .then((stats) => {
      console.log('\n✨ Seed de tipos de cobrança concluído com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro fatal no seed:', error);
      process.exit(1);
    });
}
