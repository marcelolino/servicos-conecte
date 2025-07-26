import {
  users,
  providers,
  serviceCategories,
  providerServices,
  serviceRequests,
  reviews,
  notifications,
  employees,
  serviceZones,
  promotionalBanners,
  payments,
  coupons,
  serviceAssignments,
  systemSettings,
  fileUploads,
  userUploadStats,
  orders,
  orderItems,
  type User,
  type InsertUser,
  type Provider,
  type InsertProvider,
  type ServiceCategory,
  type InsertServiceCategory,
  type ProviderService,
  type InsertProviderService,
  type ServiceRequest,
  type InsertServiceRequest,
  type Review,
  type InsertReview,
  type Notification,
  type InsertNotification,
  type Employee,
  type InsertEmployee,
  type ServiceZone,
  type InsertServiceZone,
  type PromotionalBanner,
  type InsertPromotionalBanner,
  type Payment as PaymentRecord,
  type InsertPayment,
  type Coupon,
  type InsertCoupon,
  type ServiceAssignment,
  type InsertServiceAssignment,
  type SystemSetting,
  type InsertSystemSetting,
  type FileUpload,
  type InsertFileUpload,
  type UserUploadStats,
  type InsertUserUploadStats,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  providerEarnings,
  withdrawalRequests,
  providerBankAccounts,
  providerPixKeys,
  type ProviderEarning,
  type InsertProviderEarning,
  type WithdrawalRequest,
  type InsertWithdrawalRequest,
  type ProviderBankAccount,
  type InsertProviderBankAccount,
  type ProviderPixKey,
  type InsertProviderPixKey,
  chatConversations,
  chatMessages,
  type ChatConversation,
  type InsertChatConversation,
  type ChatMessage,
  type InsertChatMessage,
  paymentGatewayConfigs,
  type PaymentGatewayConfig,
  type InsertPaymentGatewayConfig,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, asc, sql, isNull, count, inArray } from "drizzle-orm";
