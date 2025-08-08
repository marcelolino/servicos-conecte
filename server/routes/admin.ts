import express from 'express';
import jwt from 'jsonwebtoken';
import { storage } from '../storage';
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';
import { users, providers, serviceRequests, serviceCategories, providerServices, payments } from '../../shared/schema';

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

// REPORTS ENDPOINTS

// GET /api/admin/reports/transactions - Relatórios de transações
router.get('/reports/transactions', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Simulated transaction data based on service requests and payments
    const transactions = [
      {
        id: 'TXN001',
        amount: 25688.00,
        status: 'completed',
        paymentMethod: 'digital',
        transactionId: 'DCMR6604-64C7-4CC7-976CC8F7GH',
        date: '02-ago-2023',
        provider: 'Edilson Guardado Trading',
        serviceType: 'Limpeza',
        location: 'São Paulo-SP'
      },
      {
        id: 'TXN002', 
        amount: 24178.00,
        status: 'completed',
        paymentMethod: 'pix',
        transactionId: 'PQSM9234-34B3-4CC4-587EERET4R',
        date: '02-ago-2023',
        provider: 'Edilson Guardado Trading',
        serviceType: 'Jardinagem',
        location: 'São Paulo-SP'
      }
    ];

    const metrics = {
      totalRevenue: 25688.00,
      commissionRevenue: 24178.00,
      depositsRequired: 210.00,
      lostGain: 7536815.14,
      completedGain: 17547.89
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
    const metrics = {
      overallEarnings: 23988.00,
      netEarnings: 25688.00,
      totalBookings: 1700.00
    };

    // Chart data for earnings statistics
    const chartData = [
      { month: '2022', earnings: 4500 },
      { month: '2023', earnings: 4200 },
      { month: '2024', earnings: 4600 }
    ];

    // Yearly summary
    const yearlyData = [
      { year: 2023, bookings: 102756, expenses: 0, totalRevenue: 10756.00, netIncome: 10756.00 },
      { year: 2024, bookings: 82456, expenses: 0, totalRevenue: 8245.00, netIncome: 8245.00 }
    ];

    res.json({ metrics, chartData, yearlyData });
  } catch (error) {
    console.error('Erro ao buscar relatórios de negócios:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/admin/reports/bookings - Relatórios de reservas
router.get('/reports/bookings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const metrics = {
      totalReservations: 78,
      totalAmount: 7946409.33
    };

    // Chart data for reservations statistics
    const chartData = [
      { month: 'Jan', reservations: 45 },
      { month: 'Feb', reservations: 35 },
      { month: 'Mar', reservations: 55 },
      { month: 'Apr', reservations: 25 },
      { month: 'May', reservations: 40 },
      { month: 'Jun', reservations: 60 }
    ];

    // Booking details
    const bookings = [
      {
        id: 'VXV30',
        clientInfo: 'Edilson Guardado Trading',
        providerInfo: 'Edilson Guardado Trading',
        serviceValue: 1440.00,
        serviceAmount: 1500.00,
        depositValue: 0.00,
        totalAmount: 1500.00,
        paymentStatus: 'Confirmado',
        action: 'Check'
      },
      {
        id: 'VXV34',
        clientInfo: 'Arilda',
        providerInfo: 'Edilson Guardado Trading',
        serviceValue: 300.00,
        serviceAmount: 300.00, 
        depositValue: 0.00,
        totalAmount: 300.00,
        paymentStatus: 'Confirmado',
        action: 'Check'
      }
    ];

    res.json({ metrics, chartData, bookings });
  } catch (error) {
    console.error('Erro ao buscar relatórios de reservas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/admin/reports/providers - Relatórios dos provedores
router.get('/reports/providers', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const providers = [
      {
        id: 1,
        name: 'Ana Maria',
        subscriptionsNumber: 0,
        servicesNumber: 0,
        totalReservations: 0,
        totalEarnings: 0.00,
        cancellationData: 0.00,
        completionRate: '0%'
      },
      {
        id: 2,
        name: 'Eliset e Parceiros LCC',
        subscriptionsNumber: 0,
        servicesNumber: 1,
        totalReservations: 0,
        totalEarnings: 0.00,
        cancellationData: 0.00,
        completionRate: '0%'
      },
      {
        id: 3,
        name: 'Edilson Guardado Trading',
        subscriptionsNumber: 20,
        servicesNumber: 3,
        totalReservations: 84,
        totalEarnings: 15754.00,
        cancellationData: 200.00,
        completionRate: '97.6%'
      },
      {
        id: 4,
        name: 'Margarit B',
        subscriptionsNumber: 12,
        servicesNumber: 6,
        totalReservations: 4,
        totalEarnings: 2124.00,
        cancellationData: 0.00,
        completionRate: '100%'
      },
      {
        id: 5,
        name: 'Wright e Shannon LLC',
        subscriptionsNumber: 0,
        servicesNumber: 5,
        totalReservations: 0,
        totalEarnings: 0.00,
        cancellationData: 0.00,
        completionRate: '0%'
      },
      {
        id: 6,
        name: 'Cruz e Briggs LLC',
        subscriptionsNumber: 0,
        servicesNumber: 5,
        totalReservations: 0,
        totalEarnings: 0.00,
        cancellationData: 0.00,
        completionRate: '0%'
      },
      {
        id: 7,
        name: 'Construção de chova a Jardim',
        subscriptionsNumber: 30,
        servicesNumber: 5,
        totalReservations: 4,
        totalEarnings: 0.00,
        cancellationData: 0.00,
        completionRate: '75.0%'
      }
    ];

    res.json({ providers });
  } catch (error) {
    console.error('Erro ao buscar relatórios de provedores:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;