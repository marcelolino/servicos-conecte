-- ==============================================
-- QSERVIÇOS - SEED DO CATÁLOGO DE SERVIÇOS
-- Data: 19/08/2025
-- Versão: 1.0
-- ==============================================

-- Este arquivo contém o seed completo do catálogo de serviços
-- Para usar: execute este arquivo contra o banco de dados

-- ==============================================
-- 1. LIMPAR DADOS EXISTENTES (OPCIONAL)
-- ==============================================
-- TRUNCATE TABLE services RESTART IDENTITY CASCADE;
-- TRUNCATE TABLE service_categories RESTART IDENTITY CASCADE;

-- ==============================================
-- 2. CATEGORIAS DE SERVIÇOS
-- ==============================================

INSERT INTO service_categories (id, name, description, icon, color, level, is_active) VALUES
(1, 'Limpeza', 'Serviços de limpeza residencial e comercial', 'mop-icon', '#4CAF50', 0, true),
(2, 'Manutenção', 'Reparos e manutenção em geral', 'wrench-icon', '#FF9800', 0, true),
(3, 'Beleza', 'Serviços de beleza e estética', 'beauty-icon', '#E91E63', 0, true),
(4, 'Educação', 'Aulas particulares e cursos', 'education-icon', '#2196F3', 0, true),
(5, 'Tecnologia', 'Serviços de TI e tecnologia', 'tech-icon', '#9C27B0', 0, true),
(6, 'Saúde', 'Cuidados de saúde e bem-estar', 'health-icon', '#F44336', 0, true),
(7, 'Jardinagem', 'Serviços de jardinagem e paisagismo', 'leaf-icon', '#4CAF50', 0, true),
(8, 'Desentupimento', 'Serviços especializados em desentupimento', 'wrench-icon', '#FF5722', 0, true),
(9, 'Elétrica', 'Serviços elétricos residenciais e comerciais', 'zap-icon', '#FFC107', 0, true),
(10, 'Encanador', 'Serviços de encanamento e hidráulica', 'droplets-icon', '#2196F3', 0, true),
(11, 'Pintor', 'Serviços de pintura residencial e comercial', 'brush-icon', '#9C27B0', 0, true);

-- Reset da sequência para categorias
SELECT setval('service_categories_id_seq', (SELECT MAX(id) FROM service_categories));

-- ==============================================
-- 3. CATÁLOGO DE SERVIÇOS
-- ==============================================

INSERT INTO services (category_id, name, description, estimated_duration, suggested_min_price, suggested_max_price, default_charging_type, is_active, visible_on_home) VALUES

-- LIMPEZA (category_id = 1)
(1, 'Limpeza Residencial Completa', 'Limpeza completa de residências incluindo todos os cômodos', '3-4 horas', 80.00, 150.00, 'visit', true, true),
(1, 'Limpeza de Escritório', 'Limpeza de ambientes comerciais e escritórios', '2-3 horas', 60.00, 120.00, 'visit', true, true),
(1, 'Limpeza Pós-Obra', 'Limpeza especializada para remoção de resíduos de obra', '6-8 h', 150.00, 300.00, 'visit', true, true),
(1, 'Limpeza de Carpete e Estofados', 'Limpeza profunda de carpetes e estofados', '2-4 h', 120.00, 300.00, 'visit', true, true),
(1, 'Limpeza de Vidros e Janelas', 'Vidros limpos e cristalinos', '1-3 h', 50.00, 150.00, 'visit', true, false),

-- MANUTENÇÃO (category_id = 2)
(2, 'Reparo de Torneira', 'Conserto e substituição de torneiras', '1 hora', 40.00, 80.00, 'visit', true, true),
(2, 'Instalação Elétrica', 'Instalação e reparo de sistemas elétricos', '2-4 horas', 50.00, 100.00, 'hour', true, true),

-- BELEZA (category_id = 3)
(3, 'Corte de Cabelo', 'Corte e penteado profissional', '1 hora', 30.00, 80.00, 'visit', true, true),
(3, 'Manicure e Pedicure', 'Cuidados completos para unhas', '1.5 horas', 25.00, 60.00, 'visit', true, true),

-- EDUCAÇÃO (category_id = 4)
(4, 'Aula de Matemática', 'Aulas particulares de matemática', '1 hora', 40.00, 80.00, 'hour', true, true),

