import express from 'express';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import { storage } from '../storage';
import { db } from '../db';
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';
import { users, providers, serviceRequests, serviceCategories, providerServices, payments, cities, insertCitySchema } from '../../shared/schema';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Configuração do multer para upload de logo
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/logos');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const logoUpload = multer({ 
  storage: logoStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas!'));
    }
  }
});

// Middleware to verify JWT token
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }
    req.user = user;
    next();
  });
};

// Middleware para verificar se o usuário é admin
const requireAdmin = (req: any, res: any, next: any) => {
  if (!req.user || req.user.userType !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
  }
  next();
};

// GET /api/admin/metrics - Obter métricas do dashboard
/**
 * @swagger
 * /api/admin/metrics:
 *   get:
 *     tags: [Admin - Métricas]
 *     summary: Obter métricas administrativas
 *     description: Retorna métricas gerais do sistema para o painel administrativo
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Métricas obtidas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalUsers:
 *                   type: integer
 *                   example: 150
 *                 totalProviders:
 *                   type: integer
 *                   example: 45
 *                 totalServiceRequests:
 *                   type: integer
 *                   example: 320
 *                 totalRevenue:
 *                   type: number
 *                   format: decimal
 *                   example: 15750.00
 *                 pendingApprovals:
 *                   type: integer
 *                   example: 8
 *       401:
 *         description: Token não fornecido
 *       403:
 *         description: Acesso negado - Admin requerido
 */
