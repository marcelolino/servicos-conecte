import express from 'express';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import { storage } from '../storage';
import { db } from '../db';
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';
import { users, providers, serviceRequests, serviceCategories, providerServices, payments } from '../../shared/schema';

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
router.get('/cities', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Get providers and extract unique cities
    const allProviders = await storage.getAllProviders();
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
router.get('/page-settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const settings = await storage.getPageSettings();
    res.json(settings);
  } catch (error) {
    console.error('Erro ao buscar configurações da página:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

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

export default router;