-- TECNOLOGIA (category_id = 5)
(5, 'Manutenção de Computador', 'Limpeza e otimização de computadores', '2 horas', 60.00, 120.00, 'visit', true, true),

-- JARDINAGEM (category_id = 7)
(7, 'Poda de Árvores', 'Poda profissional e segura de árvores', '3-6 h', 135.00, 340.00, 'visit', true, true),
(7, 'Irrigação Automática', 'Sistema de irrigação automática', '1-2 d', 500.00, 2000.00, 'quote', true, false),
(7, 'Limpeza de Piscina', 'Piscina sempre limpa e cristalina', '1-2 h', 60.00, 130.00, 'visit', true, true),

-- DESENTUPIMENTO (category_id = 8)
(8, 'Desentupimento de Pia', 'Desentupimento rápido da sua pia', '30-60 min', 60.00, 120.00, 'visit', true, true),
(8, 'Desentupimento de Vaso Sanitário', 'Desentupimento eficaz do vaso sanitário', '30-90 min', 60.00, 150.00, 'visit', true, true),
(8, 'Limpeza de Caixa D''água', 'Água limpa e segura na sua casa', '2-4 h', 120.00, 250.00, 'visit', true, true),
(8, 'Desentupimento de Ralo', 'Desentupimento eficaz de ralos', '30-60 min', 50.00, 100.00, 'visit', true, false),
(8, 'Desentupimento de Rede de Esgoto', 'Desentupimento de rede de esgoto com equipamentos industriais', '2-4 h', 200.00, 500.00, 'visit', true, false),

-- ELÉTRICA (category_id = 9)
(9, 'Instalação Elétrica Residencial', 'Instalação elétrica residencial', '1-2 h', 70.00, 90.00, 'hour', true, true),
(9, 'Instalação de Luminária', 'Instalação profissional de luminárias', '1-2 h', 70.00, 130.00, 'visit', true, true),
(9, 'Manutenção de Quadro Elétrico', 'Manutenção do seu quadro elétrico', '1-2 h', 100.00, 200.00, 'visit', true, false),

-- ENCANADOR (category_id = 10)
(10, 'Instalação de Registro', 'Instalação de registros hidráulicos', '1-2 h', 70.00, 120.00, 'visit', true, true),
(10, 'Troca de Sifão', 'Troca rápida de sifões', '30-60 min', 60.00, 100.00, 'visit', true, false),

-- PINTOR (category_id = 11)
(11, 'Pintura de Móveis', 'Renovação de móveis com pintura', '1-2 d', 150.00, 400.00, 'visit', true, true),
(11, 'Textura em Parede', 'Texturas decorativas para suas paredes', '1-3 d', 300.00, 800.00, 'visit', true, false);

-- Reset da sequência para services
SELECT setval('services_id_seq', (SELECT MAX(id) FROM services));

-- ==============================================
-- 4. CONFIGURAÇÕES ADICIONAIS
-- ==============================================

-- Marcar alguns serviços como visíveis na home
UPDATE services SET visible_on_home = true WHERE name IN (
    'Limpeza Residencial Completa',
    'Poda de Árvores', 
    'Desentupimento de Pia',
    'Instalação Elétrica Residencial',
    'Limpeza de Piscina',
    'Pintura de Móveis',
    'Limpeza Pós-Obra'
);

-- ==============================================
-- 5. VERIFICAÇÃO
-- ==============================================

-- Contar serviços por categoria
SELECT sc.name as categoria, COUNT(s.id) as total_servicos
FROM service_categories sc
LEFT JOIN services s ON sc.id = s.category_id AND s.is_active = true
WHERE sc.level = 0
GROUP BY sc.id, sc.name
ORDER BY sc.name;

COMMIT;

-- ==============================================
-- INSTRUÇÕES DE USO:
-- ==============================================
-- 1. Para aplicar o seed completo:
--    psql -d sua_database < server/seeds/services-catalog-seed.sql
--
-- 2. Para resetar apenas os serviços:
--    Descomente as linhas TRUNCATE no início do arquivo
--
-- 3. Para backup:
--    pg_dump -d sua_database -t services -t service_categories > backup.sql
-- ==============================================