router.get('/metrics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const cityFilter = req.query.city as string;
    
    // Buscar métricas gerais
    const [totalClientsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.userType, 'client'));

    const [totalProvidersResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(providers);

    const [pendingProvidersResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(providers)
      .where(eq(providers.status, 'pending'));

    const [approvedProvidersResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(providers)
      .where(eq(providers.status, 'approved'));

    const [totalServicesResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(serviceRequests);

    // Reservas do mês atual
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    let bookingsQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(serviceRequests)
      .where(gte(serviceRequests.createdAt, currentMonth));

    if (cityFilter && cityFilter !== 'all') {
      const [city, state] = cityFilter.split('-');
      bookingsQuery = bookingsQuery.where(
        and(
          eq(serviceRequests.city, city),
          eq(serviceRequests.state, state)
        )
      );
    }

    const [totalBookingsResult] = await bookingsQuery;

    // Receita mensal (simulada - implementar com dados reais)
    const monthlyRevenue = 15000; // Placeholder

    // Contar cidades únicas
    const citiesResult = await db
      .selectDistinct({
        city: providers.city,
        state: providers.state,
      })
      .from(providers)
      .where(sql`${providers.city} IS NOT NULL AND ${providers.state} IS NOT NULL`);

    const metrics = {
      totalClients: totalClientsResult.count,
      totalProviders: totalProvidersResult.count,
      pendingProviders: pendingProvidersResult.count,
      approvedProviders: approvedProvidersResult.count,
      totalServices: totalServicesResult.count,
      totalBookings: totalBookingsResult.count,
      monthlyRevenue,
      citiesCount: citiesResult.length,
    };

    res.json(metrics);
  } catch (error) {
    console.error('Erro ao buscar métricas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/admin/cities - Listar cidades disponíveis
/**
 * @swagger
 * /api/admin/cities:
 *   get:
 *     tags: [Admin - Cidades]
 *     summary: Listar cidades
 *     description: Retorna lista de cidades cadastradas no sistema
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de cidades
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: 'São Paulo'
 *                   state:
 *                     type: string
 *                     example: 'SP'
 *                   isActive:
 *                     type: boolean
 *                     example: true
 *       401:
 *         description: Token não fornecido
 *       403:
 *         description: Acesso negado - Admin requerido
 */
router.get('/cities', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const allCities = await db
      .select()
      .from(cities)
      .orderBy(cities.name);

    res.json(allCities);
  } catch (error) {
    console.error('Erro ao buscar cidades:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/admin/cities - Criar nova cidade
/**
 * @swagger
 * /api/admin/cities:
 *   post:
 *     tags: [Admin - Cidades]
 *     summary: Criar nova cidade
 *     description: Adiciona uma nova cidade ao sistema
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: 'Goiânia'
 *               state:
 *                 type: string
 *                 example: 'Goiás'
 *               stateCode:
 *                 type: string
 *                 example: 'GO'
 *               isHighlighted:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Cidade criada com sucesso
 *       401:
 *         description: Token não fornecido
 *       403:
 *         description: Acesso negado - Admin requerido
 */
router.post('/cities', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const cityData = insertCitySchema.parse(req.body);
    
    const [newCity] = await db
      .insert(cities)
      .values(cityData)
      .returning();

    res.status(201).json(newCity);
  } catch (error) {
    console.error('Erro ao criar cidade:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    res.status(500).json({ error: 'Erro ao criar cidade' });
  }
});

// PUT /api/admin/cities/:id - Atualizar cidade
/**
 * @swagger
 * /api/admin/cities/{id}:
 *   put:
 *     tags: [Admin - Cidades]
 *     summary: Atualizar cidade
 *     description: Atualiza os dados de uma cidade
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da cidade
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               state:
 *                 type: string
 *               stateCode:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               isHighlighted:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cidade atualizada com sucesso
 *       404:
 *         description: Cidade não encontrada
 *       401:
 *         description: Token não fornecido
 *       403:
 *         description: Acesso negado - Admin requerido
 */
router.put('/cities/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const cityId = parseInt(req.params.id);
    
    // Verificar se a cidade existe
    const [existingCity] = await db
      .select()
      .from(cities)
      .where(eq(cities.id, cityId))
      .limit(1);
    
    if (!existingCity) {
      return res.status(404).json({ error: 'Cidade não encontrada' });
    }

    // Validar dados de atualização
    const cityData = insertCitySchema.partial().parse(req.body);
    const updateData = { ...cityData, updatedAt: new Date() };

    const [updatedCity] = await db
      .update(cities)
      .set(updateData)
      .where(eq(cities.id, cityId))
      .returning();

    res.json(updatedCity);
  } catch (error) {
    console.error('Erro ao atualizar cidade:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    res.status(500).json({ error: 'Erro ao atualizar cidade' });
  }
});

// DELETE /api/admin/cities/:id - Deletar cidade
/**
 * @swagger
 * /api/admin/cities/{id}:
 *   delete:
 *     tags: [Admin - Cidades]
 *     summary: Deletar cidade
 *     description: Remove uma cidade do sistema
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da cidade
 *     responses:
 *       200:
 *         description: Cidade deletada com sucesso
 *       404:
 *         description: Cidade não encontrada
 *       401:
 *         description: Token não fornecido
 *       403:
 *         description: Acesso negado - Admin requerido
 */
router.delete('/cities/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const cityId = parseInt(req.params.id);
    
    // Verificar se a cidade existe
    const [existingCity] = await db
      .select()
      .from(cities)
      .where(eq(cities.id, cityId))
      .limit(1);
    
    if (!existingCity) {
      return res.status(404).json({ error: 'Cidade não encontrada' });
    }

    await db
      .delete(cities)
      .where(eq(cities.id, cityId));

    res.json({ success: true, message: 'Cidade deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar cidade:', error);
    res.status(500).json({ error: 'Erro ao deletar cidade' });
  }
});

// GET /api/admin/providers/pending - Listar prestadores pendentes
/**
 * @swagger
 * /api/admin/providers/pending:
 *   get:
 *     tags: [Admin - Prestadores]
 *     summary: Listar prestadores pendentes
 *     description: Retorna lista de prestadores aguardando aprovação
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de prestadores pendentes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   userId:
 *                     type: integer
 *                     example: 5
 *                   status:
 *                     type: string
 *                     enum: ['pending', 'approved', 'rejected']
 *                     example: 'pending'
 *                   description:
 *                     type: string
 *                     example: 'Prestador de serviços eletricista'
 *                   experience:
 *                     type: string
 *                     example: '5 anos de experiência'
 *                   user:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: 'João Silva'
 *                       email:
 *                         type: string
 *                         example: 'joao@email.com'
 *                       phone:
 *                         type: string
 *                         example: '11999999999'
 *       401:
 *         description: Token não fornecido
 *       403:
 *         description: Acesso negado - Admin requerido
 */
router.get('/providers/pending', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const pendingProviders = await db
      .select({
        id: providers.id,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
          city: users.city,
          state: users.state,
        },
        cpfCnpj: providers.cpfCnpj,
        description: providers.description,
        experience: providers.experience,
        bankName: providers.bankName,
        bankAgency: providers.bankAgency,
        bankAccount: providers.bankAccount,
        avatar: users.avatar,
        createdAt: providers.createdAt,
      })
      .from(providers)
      .innerJoin(users, eq(providers.userId, users.id))
      .where(eq(providers.status, 'pending'))
      .orderBy(desc(providers.createdAt));

    res.json(pendingProviders);
  } catch (error) {
    console.error('Erro ao buscar prestadores pendentes:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PATCH /api/admin/providers/:id/approve - Aprovar prestador
router.patch('/providers/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const providerId = parseInt(req.params.id);

    await db
      .update(providers)
      .set({ status: 'approved', updatedAt: new Date() })
      .where(eq(providers.id, providerId));

    res.json({ success: true, message: 'Prestador aprovado com sucesso' });
  } catch (error) {
    console.error('Erro ao aprovar prestador:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PATCH /api/admin/providers/:id/reject - Rejeitar prestador
router.patch('/providers/:id/reject', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const providerId = parseInt(req.params.id);

    await db
      .update(providers)
      .set({ status: 'rejected', updatedAt: new Date() })
      .where(eq(providers.id, providerId));

    res.json({ success: true, message: 'Prestador rejeitado' });
  } catch (error) {
    console.error('Erro ao rejeitar prestador:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/admin/services - Obter todos os serviços
/**
 * @swagger
 * /api/admin/services:
 *   get:
 *     tags: [Admin - Serviços]
 *     summary: Listar todos os serviços
 *     description: Retorna lista completa de serviços com informações do prestador e categoria
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de serviços obtida com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: 'Instalação de torneira'
 *                   description:
 *                     type: string
 *                     example: 'Instalação profissional de torneiras'
 *                   categoryId:
 *                     type: integer
 *                     example: 3
 *                   providerId:
 *                     type: integer
 *                     example: 7
 *                   price:
 *                     type: string
 *                     example: '150.00'
 *                   minimumPrice:
 *                     type: string
 *                     example: '100.00'
 *                   estimatedDuration:
 *                     type: string
 *                     example: '2 horas'
 *                   serviceZone:
 *                     type: string
 *                     example: 'Zona Sul'
 *                   requirements:
 *                     type: string
 *                     example: 'Material incluso'
 *                   isActive:
 *                     type: boolean
 *                     example: true
 *                   category:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                   provider:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       user:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *       401:
 *         description: Token não fornecido
 *       403:
 *         description: Acesso negado - Admin requerido
 */
router.get('/services', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const services = await db
      .select({
        id: providerServices.id,
        name: providerServices.name,
        description: providerServices.description,
        categoryId: providerServices.categoryId,
        providerId: providerServices.providerId,
        price: providerServices.price,
        minimumPrice: providerServices.minimumPrice,
        estimatedDuration: providerServices.estimatedDuration,
        serviceZone: providerServices.serviceZone,
        requirements: providerServices.requirements,
        images: providerServices.images,
        isActive: providerServices.isActive,
        createdAt: providerServices.createdAt,
        category: {
          id: serviceCategories.id,
          name: serviceCategories.name,
        },
        provider: {
          id: providers.id,
          user: {
            name: users.name,
            email: users.email,
          },
        },
      })
      .from(providerServices)
      .leftJoin(serviceCategories, eq(providerServices.categoryId, serviceCategories.id))
      .leftJoin(providers, eq(providerServices.providerId, providers.id))
      .leftJoin(users, eq(providers.userId, users.id))
      .orderBy(desc(providerServices.createdAt));

    res.json(services);
  } catch (error) {
    console.error('Erro ao buscar serviços:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/admin/services/:id - Obter serviço específico
/**
 * @swagger
 * /api/admin/services/{id}:
 *   get:
 *     tags: [Admin - Serviços]
 *     summary: Obter serviço específico
 *     description: Retorna detalhes de um serviço específico
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do serviço
 *     responses:
 *       200:
 *         description: Detalhes do serviço
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: 'Instalação de torneira'
 *                 description:
 *                   type: string
 *                   example: 'Instalação profissional de torneiras'
 *                 categoryId:
 *                   type: integer
 *                   example: 3
 *                 providerId:
 *                   type: integer
 *                   example: 7
 *                 price:
 *                   type: string
 *                   example: '150.00'
 *                 minimumPrice:
 *                   type: string
 *                   example: '100.00'
 *                 estimatedDuration:
 *                   type: string
 *                   example: '2 horas'
 *                 serviceZone:
 *                   type: string
 *                   example: 'Zona Sul'
 *                 requirements:
 *                   type: string
 *                   example: 'Material incluso'
 *                 isActive:
 *                   type: boolean
 *                   example: true
 *                 category:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                 provider:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     user:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *       401:
 *         description: Token não fornecido
 *       403:
 *         description: Acesso negado - Admin requerido
 *       404:
 *         description: Serviço não encontrado
 */
router.get('/services/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const service = await db
      .select({
        id: providerServices.id,
        name: providerServices.name,
        description: providerServices.description,
        categoryId: providerServices.categoryId,
        providerId: providerServices.providerId,
        price: providerServices.price,
        minimumPrice: providerServices.minimumPrice,
        estimatedDuration: providerServices.estimatedDuration,
        serviceZone: providerServices.serviceZone,
        requirements: providerServices.requirements,
        images: providerServices.images,
        isActive: providerServices.isActive,
        createdAt: providerServices.createdAt,
        category: {
          id: serviceCategories.id,
          name: serviceCategories.name,
        },
        provider: {
          id: providers.id,
          user: {
            name: users.name,
            email: users.email,
          },
        },
      })
      .from(providerServices)
      .leftJoin(serviceCategories, eq(providerServices.categoryId, serviceCategories.id))
      .leftJoin(providers, eq(providerServices.providerId, providers.id))
      .leftJoin(users, eq(providers.userId, users.id))
      .where(eq(providerServices.id, parseInt(id)))
      .limit(1);

    if (!service.length) {
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }

    res.json(service[0]);
  } catch (error) {
    console.error('Erro ao buscar serviço:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/admin/services - Criar novo serviço
/**
 * @swagger
 * /api/admin/services:
 *   post:
 *     tags: [Admin - Serviços]
 *     summary: Criar novo serviço
 *     description: Cria um novo serviço no sistema
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - categoryId
 *               - providerId
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *                 example: 'Instalação de torneira'
 *               description:
 *                 type: string
 *                 example: 'Instalação profissional de torneiras'
 *               categoryId:
 *                 type: integer
 *                 example: 3
 *               providerId:
 *                 type: integer
 *                 example: 7
 *               price:
 *                 type: string
 *                 example: '150.00'
 *               minimumPrice:
 *                 type: string
 *                 example: '100.00'
 *               estimatedDuration:
 *                 type: string
 *                 example: '2 horas'
 *               serviceZone:
 *                 type: string
 *                 example: 'Zona Sul'
 *               requirements:
 *                 type: string
 *                 example: 'Material incluso'
 *     responses:
 *       200:
 *         description: Serviço criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Serviço criado com sucesso'
 *                 service:
 *                   type: object
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Token não fornecido
 *       403:
 *         description: Acesso negado - Admin requerido
 */
router.post('/services', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, description, categoryId, providerId, price, minimumPrice, estimatedDuration, requirements, serviceZone, images } = req.body;
    
    const newService = await db
      .insert(providerServices)
      .values({
        name,
        description,
        categoryId: parseInt(categoryId),
        providerId: parseInt(providerId),
        price: price ? price.toString() : null,
        minimumPrice: minimumPrice ? minimumPrice.toString() : null,
        estimatedDuration,
        requirements,
        serviceZone,
        images: images || null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    res.json({ message: 'Serviço criado com sucesso', service: newService[0] });
  } catch (error) {
    console.error('Erro ao criar serviço:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/admin/services/:id - Editar serviço
/**
 * @swagger
 * /api/admin/services/{id}:
 *   put:
 *     tags: [Admin - Serviços]
 *     summary: Atualizar serviço
 *     description: Atualiza um serviço existente
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do serviço
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: 'Instalação de torneira'
 *               description:
 *                 type: string
 *                 example: 'Instalação profissional de torneiras'
 *               categoryId:
 *                 type: integer
 *                 example: 3
 *               providerId:
 *                 type: integer
 *                 example: 7
 *               price:
 *                 type: string
 *                 example: '150.00'
 *               minimumPrice:
 *                 type: string
 *                 example: '100.00'
 *               estimatedDuration:
 *                 type: string
 *                 example: '2 horas'
 *               serviceZone:
 *                 type: string
 *                 example: 'Zona Sul'
 *               requirements:
 *                 type: string
 *                 example: 'Material incluso'
 *     responses:
 *       200:
 *         description: Serviço atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Serviço atualizado com sucesso'
 *                 service:
 *                   type: object
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Token não fornecido
 *       403:
 *         description: Acesso negado - Admin requerido
 *       404:
 *         description: Serviço não encontrado
 */
router.put('/services/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      description, 
      categoryId, 
      providerId, 
      price, 
      minimumPrice, 
      estimatedDuration, 
      durationType,
      suggestedMinPrice,
      suggestedMaxPrice,
      tags,
      chargingType,
      requirements, 
      serviceZone, 
      images 
    } = req.body;
    
    const updatedService = await db
      .update(providerServices)
      .set({
        name,
        description,
        categoryId: categoryId ? parseInt(categoryId) : undefined,
        providerId: providerId ? parseInt(providerId) : undefined,
        price: price ? price.toString() : null,
        minimumPrice: minimumPrice ? minimumPrice.toString() : null,
        estimatedDuration,
        durationType: durationType || 'hours',
        suggestedMinPrice: suggestedMinPrice ? suggestedMinPrice.toString() : null,
        suggestedMaxPrice: suggestedMaxPrice ? suggestedMaxPrice.toString() : null,
        tags: tags || null,
        chargingType: chargingType || 'visit',
        requirements,
        serviceZone,
        images: images || null,
        updatedAt: new Date(),
      })
      .where(eq(providerServices.id, parseInt(id)))
      .returning();

    res.json({ message: 'Serviço atualizado com sucesso', service: updatedService[0] });
  } catch (error) {
    console.error('Erro ao atualizar serviço:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/admin/services/:id/status - Atualizar status do serviço
router.put('/services/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    await db
      .update(providerServices)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(providerServices.id, parseInt(id)));

    res.json({ message: 'Status do serviço atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar status do serviço:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/admin/services/:id - Excluir serviço
/**
 * @swagger
 * /api/admin/services/{id}:
 *   delete:
 *     tags: [Admin - Serviços]
 *     summary: Excluir serviço
 *     description: Exclui um serviço do sistema
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do serviço
 *     responses:
 *       200:
 *         description: Serviço excluído com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Serviço removido com sucesso'
 *       401:
 *         description: Token não fornecido
 *       403:
 *         description: Acesso negado - Admin requerido
 *       404:
 *         description: Serviço não encontrado
 */
router.delete('/services/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await db
      .delete(providerServices)
      .where(eq(providerServices.id, parseInt(id)));

    res.json({ message: 'Serviço excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir serviço:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// REPORTS ENDPOINTS

// GET /api/admin/reports/transactions - Relatórios de transações
router.get('/reports/transactions', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, zone, category } = req.query;
    
    // Get all bookings (service requests) which contain payment and provider info
    const bookings = await storage.getAllBookingsForAdmin();
    
    // Build transaction data with available information
    const transactions = bookings.map((booking, index) => {
      const amount = parseFloat(booking.finalPrice || booking.estimatedPrice || booking.totalAmount || '0');
      
      return {
        id: `TXN${String(index + 1).padStart(3, '0')}`,
        amount,
        status: booking.status === 'completed' ? 'completed' : 'pending',
        paymentMethod: booking.paymentMethod || 'digital',
        transactionId: `TX-${booking.id}`,
        date: booking.createdAt ? new Date(booking.createdAt).toLocaleDateString('pt-BR') : 'N/A',
        provider: booking.provider?.user?.name || 'N/A',
        serviceType: booking.category?.name || 'Serviço',
        location: `${booking.city || 'N/A'}, ${booking.state || 'N/A'}`
      };
    });

    // Calculate real metrics
    const completedBookings = bookings.filter(b => b.status === 'completed');
    const totalRevenue = completedBookings.reduce((sum, b) => sum + parseFloat(b.finalPrice || b.estimatedPrice || b.totalAmount || '0'), 0);
    const totalCommissions = totalRevenue * 0.15; // Assuming 15% commission rate
    const pendingBookings = bookings.filter(b => b.status === 'pending');
    const depositsRequired = pendingBookings.reduce((sum, b) => sum + parseFloat(b.finalPrice || b.estimatedPrice || b.totalAmount || '0'), 0) * 0.1;

    const metrics = {
      totalRevenue,
      commissionRevenue: totalCommissions,
      depositsRequired,
      lostGain: bookings.filter(b => b.status === 'cancelled').length * 100, // Estimated loss per cancelled booking
      completedGain: totalRevenue - totalCommissions
    };

    res.json({ metrics, transactions });
  } catch (error) {
    console.error('Erro ao buscar relatórios de transações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/admin/reports/business - Relatórios de negócios
router.get('/reports/business', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, zone, category } = req.query;
    
    // Get real data from bookings
    const bookings = await storage.getAllBookingsForAdmin();
    
    // Calculate real business metrics
    const completedBookings = bookings.filter(b => b.status === 'completed');
    const totalRevenue = completedBookings.reduce((sum, b) => sum + parseFloat(b.finalPrice || b.estimatedPrice || b.totalAmount || '0'), 0);
    const totalCommissions = totalRevenue * 0.15; // 15% commission rate
    const netEarnings = totalRevenue - totalCommissions;
    const totalBookings = bookings.length;

    const metrics = {
      overallEarnings: totalRevenue,
      netEarnings,
      totalBookings
    };

    // Chart data for earnings statistics - group by month
    const monthlyEarnings = {};
    completedBookings.forEach(booking => {
      if (booking.createdAt) {
        const date = new Date(booking.createdAt);
        const monthKey = date.toISOString().substring(0, 7); // YYYY-MM format
        const amount = parseFloat(booking.finalPrice || booking.estimatedPrice || booking.totalAmount || '0');
        monthlyEarnings[monthKey] = (monthlyEarnings[monthKey] || 0) + amount;
      }
    });

    const chartData = Object.entries(monthlyEarnings)
      .map(([month, earnings]) => ({ month, earnings }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // Last 6 months

    // Yearly summary - group by year
    const yearlyStats = {};
    bookings.forEach(booking => {
      if (booking.createdAt) {
        const year = new Date(booking.createdAt).getFullYear();
        if (!yearlyStats[year]) {
          yearlyStats[year] = { bookings: 0, revenue: 0 };
        }
        yearlyStats[year].bookings++;
        const amount = parseFloat(booking.finalPrice || booking.estimatedPrice || booking.totalAmount || '0');
        yearlyStats[year].revenue += amount;
      }
    });

    const yearlyData = Object.entries(yearlyStats).map(([year, stats]) => ({
      year: parseInt(year),
      bookings: stats.bookings,
      expenses: 0, // Calculate if expense data is available
      totalRevenue: stats.revenue,
      netIncome: stats.revenue * 0.85 // Assuming 15% commission rate
    })).sort((a, b) => b.year - a.year);

    res.json({ metrics, chartData, yearlyData });
  } catch (error) {
    console.error('Erro ao buscar relatórios de negócios:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/admin/reports/bookings - Relatórios de reservas
router.get('/reports/bookings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, zone, category } = req.query;
    
    // Get real data from bookings
    const bookings = await storage.getAllBookingsForAdmin();
    
    // Calculate real metrics
    const totalReservations = bookings.length;
    const totalAmount = bookings.reduce((sum, booking) => {
      return sum + parseFloat(booking.finalPrice || booking.estimatedPrice || booking.totalAmount || '0');
    }, 0);

    const metrics = {
      totalReservations,
      totalAmount
    };

    // Chart data for reservations statistics - group by month
    const monthlyReservations = {};
    bookings.forEach(booking => {
      if (booking.createdAt) {
        const date = new Date(booking.createdAt);
        const monthKey = date.toLocaleDateString('pt-BR', { month: 'short' });
        monthlyReservations[monthKey] = (monthlyReservations[monthKey] || 0) + 1;
      }
    });

    const chartData = Object.entries(monthlyReservations)
      .map(([month, reservations]) => ({ month, reservations }))
      .slice(-6); // Last 6 months

    // Build booking details with real data
    const bookingsList = bookings.slice(0, 10).map(booking => {
      return {
        id: `VXV${booking.id}`,
        clientInfo: booking.client?.name || 'Cliente desconhecido',
        providerInfo: booking.provider?.user?.name || 'Provedor desconhecido',
        serviceValue: parseFloat(booking.estimatedPrice || '0'),
        serviceAmount: parseFloat(booking.finalPrice || booking.estimatedPrice || booking.totalAmount || '0'),
        depositValue: 0.00, // Implement if deposit system exists
        totalAmount: parseFloat(booking.finalPrice || booking.estimatedPrice || booking.totalAmount || '0'),
        paymentStatus: booking.status === 'completed' ? 'Confirmado' : 
                      booking.status === 'pending' ? 'Pendente' : 'Cancelado',
        action: 'Check'
      };
    });

    res.json({ metrics, chartData, bookings: bookingsList });
  } catch (error) {
    console.error('Erro ao buscar relatórios de reservas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/admin/reports/providers - Relatórios dos provedores
router.get('/reports/providers', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, zone, category } = req.query;
    
    // Get real data
    const allProviders = await storage.getAllProviders();
    const bookings = await storage.getAllBookingsForAdmin();
    const services = await storage.getAllProviderServices();
    
    // Build provider statistics with real data
    const providerStats = allProviders.map(provider => {
      const providerBookings = bookings.filter(b => b.providerId === provider.id);
      const providerServices = services.filter(s => s.providerId === provider.id);
      
      // Calculate metrics
      const totalReservations = providerBookings.length;
      const completedReservations = providerBookings.filter(b => b.status === 'completed').length;
      const cancelledReservations = providerBookings.filter(b => b.status === 'cancelled').length;
      const totalEarnings = providerBookings
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + parseFloat(b.finalPrice || b.estimatedPrice || b.totalAmount || '0'), 0);
      
      const completionRate = totalReservations > 0 
        ? ((completedReservations / totalReservations) * 100).toFixed(1) + '%'
        : '0%';
      
      return {
        id: provider.id,
        name: provider.user?.name || 'Nome não disponível',
        subscriptionsNumber: 0, // Implement if subscription system exists
        servicesNumber: providerServices.length,
        totalReservations,
        totalEarnings,
        cancellationData: cancelledReservations * 50, // Simulated cancellation cost
        completionRate
      };
    }).filter(provider => provider.name !== 'Nome não disponível'); // Filter out providers without user data

    res.json({ providers: providerStats });
  } catch (error) {
    console.error('Erro ao buscar relatórios de provedores:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Page Settings Routes
/**
 * @swagger
 * /api/admin/page-settings:
 *   get:
 *     tags: [Admin - Configurações]
 *     summary: Obter configurações da página
 *     description: Retorna as configurações gerais da página/site
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configurações obtidas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 siteName:
 *                   type: string
 *                   example: 'QServiços'
 *                 siteDesc:
 *                   type: string
 *                   example: 'Plataforma de serviços'
 *                 logo:
 *                   type: string
 *                   example: '/uploads/logo.png'
 *                 primaryColor:
 *                   type: string
 *                   example: '#007bff'
 *                 secondaryColor:
 *                   type: string
 *                   example: '#6c757d'
 *       401:
 *         description: Token não fornecido
 *       403:
 *         description: Acesso negado - Admin requerido
 */
router.get('/page-settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const settings = await storage.getPageSettings();
    res.json(settings);
  } catch (error) {
    console.error('Erro ao buscar configurações da página:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * @swagger
 * /api/admin/page-settings:
 *   put:
 *     tags: [Admin - Configurações]
 *     summary: Atualizar configurações da página
 *     description: Atualiza as configurações gerais da página/site
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               siteName:
 *                 type: string
 *                 example: 'QServiços'
 *               siteDesc:
 *                 type: string
 *                 example: 'Plataforma de serviços'
 *               logo:
 *                 type: string
 *                 example: '/uploads/logo.png'
 *               primaryColor:
 *                 type: string
 *                 example: '#007bff'
 *               secondaryColor:
 *                 type: string
 *                 example: '#6c757d'
 *     responses:
 *       200:
 *         description: Configurações atualizadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Configurações atualizadas com sucesso'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Token não fornecido
 *       403:
 *         description: Acesso negado - Admin requerido
 */
router.put('/page-settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const settings = req.body;
    console.log('Salvando configurações da página:', settings);
    
    const updatedSettings = await storage.updatePageSettings(settings);
    
    res.json({ 
      success: true, 
      message: 'Configurações da página salvas com sucesso',
      data: updatedSettings 
    });
  } catch (error) {
    console.error('Erro ao salvar configurações da página:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Upload de logo
/**
 * @swagger
 * /api/admin/upload-logo:
 *   post:
 *     tags: [Admin - Upload]
 *     summary: Upload de logo
 *     description: Faz upload do logo da empresa/site
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               logo:
 *                 type: string
 *                 format: binary
 *                 description: Arquivo de imagem do logo (PNG, JPG, etc.)
 *     responses:
 *       200:
 *         description: Logo enviado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Logo enviado com sucesso'
 *                 filename:
 *                   type: string
 *                   example: 'logo-1234567890-123456789.png'
 *                 path:
 *                   type: string
 *                   example: '/uploads/logos/logo-1234567890-123456789.png'
 *       400:
 *         description: Arquivo inválido
 *       401:
 *         description: Token não fornecido
 *       403:
 *         description: Acesso negado - Admin requerido
 */
router.post('/upload-logo', authenticateToken, requireAdmin, logoUpload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Nenhum arquivo enviado' });
    }

    const logoUrl = `/uploads/logos/${req.file.filename}`;
    
    res.json({ 
      success: true, 
      message: 'Logo enviado com sucesso',
      logoUrl: logoUrl
    });
  } catch (error) {
    console.error('Erro ao enviar logo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Social Settings Routes
router.get('/social-settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const settings = await storage.getSocialSettings();
    res.json(settings);
  } catch (error) {
    console.error('Erro ao buscar configurações sociais:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.put('/social-settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const settings = req.body;
    console.log('Salvando configurações sociais:', settings);
    
    const updatedSettings = await storage.updateSocialSettings(settings);
    
    res.json({ 
      success: true, 
      message: 'Configurações sociais salvas com sucesso',
      data: updatedSettings 
    });
  } catch (error) {
    console.error('Erro ao salvar configurações sociais:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Notification Settings Routes
router.get('/notification-settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Return default values for notification settings
    const defaultSettings = {
      emailNewBooking: true,
      emailBookingCancelled: true,
      emailPaymentReceived: true,
      emailNewUser: true,
      emailNewProvider: true,
      smsNewBooking: false,
      smsBookingReminder: true,
      smsPaymentConfirmed: false,
      pushNewBooking: true,
      pushBookingUpdates: true,
      pushPaymentAlerts: true,
      pushSystemNotifications: false,
    };
    
    res.json(defaultSettings);
  } catch (error) {
    console.error('Erro ao buscar configurações de notificação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.put('/notification-settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const settings = req.body;
    console.log('Salvando configurações de notificação:', settings);
    
    // In a real implementation, you would save to database
    // For now, we just simulate success
    
    res.json({ success: true, message: 'Configurações de notificação salvas com sucesso' });
  } catch (error) {
    console.error('Erro ao salvar configurações de notificação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Test notification endpoint
router.post('/test-notification', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { type } = req.body;
    
    // Here you would implement actual notification sending logic
    // For now, we just simulate success
    console.log(`Teste de notificação do tipo: ${type}`);
    
    res.json({ success: true, message: `Notificação de teste "${type}" enviada com sucesso` });
  } catch (error) {
    console.error('Erro ao enviar notificação de teste:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * @swagger
 * /api/admin/media:
 *   get:
 *     tags: [Admin - Mídia]
 *     summary: Listar arquivos de mídia
 *     description: Lista todos os arquivos de mídia disponíveis no sistema
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de arquivos de mídia
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "services_image1.jpg"
 *                   url:
 *                     type: string
 *                     example: "/uploads/services/image1.jpg"
 *                   name:
 *                     type: string
 *                     example: "image1.jpg"
 *                   size:
 *                     type: number
 *                     example: 1024000
 *                   type:
 *                     type: string
 *                     example: "image/jpeg"
 *                   category:
 *                     type: string
 *                     example: "service"
 *       401:
 *         description: Token não fornecido
 *       403:
 *         description: Acesso negado - Admin requerido
 */
router.get('/media', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    const uploadsDir = path.default.join(process.cwd(), 'uploads');
    const categories = ['banners', 'services', 'categories', 'providers', 'avatars', 'general', 'portfolio', 'logos', 'documents'];
    const mediaFiles: any[] = [];
    
    for (const category of categories) {
      const categoryDir = path.default.join(uploadsDir, category);
      if (fs.default.existsSync(categoryDir)) {
        const files = fs.default.readdirSync(categoryDir);
        for (const file of files) {
          const filePath = path.default.join(categoryDir, file);
          const stats = fs.default.statSync(filePath);
          
          if (stats.isFile() && /\.(jpg|jpeg|png|gif|webp)$/i.test(file)) {
            mediaFiles.push({
              id: `${category}_${file}`,
              url: `/uploads/${category}/${file}`,
              name: file,
              size: stats.size,
              type: `image/${path.default.extname(file).slice(1).toLowerCase()}`,
              category: category === 'categories' ? 'category' : 
                       category === 'banners' ? 'banner' :
                       category === 'services' ? 'service' :
                       category === 'providers' ? 'provider' :
                       category === 'avatars' ? 'avatar' :
                       category === 'general' ? 'general' : 
                       category === 'portfolio' ? 'portfolio' :
                       category === 'logos' ? 'logos' : 'documents',
              createdAt: stats.birthtime
            });
          }
        }
      }
    }
    
    // Sort by creation date (newest first)
    mediaFiles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    res.json(mediaFiles);
  } catch (error) {
    console.error('Erro ao buscar arquivos de mídia:', error);
    res.status(500).json({ message: "Erro ao buscar arquivos de mídia", error: error instanceof Error ? error.message : "Erro desconhecido" });
  }
});

export default router;