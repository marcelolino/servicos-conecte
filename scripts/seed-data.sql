-- Seed data for Qserviços platform
-- Run this script to populate the database with sample data

-- Insert service categories
INSERT INTO service_categories (name, description, icon) VALUES 
('Limpeza', 'Serviços de limpeza residencial e comercial', '🧹'),
('Encanamento', 'Serviços de encanamento e hidráulica', '🔧'),
('Eletricista', 'Serviços elétricos e instalações', '⚡'),
('Encanador', 'Serviços hidráulicos e encanamento', '🔧'),
('Pintor', 'Serviços de pintura residencial e comercial', '🎨')
ON CONFLICT (name) DO NOTHING;

-- Insert admin user
INSERT INTO users (name, email, password, user_type, phone, is_active) VALUES 
('Admin User', 'admin@qservicos.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', '11999999999', true)
ON CONFLICT (email) DO NOTHING;

-- Insert client users
INSERT INTO users (name, email, password, user_type, phone, is_active) VALUES 
('João Silva', 'joao@cliente.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'client', '11987654321', true),
('Maria Santos', 'maria@cliente.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'client', '11876543210', true),
('Cliente Teste', 'cliente.teste@qservicos.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'client', '11999999999', true),
('elivania', 'elis205@gmail.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'client', '62981458264', true)
ON CONFLICT (email) DO NOTHING;

-- Insert provider users
INSERT INTO users (name, email, password, user_type, phone, is_active) VALUES 
('Carlos Ferreira', 'carlos@provider.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'provider', '11765432109', true),
('Ana Costa', 'ana@provider.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'provider', '11654321098', true),
('João Moura', 'joaomoura49@outlook.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'provider', '(11) 99999-9999', true),
('Maria Santos', 'maria@provider.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'provider', '(11) 91234-5678', true),
('Pedro Silva', 'pedro@provider.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'provider', '(11) 94567-8901', true),
('Ana Costa', 'ana@costa.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'provider', '(11) 93456-7890', true)
ON CONFLICT (email) DO NOTHING;

-- Insert providers (link users to provider table)
INSERT INTO providers (user_id, status, service_radius, base_price, description) 
SELECT u.id, 'approved', 
  CASE u.email
    WHEN 'joaomoura49@outlook.com' THEN 15
    WHEN 'maria@provider.com' THEN 20
    WHEN 'carlos@provider.com' THEN 12
    WHEN 'ana@costa.com' THEN 18
    WHEN 'pedro@provider.com' THEN 25
  END,
  CASE u.email
    WHEN 'joaomoura49@outlook.com' THEN 45.00
    WHEN 'maria@provider.com' THEN 35.00
    WHEN 'carlos@provider.com' THEN 35.00
    WHEN 'ana@costa.com' THEN 45.00
    WHEN 'pedro@provider.com' THEN 25.00
  END,
  CASE u.email
    WHEN 'joaomoura49@outlook.com' THEN 'Eletricista experiente em instalações residenciais e comerciais'
    WHEN 'maria@provider.com' THEN 'Especialista em limpeza residencial e comercial'
    WHEN 'carlos@provider.com' THEN 'Eletricista com experiência em manutenção predial'
    WHEN 'ana@costa.com' THEN 'Encanadora especializada em reparos hidráulicos'
    WHEN 'pedro@provider.com' THEN 'Pintor profissional com experiência em projetos residenciais e comerciais'
  END
FROM users u
WHERE u.user_type = 'provider' AND u.email IN ('joaomoura49@outlook.com', 'maria@provider.com', 'carlos@provider.com', 'ana@costa.com', 'pedro@provider.com')
ON CONFLICT (user_id) DO NOTHING;

-- Insert provider services
INSERT INTO provider_services (provider_id, category_id, name, description, minimum_price, service_zone, is_active)
SELECT 
  p.id as provider_id,
  sc.id as category_id,
  services.name,
  services.description,
  services.minimum_price,
  'Não especificado',
  true
FROM (
  SELECT 'joaomoura49@outlook.com' as email, 'Eletricista' as category, 'Instalação Elétrica Básica' as name, 'Instalação de tomadas, interruptores e luminárias' as description, 45.00 as minimum_price
  UNION ALL SELECT 'joaomoura49@outlook.com', 'Limpeza', 'Limpeza Residencial Completa', 'Limpeza completa de casa incluindo todos os cômodos', 35.00
  UNION ALL SELECT 'maria@provider.com', 'Limpeza', 'Limpeza de Escritórios', 'Limpeza comercial para empresas e escritórios', 40.00
  UNION ALL SELECT 'maria@provider.com', 'Limpeza', 'Limpeza Pós-Obra', 'Limpeza especializada após reformas e construções', 50.00
  UNION ALL SELECT 'carlos@provider.com', 'Eletricista', 'Instalação de Ventiladores', 'Instalação e manutenção de ventiladores de teto', 35.00
  UNION ALL SELECT 'carlos@provider.com', 'Eletricista', 'Manutenção Elétrica Predial', 'Manutenção elétrica em prédios e condomínios', 60.00
  UNION ALL SELECT 'ana@costa.com', 'Encanador', 'Conserto de Torneiras', 'Reparo e troca de torneiras e registros', 45.00
  UNION ALL SELECT 'ana@costa.com', 'Encanador', 'Desentupimento de Pias', 'Serviço de desentupimento para cozinhas e banheiros', 80.00
  UNION ALL SELECT 'pedro@provider.com', 'Pintor', 'Pintura de Fachadas', 'Pintura externa de prédios e casas', 30.00
  UNION ALL SELECT 'pedro@provider.com', 'Pintor', 'Pintura de Interiores', 'Pintura interna de casas e apartamentos', 25.00
) services
JOIN users u ON u.email = services.email
JOIN providers p ON p.user_id = u.id
JOIN service_categories sc ON sc.name = services.category
ON CONFLICT DO NOTHING;

-- Note: Password for all test users is "123456" (hashed)
-- Admin credentials: admin@qservicos.com / password