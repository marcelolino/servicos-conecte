/**
 * Script simples para executar o seed do catálogo de serviços
 * Uso: tsx server/seeds/run-seed.ts
 */

import { db } from '../db';

async function runServicesSeed() {
  console.log('🌱 Iniciando seed do catálogo de serviços...');
  
  try {
    // Executar queries diretamente usando SQL
    
    // 1. Inserir categorias faltantes
    console.log('📁 Adicionando categorias...');
    
    await db.execute(`
      INSERT INTO service_categories (name, description, icon, color, level, is_active) 
      SELECT name, description, icon, color, level, is_active 
      FROM (VALUES 
        ('Jardinagem', 'Serviços de jardinagem e paisagismo', 'leaf-icon', '#4CAF50', 0, true),
        ('Desentupimento', 'Serviços especializados em desentupimento', 'wrench-icon', '#FF5722', 0, true),
        ('Elétrica', 'Serviços elétricos residenciais e comerciais', 'zap-icon', '#FFC107', 0, true),
        ('Encanador', 'Serviços de encanamento e hidráulica', 'droplets-icon', '#2196F3', 0, true),
        ('Pintor', 'Serviços de pintura residencial e comercial', 'brush-icon', '#9C27B0', 0, true)
      ) AS new_categories(name, description, icon, color, level, is_active)
      WHERE NOT EXISTS (
        SELECT 1 FROM service_categories sc WHERE sc.name = new_categories.name
      );
    `);

    // 2. Atualizar sequência de categorias
    await db.execute(`SELECT setval('service_categories_id_seq', (SELECT MAX(id) FROM service_categories));`);

    // 3. Buscar IDs das categorias
    const categories = await db.execute(`
      SELECT id, name FROM service_categories WHERE level = 0 ORDER BY id;
    `);
    
    console.log('📋 Categorias disponíveis:', categories.length);

    // 4. Inserir serviços do catálogo apenas se não existirem
    console.log('🛠️ Adicionando serviços ao catálogo...');
    
    const servicesToAdd = `
      INSERT INTO services (category_id, name, description, estimated_duration, suggested_min_price, suggested_max_price, default_charging_type, is_active, visible_on_home) 
      SELECT * FROM (VALUES 
        -- Jardinagem
        ((SELECT id FROM service_categories WHERE name = 'Jardinagem'), 'Poda de Árvores', 'Poda profissional e segura de árvores', '3-6 h', 135.00, 340.00, 'visit', true, true),
        ((SELECT id FROM service_categories WHERE name = 'Jardinagem'), 'Irrigação Automática', 'Sistema de irrigação automática', '1-2 d', 500.00, 2000.00, 'quote', true, false),
        ((SELECT id FROM service_categories WHERE name = 'Jardinagem'), 'Limpeza de Piscina', 'Piscina sempre limpa e cristalina', '1-2 h', 60.00, 130.00, 'visit', true, true),
        
        -- Desentupimento  
        ((SELECT id FROM service_categories WHERE name = 'Desentupimento'), 'Desentupimento de Pia', 'Desentupimento rápido da sua pia', '30-60 min', 60.00, 120.00, 'visit', true, true),
        ((SELECT id FROM service_categories WHERE name = 'Desentupimento'), 'Desentupimento de Vaso Sanitário', 'Desentupimento eficaz do vaso sanitário', '30-90 min', 60.00, 150.00, 'visit', true, true),
        ((SELECT id FROM service_categories WHERE name = 'Desentupimento'), 'Limpeza de Caixa D''água', 'Água limpa e segura na sua casa', '2-4 h', 120.00, 250.00, 'visit', true, true),
        ((SELECT id FROM service_categories WHERE name = 'Desentupimento'), 'Desentupimento de Ralo', 'Desentupimento eficaz de ralos', '30-60 min', 50.00, 100.00, 'visit', true, false),
        ((SELECT id FROM service_categories WHERE name = 'Desentupimento'), 'Desentupimento de Rede de Esgoto', 'Desentupimento de rede de esgoto com equipamentos industriais', '2-4 h', 200.00, 500.00, 'visit', true, false),
        
        -- Elétrica
        ((SELECT id FROM service_categories WHERE name = 'Elétrica'), 'Instalação Elétrica Residencial', 'Instalação elétrica residencial', '1-2 h', 70.00, 90.00, 'hour', true, true),
        ((SELECT id FROM service_categories WHERE name = 'Elétrica'), 'Instalação de Luminária', 'Instalação profissional de luminárias', '1-2 h', 70.00, 130.00, 'visit', true, true),
        ((SELECT id FROM service_categories WHERE name = 'Elétrica'), 'Manutenção de Quadro Elétrico', 'Manutenção do seu quadro elétrico', '1-2 h', 100.00, 200.00, 'visit', true, false),
        
        -- Encanador
        ((SELECT id FROM service_categories WHERE name = 'Encanador'), 'Instalação de Registro', 'Instalação de registros hidráulicos', '1-2 h', 70.00, 120.00, 'visit', true, true),
        ((SELECT id FROM service_categories WHERE name = 'Encanador'), 'Troca de Sifão', 'Troca rápida de sifões', '30-60 min', 60.00, 100.00, 'visit', true, false),
        
        -- Pintor
        ((SELECT id FROM service_categories WHERE name = 'Pintor'), 'Pintura de Móveis', 'Renovação de móveis com pintura', '1-2 d', 150.00, 400.00, 'visit', true, true),
        ((SELECT id FROM service_categories WHERE name = 'Pintor'), 'Textura em Parede', 'Texturas decorativas para suas paredes', '1-3 d', 300.00, 800.00, 'visit', true, false),
        
        -- Limpeza adicionais
        ((SELECT id FROM service_categories WHERE name = 'Limpeza'), 'Limpeza Pós-Obra', 'Limpeza especializada para remoção de resíduos de obra', '6-8 h', 150.00, 300.00, 'visit', true, true),
        ((SELECT id FROM service_categories WHERE name = 'Limpeza'), 'Limpeza de Carpete e Estofados', 'Limpeza profunda de carpetes e estofados', '2-4 h', 120.00, 300.00, 'visit', true, true),
        ((SELECT id FROM service_categories WHERE name = 'Limpeza'), 'Limpeza de Vidros e Janelas', 'Vidros limpos e cristalinos', '1-3 h', 50.00, 150.00, 'visit', true, false)
      ) AS new_services(category_id, name, description, estimated_duration, suggested_min_price, suggested_max_price, default_charging_type, is_active, visible_on_home)
      WHERE NOT EXISTS (
        SELECT 1 FROM services s WHERE s.name = new_services.name AND s.category_id = new_services.category_id
      );
    `;

    await db.execute(servicesToAdd);

    // 5. Atualizar sequência de serviços
    await db.execute(`SELECT setval('services_id_seq', (SELECT MAX(id) FROM services));`);

    // 6. Verificar resultados
    const totalServices = await db.execute(`SELECT COUNT(*) as total FROM services WHERE is_active = true;`);
    const totalCategories = await db.execute(`SELECT COUNT(*) as total FROM service_categories WHERE level = 0 AND is_active = true;`);

    console.log('✅ Seed concluído com sucesso!');
    console.log(`📊 Total de categorias: ${(totalCategories as any)[0]?.total || 0}`);
    console.log(`📊 Total de serviços: ${(totalServices as any)[0]?.total || 0}`);

  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    throw error;
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  runServicesSeed()
    .then(() => {
      console.log('🎉 Seed concluído!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro fatal:', error);
      process.exit(1);
    });
}

export default runServicesSeed;