import bcrypt from "bcrypt";
import { MercadoPagoConfig, Payment } from 'mercadopago';
import QRCode from 'qrcode';

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: number): Promise<void>;
  getAllUsers(): Promise<User[]>;
  
  // Provider management
  getProvider(id: number): Promise<Provider | undefined>;
  getProviderByUserId(userId: number): Promise<Provider | undefined>;
  createProvider(provider: InsertProvider): Promise<Provider>;
  updateProvider(id: number, provider: Partial<InsertProvider>): Promise<Provider>;
  getProvidersByCategory(categoryId: number, latitude?: number, longitude?: number, radius?: number): Promise<(Provider & { user: User })[]>;
  getAllProviders(): Promise<(Provider & { user: User })[]>;
  
  // Service categories
  getServiceCategories(): Promise<ServiceCategory[]>;
  getServiceCategory(id: number): Promise<ServiceCategory | undefined>;
  createServiceCategory(category: InsertServiceCategory): Promise<ServiceCategory>;
  updateServiceCategory(id: number, category: Partial<InsertServiceCategory>): Promise<ServiceCategory>;
  
  // Provider services
  getProviderServices(providerId: number): Promise<(ProviderService & { category: ServiceCategory })[]>;
  createProviderService(service: InsertProviderService): Promise<ProviderService>;
  updateProviderService(id: number, service: Partial<InsertProviderService>): Promise<ProviderService>;
  deleteProviderService(id: number): Promise<void>;
  
  // Service requests
  getServiceRequest(id: number): Promise<(ServiceRequest & { client: User; provider?: Provider; category: ServiceCategory }) | undefined>;
  getServiceRequestsByClient(clientId: number): Promise<(ServiceRequest & { provider?: Provider; category: ServiceCategory })[]>;
  getServiceRequestsByProvider(providerId: number): Promise<(ServiceRequest & { client: User; category: ServiceCategory })[]>;
  createServiceRequest(request: InsertServiceRequest): Promise<ServiceRequest>;
  updateServiceRequest(id: number, request: Partial<InsertServiceRequest>): Promise<ServiceRequest>;
  
  // Reviews
  getReviewsByProvider(providerId: number): Promise<(Review & { client: User; serviceRequest: ServiceRequest })[]>;
  createReview(review: InsertReview): Promise<Review>;
  
  // Notifications
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<void>;
  
  // Authentication
  validateUser(email: string, password: string): Promise<User | null>;
  
  // Admin service management
  getAllServicesForAdmin(): Promise<(ProviderService & { category: ServiceCategory; provider: Provider & { user: User } })[]>;
  getAllBookingsForAdmin(): Promise<(ServiceRequest & { client: User; provider?: Provider & { user: User }; category: ServiceCategory })[]>;

  // Statistics
  getProviderStats(providerId: number): Promise<{
    totalServices: number;
    totalEarnings: number;
    averageRating: number;
    totalReviews: number;
  }>;
  
  getClientStats(clientId: number): Promise<{
    totalServices: number;
    totalSpent: number;
    completedServices: number;
  }>;
  
  getAdminStats(): Promise<{
    totalUsers: number;
    totalProviders: number;
    totalServiceRequests: number;
    totalRevenue: number;
    pendingApprovals: number;
  }>;

  // Employee management
  getEmployeesByProvider(providerId: number): Promise<(Employee & { user: User })[]>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee>;
  deleteEmployee(id: number): Promise<void>;
  
  // Service zones
  getServiceZones(): Promise<ServiceZone[]>;
  createServiceZone(zone: InsertServiceZone): Promise<ServiceZone>;
  updateServiceZone(id: number, zone: Partial<InsertServiceZone>): Promise<ServiceZone>;
  deleteServiceZone(id: number): Promise<void>;
  
  // Promotional banners
  getPromotionalBanners(): Promise<(PromotionalBanner & { category?: ServiceCategory })[]>;
  createPromotionalBanner(banner: InsertPromotionalBanner): Promise<PromotionalBanner>;
  updatePromotionalBanner(id: number, banner: Partial<InsertPromotionalBanner>): Promise<PromotionalBanner>;
  deletePromotionalBanner(id: number): Promise<void>;
  incrementBannerClick(id: number): Promise<void>;
  
  // Payments
  getPaymentsByServiceRequest(serviceRequestId: number): Promise<PaymentRecord[]>;
  createPayment(payment: InsertPayment): Promise<PaymentRecord>;
  updatePayment(id: number, payment: Partial<InsertPayment>): Promise<PaymentRecord>;
  
  // Payment Gateway Configurations
  getPaymentGatewayConfigs(): Promise<PaymentGatewayConfig[]>;
  getPaymentGatewayConfig(gatewayName: string): Promise<PaymentGatewayConfig | undefined>;
  createPaymentGatewayConfig(config: InsertPaymentGatewayConfig): Promise<PaymentGatewayConfig>;
  updatePaymentGatewayConfig(id: number, config: Partial<InsertPaymentGatewayConfig>): Promise<PaymentGatewayConfig>;
  deletePaymentGatewayConfig(id: number): Promise<void>;
  getActivePaymentMethods(): Promise<PaymentGatewayConfig[]>;
  createPixPayment(data: { amount: number; description: string; payerEmail: string }): Promise<any>;
  
  // Coupons
  getCoupons(): Promise<Coupon[]>;
  getCouponByCode(code: string): Promise<Coupon | undefined>;
  createCoupon(coupon: InsertCoupon): Promise<Coupon>;
  updateCoupon(id: number, coupon: Partial<InsertCoupon>): Promise<Coupon>;
  deleteCoupon(id: number): Promise<void>;
  useCoupon(id: number): Promise<void>;
  
  // Service assignments
  getServiceAssignmentsByEmployee(employeeId: number): Promise<(ServiceAssignment & { serviceRequest: ServiceRequest & { client: User; category: ServiceCategory } })[]>;
  createServiceAssignment(assignment: InsertServiceAssignment): Promise<ServiceAssignment>;
  updateServiceAssignment(id: number, assignment: Partial<InsertServiceAssignment>): Promise<ServiceAssignment>;
  
  // System settings
  getSystemSettings(): Promise<SystemSetting[]>;
  getSystemSetting(key: string): Promise<SystemSetting | undefined>;
  createSystemSetting(setting: InsertSystemSetting): Promise<SystemSetting>;
  updateSystemSetting(key: string, value: string): Promise<SystemSetting>;

  // Orders and cart management
  getCartByClient(clientId: number): Promise<(Order & { items: (OrderItem & { providerService: ProviderService & { category: ServiceCategory; provider: Provider } })[] }) | undefined>;
  getOrderById(id: number): Promise<(Order & { items: (OrderItem & { providerService: ProviderService & { category: ServiceCategory; provider: Provider } })[]; client: User; provider?: Provider }) | undefined>;
  getOrdersByClient(clientId: number): Promise<(Order & { items: (OrderItem & { providerService: ProviderService & { category: ServiceCategory; provider: Provider } })[]; provider?: Provider })[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order>;
  addItemToCart(clientId: number, item: InsertOrderItem): Promise<OrderItem>;
  updateCartItem(itemId: number, quantity: number): Promise<OrderItem>;
  removeCartItem(itemId: number): Promise<void>;
  clearCart(clientId: number): Promise<void>;
  convertCartToOrder(clientId: number, orderData: Partial<InsertOrder>): Promise<Order>;

  // Provider earnings
  getProviderEarnings(providerId: number): Promise<ProviderEarning[]>;
  insertProviderEarning(earning: InsertProviderEarning): Promise<ProviderEarning>;
  createProviderEarning(serviceRequest: ServiceRequest): Promise<void>;
  getProviderAvailableBalance(providerId: number): Promise<number>;
  getAllEarnings(): Promise<(ProviderEarning & { provider: Provider & { user: User }; serviceRequest: ServiceRequest })[]>;

  // Withdrawal requests
  getWithdrawalRequests(providerId?: number): Promise<(WithdrawalRequest & { provider: Provider & { user: User } })[]>;
  createWithdrawalRequest(request: InsertWithdrawalRequest): Promise<WithdrawalRequest>;
  updateWithdrawalRequest(id: number, request: Partial<InsertWithdrawalRequest>): Promise<WithdrawalRequest>;
  processWithdrawalRequest(id: number, status: 'approved' | 'rejected', adminId: number, adminNotes?: string): Promise<WithdrawalRequest>;

  // Provider bank accounts
  getProviderBankAccounts(providerId: number): Promise<ProviderBankAccount[]>;
  createProviderBankAccount(account: InsertProviderBankAccount): Promise<ProviderBankAccount>;
  updateProviderBankAccount(id: number, account: Partial<InsertProviderBankAccount>): Promise<ProviderBankAccount>;
  deleteProviderBankAccount(id: number): Promise<void>;

  // Provider PIX keys
  getProviderPixKeys(providerId: number): Promise<ProviderPixKey[]>;
  createProviderPixKey(pixKey: InsertProviderPixKey): Promise<ProviderPixKey>;
  updateProviderPixKey(id: number, pixKey: Partial<InsertProviderPixKey>): Promise<ProviderPixKey>;
  deleteProviderPixKey(id: number): Promise<void>;

  // Chat conversations
  getChatConversationsByUser(userId: number): Promise<(ChatConversation & { participantOne: User; participantTwo: User; lastMessage?: ChatMessage })[]>;
  getChatConversation(id: number): Promise<(ChatConversation & { participantOne: User; participantTwo: User; messages: (ChatMessage & { sender: User })[] }) | undefined>;
  findOrCreateConversation(participantOneId: number, participantTwoId: number, serviceRequestId?: number): Promise<ChatConversation>;
  createChatConversation(conversation: InsertChatConversation): Promise<ChatConversation>;
  updateChatConversation(id: number, conversation: Partial<InsertChatConversation>): Promise<ChatConversation>;

  // Chat messages
  getChatMessages(conversationId: number): Promise<(ChatMessage & { sender: User })[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  markMessageAsRead(messageId: number): Promise<ChatMessage>;
  getUnreadMessageCount(userId: number): Promise<number>;
  canUsersChat(userOneId: number, userTwoId: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const [newUser] = await db
      .insert(users)
      .values({ ...user, password: hashedPassword })
      .returning();
    return newUser;
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User> {
    const updates = { ...user };
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }
    const [updatedUser] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getProvider(id: number): Promise<Provider | undefined> {
    const [provider] = await db.select().from(providers).where(eq(providers.id, id));
    return provider || undefined;
  }

  async getProviderByUserId(userId: number): Promise<Provider | undefined> {
    const [provider] = await db.select().from(providers).where(eq(providers.userId, userId));
    return provider || undefined;
  }

  async createProvider(provider: InsertProvider): Promise<Provider> {
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7); // 7 days trial
    
    const [newProvider] = await db
      .insert(providers)
      .values({ ...provider, trialEndsAt })
      .returning();
    return newProvider;
  }

  async updateProvider(id: number, provider: Partial<InsertProvider>): Promise<Provider> {
    const [updatedProvider] = await db
      .update(providers)
      .set({ ...provider, updatedAt: new Date() })
      .where(eq(providers.id, id))
      .returning();
    return updatedProvider;
  }

  async getProvidersByCategory(categoryId: number, latitude?: number, longitude?: number, radius?: number): Promise<(Provider & { user: User })[]> {
    let query = db
      .select({
        id: providers.id,
        userId: providers.userId,
        status: providers.status,
        serviceRadius: providers.serviceRadius,
        basePrice: providers.basePrice,
        description: providers.description,
        experience: providers.experience,
        documents: providers.documents,
        rating: providers.rating,
        totalReviews: providers.totalReviews,
        totalServices: providers.totalServices,
        isTrialActive: providers.isTrialActive,
        trialEndsAt: providers.trialEndsAt,
        createdAt: providers.createdAt,
        updatedAt: providers.updatedAt,
        user: users,
      })
      .from(providers)
      .innerJoin(users, eq(providers.userId, users.id))
      .innerJoin(providerServices, eq(providers.id, providerServices.providerId))
      .where(
        and(
          eq(providerServices.categoryId, categoryId),
          eq(providers.status, "approved"),
          eq(providerServices.isActive, true)
        )
      );

    // Add distance filter if coordinates provided
    if (latitude && longitude && radius) {
      const distanceFilter = sql`(
        6371 * acos(
          cos(radians(${latitude})) * 
          cos(radians(${users.latitude})) * 
          cos(radians(${users.longitude}) - radians(${longitude})) + 
          sin(radians(${latitude})) * 
          sin(radians(${users.latitude}))
        )
      ) <= ${radius}`;
      
      const filteredQuery = query.where(distanceFilter);
      return await filteredQuery.orderBy(desc(providers.rating));
    }

    return await query.orderBy(desc(providers.rating));
  }

  async getAllProviders(): Promise<(Provider & { user: User })[]> {
    return await db
      .select({
        id: providers.id,
        userId: providers.userId,
        status: providers.status,
        serviceRadius: providers.serviceRadius,
        basePrice: providers.basePrice,
        description: providers.description,
        experience: providers.experience,
        documents: providers.documents,
        rating: providers.rating,
        totalReviews: providers.totalReviews,
        totalServices: providers.totalServices,
        isTrialActive: providers.isTrialActive,
        trialEndsAt: providers.trialEndsAt,
        createdAt: providers.createdAt,
        updatedAt: providers.updatedAt,
        user: users,
      })
      .from(providers)
      .innerJoin(users, eq(providers.userId, users.id))
      .orderBy(desc(providers.createdAt));
  }

  async getServiceCategories(): Promise<ServiceCategory[]> {
    return await db.select().from(serviceCategories).where(eq(serviceCategories.isActive, true));
  }

  async getServiceCategory(id: number): Promise<ServiceCategory | undefined> {
    const [category] = await db.select().from(serviceCategories).where(eq(serviceCategories.id, id));
    return category || undefined;
  }

  async createServiceCategory(category: InsertServiceCategory): Promise<ServiceCategory> {
    const [newCategory] = await db
      .insert(serviceCategories)
      .values(category)
      .returning();
    return newCategory;
  }

  async updateServiceCategory(id: number, category: Partial<InsertServiceCategory>): Promise<ServiceCategory> {
    const [updatedCategory] = await db
      .update(serviceCategories)
      .set(category)
      .where(eq(serviceCategories.id, id))
      .returning();
    return updatedCategory;
  }

  async getProviderServices(providerId: number): Promise<(ProviderService & { category: ServiceCategory })[]> {
    return await db
      .select({
        id: providerServices.id,
        providerId: providerServices.providerId,
        categoryId: providerServices.categoryId,
        price: providerServices.price,
        description: providerServices.description,
        isActive: providerServices.isActive,
        createdAt: providerServices.createdAt,
        category: serviceCategories,
      })
      .from(providerServices)
      .innerJoin(serviceCategories, eq(providerServices.categoryId, serviceCategories.id))
      .where(eq(providerServices.providerId, providerId));
  }

  async createProviderService(service: InsertProviderService): Promise<ProviderService> {
    const [newService] = await db
      .insert(providerServices)
      .values(service)
      .returning();
    return newService;
  }

  async updateProviderService(id: number, service: Partial<InsertProviderService>): Promise<ProviderService> {
    const [updatedService] = await db
      .update(providerServices)
      .set(service)
      .where(eq(providerServices.id, id))
      .returning();
    return updatedService;
  }

  async deleteProviderService(id: number): Promise<void> {
    await db.delete(providerServices).where(eq(providerServices.id, id));
  }

  async getAllProviderServices(): Promise<any[]> {
    try {
      // First, let's try a simpler query without the complex nesting
      const results = await db
        .select()
        .from(providerServices)
        .innerJoin(serviceCategories, eq(providerServices.categoryId, serviceCategories.id))
        .innerJoin(providers, eq(providerServices.providerId, providers.id))
        .innerJoin(users, eq(providers.userId, users.id))
        .where(eq(providerServices.isActive, true))
        .orderBy(asc(serviceCategories.name), asc(providerServices.name));

      // Transform the results to match the expected structure
      return results.map(row => ({
        ...row.provider_services,
        category: row.service_categories,
        provider: {
          ...row.providers,
          user: row.users
        }
      }));
    } catch (error) {
      console.error('Error in getAllProviderServices:', error);
      throw error;
    }
  }

  async getServiceRequest(id: number): Promise<(ServiceRequest & { client: User; provider?: Provider; category: ServiceCategory }) | undefined> {
    const [request] = await db
      .select({
        id: serviceRequests.id,
        clientId: serviceRequests.clientId,
        categoryId: serviceRequests.categoryId,
        providerId: serviceRequests.providerId,
        title: serviceRequests.title,
        description: serviceRequests.description,
        address: serviceRequests.address,
        cep: serviceRequests.cep,
        city: serviceRequests.city,
        state: serviceRequests.state,
        latitude: serviceRequests.latitude,
        longitude: serviceRequests.longitude,
        estimatedPrice: serviceRequests.estimatedPrice,
        finalPrice: serviceRequests.finalPrice,
        totalAmount: serviceRequests.totalAmount,
        paymentMethod: serviceRequests.paymentMethod,
        paymentStatus: serviceRequests.paymentStatus,
        status: serviceRequests.status,
        scheduledAt: serviceRequests.scheduledAt,
        completedAt: serviceRequests.completedAt,
        createdAt: serviceRequests.createdAt,
        updatedAt: serviceRequests.updatedAt,
        client: users,
        provider: providers,
        category: serviceCategories,
      })
      .from(serviceRequests)
      .innerJoin(users, eq(serviceRequests.clientId, users.id))
      .leftJoin(providers, eq(serviceRequests.providerId, providers.id))
      .innerJoin(serviceCategories, eq(serviceRequests.categoryId, serviceCategories.id))
      .where(eq(serviceRequests.id, id));

    return request ? { ...request, provider: request.provider || undefined } : undefined;
  }

  async getServiceRequestsByClient(clientId: number): Promise<(ServiceRequest & { provider?: Provider & { user: User }; category: ServiceCategory })[]> {
    const results = await db
      .select({
        id: serviceRequests.id,
        clientId: serviceRequests.clientId,
        categoryId: serviceRequests.categoryId,
        providerId: serviceRequests.providerId,
        title: serviceRequests.title,
        description: serviceRequests.description,
        address: serviceRequests.address,
        cep: serviceRequests.cep,
        city: serviceRequests.city,
        state: serviceRequests.state,
        latitude: serviceRequests.latitude,
        longitude: serviceRequests.longitude,
        estimatedPrice: serviceRequests.estimatedPrice,
        finalPrice: serviceRequests.finalPrice,
        totalAmount: serviceRequests.totalAmount,
        paymentMethod: serviceRequests.paymentMethod,
        paymentStatus: serviceRequests.paymentStatus,
        status: serviceRequests.status,
        scheduledAt: serviceRequests.scheduledAt,
        completedAt: serviceRequests.completedAt,
        createdAt: serviceRequests.createdAt,
        updatedAt: serviceRequests.updatedAt,
        provider: providers,
        providerUser: users,
        category: serviceCategories,
      })
      .from(serviceRequests)
      .leftJoin(providers, eq(serviceRequests.providerId, providers.id))
      .leftJoin(users, eq(providers.userId, users.id))
      .innerJoin(serviceCategories, eq(serviceRequests.categoryId, serviceCategories.id))
      .where(eq(serviceRequests.clientId, clientId))
      .orderBy(desc(serviceRequests.createdAt));

    return results.map(result => ({
      ...result,
      provider: result.provider ? { ...result.provider, user: result.providerUser } : undefined,
      providerUser: undefined, // Remove from final result
    }));
  }

  async getServiceRequestsByProvider(providerId: number): Promise<(ServiceRequest & { client: User; category: ServiceCategory })[]> {
    // Get provider's service categories
    const providerServicesList = await db
      .select({ categoryId: providerServices.categoryId })
      .from(providerServices)
      .where(eq(providerServices.providerId, providerId));
    
    const categoryIds = providerServicesList.map(ps => ps.categoryId);
    
    if (categoryIds.length === 0) {
      return [];
    }
    
    // Get all pending requests in provider's categories OR requests assigned to this provider
    return await db
      .select({
        id: serviceRequests.id,
        clientId: serviceRequests.clientId,
        categoryId: serviceRequests.categoryId,
        providerId: serviceRequests.providerId,
        title: serviceRequests.title,
        description: serviceRequests.description,
        address: serviceRequests.address,
        cep: serviceRequests.cep,
        city: serviceRequests.city,
        state: serviceRequests.state,
        latitude: serviceRequests.latitude,
        longitude: serviceRequests.longitude,
        estimatedPrice: serviceRequests.estimatedPrice,
        finalPrice: serviceRequests.finalPrice,
        totalAmount: serviceRequests.totalAmount,
        paymentMethod: serviceRequests.paymentMethod,
        paymentStatus: serviceRequests.paymentStatus,
        status: serviceRequests.status,
        scheduledAt: serviceRequests.scheduledAt,
        completedAt: serviceRequests.completedAt,
        createdAt: serviceRequests.createdAt,
        updatedAt: serviceRequests.updatedAt,
        client: users,
        category: serviceCategories,
      })
      .from(serviceRequests)
      .innerJoin(users, eq(serviceRequests.clientId, users.id))
      .innerJoin(serviceCategories, eq(serviceRequests.categoryId, serviceCategories.id))
      .where(
        or(
          // Show pending requests in provider's service categories
          and(
            inArray(serviceRequests.categoryId, categoryIds),
            eq(serviceRequests.status, "pending"),
            isNull(serviceRequests.providerId)
          ),
          // Show all requests assigned to this provider
          eq(serviceRequests.providerId, providerId)
        )
      )
      .orderBy(desc(serviceRequests.createdAt));
  }

  async createServiceRequest(request: InsertServiceRequest): Promise<ServiceRequest> {
    const [newRequest] = await db
      .insert(serviceRequests)
      .values(request)
      .returning();
    return newRequest;
  }

  async updateServiceRequest(id: number, request: Partial<InsertServiceRequest>): Promise<ServiceRequest> {
    console.log('Updating service request:', id, 'with data:', request);
    
    // Clean up the request data to ensure no invalid values
    const cleanRequest: Partial<InsertServiceRequest> = {};
    
    // Only include defined values and handle date fields properly
    if (request.status !== undefined) cleanRequest.status = request.status;
    if (request.providerId !== undefined) cleanRequest.providerId = request.providerId;
    if (request.notes !== undefined) cleanRequest.notes = request.notes;
    if (request.scheduledAt !== undefined) {
      cleanRequest.scheduledAt = typeof request.scheduledAt === 'string' 
        ? new Date(request.scheduledAt) 
        : request.scheduledAt;
    }
    if (request.completedAt !== undefined) {
      cleanRequest.completedAt = typeof request.completedAt === 'string' 
        ? new Date(request.completedAt) 
        : request.completedAt;
    }
    if (request.acceptedAt !== undefined) {
      cleanRequest.acceptedAt = typeof request.acceptedAt === 'string' 
        ? new Date(request.acceptedAt) 
        : request.acceptedAt;
    }
    if (request.estimatedPrice !== undefined) cleanRequest.estimatedPrice = request.estimatedPrice;
    if (request.finalPrice !== undefined) cleanRequest.finalPrice = request.finalPrice;
    
    console.log('Clean request data:', cleanRequest);
    
    const [updatedRequest] = await db
      .update(serviceRequests)
      .set({ ...cleanRequest, updatedAt: new Date() })
      .where(eq(serviceRequests.id, id))
      .returning();

    // If service is completed, create earnings record for provider
    if (cleanRequest.status === 'completed' && updatedRequest.providerId && updatedRequest.totalAmount) {
      await this.createProviderEarning(updatedRequest);
    }

    return updatedRequest;
  }

  async getReviewsByProvider(providerId: number): Promise<(Review & { client: User; serviceRequest: ServiceRequest })[]> {
    return await db
      .select({
        id: reviews.id,
        serviceRequestId: reviews.serviceRequestId,
        clientId: reviews.clientId,
        providerId: reviews.providerId,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
        client: users,
        serviceRequest: serviceRequests,
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.clientId, users.id))
      .innerJoin(serviceRequests, eq(reviews.serviceRequestId, serviceRequests.id))
      .where(eq(reviews.providerId, providerId))
      .orderBy(desc(reviews.createdAt));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db
      .insert(reviews)
      .values(review)
      .returning();
    
    // Update provider rating
    const avgRating = await db
      .select({ avg: sql`AVG(${reviews.rating})` })
      .from(reviews)
      .where(eq(reviews.providerId, review.providerId));
    
    const totalReviews = await db
      .select({ count: count() })
      .from(reviews)
      .where(eq(reviews.providerId, review.providerId));
    
    await db
      .update(providers)
      .set({
        rating: Number(avgRating[0].avg) || 0,
        totalReviews: totalReviews[0].count,
      })
      .where(eq(providers.id, review.providerId));
    
    return newReview;
  }

  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async markNotificationAsRead(id: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;
    
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  async getProviderStats(providerId: number): Promise<{
    totalServices: number;
    totalEarnings: number;
    averageRating: number;
    totalReviews: number;
  }> {
    const provider = await this.getProvider(providerId);
    if (!provider) throw new Error("Provider not found");
    
    const totalServices = await db
      .select({ count: count() })
      .from(serviceRequests)
      .where(
        and(
          eq(serviceRequests.providerId, providerId),
          eq(serviceRequests.status, "completed")
        )
      );
    
    const totalEarnings = await db
      .select({ sum: sql`SUM(${serviceRequests.finalPrice})` })
      .from(serviceRequests)
      .where(
        and(
          eq(serviceRequests.providerId, providerId),
          eq(serviceRequests.status, "completed")
        )
      );
    
    return {
      totalServices: totalServices[0].count,
      totalEarnings: Number(totalEarnings[0].sum) || 0,
      averageRating: Number(provider.rating) || 0,
      totalReviews: provider.totalReviews || 0,
    };
  }

  async getClientStats(clientId: number): Promise<{
    totalServices: number;
    totalSpent: number;
    completedServices: number;
  }> {
    const totalServices = await db
      .select({ count: count() })
      .from(serviceRequests)
      .where(eq(serviceRequests.clientId, clientId));
    
    const completedServices = await db
      .select({ count: count() })
      .from(serviceRequests)
      .where(
        and(
          eq(serviceRequests.clientId, clientId),
          eq(serviceRequests.status, "completed")
        )
      );
    
    const totalSpent = await db
      .select({ sum: sql`SUM(${serviceRequests.finalPrice})` })
      .from(serviceRequests)
      .where(
        and(
          eq(serviceRequests.clientId, clientId),
          eq(serviceRequests.status, "completed")
        )
      );
    
    return {
      totalServices: totalServices[0].count,
      totalSpent: Number(totalSpent[0].sum) || 0,
      completedServices: completedServices[0].count,
    };
  }

  async getAllServicesForAdmin(): Promise<(ProviderService & { category: ServiceCategory; provider: Provider & { user: User } })[]> {
    return await db
      .select({
        id: providerServices.id,
        providerId: providerServices.providerId,
        categoryId: providerServices.categoryId,
        name: providerServices.name,
        description: providerServices.description,
        price: providerServices.price,
        estimatedDuration: providerServices.estimatedDuration,
        requirements: providerServices.requirements,
        serviceZone: providerServices.serviceZone,
        isActive: providerServices.isActive,
        createdAt: providerServices.createdAt,
        updatedAt: providerServices.updatedAt,
        category: serviceCategories,
        provider: {
          id: providers.id,
          userId: providers.userId,
          status: providers.status,
          serviceRadius: providers.serviceRadius,
          basePrice: providers.basePrice,
          description: providers.description,
          experience: providers.experience,
          documents: providers.documents,
          rating: providers.rating,
          totalReviews: providers.totalReviews,
          totalServices: providers.totalServices,
          isTrialActive: providers.isTrialActive,
          trialEndsAt: providers.trialEndsAt,
          createdAt: providers.createdAt,
          updatedAt: providers.updatedAt,
          user: users,
        },
      })
      .from(providerServices)
      .innerJoin(serviceCategories, eq(providerServices.categoryId, serviceCategories.id))
      .innerJoin(providers, eq(providerServices.providerId, providers.id))
      .innerJoin(users, eq(providers.userId, users.id))
      .orderBy(desc(providerServices.createdAt));
  }

  async getAllBookingsForAdmin(): Promise<(ServiceRequest & { client: User; provider?: Provider & { user: User }; category: ServiceCategory })[]> {
    const result = await db
      .select({
        id: serviceRequests.id,
        clientId: serviceRequests.clientId,
        providerId: serviceRequests.providerId,
        categoryId: serviceRequests.categoryId,
        title: serviceRequests.title,
        description: serviceRequests.description,
        address: serviceRequests.address,
        city: serviceRequests.city,
        state: serviceRequests.state,
        cep: serviceRequests.cep,
        latitude: serviceRequests.latitude,
        longitude: serviceRequests.longitude,
        estimatedPrice: serviceRequests.estimatedPrice,
        finalPrice: serviceRequests.finalPrice,
        totalAmount: serviceRequests.totalAmount,
        paymentMethod: serviceRequests.paymentMethod,
        paymentStatus: serviceRequests.paymentStatus,
        status: serviceRequests.status,
        scheduledAt: serviceRequests.scheduledAt,
        completedAt: serviceRequests.completedAt,
        createdAt: serviceRequests.createdAt,
        updatedAt: serviceRequests.updatedAt,
        client: users,
        provider: providers,
        category: serviceCategories,
      })
      .from(serviceRequests)
      .innerJoin(users, eq(serviceRequests.clientId, users.id))
      .leftJoin(providers, eq(serviceRequests.providerId, providers.id))
      .innerJoin(serviceCategories, eq(serviceRequests.categoryId, serviceCategories.id))
      .orderBy(desc(serviceRequests.createdAt));

    // Buscar dados do usuário do prestador separadamente
    const enrichedResults = await Promise.all(
      result.map(async (booking) => {
        let providerWithUser = null;
        if (booking.provider) {
          const providerUser = await db
            .select()
            .from(users)
            .where(eq(users.id, booking.provider.userId))
            .limit(1);
          
          providerWithUser = {
            ...booking.provider,
            user: providerUser[0] || null,
          };
        }

        return {
          ...booking,
          provider: providerWithUser,
        };
      })
    );

    return enrichedResults;
  }

  async createProviderEarning(serviceRequest: ServiceRequest): Promise<void> {
    try {
      console.log('Starting createProviderEarning for service request:', serviceRequest.id);
      console.log('Service request data:', JSON.stringify(serviceRequest, null, 2));
      
      // Validate required fields
      if (!serviceRequest.providerId) {
        throw new Error('Provider ID is required for earning calculation');
      }
      
      if (!serviceRequest.totalAmount) {
        throw new Error('Total amount is required for earning calculation');
      }

      // Get commission rate from system settings (default 4%)
      const commissionSetting = await db
        .select()
        .from(systemSettings)
        .where(eq(systemSettings.key, "commission_rate"))
        .limit(1);
      
      const commissionRate = commissionSetting[0] ? parseFloat(commissionSetting[0].value) : 4;
      const totalAmount = parseFloat(serviceRequest.totalAmount || "0");
      const commissionAmount = (totalAmount * commissionRate) / 100;
      const providerAmount = totalAmount - commissionAmount;

      console.log(`Calculated values - Total: ${totalAmount}, Commission Rate: ${commissionRate}%, Commission Amount: ${commissionAmount}, Provider Amount: ${providerAmount}`);

      // Check if earnings record already exists for this service
      const existingEarning = await db
        .select()
        .from(providerEarnings)
        .where(eq(providerEarnings.serviceRequestId, serviceRequest.id))
        .limit(1);

      if (!existingEarning.length) {
        const earningData = {
          providerId: serviceRequest.providerId,
          serviceRequestId: serviceRequest.id,
          totalAmount: totalAmount.toString(),
          commissionRate: commissionRate,
          commissionAmount: commissionAmount.toString(),
          providerAmount: providerAmount.toString(),
          isWithdrawn: false,
        };
        
        console.log('Inserting earning data:', JSON.stringify(earningData, null, 2));
        
        await db.insert(providerEarnings).values(earningData);

        console.log(`Created earning record for provider ${serviceRequest.providerId}: R$ ${providerAmount.toFixed(2)} (total: R$ ${totalAmount.toFixed(2)}, commission: ${commissionRate}%)`);
      } else {
        console.log('Earning record already exists for service request:', serviceRequest.id);
      }
    } catch (error) {
      console.error('Error creating provider earning:', error);
      throw error; // Re-throw the error so it can be caught in the calling function
    }
  }

  async getAdminStats(): Promise<{
    totalUsers: number;
    totalProviders: number;
    totalServiceRequests: number;
    totalRevenue: number;
    pendingApprovals: number;
  }> {
    const totalUsers = await db.select({ count: count() }).from(users);
    const totalProviders = await db.select({ count: count() }).from(providers);
    const totalServiceRequests = await db.select({ count: count() }).from(serviceRequests);
    const pendingApprovals = await db
      .select({ count: count() })
      .from(providers)
      .where(eq(providers.status, "pending"));
    
    const totalRevenue = await db
      .select({ sum: sql`SUM(${serviceRequests.finalPrice})` })
      .from(serviceRequests)
      .where(eq(serviceRequests.status, "completed"));
    
    return {
      totalUsers: totalUsers[0].count,
      totalProviders: totalProviders[0].count,
      totalServiceRequests: totalServiceRequests[0].count,
      totalRevenue: Number(totalRevenue[0].sum) || 0,
      pendingApprovals: pendingApprovals[0].count,
    };
  }

  // Employee management
  async getEmployeesByProvider(providerId: number): Promise<(Employee & { user: User })[]> {
    const result = await db
      .select({
        id: employees.id,
        providerId: employees.providerId,
        userId: employees.userId,
        name: employees.name,
        phone: employees.phone,
        email: employees.email,
        specialization: employees.specialization,
        isActive: employees.isActive,
        createdAt: employees.createdAt,
        updatedAt: employees.updatedAt,
        user: users,
      })
      .from(employees)
      .innerJoin(users, eq(employees.userId, users.id))
      .where(eq(employees.providerId, providerId))
      .orderBy(desc(employees.createdAt));

    return result;
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [newEmployee] = await db
      .insert(employees)
      .values(employee)
      .returning();
    return newEmployee;
  }

  async updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee> {
    const [updatedEmployee] = await db
      .update(employees)
      .set({ ...employee, updatedAt: new Date() })
      .where(eq(employees.id, id))
      .returning();
    return updatedEmployee;
  }

  async deleteEmployee(id: number): Promise<void> {
    await db.delete(employees).where(eq(employees.id, id));
  }

  // Service zones
  async getServiceZones(): Promise<ServiceZone[]> {
    return await db.select().from(serviceZones).orderBy(asc(serviceZones.name));
  }

  async createServiceZone(zone: InsertServiceZone): Promise<ServiceZone> {
    const [newZone] = await db
      .insert(serviceZones)
      .values(zone)
      .returning();
    return newZone;
  }

  async updateServiceZone(id: number, zone: Partial<InsertServiceZone>): Promise<ServiceZone> {
    const [updatedZone] = await db
      .update(serviceZones)
      .set(zone)
      .where(eq(serviceZones.id, id))
      .returning();
    return updatedZone;
  }

  async deleteServiceZone(id: number): Promise<void> {
    await db.delete(serviceZones).where(eq(serviceZones.id, id));
  }

  // Promotional banners
  async getPromotionalBanners(): Promise<(PromotionalBanner & { category?: ServiceCategory })[]> {
    const result = await db
      .select({
        id: promotionalBanners.id,
        title: promotionalBanners.title,
        description: promotionalBanners.description,
        imageUrl: promotionalBanners.imageUrl,
        categoryId: promotionalBanners.categoryId,
        targetUrl: promotionalBanners.targetUrl,
        status: promotionalBanners.status,
        startDate: promotionalBanners.startDate,
        endDate: promotionalBanners.endDate,
        clickCount: promotionalBanners.clickCount,
        displayOrder: promotionalBanners.displayOrder,
        createdAt: promotionalBanners.createdAt,
        updatedAt: promotionalBanners.updatedAt,
        category: serviceCategories,
      })
      .from(promotionalBanners)
      .leftJoin(serviceCategories, eq(promotionalBanners.categoryId, serviceCategories.id))
      .orderBy(asc(promotionalBanners.displayOrder));

    return result;
  }

  async createPromotionalBanner(banner: InsertPromotionalBanner): Promise<PromotionalBanner> {
    const [newBanner] = await db
      .insert(promotionalBanners)
      .values(banner)
      .returning();
    return newBanner;
  }

  async updatePromotionalBanner(id: number, banner: Partial<InsertPromotionalBanner>): Promise<PromotionalBanner> {
    const [updatedBanner] = await db
      .update(promotionalBanners)
      .set({ ...banner, updatedAt: new Date() })
      .where(eq(promotionalBanners.id, id))
      .returning();
    return updatedBanner;
  }

  async deletePromotionalBanner(id: number): Promise<void> {
    await db.delete(promotionalBanners).where(eq(promotionalBanners.id, id));
  }

  async incrementBannerClick(id: number): Promise<void> {
    await db
      .update(promotionalBanners)
      .set({ clickCount: sql`${promotionalBanners.clickCount} + 1` })
      .where(eq(promotionalBanners.id, id));
  }

  // Payments
  async getPaymentsByServiceRequest(serviceRequestId: number): Promise<PaymentRecord[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.serviceRequestId, serviceRequestId))
      .orderBy(desc(payments.createdAt));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db
      .insert(payments)
      .values(payment)
      .returning();
    return newPayment;
  }

  async updatePayment(id: number, payment: Partial<InsertPayment>): Promise<Payment> {
    const [updatedPayment] = await db
      .update(payments)
      .set({ ...payment, updatedAt: new Date() })
      .where(eq(payments.id, id))
      .returning();
    return updatedPayment;
  }

  // Payment Gateway Configurations
  async getPaymentGatewayConfigs(): Promise<PaymentGatewayConfig[]> {
    return await db
      .select()
      .from(paymentGatewayConfigs)
      .orderBy(asc(paymentGatewayConfigs.gatewayName));
  }

  async getPaymentGatewayConfig(gatewayName: string): Promise<PaymentGatewayConfig | undefined> {
    const [config] = await db
      .select()
      .from(paymentGatewayConfigs)
      .where(eq(paymentGatewayConfigs.gatewayName, gatewayName))
      .limit(1);
    return config || undefined;
  }

  async createPaymentGatewayConfig(config: InsertPaymentGatewayConfig): Promise<PaymentGatewayConfig> {
    const [newConfig] = await db
      .insert(paymentGatewayConfigs)
      .values(config)
      .returning();
    return newConfig;
  }

  async updatePaymentGatewayConfig(id: number, config: Partial<InsertPaymentGatewayConfig>): Promise<PaymentGatewayConfig> {
    const [updatedConfig] = await db
      .update(paymentGatewayConfigs)
      .set({ ...config, updatedAt: new Date() })
      .where(eq(paymentGatewayConfigs.id, id))
      .returning();
    return updatedConfig;
  }

  async deletePaymentGatewayConfig(id: number): Promise<void> {
    await db.delete(paymentGatewayConfigs).where(eq(paymentGatewayConfigs.id, id));
  }

  // Coupons
  async getCoupons(): Promise<Coupon[]> {
    return await db.select().from(coupons).orderBy(desc(coupons.createdAt));
  }

  async getCouponByCode(code: string): Promise<Coupon | undefined> {
    const [coupon] = await db
      .select()
      .from(coupons)
      .where(and(eq(coupons.code, code), eq(coupons.isActive, true)))
      .limit(1);
    return coupon || undefined;
  }

  async createCoupon(coupon: InsertCoupon): Promise<Coupon> {
    const [newCoupon] = await db
      .insert(coupons)
      .values(coupon)
      .returning();
    return newCoupon;
  }

  async updateCoupon(id: number, coupon: Partial<InsertCoupon>): Promise<Coupon> {
    const [updatedCoupon] = await db
      .update(coupons)
      .set({ ...coupon, updatedAt: new Date() })
      .where(eq(coupons.id, id))
      .returning();
    return updatedCoupon;
  }

  async deleteCoupon(id: number): Promise<void> {
    await db.delete(coupons).where(eq(coupons.id, id));
  }

  async useCoupon(id: number): Promise<void> {
    await db
      .update(coupons)
      .set({ currentUses: sql`${coupons.currentUses} + 1` })
      .where(eq(coupons.id, id));
  }

  // Service assignments
  async getServiceAssignmentsByEmployee(employeeId: number): Promise<(ServiceAssignment & { serviceRequest: ServiceRequest & { client: User; category: ServiceCategory } })[]> {
    const result = await db
      .select({
        id: serviceAssignments.id,
        serviceRequestId: serviceAssignments.serviceRequestId,
        employeeId: serviceAssignments.employeeId,
        assignedAt: serviceAssignments.assignedAt,
        startedAt: serviceAssignments.startedAt,
        completedAt: serviceAssignments.completedAt,
        notes: serviceAssignments.notes,
        createdAt: serviceAssignments.createdAt,
        updatedAt: serviceAssignments.updatedAt,
        serviceRequest: {
          id: serviceRequests.id,
          clientId: serviceRequests.clientId,
          categoryId: serviceRequests.categoryId,
          providerId: serviceRequests.providerId,
          title: serviceRequests.title,
          description: serviceRequests.description,
          address: serviceRequests.address,
          cep: serviceRequests.cep,
          city: serviceRequests.city,
          state: serviceRequests.state,
          latitude: serviceRequests.latitude,
          longitude: serviceRequests.longitude,
          estimatedPrice: serviceRequests.estimatedPrice,
          finalPrice: serviceRequests.finalPrice,
          status: serviceRequests.status,
          scheduledAt: serviceRequests.scheduledAt,
          completedAt: serviceRequests.completedAt,
          createdAt: serviceRequests.createdAt,
          updatedAt: serviceRequests.updatedAt,
          client: users,
          category: serviceCategories,
        },
      })
      .from(serviceAssignments)
      .innerJoin(serviceRequests, eq(serviceAssignments.serviceRequestId, serviceRequests.id))
      .innerJoin(users, eq(serviceRequests.clientId, users.id))
      .innerJoin(serviceCategories, eq(serviceRequests.categoryId, serviceCategories.id))
      .where(eq(serviceAssignments.employeeId, employeeId))
      .orderBy(desc(serviceAssignments.assignedAt));

    return result;
  }

  async createServiceAssignment(assignment: InsertServiceAssignment): Promise<ServiceAssignment> {
    const [newAssignment] = await db
      .insert(serviceAssignments)
      .values(assignment)
      .returning();
    return newAssignment;
  }

  async updateServiceAssignment(id: number, assignment: Partial<InsertServiceAssignment>): Promise<ServiceAssignment> {
    const [updatedAssignment] = await db
      .update(serviceAssignments)
      .set({ ...assignment, updatedAt: new Date() })
      .where(eq(serviceAssignments.id, id))
      .returning();
    return updatedAssignment;
  }

  // System settings
  async getSystemSettings(): Promise<SystemSetting[]> {
    return await db.select().from(systemSettings).orderBy(asc(systemSettings.key));
  }

  async getSystemSetting(key: string): Promise<SystemSetting | undefined> {
    const [setting] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key))
      .limit(1);
    return setting || undefined;
  }

  async createSystemSetting(setting: InsertSystemSetting): Promise<SystemSetting> {
    const [newSetting] = await db
      .insert(systemSettings)
      .values(setting)
      .returning();
    return newSetting;
  }

  async updateSystemSetting(key: string, value: string): Promise<SystemSetting> {
    const [updatedSetting] = await db
      .update(systemSettings)
      .set({ value, updatedAt: new Date() })
      .where(eq(systemSettings.key, key))
      .returning();
    return updatedSetting;
  }

  // Orders and cart management
  async getCartByClient(clientId: number): Promise<(Order & { items: (OrderItem & { providerService: ProviderService & { category: ServiceCategory; provider: Provider & { user: User } } })[] }) | undefined> {
    const [order] = await db
      .select({
        id: orders.id,
        clientId: orders.clientId,
        providerId: orders.providerId,
        status: orders.status,
        subtotal: orders.subtotal,
        discountAmount: orders.discountAmount,
        serviceAmount: orders.serviceAmount,
        totalAmount: orders.totalAmount,
        couponCode: orders.couponCode,
        paymentMethod: orders.paymentMethod,
        address: orders.address,
        cep: orders.cep,
        city: orders.city,
        state: orders.state,
        latitude: orders.latitude,
        longitude: orders.longitude,
        scheduledAt: orders.scheduledAt,
        notes: orders.notes,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
      })
      .from(orders)
      .where(and(eq(orders.clientId, clientId), eq(orders.status, "cart")))
      .limit(1);

    if (!order) return undefined;

    const items = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        providerServiceId: orderItems.providerServiceId,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
        totalPrice: orderItems.totalPrice,
        notes: orderItems.notes,
        createdAt: orderItems.createdAt,
        updatedAt: orderItems.updatedAt,
        providerService: {
          id: providerServices.id,
          providerId: providerServices.providerId,
          categoryId: providerServices.categoryId,
          name: providerServices.name,
          description: providerServices.description,
          price: providerServices.price,
          minimumPrice: providerServices.minimumPrice,
          estimatedDuration: providerServices.estimatedDuration,
          requirements: providerServices.requirements,
          serviceZone: providerServices.serviceZone,
          images: providerServices.images,
          isActive: providerServices.isActive,
          createdAt: providerServices.createdAt,
          updatedAt: providerServices.updatedAt,
          category: serviceCategories,
          provider: {
            id: providers.id,
            userId: providers.userId,
            status: providers.status,
            serviceRadius: providers.serviceRadius,
            basePrice: providers.basePrice,
            description: providers.description,
            experience: providers.experience,
            documents: providers.documents,
            portfolioImages: providers.portfolioImages,
            rating: providers.rating,
            totalReviews: providers.totalReviews,
            totalServices: providers.totalServices,
            isTrialActive: providers.isTrialActive,
            trialEndsAt: providers.trialEndsAt,
            createdAt: providers.createdAt,
            updatedAt: providers.updatedAt,
            user: {
              id: users.id,
              email: users.email,
              name: users.name,
              phone: users.phone,
              userType: users.userType,
              address: users.address,
              cep: users.cep,
              city: users.city,
              state: users.state,
              latitude: users.latitude,
              longitude: users.longitude,
              avatar: users.avatar,
              isActive: users.isActive,
              createdAt: users.createdAt,
              updatedAt: users.updatedAt,
            },
          },
        },
      })
      .from(orderItems)
      .innerJoin(providerServices, eq(orderItems.providerServiceId, providerServices.id))
      .innerJoin(serviceCategories, eq(providerServices.categoryId, serviceCategories.id))
      .innerJoin(providers, eq(providerServices.providerId, providers.id))
      .innerJoin(users, eq(providers.userId, users.id))
      .where(eq(orderItems.orderId, order.id));

    return { ...order, items };
  }

  async getOrderById(id: number): Promise<(Order & { items: (OrderItem & { providerService: ProviderService & { category: ServiceCategory; provider: Provider } })[]; client: User; provider?: Provider }) | undefined> {
    const [order] = await db
      .select({
        id: orders.id,
        clientId: orders.clientId,
        providerId: orders.providerId,
        status: orders.status,
        subtotal: orders.subtotal,
        discountAmount: orders.discountAmount,
        serviceAmount: orders.serviceAmount,
        totalAmount: orders.totalAmount,
        couponCode: orders.couponCode,
        paymentMethod: orders.paymentMethod,
        address: orders.address,
        cep: orders.cep,
        city: orders.city,
        state: orders.state,
        latitude: orders.latitude,
        longitude: orders.longitude,
        scheduledAt: orders.scheduledAt,
        notes: orders.notes,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        client: users,
        provider: providers,
      })
      .from(orders)
      .innerJoin(users, eq(orders.clientId, users.id))
      .leftJoin(providers, eq(orders.providerId, providers.id))
      .where(eq(orders.id, id))
      .limit(1);

    if (!order) return undefined;

    const items = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        providerServiceId: orderItems.providerServiceId,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
        totalPrice: orderItems.totalPrice,
        notes: orderItems.notes,
        createdAt: orderItems.createdAt,
        updatedAt: orderItems.updatedAt,
        providerService: {
          id: providerServices.id,
          providerId: providerServices.providerId,
          categoryId: providerServices.categoryId,
          name: providerServices.name,
          description: providerServices.description,
          price: providerServices.price,
          minimumPrice: providerServices.minimumPrice,
          estimatedDuration: providerServices.estimatedDuration,
          requirements: providerServices.requirements,
          serviceZone: providerServices.serviceZone,
          images: providerServices.images,
          isActive: providerServices.isActive,
          createdAt: providerServices.createdAt,
          updatedAt: providerServices.updatedAt,
          category: serviceCategories,
          provider: providers,
        },
      })
      .from(orderItems)
      .innerJoin(providerServices, eq(orderItems.providerServiceId, providerServices.id))
      .innerJoin(serviceCategories, eq(providerServices.categoryId, serviceCategories.id))
      .innerJoin(providers, eq(providerServices.providerId, providers.id))
      .where(eq(orderItems.orderId, order.id));

    return { 
      ...order, 
      items,
      provider: order.provider || undefined
    };
  }

  async getOrdersByClient(clientId: number): Promise<(Order & { items: (OrderItem & { providerService: ProviderService & { category: ServiceCategory; provider: Provider } })[]; provider?: Provider })[]> {
    const ordersList = await db
      .select({
        id: orders.id,
        clientId: orders.clientId,
        providerId: orders.providerId,
        status: orders.status,
        subtotal: orders.subtotal,
        discountAmount: orders.discountAmount,
        serviceAmount: orders.serviceAmount,
        totalAmount: orders.totalAmount,
        couponCode: orders.couponCode,
        paymentMethod: orders.paymentMethod,
        address: orders.address,
        cep: orders.cep,
        city: orders.city,
        state: orders.state,
        latitude: orders.latitude,
        longitude: orders.longitude,
        scheduledAt: orders.scheduledAt,
        notes: orders.notes,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        provider: providers,
      })
      .from(orders)
      .leftJoin(providers, eq(orders.providerId, providers.id))
      .where(and(eq(orders.clientId, clientId), sql`${orders.status} != 'cart'`))
      .orderBy(desc(orders.createdAt));

    // Get items for each order
    const ordersWithItems = await Promise.all(
      ordersList.map(async (order) => {
        const items = await db
          .select({
            id: orderItems.id,
            orderId: orderItems.orderId,
            providerServiceId: orderItems.providerServiceId,
            quantity: orderItems.quantity,
            unitPrice: orderItems.unitPrice,
            totalPrice: orderItems.totalPrice,
            notes: orderItems.notes,
            createdAt: orderItems.createdAt,
            updatedAt: orderItems.updatedAt,
            providerService: {
              id: providerServices.id,
              providerId: providerServices.providerId,
              categoryId: providerServices.categoryId,
              name: providerServices.name,
              description: providerServices.description,
              price: providerServices.price,
              minimumPrice: providerServices.minimumPrice,
              estimatedDuration: providerServices.estimatedDuration,
              requirements: providerServices.requirements,
              serviceZone: providerServices.serviceZone,
              images: providerServices.images,
              isActive: providerServices.isActive,
              createdAt: providerServices.createdAt,
              updatedAt: providerServices.updatedAt,
              category: serviceCategories,
              provider: providers,
            },
          })
          .from(orderItems)
          .innerJoin(providerServices, eq(orderItems.providerServiceId, providerServices.id))
          .innerJoin(serviceCategories, eq(providerServices.categoryId, serviceCategories.id))
          .innerJoin(providers, eq(providerServices.providerId, providers.id))
          .where(eq(orderItems.orderId, order.id));

        return {
          ...order,
          items,
          provider: order.provider || undefined
        };
      })
    );

    return ordersWithItems;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db
      .insert(orders)
      .values(order)
      .returning();
    return newOrder;
  }

  async updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ ...order, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  async addItemToCart(clientId: number, item: InsertOrderItem): Promise<OrderItem> {
    // Get or create cart
    let cart = await this.getCartByClient(clientId);
    if (!cart) {
      cart = await this.createOrder({
        clientId,
        status: "cart",
        subtotal: "0.00",
        discountAmount: "0.00",
        serviceAmount: "0.00",
        totalAmount: "0.00",
      });
    }

    // Check if item already exists in cart
    const existingItems = await db
      .select()
      .from(orderItems)
      .where(and(
        eq(orderItems.orderId, cart.id),
        eq(orderItems.providerServiceId, item.providerServiceId)
      ));

    if (existingItems.length > 0) {
      // Update existing item quantity
      const existingItem = existingItems[0];
      const newQuantity = existingItem.quantity + item.quantity;
      const unitPrice = parseFloat(existingItem.unitPrice);
      const newTotalPrice = (unitPrice * newQuantity).toFixed(2);
      
      const [updatedItem] = await db
        .update(orderItems)
        .set({
          quantity: newQuantity,
          totalPrice: newTotalPrice,
          updatedAt: new Date()
        })
        .where(eq(orderItems.id, existingItem.id))
        .returning();
      return updatedItem;
    } else {
      // Add new item
      const unitPrice = parseFloat(item.unitPrice);
      const totalPrice = (unitPrice * item.quantity).toFixed(2);
      
      const insertData = {
        orderId: cart.id,
        providerServiceId: item.providerServiceId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: totalPrice,
        notes: item.notes || null
      };
      
      const [newItem] = await db
        .insert(orderItems)
        .values(insertData)
        .returning();
      return newItem;
    }
  }

  async updateCartItem(itemId: number, quantity: number): Promise<OrderItem> {
    // First get the current item to calculate the new total price
    const [currentItem] = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.id, itemId))
      .limit(1);
    
    if (!currentItem) {
      throw new Error("Cart item not found");
    }
    
    const unitPrice = parseFloat(currentItem.unitPrice);
    const totalPrice = (unitPrice * quantity).toFixed(2);
    
    const [updatedItem] = await db
      .update(orderItems)
      .set({
        quantity,
        totalPrice,
        updatedAt: new Date()
      })
      .where(eq(orderItems.id, itemId))
      .returning();
    return updatedItem;
  }

  async removeCartItem(itemId: number): Promise<void> {
    await db.delete(orderItems).where(eq(orderItems.id, itemId));
  }

  async clearCart(clientId: number): Promise<void> {
    const cart = await this.getCartByClient(clientId);
    if (cart) {
      await db.delete(orderItems).where(eq(orderItems.orderId, cart.id));
      await db.delete(orders).where(eq(orders.id, cart.id));
    }
  }

  async convertCartToOrder(clientId: number, orderData: Partial<InsertOrder>): Promise<Order> {
    const cart = await this.getCartByClient(clientId);
    if (!cart) {
      throw new Error("Cart not found");
    }

    // Calculate totals
    const subtotal = cart.items.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);
    const serviceAmount = subtotal * 0.1; // 10% service fee
    const totalAmount = subtotal + serviceAmount - parseFloat(orderData.discountAmount || "0");

    const [updatedOrder] = await db
      .update(orders)
      .set({
        ...orderData,
        status: "confirmed",
        subtotal: subtotal.toString(),
        serviceAmount: serviceAmount.toString(),
        totalAmount: totalAmount.toString(),
        updatedAt: new Date()
      })
      .where(eq(orders.id, cart.id))
      .returning();

    // Create service requests for each provider in the cart
    const providerRequests = new Map<number, {
      providerId: number;
      categoryId: number;
      items: any[];
    }>();

    // Group items by provider
    cart.items.forEach(item => {
      const providerId = item.providerService.provider.id;
      const categoryId = item.providerService.category.id;
      
      if (!providerRequests.has(providerId)) {
        providerRequests.set(providerId, {
          providerId,
          categoryId,
          items: []
        });
      }
      
      providerRequests.get(providerId)!.items.push(item);
    });

    // Create service requests for each provider
    for (const [providerId, providerData] of providerRequests) {
      const serviceDescription = providerData.items
        .map(item => `${item.quantity}x ${item.providerService.category.name}`)
        .join(', ');
      
      const totalPrice = providerData.items
        .reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);

      await db.insert(serviceRequests).values({
        clientId,
        categoryId: providerData.categoryId,
        providerId: null, // Will be assigned when provider accepts
        title: `Pedido #${updatedOrder.id}`,
        description: `${serviceDescription}${orderData.notes ? ` - ${orderData.notes}` : ''}`,
        address: orderData.address || '',
        cep: orderData.cep || '',
        city: orderData.city || '',
        state: orderData.state || '',
        latitude: orderData.latitude,
        longitude: orderData.longitude,
        estimatedPrice: totalPrice.toString(),
        finalPrice: null,
        totalAmount: totalPrice.toString(),
        paymentMethod: orderData.paymentMethod,
        paymentStatus: "completed", // Since order was processed successfully
        notes: orderData.notes,
        status: "pending",
        scheduledAt: orderData.scheduledAt,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return updatedOrder;
  }

  // Provider earnings methods
  async getProviderEarnings(providerId: number): Promise<ProviderEarning[]> {
    return await db
      .select()
      .from(providerEarnings)
      .where(eq(providerEarnings.providerId, providerId))
      .orderBy(desc(providerEarnings.createdAt));
  }

  async insertProviderEarning(earning: InsertProviderEarning): Promise<ProviderEarning> {
    const [newEarning] = await db
      .insert(providerEarnings)
      .values(earning)
      .returning();
    return newEarning;
  }

  async getProviderAvailableBalance(providerId: number): Promise<number> {
    const earnings = await db
      .select()
      .from(providerEarnings)
      .where(and(
        eq(providerEarnings.providerId, providerId),
        eq(providerEarnings.isWithdrawn, false)
      ));
    
    return earnings.reduce((sum, earning) => sum + parseFloat(earning.providerAmount), 0);
  }

  async getAllEarnings(): Promise<(ProviderEarning & { provider: Provider & { user: User }; serviceRequest: ServiceRequest })[]> {
    const earningsData = await db
      .select({
        earning: providerEarnings,
        provider: providers,
        user: users,
        serviceRequest: serviceRequests
      })
      .from(providerEarnings)
      .innerJoin(providers, eq(providerEarnings.providerId, providers.id))
      .innerJoin(users, eq(providers.userId, users.id))
      .innerJoin(serviceRequests, eq(providerEarnings.serviceRequestId, serviceRequests.id))
      .orderBy(desc(providerEarnings.createdAt));

    return earningsData.map(row => ({
      ...row.earning,
      provider: {
        ...row.provider,
        user: row.user
      },
      serviceRequest: row.serviceRequest
    }));
  }

  // Withdrawal requests methods
  async getWithdrawalRequests(providerId?: number): Promise<(WithdrawalRequest & { provider: Provider & { user: User } })[]> {
    let query = db
      .select({
        request: withdrawalRequests,
        provider: providers,
        user: users
      })
      .from(withdrawalRequests)
      .innerJoin(providers, eq(withdrawalRequests.providerId, providers.id))
      .innerJoin(users, eq(providers.userId, users.id));

    if (providerId) {
      query = query.where(eq(withdrawalRequests.providerId, providerId));
    }

    const requestsData = await query.orderBy(desc(withdrawalRequests.createdAt));

    return requestsData.map(row => ({
      ...row.request,
      provider: {
        ...row.provider,
        user: row.user
      }
    }));
  }

  async createWithdrawalRequest(request: InsertWithdrawalRequest): Promise<WithdrawalRequest> {
    const [newRequest] = await db
      .insert(withdrawalRequests)
      .values(request)
      .returning();
    return newRequest;
  }

  async updateWithdrawalRequest(id: number, request: Partial<InsertWithdrawalRequest>): Promise<WithdrawalRequest> {
    const [updatedRequest] = await db
      .update(withdrawalRequests)
      .set({ ...request, updatedAt: new Date() })
      .where(eq(withdrawalRequests.id, id))
      .returning();
    return updatedRequest;
  }

  async processWithdrawalRequest(id: number, status: 'approved' | 'rejected', adminId: number, adminNotes?: string): Promise<WithdrawalRequest> {
    const updateData: Partial<InsertWithdrawalRequest> = {
      status,
      processedBy: adminId,
      processedAt: new Date(),
      adminNotes,
      updatedAt: new Date()
    };

    if (status === 'approved') {
      // When approved, mark related earnings as withdrawn
      const request = await db
        .select()
        .from(withdrawalRequests)
        .where(eq(withdrawalRequests.id, id))
        .limit(1);

      if (request.length > 0) {
        const requestAmount = parseFloat(request[0].amount);
        
        // Get available earnings for this provider
        const availableEarnings = await db
          .select()
          .from(providerEarnings)
          .where(and(
            eq(providerEarnings.providerId, request[0].providerId),
            eq(providerEarnings.isWithdrawn, false)
          ))
          .orderBy(asc(providerEarnings.createdAt));

        // Mark earnings as withdrawn up to the request amount
        let remainingAmount = requestAmount;
        for (const earning of availableEarnings) {
          if (remainingAmount <= 0) break;
          
          const earningAmount = parseFloat(earning.providerAmount);
          if (earningAmount <= remainingAmount) {
            await db
              .update(providerEarnings)
              .set({ isWithdrawn: true, withdrawnAt: new Date() })
              .where(eq(providerEarnings.id, earning.id));
            remainingAmount -= earningAmount;
          }
        }
      }
    }

    const [updatedRequest] = await db
      .update(withdrawalRequests)
      .set(updateData)
      .where(eq(withdrawalRequests.id, id))
      .returning();
    
    return updatedRequest;
  }

  // Provider bank accounts methods
  async getProviderBankAccounts(providerId: number): Promise<ProviderBankAccount[]> {
    return await db
      .select()
      .from(providerBankAccounts)
      .where(eq(providerBankAccounts.providerId, providerId))
      .orderBy(desc(providerBankAccounts.createdAt));
  }

  async createProviderBankAccount(account: InsertProviderBankAccount): Promise<ProviderBankAccount> {
    const [newAccount] = await db
      .insert(providerBankAccounts)
      .values(account)
      .returning();
    return newAccount;
  }

  async updateProviderBankAccount(id: number, account: Partial<InsertProviderBankAccount>): Promise<ProviderBankAccount> {
    const [updatedAccount] = await db
      .update(providerBankAccounts)
      .set({ ...account, updatedAt: new Date() })
      .where(eq(providerBankAccounts.id, id))
      .returning();
    return updatedAccount;
  }

  async deleteProviderBankAccount(id: number): Promise<void> {
    await db.delete(providerBankAccounts).where(eq(providerBankAccounts.id, id));
  }

  // Provider PIX keys methods
  async getProviderPixKeys(providerId: number): Promise<ProviderPixKey[]> {
    return await db
      .select()
      .from(providerPixKeys)
      .where(eq(providerPixKeys.providerId, providerId))
      .orderBy(desc(providerPixKeys.createdAt));
  }

  async createProviderPixKey(pixKey: InsertProviderPixKey): Promise<ProviderPixKey> {
    const [newPixKey] = await db
      .insert(providerPixKeys)
      .values(pixKey)
      .returning();
    return newPixKey;
  }

  async updateProviderPixKey(id: number, pixKey: Partial<InsertProviderPixKey>): Promise<ProviderPixKey> {
    const [updatedPixKey] = await db
      .update(providerPixKeys)
      .set({ ...pixKey, updatedAt: new Date() })
      .where(eq(providerPixKeys.id, id))
      .returning();
    return updatedPixKey;
  }

  async deleteProviderPixKey(id: number): Promise<void> {
    await db.delete(providerPixKeys).where(eq(providerPixKeys.id, id));
  }

  // Chat conversation methods
  async getChatConversationsByUser(userId: number): Promise<(ChatConversation & { participantOne: User; participantTwo: User; lastMessage?: ChatMessage })[]> {
    const conversations = await db
      .select({
        id: chatConversations.id,
        participantOneId: chatConversations.participantOneId,
        participantTwoId: chatConversations.participantTwoId,
        serviceRequestId: chatConversations.serviceRequestId,
        title: chatConversations.title,
        status: chatConversations.status,
        lastMessageAt: chatConversations.lastMessageAt,
        createdAt: chatConversations.createdAt,
        updatedAt: chatConversations.updatedAt,
        participantOne: users,
      })
      .from(chatConversations)
      .innerJoin(users, eq(users.id, chatConversations.participantOneId))
      .where(or(
        eq(chatConversations.participantOneId, userId),
        eq(chatConversations.participantTwoId, userId)
      ))
      .orderBy(desc(chatConversations.lastMessageAt));

    // Get participant two and last message for each conversation
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conversation) => {
        const participantTwoId = conversation.participantOneId === userId 
          ? conversation.participantTwoId 
          : conversation.participantOneId;
        
        const [participantTwo] = await db
          .select()
          .from(users)
          .where(eq(users.id, participantTwoId));

        const [lastMessage] = await db
          .select()
          .from(chatMessages)
          .where(eq(chatMessages.conversationId, conversation.id))
          .orderBy(desc(chatMessages.createdAt))
          .limit(1);

        return {
          ...conversation,
          participantTwo,
          lastMessage,
        };
      })
    );

    return conversationsWithDetails;
  }

  async getChatConversation(id: number): Promise<(ChatConversation & { participantOne: User; participantTwo: User; messages: (ChatMessage & { sender: User })[] }) | undefined> {
    const [conversation] = await db
      .select()
      .from(chatConversations)
      .where(eq(chatConversations.id, id));

    if (!conversation) return undefined;

    const [participantOne, participantTwo] = await Promise.all([
      db.select().from(users).where(eq(users.id, conversation.participantOneId)).then(r => r[0]),
      db.select().from(users).where(eq(users.id, conversation.participantTwoId)).then(r => r[0])
    ]);

    const messages = await db
      .select({
        id: chatMessages.id,
        conversationId: chatMessages.conversationId,
        senderId: chatMessages.senderId,
        content: chatMessages.content,
        messageType: chatMessages.messageType,
        attachmentUrl: chatMessages.attachmentUrl,
        status: chatMessages.status,
        createdAt: chatMessages.createdAt,
        updatedAt: chatMessages.updatedAt,
        sender: users,
      })
      .from(chatMessages)
      .innerJoin(users, eq(users.id, chatMessages.senderId))
      .where(eq(chatMessages.conversationId, id))
      .orderBy(asc(chatMessages.createdAt));

    return {
      ...conversation,
      participantOne,
      participantTwo,
      messages,
    };
  }

  async findOrCreateConversation(participantOneId: number, participantTwoId: number, serviceRequestId?: number): Promise<ChatConversation> {
    // Try to find existing conversation
    const [existingConversation] = await db
      .select()
      .from(chatConversations)
      .where(or(
        and(
          eq(chatConversations.participantOneId, participantOneId),
          eq(chatConversations.participantTwoId, participantTwoId)
        ),
        and(
          eq(chatConversations.participantOneId, participantTwoId),
          eq(chatConversations.participantTwoId, participantOneId)
        )
      ));

    if (existingConversation) {
      return existingConversation;
    }

    // Create new conversation
    const [newConversation] = await db
      .insert(chatConversations)
      .values({
        participantOneId,
        participantTwoId,
        serviceRequestId,
        status: "active",
        lastMessageAt: new Date(),
      })
      .returning();

    return newConversation;
  }

  async createChatConversation(conversation: InsertChatConversation): Promise<ChatConversation> {
    const [newConversation] = await db
      .insert(chatConversations)
      .values(conversation)
      .returning();
    return newConversation;
  }

  async updateChatConversation(id: number, conversation: Partial<InsertChatConversation>): Promise<ChatConversation> {
    const [updatedConversation] = await db
      .update(chatConversations)
      .set({ ...conversation, updatedAt: new Date() })
      .where(eq(chatConversations.id, id))
      .returning();
    return updatedConversation;
  }

  // Chat message methods
  async getChatMessages(conversationId: number): Promise<(ChatMessage & { sender: User })[]> {
    return await db
      .select({
        id: chatMessages.id,
        conversationId: chatMessages.conversationId,
        senderId: chatMessages.senderId,
        content: chatMessages.content,
        messageType: chatMessages.messageType,
        attachmentUrl: chatMessages.attachmentUrl,
        status: chatMessages.status,
        createdAt: chatMessages.createdAt,
        updatedAt: chatMessages.updatedAt,
        sender: users,
      })
      .from(chatMessages)
      .innerJoin(users, eq(users.id, chatMessages.senderId))
      .where(eq(chatMessages.conversationId, conversationId))
      .orderBy(asc(chatMessages.createdAt));
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db
      .insert(chatMessages)
      .values(message)
      .returning();

    // Update conversation's last message time
    await db
      .update(chatConversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(chatConversations.id, message.conversationId));

    return newMessage;
  }

  async markMessageAsRead(messageId: number): Promise<ChatMessage> {
    const [updatedMessage] = await db
      .update(chatMessages)
      .set({ status: "read" })
      .where(eq(chatMessages.id, messageId))
      .returning();
    return updatedMessage;
  }

  // Check if two users can chat (have accepted service request between them)
  async canUsersChat(userOneId: number, userTwoId: number): Promise<boolean> {
    // Admin users can chat with anyone
    const [userOne, userTwo] = await Promise.all([
      db.select({ userType: users.userType }).from(users).where(eq(users.id, userOneId)).limit(1),
      db.select({ userType: users.userType }).from(users).where(eq(users.id, userTwoId)).limit(1)
    ]);

    if (userOne[0]?.userType === "admin" || userTwo[0]?.userType === "admin") {
      return true;
    }

    // Check if there's an accepted, in_progress, or completed service request between these users
    const validRequests = await db
      .select({ id: serviceRequests.id })
      .from(serviceRequests)
      .innerJoin(providers, eq(providers.id, serviceRequests.providerId))
      .where(and(
        or(
          eq(serviceRequests.status, "accepted"),
          eq(serviceRequests.status, "in_progress"),
          eq(serviceRequests.status, "completed")
        ),
        or(
          and(
            eq(serviceRequests.clientId, userOneId),
            eq(providers.userId, userTwoId)
          ),
          and(
            eq(serviceRequests.clientId, userTwoId),
            eq(providers.userId, userOneId)
          )
        )
      ))
      .limit(1);

    return validRequests.length > 0;
  }

  async getUnreadMessageCount(userId: number): Promise<number> {
    // Get conversations where user is a participant
    const userConversations = await db
      .select({ id: chatConversations.id })
      .from(chatConversations)
      .where(or(
        eq(chatConversations.participantOneId, userId),
        eq(chatConversations.participantTwoId, userId)
      ));

    if (userConversations.length === 0) return 0;

    const conversationIds = userConversations.map(c => c.id);

    // Count unread messages in these conversations that are not sent by the user
    const [result] = await db
      .select({ count: count() })
      .from(chatMessages)
      .where(and(
        inArray(chatMessages.conversationId, conversationIds),
        eq(chatMessages.status, "sent"),
        sql`${chatMessages.senderId} != ${userId}`
      ));

    return result.count;
  }

  // Payment Gateway Configuration methods
  async getActivePaymentMethods(): Promise<PaymentGatewayConfig[]> {
    try {
      const result = await db
        .select()
        .from(paymentGatewayConfigs)
        .where(eq(paymentGatewayConfigs.isActive, true))
        .orderBy(paymentGatewayConfigs.gatewayName);
      console.log('Payment methods query result:', result);
      return result;
    } catch (error) {
      console.error('Error in getActivePaymentMethods:', error);
      throw error;
    }
  }

  // Card payment integration with MercadoPago
  async createCardPayment(data: { 
    token: string; 
    amount: number; 
    description: string; 
    installments: number;
    payment_method_id: string;
    payer: {
      email: string;
      identification: {
        type: string;
        number: string;
      };
    };
  }): Promise<any> {
    try {
      console.log('Creating card payment with data:', data);
      
      // Get MercadoPago credentials from database
      const mercadoPagoConfig = await db
        .select()
        .from(paymentGatewayConfigs)
        .where(and(
          eq(paymentGatewayConfigs.gatewayName, 'mercadopago'),
          eq(paymentGatewayConfigs.isActive, true)
        ))
        .limit(1);

      console.log('MercadoPago config:', mercadoPagoConfig);

      if (!mercadoPagoConfig.length || !mercadoPagoConfig[0].accessToken) {
        console.error('MercadoPago config missing or access token empty');
        throw new Error('MercadoPago access token not configured');
      }

      const accessToken = mercadoPagoConfig[0].accessToken;
      console.log('Using access token for card payment:', accessToken?.substring(0, 20) + '...');

      // Initialize MercadoPago client
      const client = new MercadoPagoConfig({ 
        accessToken: accessToken,
        options: { timeout: 5000 }
      });

      const payment = new Payment(client);

      // Create card payment
      const paymentRequest = {
        transaction_amount: data.amount,
        token: data.token,
        description: data.description,
        installments: data.installments,
        payment_method_id: data.payment_method_id,
        payer: {
          email: data.payer.email,
          identification: {
            type: data.payer.identification.type,
            number: data.payer.identification.number,
          },
        },
      };

      console.log('Card payment request:', paymentRequest);
      const response = await payment.create({ body: paymentRequest });
      console.log('Card payment response:', response);

      return {
        id: response.id,
        status: response.status,
        status_detail: response.status_detail,
        amount: response.transaction_amount,
        currency_id: response.currency_id,
        payment_method_id: response.payment_method_id,
        payment_type_id: response.payment_type_id,
        date_created: response.date_created,
        date_approved: response.date_approved,
      };
    } catch (error) {
      console.error('Error creating card payment:', error);
      throw error;
    }
  }

  // PIX payment integration with MercadoPago
  async createPixPayment(data: { amount: number; description: string; payerEmail: string }): Promise<any> {
    try {
      console.log('Creating PIX payment with data:', data);
      
      // Get MercadoPago credentials from database
      const mercadoPagoConfig = await db
        .select()
        .from(paymentGatewayConfigs)
        .where(and(
          eq(paymentGatewayConfigs.gatewayName, 'mercadopago'),
          eq(paymentGatewayConfigs.isActive, true)
        ))
        .limit(1);

      console.log('MercadoPago config:', mercadoPagoConfig);

      if (!mercadoPagoConfig.length || !mercadoPagoConfig[0].accessToken) {
        console.error('MercadoPago config missing or access token empty');
        throw new Error('MercadoPago access token not configured');
      }

      const accessToken = mercadoPagoConfig[0].accessToken;
      console.log('Using access token:', accessToken?.substring(0, 20) + '...');

      // Initialize MercadoPago client
      const client = new MercadoPagoConfig({ 
        accessToken: accessToken,
        options: { timeout: 5000 }
      });

      const payment = new Payment(client);

      // Create PIX payment
      const paymentRequest = {
        transaction_amount: data.amount,
        description: data.description,
        payment_method_id: 'pix',
        payer: {
          email: data.payerEmail
        }
      };

      const response = await payment.create({ body: paymentRequest });
      
      // Generate QR Code from PIX code
      let qrCodeDataURL = null;
      if (response.point_of_interaction?.transaction_data?.qr_code) {
        qrCodeDataURL = await QRCode.toDataURL(response.point_of_interaction.transaction_data.qr_code);
      }

      return {
        id: response.id,
        status: response.status,
        qr_code: response.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: response.point_of_interaction?.transaction_data?.qr_code_base64,
        qr_code_image: qrCodeDataURL,
        ticket_url: response.point_of_interaction?.transaction_data?.ticket_url,
        amount: response.transaction_amount,
        currency: response.currency_id,
        expires_at: response.date_of_expiration
      };
    } catch (error) {
      console.error('Error creating PIX payment:', error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
