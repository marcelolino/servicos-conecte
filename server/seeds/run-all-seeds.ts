/**
 * QSERVIÇOS - SEED COMPLETO
 * Data: 30/08/2025
 * 
 * Script para executar todos os seeds em sequência
 * Uso: npx tsx server/seeds/run-all-seeds.ts
 */

import { seedServicesCatalog } from './seed-services';
import { seedUsers } from './seed-users';
import { seedChargingTypes } from './seed-charging-types';

export async function runAllSeeds(reset = false) {
  console.log('🚀 Iniciando seed completo do Qserviços...');
  console.log('==========================================\n');

  try {
    // 1. Seed dos tipos de cobrança
    console.log('1️⃣ TIPOS DE COBRANÇA');
    const chargingTypesStats = await seedChargingTypes(reset);
    console.log('✅ Tipos de cobrança concluídos\n');

    // 2. Seed do catálogo de serviços
    console.log('2️⃣ CATÁLOGO DE SERVIÇOS');
    const servicesStats = await seedServicesCatalog(reset);
    console.log('✅ Catálogo concluído\n');

    // 3. Seed das contas de teste
    console.log('3️⃣ CONTAS DE TESTE');
    const usersStats = await seedUsers(reset);
    console.log('✅ Contas concluídas\n');

    // 4. Relatório final
    console.log('==========================================');
    console.log('🎉 SEED COMPLETO CONCLUÍDO COM SUCESSO!');
    console.log('==========================================');
    console.log('📊 RESUMO FINAL:');
    console.log(`   • ${chargingTypesStats.total} tipos de cobrança`);
    console.log(`   • ${servicesStats.categoriesProcessed} categorias de serviços`);
    console.log(`   • ${servicesStats.servicesProcessed} serviços no catálogo`);
    console.log(`   • ${usersStats.mainAccountsProcessed} contas principais`);
    console.log(`   • ${usersStats.providersProcessed} prestadores especializados`);
    console.log(`   • ${usersStats.totalUsersInDb} usuários total`);
    console.log(`   • ${usersStats.totalProvidersInDb} prestadores total`);
    console.log('');
    console.log('🔐 CREDENCIAIS DE ACESSO:');
    console.log('   • Admin: admin@qservicos.com | senha: password');
    console.log('   • Cliente: cliente@teste.com | senha: password');
    console.log('   • Prestador: prestador@teste.com | senha: password');
    console.log('   • Todos os prestadores usam a senha: password');
    console.log('');
    console.log('✨ Sistema pronto para uso!');

    return {
      success: true,
      chargingTypes: chargingTypesStats,
      services: servicesStats,
      users: usersStats,
    };

  } catch (error) {
    console.error('❌ Erro durante o seed completo:', error);
    throw error;
  }
}

// Executar apenas se chamado diretamente (ES modules)
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllSeeds(process.argv.includes('--reset'))
    .then((stats) => {
      console.log('🎯 Seed completo finalizado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro fatal no seed completo:', error);
      process.exit(1);
    });
}