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
    // Get providers and extract unique cities
    const allProviders = await storage.getProviders();
    const citySet = new Set();
    
    allProviders.forEach(provider => {
      if (provider.city && provider.state) {
        citySet.add(JSON.stringify({ city: provider.city, state: provider.state }));
      }
    });
    
    const cities = Array.from(citySet)
      .map(cityStr => JSON.parse(cityStr))
      .sort((a, b) => a.city.localeCompare(b.city));

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
    const { startDate, endDate, zone, category } = req.query;
    
    // Get all payments with related service requests
    const payments = await storage.getPayments();
    const serviceRequests = await storage.getServiceRequests();
    const providers = await storage.getProviders();
    const users = await storage.getUsers();
    
    // Create a map for quick lookups
    const serviceRequestMap = new Map(serviceRequests.map(sr => [sr.id, sr]));
    const providerMap = new Map(providers.map(p => [p.id, p]));
    const userMap = new Map(users.map(u => [u.id, u]));
    
    // Build transaction data with related information
    const transactions = payments.map((payment, index) => {
      const serviceRequest = serviceRequestMap.get(payment.serviceRequestId);
      const provider = serviceRequest ? providerMap.get(serviceRequest.providerId) : null;
      const providerUser = provider ? userMap.get(provider.userId) : null;
      
      return {
        id: `TXN${String(index + 1).padStart(3, '0')}`,
        amount: parseFloat(payment.amount || '0'),
        status: payment.status || 'pending',
        paymentMethod: payment.paymentMethod || 'digital',
        transactionId: payment.transactionId || `TX-${payment.id}`,
        date: payment.createdAt ? new Date(payment.createdAt).toLocaleDateString('pt-BR') : 'N/A',
        provider: providerUser ? providerUser.name : 'N/A',
        serviceType: serviceRequest ? 'Serviço' : 'N/A',
        location: serviceRequest ? `${serviceRequest.city || 'N/A'}, ${serviceRequest.state || 'N/A'}` : 'N/A'
      };
    });

    // Calculate real metrics
    const completedPayments = payments.filter(p => p.status === 'completed');
    const totalRevenue = completedPayments.reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0);
    const totalCommissions = completedPayments.reduce((sum, p) => sum + parseFloat(p.commissionAmount || '0'), 0);
    const pendingPayments = payments.filter(p => p.status === 'pending');
    const depositsRequired = pendingPayments.reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0);

    const metrics = {
      totalRevenue,
      commissionRevenue: totalCommissions,
      depositsRequired,
      lostGain: 0, // Calculate based on cancelled transactions
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
    
    // Get real data
    const payments = await storage.getPayments();
    const serviceRequests = await storage.getServiceRequests();
    
    // Calculate real business metrics
    const completedPayments = payments.filter(p => p.status === 'completed');
    const totalRevenue = completedPayments.reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0);
    const totalCommissions = completedPayments.reduce((sum, p) => sum + parseFloat(p.commissionAmount || '0'), 0);
    const netEarnings = totalRevenue - totalCommissions;
    const totalBookings = serviceRequests.length;

    const metrics = {
      overallEarnings: totalRevenue,
      netEarnings,
      totalBookings
    };

    // Chart data for earnings statistics - group by month
    const monthlyEarnings = {};
    completedPayments.forEach(payment => {
      if (payment.createdAt) {
        const date = new Date(payment.createdAt);
        const monthKey = date.toISOString().substring(0, 7); // YYYY-MM format
        const amount = parseFloat(payment.amount || '0');
        monthlyEarnings[monthKey] = (monthlyEarnings[monthKey] || 0) + amount;
      }
    });

    const chartData = Object.entries(monthlyEarnings)
      .map(([month, earnings]) => ({ month, earnings }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // Last 6 months

    // Yearly summary - group by year
    const yearlyStats = {};
    serviceRequests.forEach(request => {
      if (request.createdAt) {
        const year = new Date(request.createdAt).getFullYear();
        if (!yearlyStats[year]) {
          yearlyStats[year] = { bookings: 0, revenue: 0 };
        }
        yearlyStats[year].bookings++;
        if (request.finalPrice) {
          yearlyStats[year].revenue += parseFloat(request.finalPrice);
        }
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
    
    // Get real data
    const serviceRequests = await storage.getServiceRequests();
    const providers = await storage.getProviders();
    const users = await storage.getUsers();
    
    // Create maps for quick lookups
    const providerMap = new Map(providers.map(p => [p.id, p]));
    const userMap = new Map(users.map(u => [u.id, u]));
    
    // Calculate real metrics
    const totalReservations = serviceRequests.length;
    const totalAmount = serviceRequests.reduce((sum, sr) => {
      return sum + parseFloat(sr.finalPrice || sr.basePrice || '0');
    }, 0);

    const metrics = {
      totalReservations,
      totalAmount
    };

    // Chart data for reservations statistics - group by month
    const monthlyReservations = {};
    serviceRequests.forEach(request => {
      if (request.createdAt) {
        const date = new Date(request.createdAt);
        const monthKey = date.toLocaleDateString('pt-BR', { month: 'short' });
        monthlyReservations[monthKey] = (monthlyReservations[monthKey] || 0) + 1;
      }
    });

    const chartData = Object.entries(monthlyReservations)
      .map(([month, reservations]) => ({ month, reservations }))
      .slice(-6); // Last 6 months

    // Build booking details with real data
    const bookings = serviceRequests.slice(0, 10).map(request => {
      const provider = providerMap.get(request.providerId);
      const providerUser = provider ? userMap.get(provider.userId) : null;
      const clientUser = userMap.get(request.clientId);
      
      return {
        id: `VXV${request.id}`,
        clientInfo: clientUser ? clientUser.name : 'Cliente desconhecido',
        providerInfo: providerUser ? providerUser.name : 'Provedor desconhecido',
        serviceValue: parseFloat(request.basePrice || '0'),
        serviceAmount: parseFloat(request.finalPrice || request.basePrice || '0'),
        depositValue: 0.00, // Implement if deposit system exists
        totalAmount: parseFloat(request.finalPrice || request.basePrice || '0'),
        paymentStatus: request.status === 'completed' ? 'Confirmado' : 
                      request.status === 'pending' ? 'Pendente' : 'Cancelado',
        action: 'Check'
      };
    });

    res.json({ metrics, chartData, bookings });
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
    const providers = await storage.getProviders();
    const users = await storage.getUsers();
    const serviceRequests = await storage.getServiceRequests();
    const services = await storage.getServices();
    
    // Create maps for quick lookups
    const userMap = new Map(users.map(u => [u.id, u]));
    
    // Build provider statistics with real data
    const providerStats = providers.map(provider => {
      const user = userMap.get(provider.userId);
      const providerRequests = serviceRequests.filter(sr => sr.providerId === provider.id);
      const providerServices = services.filter(s => s.providerId === provider.id);
      
      // Calculate metrics
      const totalReservations = providerRequests.length;
      const completedReservations = providerRequests.filter(sr => sr.status === 'completed').length;
      const cancelledReservations = providerRequests.filter(sr => sr.status === 'cancelled').length;
      const totalEarnings = providerRequests
        .filter(sr => sr.status === 'completed')
        .reduce((sum, sr) => sum + parseFloat(sr.finalPrice || sr.basePrice || '0'), 0);
      
      const completionRate = totalReservations > 0 
        ? ((completedReservations / totalReservations) * 100).toFixed(1) + '%'
        : '0%';
      
      return {
        id: provider.id,
        name: user ? user.name : 'Nome não disponível',
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

export default router;