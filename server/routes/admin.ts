import express from 'express';
import jwt from 'jsonwebtoken';
import { storage } from '../storage';
import { eq, and, gte, sql, desc } from 'drizzle-orm';
import { users, providers, serviceRequests, serviceCategories, providerServices } from '../../shared/schema';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

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
router.get('/metrics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const cityFilter = req.query.city as string;
    
    // Buscar métricas gerais
    const [totalClientsResult] = await storage.db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.userType, 'client'));

    const [totalProvidersResult] = await storage.db
      .select({ count: sql<number>`count(*)` })
      .from(providers);

    const [pendingProvidersResult] = await storage.db
      .select({ count: sql<number>`count(*)` })
      .from(providers)
      .where(eq(providers.status, 'pending'));

    const [approvedProvidersResult] = await storage.db
      .select({ count: sql<number>`count(*)` })
      .from(providers)
      .where(eq(providers.status, 'approved'));

    const [totalServicesResult] = await storage.db
      .select({ count: sql<number>`count(*)` })
      .from(serviceRequests);

    // Reservas do mês atual
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    let bookingsQuery = storage.db
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
    const citiesResult = await storage.db
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
router.get('/cities', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const cities = await storage.db
      .selectDistinct({
        city: providers.city,
        state: providers.state,
      })
      .from(providers)
      .where(sql`${providers.city} IS NOT NULL AND ${providers.state} IS NOT NULL`)
      .orderBy(providers.city);

    res.json(cities);
  } catch (error) {
    console.error('Erro ao buscar cidades:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/admin/providers/pending - Listar prestadores pendentes
router.get('/providers/pending', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const pendingProviders = await storage.db
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

    await storage.db
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

    await storage.db
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
router.get('/services', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const services = await storage.db
      .select({
        id: providerServices.id,
        title: providerServices.title,
        description: providerServices.description,
        categoryId: providerServices.categoryId,
        providerId: providerServices.providerId,
        basePrice: providerServices.basePrice,
        minPrice: providerServices.minPrice,
        maxPrice: providerServices.maxPrice,
        pricingType: providerServices.pricingType,
        serviceArea: providerServices.serviceArea,
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

// PUT /api/admin/services/:id/status - Atualizar status do serviço
router.put('/services/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    await storage.db
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
router.delete('/services/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await storage.db
      .delete(providerServices)
      .where(eq(providerServices.id, parseInt(id)));

    res.json({ message: 'Serviço excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir serviço:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;