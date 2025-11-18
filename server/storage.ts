import {
  users,
  providers,
  serviceCategories,
  services,
  providerServices,
  serviceChargingTypes,
  providerCategories,
  serviceRequests,
  providerServiceRequests,
  reviews,
  notifications,
  employees,
  serviceZones,
  cities,
  promotionalBanners,
  payments,
  coupons,
  serviceAssignments,
  systemSettings,
  fileUploads,
  userUploadStats,
  orders,
  orderItems,
  pageSettings,
  type User,
  type InsertUser,
  type Provider,
  type InsertProvider,
  type ServiceCategory,
  type InsertServiceCategory,
  type Service,
  type InsertService,
  type ProviderService,
  type InsertProviderService,
  type ServiceChargingType,
  type InsertServiceChargingType,
  type ProviderCategory,
  type InsertProviderCategory,
  type ServiceRequest,
  type InsertServiceRequest,
  type ProviderServiceRequest,
  type InsertProviderServiceRequest,
  type Review,
  type InsertReview,
  type Notification,
  type InsertNotification,
  type Employee,
  type InsertEmployee,
  type ServiceZone,
  type InsertServiceZone,
  type City,
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
  type PageSettings,
  type InsertPageSettings,
  customChargingTypes,
  type CustomChargingType,
  type InsertCustomChargingType,
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
  pageConfigurations,
  type PageConfiguration,
  type InsertPageConfiguration,
  socialSettings,
  type SocialSettings,
  type InsertSocialSettings,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, asc, sql, isNull, count, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import bcrypt from "bcrypt";
import { MercadoPagoConfig, Payment } from 'mercadopago';
import QRCode from 'qrcode';

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: number): Promise<void>;
  getAllUsers(): Promise<User[]>;
  
  // Provider management
  getProvider(id: number): Promise<(Provider & { user: User }) | undefined>;
  getProviderByUserId(userId: number): Promise<(Provider & { user: User }) | undefined>;
  createProvider(provider: InsertProvider): Promise<Provider>;
  updateProvider(id: number, provider: Partial<InsertProvider>): Promise<Provider>;
  getProvidersByCategory(categoryId: number, latitude?: number, longitude?: number, radius?: number): Promise<(Provider & { user: User })[]>;
  getAllProviders(): Promise<(Provider & { user: User })[]>;
  
  // Service categories
  getServiceCategories(): Promise<ServiceCategory[]>;
  getServiceCategory(id: number): Promise<ServiceCategory | undefined>;
  createServiceCategory(category: InsertServiceCategory): Promise<ServiceCategory>;
  updateServiceCategory(id: number, category: Partial<InsertServiceCategory>): Promise<ServiceCategory>;
  
  // Provider categories management
  getProviderCategories(providerId: number): Promise<(ProviderCategory & { category: ServiceCategory })[]>;
  addProviderCategory(providerId: number, categoryId: number, isPrimary?: boolean): Promise<ProviderCategory>;
  removeProviderCategory(providerId: number, categoryId: number): Promise<void>;
  updateProviderPrimaryCategory(providerId: number, categoryId: number): Promise<void>;
  
  // Global services catalog
  getServices(): Promise<(Service & { category: ServiceCategory; subcategory?: ServiceCategory })[]>;
  getService(id: number): Promise<(Service & { category: ServiceCategory; subcategory?: ServiceCategory }) | undefined>;
  getServicesByCategory(categoryId: number): Promise<(Service & { category: ServiceCategory })[]>;
  getServicesVisibleOnHome(): Promise<(Service & { category: ServiceCategory; subcategory?: ServiceCategory })[]>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, service: Partial<InsertService>): Promise<Service>;
  deleteService(id: number): Promise<void>;
  
  // Provider services (providers adopting services from catalog)
  getProviderServices(providerId: number): Promise<(ProviderService & { service: Service & { category: ServiceCategory }; chargingTypes: ServiceChargingType[] })[]>;
  getProviderServiceById(serviceId: number): Promise<any | null>;
  getAllProviderServices(): Promise<(ProviderService & { service: Service & { category: ServiceCategory }; provider: Provider & { user: User } })[]>;
  createProviderService(service: InsertProviderService): Promise<ProviderService>;
  updateProviderService(id: number, service: Partial<InsertProviderService>): Promise<ProviderService>;
  deleteProviderService(id: number): Promise<void>;
  
  // Provider adopts service from catalog
  adoptServiceFromCatalog(providerId: number, serviceId: number, serviceData: Partial<InsertProviderService>): Promise<ProviderService>;
  getAvailableServicesForProvider(providerId: number): Promise<Service[]>; // Services not yet adopted by this provider
  
  // Category-based service distribution
  getServicesByCategoryWithProviders(categoryId: number, city?: string, state?: string): Promise<Array<Service & { category: ServiceCategory; providers: (Provider & { user: User })[]; providerCount: number }>>;
  getAllServicesWithProviders(city?: string, state?: string): Promise<Array<Service & { category: ServiceCategory; providers: (Provider & { user: User })[]; providerCount: number }>>;
  getProvidersByCategoryAndRegion(categoryId: number, city?: string, state?: string): Promise<(Provider & { user: User })[]>;
  getServiceWithProviders(serviceId: number, city?: string, state?: string): Promise<(Service & { category: ServiceCategory; subcategory?: ServiceCategory; providers: (Provider & { user: User })[]; providerCount: number }) | null>
  
  // Service charging types
  getServiceChargingTypes(providerServiceId: number): Promise<ServiceChargingType[]>;
  createServiceChargingType(chargingType: InsertServiceChargingType): Promise<ServiceChargingType>;
  updateServiceChargingType(id: number, chargingType: Partial<InsertServiceChargingType>): Promise<ServiceChargingType>;
  deleteServiceChargingType(id: number): Promise<void>;
  bulkCreateServiceChargingTypes(chargingTypes: InsertServiceChargingType[]): Promise<ServiceChargingType[]>;
  
  // Custom charging types
  getChargingTypes(): Promise<CustomChargingType[]>;
  createChargingType(chargingType: InsertCustomChargingType): Promise<CustomChargingType>;
  updateChargingType(id: number, chargingType: Partial<InsertCustomChargingType>): Promise<CustomChargingType>;
  deleteChargingType(id: number): Promise<void>;
  
  // Provider service requests (for admin approval)
  getProviderServiceRequests(): Promise<(ProviderServiceRequest & { provider: Provider & { user: User }; category: ServiceCategory })[]>;
  getProviderServiceRequestsByProvider(providerId: number): Promise<(ProviderServiceRequest & { category: ServiceCategory })[]>;
  createProviderServiceRequest(request: InsertProviderServiceRequest): Promise<ProviderServiceRequest>;
  updateProviderServiceRequestStatus(id: number, status: "pending" | "approved" | "rejected", adminResponse?: string): Promise<ProviderServiceRequest>;
  
  // Service requests
  getServiceRequest(id: number): Promise<(ServiceRequest & { client: User; provider?: Provider; category: ServiceCategory }) | undefined>;
  getServiceRequestsByClient(clientId: number): Promise<(ServiceRequest & { provider?: Provider; category: ServiceCategory })[]>;
  getServiceRequestsByProvider(providerId: number): Promise<(ServiceRequest & { client: User; category: ServiceCategory })[]>;
  getServiceRequestsByCategories(categoryIds: number[]): Promise<(ServiceRequest & { client: User; category: ServiceCategory })[]>;
  createServiceRequest(request: InsertServiceRequest): Promise<ServiceRequest>;
  updateServiceRequest(id: number, request: Partial<InsertServiceRequest>): Promise<ServiceRequest>;
  
  // Reviews
  getReviewsByProvider(providerId: number): Promise<(Review & { client: User; serviceRequest: ServiceRequest })[]>;
  createReview(review: InsertReview): Promise<Review>;
  getReviewByServiceRequest(serviceRequestId: number): Promise<Review | undefined>;
  
  // Notifications
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  getNotificationsByUserType(userType: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  createAdminNotification(type: string, title: string, message: string, relatedId?: number): Promise<void>;
  markNotificationAsRead(id: number): Promise<void>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
  getUnreadNotificationsCount(userId: number): Promise<number>;
  getAdminUsers(): Promise<User[]>;
  
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
  getProviderOrders(providerId: number): Promise<any[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order>;
  addItemToCart(clientId: number, item: InsertOrderItem): Promise<OrderItem>;
  addCatalogItemToCart(clientId: number, item: { catalogServiceId: number; quantity: number; unitPrice: string; notes?: string; chargingType?: string }): Promise<OrderItem>;
  updateCartItem(itemId: number, quantity?: number, unitPrice?: string): Promise<OrderItem>;
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
  findOrCreateConversation(participantOneId: number, participantTwoId: number, serviceRequestId?: number, orderId?: number): Promise<ChatConversation>;
  createChatConversation(conversation: InsertChatConversation): Promise<ChatConversation>;
  updateChatConversation(id: number, conversation: Partial<InsertChatConversation>): Promise<ChatConversation>;

  // Chat messages
  getChatMessages(conversationId: number): Promise<(ChatMessage & { sender: User })[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  markMessageAsRead(messageId: number): Promise<ChatMessage>;
  getUnreadMessageCount(userId: number): Promise<number>;
  canUsersChat(userOneId: number, userTwoId: number): Promise<boolean>;

  // Page configurations
  getPageConfigurations(): Promise<PageConfiguration[]>;
  getPageConfiguration(pageKey: string): Promise<PageConfiguration | undefined>;
  createPageConfiguration(config: InsertPageConfiguration): Promise<PageConfiguration>;
  updatePageConfiguration(pageKey: string, config: Partial<InsertPageConfiguration>): Promise<PageConfiguration>;
  deletePageConfiguration(pageKey: string): Promise<void>;

  // Page settings
  getPageSettings(): Promise<PageSettings | undefined>;
  updatePageSettings(settings: Partial<InsertPageSettings>): Promise<PageSettings>;

  // Cities management
  getActiveCities(): Promise<City[]>;
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

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
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

  async getProvider(id: number): Promise<(Provider & { user: User }) | undefined> {
    const [provider] = await db
      .select({
        id: providers.id,
        userId: providers.userId,
        status: providers.status,
        city: providers.city,
        state: providers.state,
        serviceRadius: providers.serviceRadius,
        basePrice: providers.basePrice,
        description: providers.description,
        experience: providers.experience,
        cpfCnpj: providers.cpfCnpj,
        registrationStep: providers.registrationStep,
        registrationData: providers.registrationData,
        bankName: providers.bankName,
        bankAgency: providers.bankAgency,
        bankAccount: providers.bankAccount,
        documents: providers.documents,
        identityDocument: providers.identityDocument,
        portfolioImages: providers.portfolioImages,
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
      .where(eq(providers.id, id));
    return provider || undefined;
  }

  async getProviderByUserId(userId: number): Promise<(Provider & { user: User }) | undefined> {
    const [provider] = await db
      .select({
        id: providers.id,
        userId: providers.userId,
        status: providers.status,
        city: providers.city,
        state: providers.state,
        serviceRadius: providers.serviceRadius,
        basePrice: providers.basePrice,
        description: providers.description,
        experience: providers.experience,
        cpfCnpj: providers.cpfCnpj,
        registrationStep: providers.registrationStep,
        registrationData: providers.registrationData,
        bankName: providers.bankName,
        bankAgency: providers.bankAgency,
        bankAccount: providers.bankAccount,
        documents: providers.documents,
        identityDocument: providers.identityDocument,
        portfolioImages: providers.portfolioImages,
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
      .where(eq(providers.userId, userId));
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
    // More flexible approach: get all providers that have ANY service in the requested category
    let query = db
      .selectDistinct({
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
      .innerJoin(services, eq(providerServices.serviceId, services.id))
      .where(
        and(
          eq(services.categoryId, categoryId),
          eq(providers.status, "approved"),
          eq(users.isActive, true),
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
      
      return await query
        .where(distanceFilter)
        .orderBy(desc(providers.rating));
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

  // Provider categories management
  async getProviderCategories(providerId: number): Promise<(ProviderCategory & { category: ServiceCategory })[]> {
    const results = await db
      .select({
        providerCategory: providerCategories,
        category: serviceCategories,
      })
      .from(providerCategories)
      .innerJoin(serviceCategories, eq(providerCategories.categoryId, serviceCategories.id))
      .where(and(
        eq(providerCategories.providerId, providerId),
        eq(serviceCategories.isActive, true)
      ))
      .orderBy(desc(providerCategories.isPrimary), asc(serviceCategories.name));

    return results.map(r => ({
      ...r.providerCategory,
      category: r.category,
    }));
  }

  async addProviderCategory(providerId: number, categoryId: number, isPrimary: boolean = false): Promise<ProviderCategory> {
    // Check if provider-category relationship already exists
    const existing = await db
      .select()
      .from(providerCategories)
      .where(and(
        eq(providerCategories.providerId, providerId),
        eq(providerCategories.categoryId, categoryId)
      ));

    if (existing.length > 0) {
      throw new Error('Prestador já está associado a esta categoria');
    }

    // If setting as primary, unset other primary categories
    if (isPrimary) {
      await db
        .update(providerCategories)
        .set({ isPrimary: false })
        .where(eq(providerCategories.providerId, providerId));
    }

    const [newProviderCategory] = await db
      .insert(providerCategories)
      .values({
        providerId,
        categoryId,
        isPrimary,
      })
      .returning();

    return newProviderCategory;
  }

  async removeProviderCategory(providerId: number, categoryId: number): Promise<void> {
    await db
      .delete(providerCategories)
      .where(and(
        eq(providerCategories.providerId, providerId),
        eq(providerCategories.categoryId, categoryId)
      ));
  }

  async updateProviderPrimaryCategory(providerId: number, categoryId: number): Promise<void> {
    // First, unset all primary categories for this provider
    await db
      .update(providerCategories)
      .set({ isPrimary: false })
      .where(eq(providerCategories.providerId, providerId));

    // Then set the new primary category
    await db
      .update(providerCategories)
      .set({ isPrimary: true })
      .where(and(
        eq(providerCategories.providerId, providerId),
        eq(providerCategories.categoryId, categoryId)
      ));
  }

  // Global services catalog
  async getServices(): Promise<(Service & { category: ServiceCategory; subcategory?: ServiceCategory })[]> {
    const result = await db
      .select({
        service: services,
        category: serviceCategories,
      })
      .from(services)
      .innerJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
      .where(eq(services.isActive, true));

    return result.map(r => ({
      ...r.service,
      category: r.category,
      subcategory: undefined, // TODO: implement subcategory join
    }));
  }

  async getService(id: number): Promise<(Service & { category: ServiceCategory; subcategory?: ServiceCategory }) | undefined> {
    const [result] = await db
      .select({
        service: services,
        category: serviceCategories,
      })
      .from(services)
      .innerJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
      .where(eq(services.id, id));

    if (!result) return undefined;

    return {
      ...result.service,
      category: result.category,
      subcategory: undefined, // TODO: implement subcategory join
    };
  }

  async getServicesByCategory(categoryId: number): Promise<(Service & { category: ServiceCategory })[]> {
    const result = await db
      .select({
        service: services,
        category: serviceCategories,
      })
      .from(services)
      .innerJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
      .where(and(
        eq(services.categoryId, categoryId),
        eq(services.isActive, true)
      ));

    return result.map(r => ({
      ...r.service,
      category: r.category,
    }));
  }

  async getServicesVisibleOnHome(): Promise<(Service & { category: ServiceCategory; subcategory?: ServiceCategory })[]> {
    const result = await db
      .select({
        service: services,
        category: serviceCategories,
      })
      .from(services)
      .innerJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
      .where(and(
        eq(services.isActive, true),
        eq(services.visibleOnHome, true)
      ));

    return result.map(r => ({
      ...r.service,
      category: r.category,
      subcategory: undefined, // TODO: implement subcategory join
    }));
  }

  async createService(service: InsertService): Promise<Service> {
    const [newService] = await db
      .insert(services)
      .values(service)
      .returning();
    return newService;
  }

  async updateService(id: number, service: Partial<InsertService>): Promise<Service> {
    const [updatedService] = await db
      .update(services)
      .set({ ...service, updatedAt: new Date() })
      .where(eq(services.id, id))
      .returning();
    return updatedService;
  }

  async deleteService(id: number): Promise<void> {
    await db.update(services)
      .set({ isActive: false })
      .where(eq(services.id, id));
  }

  async getProviderServices(providerId: number): Promise<(ProviderService & { service?: Service & { category: ServiceCategory }; category: ServiceCategory; chargingTypes: ServiceChargingType[] })[]> {
    // Get all provider services with their categories and global service info (if any)
    const providerServicesList = await db
      .select({
        providerService: providerServices,
        category: serviceCategories,
        service: services,
      })
      .from(providerServices)
      .innerJoin(serviceCategories, eq(providerServices.categoryId, serviceCategories.id))
      .leftJoin(services, eq(providerServices.serviceId, services.id))
      .where(eq(providerServices.providerId, providerId));

    // Get charging types for each service
    const servicesWithChargingTypes = await Promise.all(
      providerServicesList.map(async (item) => {
        const chargingTypes = await this.getServiceChargingTypes(item.providerService.id);
        return {
          ...item.providerService,
          service: item.service ? {
            ...item.service,
            category: item.category,
          } : undefined,
          category: item.category,
          chargingTypes,
        };
      })
    );

    return servicesWithChargingTypes;
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

  async checkProviderServiceDependencies(id: number): Promise<{
    hasOrderItems: boolean;
    orderItemsCount: number;
    hasActiveOrders: boolean;
    chargingTypesCount: number;
    canDelete: boolean;
    warnings: string[];
  }> {
    // Check order items that reference this service
    const orderItemsQuery = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        orderStatus: orders.status,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(eq(orderItems.providerServiceId, id));

    // Check charging types
    const chargingTypesQuery = await db
      .select({ id: serviceChargingTypes.id })
      .from(serviceChargingTypes)
      .where(eq(serviceChargingTypes.providerServiceId, id));

    const hasOrderItems = orderItemsQuery.length > 0;
    const hasActiveOrders = orderItemsQuery.some(item => 
      item.orderStatus !== 'cancelled' && item.orderStatus !== 'completed'
    );
    
    const warnings: string[] = [];
    let canDelete = true;

    if (hasActiveOrders) {
      warnings.push('Este serviço possui pedidos ativos que impedem a exclusão');
      canDelete = false;
    }

    if (hasOrderItems && !hasActiveOrders) {
      warnings.push('Este serviço possui histórico de pedidos que serão mantidos');
    }

    if (chargingTypesQuery.length > 0) {
      warnings.push('Os tipos de cobrança associados serão removidos');
    }

    return {
      hasOrderItems,
      orderItemsCount: orderItemsQuery.length,
      hasActiveOrders,
      chargingTypesCount: chargingTypesQuery.length,
      canDelete,
      warnings,
    };
  }

  async deleteProviderServiceSafe(id: number, force: boolean = false): Promise<{ success: boolean; message: string; warnings?: string[] }> {
    // Check dependencies first
    const dependencies = await this.checkProviderServiceDependencies(id);
    
    if (!dependencies.canDelete && !force) {
      return {
        success: false,
        message: 'Não é possível excluir este serviço devido às dependências existentes',
        warnings: dependencies.warnings,
      };
    }

    try {
      if (force && (dependencies.hasOrderItems || dependencies.hasActiveOrders)) {
        // For forced deletion with order dependencies, migrate to preserve history
        await db.transaction(async (tx) => {
          // Get the current service data
          const [currentService] = await tx.select().from(providerServices).where(eq(providerServices.id, id));
          if (!currentService) {
            throw new Error('Serviço não encontrado');
          }

          // Create an archived version first
          const [archivedService] = await tx.insert(providerServices).values({
            providerId: currentService.providerId,
            categoryId: currentService.categoryId,
            name: `[MIGRADO] ${currentService.name || 'Serviço Antigo'}`,
            description: `Serviço migrado do sistema antigo. ID original: ${id}. ${currentService.description || ''}`,
            price: currentService.price,
            minimumPrice: currentService.minimumPrice,
            estimatedDuration: currentService.estimatedDuration,
            requirements: currentService.requirements,
            serviceZone: currentService.serviceZone,
            images: currentService.images,
            isActive: false, // Mark as inactive
            createdAt: currentService.createdAt,
            updatedAt: new Date(),
          }).returning();

          // Update all order items to point to the archived service
          await tx.update(orderItems)
            .set({ providerServiceId: archivedService.id })
            .where(eq(orderItems.providerServiceId, id));

          // Note: Service requests and provider earnings tables don't have providerServiceId
          // They are handled differently in the schema

          // Delete associated charging types
          if (dependencies.chargingTypesCount > 0) {
            await tx.delete(serviceChargingTypes).where(eq(serviceChargingTypes.providerServiceId, id));
          }

          // Now safely delete the original service
          await tx.delete(providerServices).where(eq(providerServices.id, id));
        });

        return {
          success: true,
          message: 'Serviço antigo migrado e removido com sucesso. Histórico preservado em versão arquivada.',
          warnings: [...(dependencies.warnings || []), 'Dados históricos migrados para preservar integridade'],
        };
      } else {
        // Normal deletion for services without dependencies
        await db.transaction(async (tx) => {
          // Delete associated charging types
          if (dependencies.chargingTypesCount > 0) {
            await tx.delete(serviceChargingTypes).where(eq(serviceChargingTypes.providerServiceId, id));
          }

          // Delete the provider service
          await tx.delete(providerServices).where(eq(providerServices.id, id));
        });

        return {
          success: true,
          message: 'Serviço excluído com sucesso',
          warnings: dependencies.warnings,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Erro ao excluir serviço: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        warnings: dependencies.warnings,
      };
    }
  }

  // Keep the original method for backward compatibility but mark as deprecated
  async deleteProviderService(id: number): Promise<void> {
    // First delete associated charging types
    await db.delete(serviceChargingTypes).where(eq(serviceChargingTypes.providerServiceId, id));
    // Then delete the service
    await db.delete(providerServices).where(eq(providerServices.id, id));
  }

  // Provider adopts service from catalog
  async adoptServiceFromCatalog(providerId: number, serviceId: number, serviceData: Partial<InsertProviderService>): Promise<ProviderService> {
    // Check if provider already adopted this service
    const existingService = await db
      .select()
      .from(providerServices)
      .where(
        and(
          eq(providerServices.providerId, providerId),
          eq(providerServices.serviceId, serviceId)
        )
      )
      .limit(1);

    if (existingService.length > 0) {
      throw new Error("Você já adotou este serviço do catálogo");
    }

    // Get the catalog service to get its category
    const catalogService = await this.getService(serviceId);
    if (!catalogService) {
      throw new Error("Service not found in catalog");
    }

    const [newProviderService] = await db
      .insert(providerServices)
      .values({
        providerId,
        serviceId,
        categoryId: catalogService.categoryId, // Set category from catalog service
        ...serviceData,
      })
      .returning();

    return newProviderService;
  }

  async getAvailableServicesForProvider(providerId: number): Promise<Service[]> {
    // Get all services from catalog
    const allServices = await this.getServices();
    
    // Get services already adopted by this provider
    const adoptedServices = await db
      .select({ serviceId: providerServices.serviceId })
      .from(providerServices)
      .where(eq(providerServices.providerId, providerId));
    
    const adoptedServiceIds = adoptedServices.map(ps => ps.serviceId);
    
    // Filter out already adopted services
    return allServices.filter(service => !adoptedServiceIds.includes(service.id));
  }

  // Category-based service distribution methods
  async getProvidersByCategoryAndRegion(categoryId: number, city?: string, state?: string): Promise<(Provider & { user: User })[]> {
    // Get all provider IDs that have this category
    const providerCategoriesResult = await db
      .select({ providerId: providerCategories.providerId })
      .from(providerCategories)
      .where(eq(providerCategories.categoryId, categoryId));
    
    const providerIds = providerCategoriesResult.map(pc => pc.providerId);
    
    if (providerIds.length === 0) {
      return [];
    }
    
    // Build the where conditions for filtering
    const conditions: any[] = [
      inArray(providers.id, providerIds),
      eq(providers.status, 'approved')
    ];
    
    if (city) {
      conditions.push(eq(providers.city, city));
    }
    
    if (state) {
      conditions.push(eq(providers.state, state));
    }
    
    // Get providers with user data
    const result = await db
      .select({
        provider: providers,
        user: users,
      })
      .from(providers)
      .innerJoin(users, eq(providers.userId, users.id))
      .where(and(...conditions));
    
    return result.map(r => ({ ...r.provider, user: r.user }));
  }

  async getServicesByCategoryWithProviders(categoryId: number, city?: string, state?: string): Promise<Array<Service & { category: ServiceCategory; providers: (Provider & { user: User })[]; providerCount: number }>> {
    // Get all services in this category
    const categoryServices = await db
      .select({
        service: services,
        category: serviceCategories,
      })
      .from(services)
      .innerJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
      .where(and(
        eq(services.categoryId, categoryId),
        eq(services.isActive, true)
      ));
    
    // For each service, find providers who have adopted it
    const servicesWithProviders = await Promise.all(
      categoryServices.map(async ({ service, category }) => {
        // Build conditions for provider filtering
        const providerConditions: any[] = [
          eq(providerServices.serviceId, service.id),
          eq(providerServices.isActive, true),
          eq(providers.status, 'approved')
        ];
        
        if (city) {
          providerConditions.push(eq(providers.city, city));
        }
        
        if (state) {
          providerConditions.push(eq(providers.state, state));
        }
        
        // Get providers who adopted this specific service
        const providersForService = await db
          .select({
            provider: providers,
            user: users,
          })
          .from(providerServices)
          .innerJoin(providers, eq(providerServices.providerId, providers.id))
          .innerJoin(users, eq(providers.userId, users.id))
          .where(and(...providerConditions));
        
        const providerList = providersForService.map(r => ({ ...r.provider, user: r.user }));
        
        return {
          ...service,
          category,
          providers: providerList,
          providerCount: providerList.length
        };
      })
    );
    
    // Filter out services with no providers in the selected region
    return servicesWithProviders.filter(service => service.providerCount > 0);
  }

  async getAllServicesWithProviders(city?: string, state?: string): Promise<Array<Service & { category: ServiceCategory; providers: (Provider & { user: User })[]; providerCount: number }>> {
    // Get all active services from the catalog
    const allServices = await db
      .select({
        service: services,
        category: serviceCategories,
      })
      .from(services)
      .innerJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
      .where(eq(services.isActive, true));
    
    // For each service, find providers who have adopted it
    const servicesWithProviders = await Promise.all(
      allServices.map(async ({ service, category }) => {
        // Build conditions for provider filtering
        const providerConditions: any[] = [
          eq(providerServices.serviceId, service.id),
          eq(providerServices.isActive, true),
          eq(providers.status, 'approved')
        ];
        
        if (city) {
          providerConditions.push(eq(providers.city, city));
        }
        
        if (state) {
          providerConditions.push(eq(providers.state, state));
        }
        
        // Get providers who adopted this specific service
        const providersForService = await db
          .select({
            provider: providers,
            user: users,
          })
          .from(providerServices)
          .innerJoin(providers, eq(providerServices.providerId, providers.id))
          .innerJoin(users, eq(providers.userId, users.id))
          .where(and(...providerConditions));
        
        const providerList = providersForService.map(r => ({ ...r.provider, user: r.user }));
        
        return {
          ...service,
          category,
          providers: providerList,
          providerCount: providerList.length
        };
      })
    );
    
    // Filter out services with no providers in the selected region
    return servicesWithProviders.filter(service => service.providerCount > 0);
  }

  async getServiceWithProviders(serviceId: number, city?: string, state?: string): Promise<(Service & { category: ServiceCategory; subcategory?: ServiceCategory; providers: any[]; providerCount: number }) | null> {
    // Get the service
    const service = await this.getService(serviceId);
    
    if (!service) {
      return null;
    }
    
    // Build conditions for provider filtering
    const providerConditions: any[] = [
      eq(providerServices.serviceId, serviceId),
      eq(providerServices.isActive, true),
      eq(providers.status, 'approved')
    ];
    
    if (city) {
      providerConditions.push(eq(providers.city, city));
    }
    
    if (state) {
      providerConditions.push(eq(providers.state, state));
    }
    
    // Get providers who adopted this specific service
    const providersForService = await db
      .select({
        providerService: providerServices,
        provider: providers,
        user: users,
      })
      .from(providerServices)
      .innerJoin(providers, eq(providerServices.providerId, providers.id))
      .innerJoin(users, eq(providers.userId, users.id))
      .where(and(...providerConditions));
    
    // Get charging types for each provider service
    const providerList = await Promise.all(
      providersForService.map(async (r) => {
        const chargingTypes = await this.getServiceChargingTypes(r.providerService.id);
        return {
          ...r.provider,
          user: r.user,
          providerServiceId: r.providerService.id,
          businessName: r.providerService.customName || r.user.name,
          chargingTypes: chargingTypes.map(ct => ({
            id: ct.id,
            chargingType: ct.chargingType,
            price: ct.price,
            description: ct.description
          })),
          serviceZone: r.providerService.serviceZone
        };
      })
    );
    
    return {
      ...service,
      providers: providerList,
      providerCount: providerList.length
    };
  }

  // Service charging types methods
  async getServiceChargingTypes(providerServiceId: number): Promise<ServiceChargingType[]> {
    return await db
      .select()
      .from(serviceChargingTypes)
      .where(and(
        eq(serviceChargingTypes.providerServiceId, providerServiceId),
        eq(serviceChargingTypes.isActive, true)
      ))
      .orderBy(asc(serviceChargingTypes.chargingType));
  }

  async createServiceChargingType(chargingType: InsertServiceChargingType): Promise<ServiceChargingType> {
    const [newChargingType] = await db
      .insert(serviceChargingTypes)
      .values(chargingType)
      .returning();
    return newChargingType;
  }

  async updateServiceChargingType(id: number, chargingType: Partial<InsertServiceChargingType>): Promise<ServiceChargingType> {
    const [updatedChargingType] = await db
      .update(serviceChargingTypes)
      .set({ ...chargingType, updatedAt: new Date() })
      .where(eq(serviceChargingTypes.id, id))
      .returning();
    return updatedChargingType;
  }

  async deleteServiceChargingType(id: number): Promise<void> {
    await db.delete(serviceChargingTypes).where(eq(serviceChargingTypes.id, id));
  }

  async bulkCreateServiceChargingTypes(chargingTypes: InsertServiceChargingType[]): Promise<ServiceChargingType[]> {
    return await db
      .insert(serviceChargingTypes)
      .values(chargingTypes)
      .returning();
  }

  // Custom charging types methods
  async getChargingTypes(): Promise<CustomChargingType[]> {
    return await db
      .select()
      .from(customChargingTypes)
      .orderBy(customChargingTypes.name);
  }

  async createChargingType(chargingType: InsertCustomChargingType): Promise<CustomChargingType> {
    const [newChargingType] = await db
      .insert(customChargingTypes)
      .values(chargingType)
      .returning();
    return newChargingType;
  }

  async updateChargingType(id: number, chargingType: Partial<InsertCustomChargingType>): Promise<CustomChargingType> {
    const [updatedChargingType] = await db
      .update(customChargingTypes)
      .set({ ...chargingType, updatedAt: new Date() })
      .where(eq(customChargingTypes.id, id))
      .returning();
    return updatedChargingType;
  }

  async deleteChargingType(id: number): Promise<void> {
    await db.delete(customChargingTypes).where(eq(customChargingTypes.id, id));
  }

  async getAllProviderServices(): Promise<any[]> {
    try {
      console.log('Getting all provider services...');
      
      const results = await db
        .select({
          providerService: providerServices,
          category: serviceCategories,
          provider: providers,
          user: users,
          service: services,
        })
        .from(providerServices)
        .innerJoin(serviceCategories, eq(providerServices.categoryId, serviceCategories.id))
        .innerJoin(providers, eq(providerServices.providerId, providers.id))
        .innerJoin(users, eq(providers.userId, users.id))
        .leftJoin(services, eq(providerServices.serviceId, services.id))
        .where(eq(providerServices.isActive, true))
        .orderBy(asc(serviceCategories.name), asc(providerServices.name));

      console.log(`Found ${results.length} provider services`);

      // Get charging types for each service
      const servicesWithChargingTypes = await Promise.all(
        results.map(async (result) => {
          const chargingTypes = await this.getServiceChargingTypes(result.providerService.id);
          return {
            id: result.providerService.id,
            providerId: result.providerService.providerId,
            categoryId: result.providerService.categoryId,
            serviceId: result.providerService.serviceId,
            name: result.providerService.name,
            description: result.providerService.description,
            price: result.providerService.price,
            minimumPrice: result.providerService.minimumPrice,
            estimatedDuration: result.providerService.estimatedDuration,
            requirements: result.providerService.requirements,
            serviceZone: result.providerService.serviceZone,
            images: result.providerService.images,
            customName: result.providerService.customName,
            customDescription: result.providerService.customDescription,
            serviceRadius: result.providerService.serviceRadius,
            serviceZones: result.providerService.serviceZones,
            availableHours: result.providerService.availableHours,
            customRequirements: result.providerService.customRequirements,
            portfolioImages: result.providerService.portfolioImages,
            specialNotes: result.providerService.specialNotes,
            isActive: result.providerService.isActive,
            createdAt: result.providerService.createdAt,
            updatedAt: result.providerService.updatedAt,
            chargingTypes, // Add charging types here
            category: {
              id: result.category.id,
              name: result.category.name,
              description: result.category.description,
              icon: result.category.icon,
              imageUrl: result.category.imageUrl,
              color: result.category.color,
            },
            service: result.service ? {
              id: result.service.id,
              name: result.service.name,
              description: result.service.description,
              shortDescription: result.service.shortDescription,
              estimatedDuration: result.service.estimatedDuration,
              durationType: result.service.durationType,
              materialsIncluded: result.service.materialsIncluded,
              materialsDescription: result.service.materialsDescription,
              defaultChargingType: result.service.defaultChargingType,
              suggestedMinPrice: result.service.suggestedMinPrice,
              suggestedMaxPrice: result.service.suggestedMaxPrice,
              tags: result.service.tags,
              requirements: result.service.requirements,
              imageUrl: result.service.imageUrl,
              category: result.category,
            } : null,
            provider: {
              id: result.provider.id,
              status: result.provider.status,
              rating: result.provider.rating,
              totalReviews: result.provider.totalReviews,
              city: result.provider.city,
              state: result.provider.state,
              description: result.provider.description,
              user: {
                id: result.user.id,
                name: result.user.name,
                email: result.user.email,
                phone: result.user.phone,
                city: result.user.city,
                state: result.user.state,
                latitude: result.user.latitude,
                longitude: result.user.longitude,
              }
            }
          };
        })
      );

      return servicesWithChargingTypes;
    } catch (error) {
      console.error('Error in getAllProviderServices:', error);
      return []; // Return empty array instead of throwing
    }
  }

  async getProviderServiceById(serviceId: number): Promise<any | null> {
    try {
      const results = await db
        .select({
          providerService: providerServices,
          service: services,
          category: serviceCategories,
          provider: providers,
          user: users,
        })
        .from(providerServices)
        .innerJoin(services, eq(providerServices.serviceId, services.id))
        .innerJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
        .innerJoin(providers, eq(providerServices.providerId, providers.id))
        .innerJoin(users, eq(providers.userId, users.id))
        .where(eq(providerServices.id, serviceId))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      const row = results[0];
      return {
        ...row.providerService,
        service: {
          ...row.service,
          category: row.category,
        },
        provider: {
          ...row.provider,
          user: row.user
        }
      };
    } catch (error) {
      console.error('Error in getProviderServiceById:', error);
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
    // First try to get categories from the new providerCategories table
    let providerCategoryRecords = await db
      .select({ categoryId: providerCategories.categoryId })
      .from(providerCategories)
      .where(eq(providerCategories.providerId, providerId));
    
    // If no categories found in providerCategories table, fall back to deriving from services
    if (providerCategoryRecords.length === 0) {
      providerCategoryRecords = await db
        .select({ categoryId: services.categoryId })
        .from(providerServices)
        .innerJoin(services, eq(providerServices.serviceId, services.id))
        .where(eq(providerServices.providerId, providerId));
    }
    
    const categoryIds = providerCategoryRecords.map(ps => ps.categoryId);
    
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

  // Provider bookings - returns only service requests (open requests where providers make proposals)
  // Orders from catalog are now fetched separately via getProviderOrders()
  async getProviderBookings(providerId: number): Promise<any[]> {
    try {
      console.log(`Getting provider service requests for provider ${providerId}`);
      
      // Get provider's categories
      let providerCategoryRecords = await db
        .select({ categoryId: providerCategories.categoryId })
        .from(providerCategories)
        .where(eq(providerCategories.providerId, providerId));
      
      // Fallback to deriving from services if no categories in providerCategories
      if (providerCategoryRecords.length === 0) {
        providerCategoryRecords = await db
          .select({ categoryId: providerServices.categoryId })
          .from(providerServices)
          .where(eq(providerServices.providerId, providerId))
          .groupBy(providerServices.categoryId);
      }
      
      const categoryIds = providerCategoryRecords.map(pc => pc.categoryId);
      
      if (categoryIds.length === 0) {
        console.log(`Provider ${providerId} has no categories defined, returning empty list`);
        return [];
      }
      
      console.log(`Provider ${providerId} has services in categories: ${categoryIds.join(', ')}`);
      
      // Get service requests for categories where provider has services
      const serviceRequestsData = await this.getServiceRequestsByProviderCategories(providerId, categoryIds);
      console.log(`Found ${serviceRequestsData.length} service requests`);
      
      // Transform to unified format
      return serviceRequestsData.map(sr => ({
        id: sr.id,
        clientId: sr.clientId,
        categoryId: sr.categoryId,
        providerId: sr.providerId,
        status: sr.status,
        totalAmount: sr.totalAmount || "0.00",
        paymentMethod: sr.paymentMethod || "cash",
        paymentStatus: sr.paymentStatus || "pending",
        address: sr.address,
        cep: sr.cep,
        city: sr.city,
        state: sr.state,
        latitude: sr.latitude,
        longitude: sr.longitude,
        scheduledAt: sr.scheduledAt,
        notes: sr.description,
        createdAt: sr.createdAt,
        updatedAt: sr.updatedAt,
        title: sr.title,
        client: sr.client,
        category: sr.category,
        type: 'service_request' as const
      }));
      
    } catch (error) {
      console.error('Error in getProviderBookings:', error);
      return [];
    }
  }

  async getServiceRequestsByProviderCategories(providerId: number, categoryIds: number[]): Promise<(ServiceRequest & { client: User; category: ServiceCategory })[]> {
    // Show pending requests in provider's categories + all requests assigned to this provider
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
        client: users,
        category: serviceCategories,
      })
      .from(serviceRequests)
      .innerJoin(users, eq(serviceRequests.clientId, users.id))
      .innerJoin(serviceCategories, eq(serviceRequests.categoryId, serviceCategories.id))
      .where(
        and(
          inArray(serviceRequests.categoryId, categoryIds),
          or(
            // Show pending requests in provider's categories
            and(
              eq(serviceRequests.status, "pending"),
              isNull(serviceRequests.providerId)
            ),
            // Show all requests assigned to this provider
            eq(serviceRequests.providerId, providerId)
          )
        )
      )
      .orderBy(desc(serviceRequests.createdAt));
    
    return results as any;
  }

  async getServiceRequestsByCategoryForProvider(providerId: number, categoryId: number): Promise<(ServiceRequest & { client: User; category: ServiceCategory })[]> {
    // Get all requests in provider's category (pending ones + assigned to this provider)
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
        and(
          eq(serviceRequests.categoryId, categoryId),
          or(
            // Show pending requests in provider's category
            and(
              eq(serviceRequests.status, "pending"),
              isNull(serviceRequests.providerId)
            ),
            // Show all requests assigned to this provider
            eq(serviceRequests.providerId, providerId)
          )
        )
      )
      .orderBy(desc(serviceRequests.createdAt));
  }

  async getServiceRequestsByCategories(categoryIds: number[]): Promise<(ServiceRequest & { client: User; category: ServiceCategory })[]> {
    if (categoryIds.length === 0) {
      return [];
    }
    
    // Get all pending requests in specified categories without assigned provider
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
        and(
          inArray(serviceRequests.categoryId, categoryIds),
          eq(serviceRequests.status, "pending"),
          isNull(serviceRequests.providerId)
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
    if (request.address !== undefined) cleanRequest.address = request.address;
    if (request.cep !== undefined) cleanRequest.cep = request.cep;
    if (request.city !== undefined) cleanRequest.city = request.city;
    if (request.state !== undefined) cleanRequest.state = request.state;
    if (request.totalAmount !== undefined) cleanRequest.totalAmount = request.totalAmount;
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
    // Check if review already exists for this service request
    const existingReview = await db
      .select()
      .from(reviews)
      .where(eq(reviews.serviceRequestId, review.serviceRequestId))
      .limit(1);
    
    if (existingReview.length > 0) {
      throw new Error("Uma avaliação já foi registrada para este serviço");
    }
    
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

  async getReviewByServiceRequest(serviceRequestId: number): Promise<Review | undefined> {
    const [review] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.serviceRequestId, serviceRequestId))
      .limit(1);
    
    return review;
  }

  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async getNotificationsByUserType(userType: string): Promise<Notification[]> {
    return await db
      .select({
        id: notifications.id,
        userId: notifications.userId,
        type: notifications.type,
        title: notifications.title,
        message: notifications.message,
        relatedId: notifications.relatedId,
        isRead: notifications.isRead,
        createdAt: notifications.createdAt
      })
      .from(notifications)
      .innerJoin(users, eq(notifications.userId, users.id))
      .where(eq(users.userType, userType as any))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async createAdminNotification(type: string, title: string, message: string, relatedId?: number): Promise<void> {
    const adminUsers = await this.getAdminUsers();
    
    const notificationData = adminUsers.map(admin => ({
      userId: admin.id,
      type,
      title,
      message,
      relatedId: relatedId || null,
      isRead: false
    }));

    if (notificationData.length > 0) {
      await db.insert(notifications).values(notificationData);
    }
  }

  async notifyAllAdmins(notification: { type: string; title: string; message: string; relatedId?: number }): Promise<void> {
    await this.createAdminNotification(
      notification.type,
      notification.title,
      notification.message,
      notification.relatedId
    );
  }

  async markNotificationAsRead(id: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  async markAllNotificationsAsRead(userId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  }

  async getUnreadNotificationsCount(userId: number): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    
    return result[0]?.count || 0;
  }

  async getAdminUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.userType, 'admin'));
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

  async getAllServicesForAdmin(): Promise<(ProviderService & { service: Service & { category: ServiceCategory }; provider: Provider & { user: User } })[]> {
    const results = await db
      .select({
        providerService: providerServices,
        service: services,
        category: serviceCategories,
        provider: providers,
        user: users,
      })
      .from(providerServices)
      .innerJoin(services, eq(providerServices.serviceId, services.id))
      .innerJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
      .innerJoin(providers, eq(providerServices.providerId, providers.id))
      .innerJoin(users, eq(providers.userId, users.id))
      .orderBy(desc(providerServices.createdAt));

    return results.map(row => ({
      ...row.providerService,
      service: {
        ...row.service,
        category: row.category,
      },
      provider: {
        ...row.provider,
        user: row.user,
      },
    }));
  }

  async getAllBookingsForAdmin(): Promise<(ServiceRequest & { client: User; provider?: Provider & { user: User }; category: ServiceCategory })[]> {
    try {
      console.log('Getting all bookings for admin...');
      
      // Get service requests with provider category and client data
      const serviceRequestsData = await db
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
        .orderBy(desc(serviceRequests.createdAt));

      console.log(`Found ${serviceRequestsData.length} service requests`);

      // Get all orders (those without provider assignment and those with provider assignment)
      const ordersData = await db
        .select({
          id: orders.id,
          clientId: orders.clientId,
          providerId: orders.providerId,
          status: orders.status,
          totalAmount: orders.totalAmount,
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
        })
        .from(orders)
        .innerJoin(users, eq(orders.clientId, users.id))
        .orderBy(desc(orders.createdAt));

      console.log(`Found ${ordersData.length} orders`);

      // Transform service requests to unified format
      const transformedServiceRequests = await Promise.all(
        serviceRequestsData.map(async (sr) => {
          let providerWithUser = null;
          if (sr.providerId) {
            const providerData = await db
              .select()
              .from(providers)
              .innerJoin(users, eq(providers.userId, users.id))
              .where(eq(providers.id, sr.providerId))
              .limit(1);
            
            if (providerData[0]) {
              providerWithUser = {
                ...providerData[0].providers,
                user: providerData[0].users,
              };
            }
          }

          return {
            id: sr.id,
            clientId: sr.clientId,
            categoryId: sr.categoryId,
            providerId: sr.providerId,
            title: sr.title,
            description: sr.description,
            address: sr.address || sr.client.address || "Endereço não informado",
            cep: sr.cep || sr.client.cep || "",
            city: sr.city || sr.client.city || "",
            state: sr.state || sr.client.state || "",
            latitude: sr.latitude,
            longitude: sr.longitude,
            estimatedPrice: sr.estimatedPrice,
            finalPrice: sr.finalPrice,
            totalAmount: sr.totalAmount,
            paymentMethod: sr.paymentMethod,
            paymentStatus: sr.paymentStatus,
            status: sr.status,
            scheduledAt: sr.scheduledAt,
            completedAt: sr.completedAt,
            createdAt: sr.createdAt,
            updatedAt: sr.updatedAt,
            client: sr.client,
            provider: providerWithUser,
            category: sr.category,
            type: 'service_request' as const
          };
        })
      );

      // Transform orders to unified format
      const transformedOrders = await Promise.all(
        ordersData.map(async (order) => {
          let providerWithUser = null;
          if (order.providerId) {
            const providerData = await db
              .select()
              .from(providers)
              .innerJoin(users, eq(providers.userId, users.id))
              .where(eq(providers.id, order.providerId))
              .limit(1);
            
            if (providerData[0]) {
              providerWithUser = {
                ...providerData[0].providers,
                user: providerData[0].users,
              };
            }
          }

          return {
            id: order.id,
            clientId: order.clientId,
            categoryId: 0, // Orders don't have categories yet
            providerId: order.providerId,
            title: "Pedido do Catálogo",
            description: order.notes || "Pedido através do catálogo de serviços",
            address: order.address || order.client.address || "Endereço não informado",
            cep: order.cep || order.client.cep || "",
            city: order.city || order.client.city || "",
            state: order.state || order.client.state || "",
            latitude: order.latitude,
            longitude: order.longitude,
            estimatedPrice: order.totalAmount,
            finalPrice: order.totalAmount,
            totalAmount: order.totalAmount,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentMethod === "cash" ? "pending" : "pending",
            status: order.status === "confirmed" ? "accepted" : order.status,
            scheduledAt: order.scheduledAt,
            completedAt: null,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            client: order.client,
            provider: providerWithUser,
            category: { id: 0, name: "Serviço do Catálogo" },
            type: 'order' as const
          };
        })
      );

      // Combine and sort by creation date (newest first)
      const combined = [...transformedServiceRequests, ...transformedOrders];
      console.log(`Combined total for admin: ${combined.length} bookings`);
      
      return combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
    } catch (error) {
      console.error('Error in getAllBookingsForAdmin:', error);
      return [];
    }
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
  async getCartByClient(clientId: number): Promise<(Order & { items: any[] }) | undefined> {
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

    // Get all order items
    const allOrderItems = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));

    const items = [];
    
    for (const item of allOrderItems) {
      if (item.providerServiceId) {
        // Provider service item
        const [providerServiceData] = await db
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
          .where(eq(orderItems.id, item.id));

        if (providerServiceData) {
          const chargingTypes = await this.getServiceChargingTypes(providerServiceData.providerService.id);
          items.push({
            ...providerServiceData,
            providerService: {
              ...providerServiceData.providerService,
              chargingTypes,
            },
          });
        }
      } else if (item.catalogServiceId) {
        // Catalog service item
        const catalogService = await this.getService(item.catalogServiceId);
        if (catalogService) {
          items.push({
            id: item.id,
            orderId: item.orderId,
            providerServiceId: item.providerServiceId,
            catalogServiceId: item.catalogServiceId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            notes: item.notes,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            type: 'catalog',
            providerService: {
              id: catalogService.id,
              name: catalogService.name,
              description: catalogService.description,
              images: catalogService.imageUrl ? JSON.stringify([catalogService.imageUrl]) : '[]',
              category: catalogService.category,
              chargingTypes: [],
              provider: {
                id: 0,
                userId: 0,
                status: 'approved' as any,
                serviceRadius: 0,
                basePrice: '0',
                description: 'Serviço de Catálogo Global',
                experience: '',
                documents: '',
                portfolioImages: '',
                rating: '5.0',
                totalReviews: 0,
                totalServices: 0,
                isTrialActive: false,
                trialEndsAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
                user: {
                  id: 0,
                  email: 'catalogo@qservicos.com',
                  name: 'Catálogo Qserviços',
                  phone: '',
                  userType: 'provider' as any,
                  address: '',
                  cep: '',
                  city: 'Todo o Brasil',
                  state: '',
                  latitude: '0',
                  longitude: '0',
                  avatar: '',
                  isActive: true,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
              },
            },
          });
        }
      }
    }

    return { ...order, items };
  }

  async getOrderById(id: number): Promise<(Order & { items: (OrderItem & { providerService: ProviderService & { category: ServiceCategory; provider: Provider } })[]; client: User; provider?: Provider }) | undefined> {
    const clientAlias = alias(users, 'client');
    const orderProviderAlias = alias(providers, 'order_provider');
    const providerUserAlias = alias(users, 'provider_user');
    
    const [orderData] = await db
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
        client: clientAlias,
        providerData: orderProviderAlias,
        providerUser: providerUserAlias,
      })
      .from(orders)
      .innerJoin(clientAlias, eq(orders.clientId, clientAlias.id))
      .leftJoin(orderProviderAlias, eq(orders.providerId, orderProviderAlias.id))
      .leftJoin(providerUserAlias, eq(orderProviderAlias.userId, providerUserAlias.id))
      .where(eq(orders.id, id))
      .limit(1);

    if (!orderData) return undefined;

    const itemProviderAlias = alias(providers, 'item_provider');
    const itemUserAlias = alias(users, 'item_user');
    
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
            id: itemProviderAlias.id,
            userId: itemProviderAlias.userId,
            status: itemProviderAlias.status,
            city: itemProviderAlias.city,
            state: itemProviderAlias.state,
            user: itemUserAlias,
          },
        },
      })
      .from(orderItems)
      .innerJoin(providerServices, eq(orderItems.providerServiceId, providerServices.id))
      .innerJoin(serviceCategories, eq(providerServices.categoryId, serviceCategories.id))
      .innerJoin(itemProviderAlias, eq(providerServices.providerId, itemProviderAlias.id))
      .innerJoin(itemUserAlias, eq(itemProviderAlias.userId, itemUserAlias.id))
      .where(eq(orderItems.orderId, orderData.id));

    // Build provider object if it exists
    const provider = orderData.providerData && orderData.providerUser ? {
      ...orderData.providerData,
      user: orderData.providerUser
    } : undefined;

    return { 
      id: orderData.id,
      clientId: orderData.clientId,
      providerId: orderData.providerId,
      status: orderData.status,
      subtotal: orderData.subtotal,
      discountAmount: orderData.discountAmount,
      serviceAmount: orderData.serviceAmount,
      totalAmount: orderData.totalAmount,
      couponCode: orderData.couponCode,
      paymentMethod: orderData.paymentMethod,
      address: orderData.address,
      cep: orderData.cep,
      city: orderData.city,
      state: orderData.state,
      latitude: orderData.latitude,
      longitude: orderData.longitude,
      scheduledAt: orderData.scheduledAt,
      notes: orderData.notes,
      createdAt: orderData.createdAt,
      updatedAt: orderData.updatedAt,
      client: orderData.client,
      provider,
      items,
    };
  }

  async getOrdersByClient(clientId: number): Promise<(Order & { items: (OrderItem & { providerService: ProviderService & { category: ServiceCategory; provider: Provider } })[]; provider?: Provider })[]> {
    const orderProviderAlias = alias(providers, 'order_provider');
    
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
        provider: orderProviderAlias,
      })
      .from(orders)
      .leftJoin(orderProviderAlias, eq(orders.providerId, orderProviderAlias.id))
      .where(and(eq(orders.clientId, clientId), sql`${orders.status} != 'cart'`))
      .orderBy(desc(orders.createdAt));

    // Get items for each order
    const ordersWithItems = await Promise.all(
      ordersList.map(async (order) => {
        const itemProviderAlias = alias(providers, 'item_provider');
        const itemUserAlias = alias(users, 'item_user');
        
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
                id: itemProviderAlias.id,
                userId: itemProviderAlias.userId,
                status: itemProviderAlias.status,
                city: itemProviderAlias.city,
                state: itemProviderAlias.state,
                user: itemUserAlias,
              },
            },
          })
          .from(orderItems)
          .innerJoin(providerServices, eq(orderItems.providerServiceId, providerServices.id))
          .innerJoin(serviceCategories, eq(providerServices.categoryId, serviceCategories.id))
          .innerJoin(itemProviderAlias, eq(providerServices.providerId, itemProviderAlias.id))
          .innerJoin(itemUserAlias, eq(itemProviderAlias.userId, itemUserAlias.id))
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

  async getProviderOrders(providerId: number): Promise<any[]> {
    try {
      console.log(`Getting provider orders for provider ${providerId}`);
      
      // Get provider's categories
      let providerCategoryRecords = await db
        .select({ categoryId: providerCategories.categoryId })
        .from(providerCategories)
        .where(eq(providerCategories.providerId, providerId));
      
      // Fallback to deriving from services if no categories in providerCategories
      if (providerCategoryRecords.length === 0) {
        providerCategoryRecords = await db
          .select({ categoryId: providerServices.categoryId })
          .from(providerServices)
          .where(eq(providerServices.providerId, providerId))
          .groupBy(providerServices.categoryId);
      }
      
      const categoryIds = providerCategoryRecords.map(pc => pc.categoryId);
      console.log(`Provider ${providerId} has services in categories: ${categoryIds.join(', ')}`);
      
      if (categoryIds.length === 0) {
        return [];
      }
      
      // Get catalog services in provider's categories
      const catalogServiceIds = await db
        .select({ id: services.id })
        .from(services)
        .where(inArray(services.categoryId, categoryIds));
      
      const catalogServiceIdList = catalogServiceIds.map(cs => cs.id);
      
      // Query 1: Orders with catalogServiceId (catalog-based orders)
      const catalogOrders = catalogServiceIdList.length > 0 ? await db
        .select({
          id: orders.id,
          clientId: orders.clientId,
          providerId: orders.providerId,
          status: orders.status,
          subtotal: orders.subtotal,
          discountAmount: orders.discountAmount,
          serviceAmount: orders.serviceAmount,
          totalAmount: orders.totalAmount,
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
          client: users,
          catalogServiceName: services.name,
          categoryName: serviceCategories.name,
        })
        .from(orders)
        .innerJoin(users, eq(orders.clientId, users.id))
        .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
        .innerJoin(services, eq(orderItems.catalogServiceId, services.id))
        .innerJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
        .where(
          or(
            // Orders assigned to this provider
            eq(orders.providerId, providerId),
            // Confirmed, pending, or pending_payment orders without provider that contain catalog services this provider can handle
            and(
              or(
                eq(orders.status, "pending"),
                eq(orders.status, "confirmed"),
                eq(orders.status, "pending_payment")
              ),
              isNull(orders.providerId),
              inArray(orderItems.catalogServiceId, catalogServiceIdList)
            )
          )
        )
        .groupBy(
          orders.id,
          orders.clientId,
          orders.providerId,
          orders.status,
          orders.subtotal,
          orders.discountAmount,
          orders.serviceAmount,
          orders.totalAmount,
          orders.paymentMethod,
          orders.address,
          orders.cep,
          orders.city,
          orders.state,
          orders.latitude,
          orders.longitude,
          orders.scheduledAt,
          orders.notes,
          orders.createdAt,
          users.id,
          users.name,
          users.email,
          users.phone,
          services.name,
          serviceCategories.name
        ) : [];

      // Query 2: Orders with providerServiceId that are already assigned to this provider
      const providerOrders = await db
        .select({
          id: orders.id,
          clientId: orders.clientId,
          providerId: orders.providerId,
          status: orders.status,
          subtotal: orders.subtotal,
          discountAmount: orders.discountAmount,
          serviceAmount: orders.serviceAmount,
          totalAmount: orders.totalAmount,
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
          client: users,
          catalogServiceName: providerServices.name,
          categoryName: serviceCategories.name,
        })
        .from(orders)
        .innerJoin(users, eq(orders.clientId, users.id))
        .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
        .innerJoin(providerServices, eq(orderItems.providerServiceId, providerServices.id))
        .innerJoin(serviceCategories, eq(providerServices.categoryId, serviceCategories.id))
        .where(
          and(
            eq(providerServices.providerId, providerId),
            or(
              eq(orders.status, "pending"),
              eq(orders.status, "confirmed"),
              eq(orders.status, "pending_payment"),
              eq(orders.status, "in_progress")
            )
          )
        )
        .groupBy(
          orders.id,
          orders.clientId,
          orders.providerId,
          orders.status,
          orders.subtotal,
          orders.discountAmount,
          orders.serviceAmount,
          orders.totalAmount,
          orders.paymentMethod,
          orders.address,
          orders.cep,
          orders.city,
          orders.state,
          orders.latitude,
          orders.longitude,
          orders.scheduledAt,
          orders.notes,
          orders.createdAt,
          users.id,
          users.name,
          users.email,
          users.phone,
          providerServices.name,
          serviceCategories.name
        );

      // Combine both queries, remove duplicates, and maintain ordering by creation date
      const uniqueOrdersMap = new Map();
      
      // Add catalog orders first
      catalogOrders.forEach(order => {
        uniqueOrdersMap.set(order.id, { ...order, isCatalogOrder: true });
      });
      
      // Add provider orders (will overwrite if duplicate, but keep all unique)
      providerOrders.forEach(order => {
        if (!uniqueOrdersMap.has(order.id)) {
          uniqueOrdersMap.set(order.id, { ...order, isCatalogOrder: false });
        }
      });
      
      // Convert to array and sort by creation date (newest first)
      const ordersData = Array.from(uniqueOrdersMap.values())
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      console.log(`Found ${ordersData.length} orders for provider (${catalogOrders.length} catalog + ${providerOrders.length} provider)`);

      // Transform to unified format
      return ordersData.map(order => ({
        id: order.id,
        clientId: order.clientId,
        categoryId: 0,
        providerId: order.providerId,
        status: order.status,
        totalAmount: order.totalAmount || "0.00",
        paymentMethod: order.paymentMethod || "cash",
        paymentStatus: "completed",
        address: order.address || "",
        cep: order.cep || "",
        city: order.city || "",
        state: order.state || "",
        scheduledAt: order.scheduledAt,
        notes: order.notes,
        createdAt: order.createdAt,
        title: order.catalogServiceName || order.categoryName || "Pedido",
        type: 'order' as const,
        isCatalogOrder: order.isCatalogOrder,
        client: order.client,
        category: { id: 0, name: order.categoryName || "" }
      }));
    } catch (error) {
      console.error('Error in getProviderOrders:', error);
      return [];
    }
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
        eq(orderItems.providerServiceId, item.providerServiceId!)
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
      
      // Update cart totals after updating item
      await this.updateCartTotals(cart.id);
      
      return updatedItem;
    } else {
      // Add new item
      const unitPrice = parseFloat(item.unitPrice);
      const totalPrice = (unitPrice * item.quantity).toFixed(2);
      
      const insertData = {
        orderId: cart.id,
        providerServiceId: item.providerServiceId!,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: totalPrice,
        notes: item.notes || null
      };
      
      const [newItem] = await db
        .insert(orderItems)
        .values(insertData)
        .returning();
      
      // Update cart totals after adding item
      await this.updateCartTotals(cart.id);
      
      return newItem;
    }
  }

  async addCatalogItemToCart(clientId: number, item: { catalogServiceId: number; quantity: number; unitPrice: string; notes?: string; chargingType?: string }): Promise<OrderItem> {
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

    // Check if catalog item already exists in cart
    const existingItems = await db
      .select()
      .from(orderItems)
      .where(and(
        eq(orderItems.orderId, cart.id),
        eq(orderItems.catalogServiceId, item.catalogServiceId)
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
      
      // Update cart totals after updating item
      await this.updateCartTotals(cart.id);
      
      return updatedItem;
    } else {
      // Add new catalog item
      const unitPrice = parseFloat(item.unitPrice);
      const totalPrice = (unitPrice * item.quantity).toFixed(2);
      
      const insertData = {
        orderId: cart.id,
        catalogServiceId: item.catalogServiceId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: totalPrice,
        notes: item.notes || null,
        chargingType: item.chargingType as any || "visit"
      };
      
      const [newItem] = await db
        .insert(orderItems)
        .values(insertData)
        .returning();
      
      // Update cart totals after adding item
      await this.updateCartTotals(cart.id);
      
      return newItem;
    }
  }

  async updateCartItem(itemId: number, quantity?: number, unitPrice?: string): Promise<OrderItem> {
    // First get the current item
    const [currentItem] = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.id, itemId))
      .limit(1);
    
    if (!currentItem) {
      throw new Error("Cart item not found");
    }
    
    // Use provided values or keep current ones
    const newQuantity = quantity !== undefined ? quantity : currentItem.quantity;
    const newUnitPrice = unitPrice !== undefined ? unitPrice : currentItem.unitPrice;
    const totalPrice = (parseFloat(newUnitPrice) * newQuantity).toFixed(2);
    
    const updateData: any = {
      totalPrice,
      updatedAt: new Date()
    };
    
    if (quantity !== undefined) {
      updateData.quantity = newQuantity;
    }
    
    if (unitPrice !== undefined) {
      updateData.unitPrice = newUnitPrice;
    }
    
    const [updatedItem] = await db
      .update(orderItems)
      .set(updateData)
      .where(eq(orderItems.id, itemId))
      .returning();
    
    // Update cart totals after updating item
    if (currentItem.orderId) {
      await this.updateCartTotals(currentItem.orderId);
    }
    
    return updatedItem;
  }

  async removeCartItem(itemId: number): Promise<void> {
    // Get the item first to know which cart to update
    const [item] = await db
      .select({ orderId: orderItems.orderId })
      .from(orderItems)
      .where(eq(orderItems.id, itemId))
      .limit(1);
    
    await db.delete(orderItems).where(eq(orderItems.id, itemId));
    
    // Update cart totals after removing item
    if (item?.orderId) {
      await this.updateCartTotals(item.orderId);
    }
  }

  async clearCart(clientId: number): Promise<void> {
    const cart = await this.getCartByClient(clientId);
    if (cart) {
      await db.delete(orderItems).where(eq(orderItems.orderId, cart.id));
      await db.delete(orders).where(eq(orders.id, cart.id));
    }
  }

  async updateCartTotals(cartId: number): Promise<void> {
    // Calculate totals from cart items
    const items = await db
      .select({
        totalPrice: orderItems.totalPrice
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, cartId));
    
    const subtotal = items.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);
    const serviceAmount = subtotal * 0.1; // 10% service fee
    const totalAmount = subtotal + serviceAmount;
    
    // Update cart totals
    await db
      .update(orders)
      .set({
        subtotal: subtotal.toFixed(2),
        serviceAmount: serviceAmount.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        updatedAt: new Date()
      })
      .where(eq(orders.id, cartId));
  }

  async createOrderFromData(orderData: InsertOrder, items: any[]): Promise<Order> {
    // Calculate totals from items
    let calculatedSubtotal = 0;
    let calculatedServiceAmount = 0;
    
    if (items && items.length > 0) {
      for (const item of items) {
        const quantity = item.quantity || 1;
        const unitPrice = parseFloat(item.unitPrice || "0.00");
        const itemTotal = quantity * unitPrice;
        calculatedSubtotal += itemTotal;
      }
      
      // Calculate service fee (10% of subtotal)
      calculatedServiceAmount = calculatedSubtotal * 0.1;
    }
    
    const calculatedTotal = calculatedSubtotal + calculatedServiceAmount;
    
    // Update order data with calculated values
    const finalOrderData = {
      ...orderData,
      subtotal: calculatedSubtotal.toFixed(2),
      serviceAmount: calculatedServiceAmount.toFixed(2),
      totalAmount: calculatedTotal.toFixed(2)
    };

    // Create the order
    const [newOrder] = await db
      .insert(orders)
      .values(finalOrderData)
      .returning();

    // Create order items and service requests based on items
    if (items && items.length > 0) {
      for (const item of items) {
        const quantity = item.quantity || 1;
        const unitPrice = parseFloat(item.unitPrice || "0.00");
        const totalPrice = quantity * unitPrice;
        
        // Create order item
        await db.insert(orderItems).values({
          orderId: newOrder.id,
          providerServiceId: item.providerServiceId || null,
          catalogServiceId: item.catalogServiceId || null,
          quantity: quantity,
          unitPrice: unitPrice.toFixed(2),
          totalPrice: totalPrice.toFixed(2),
          notes: item.notes || null,
          chargingType: item.chargingType || null,
        });
      }
    }

    return this.getOrderById(newOrder.id) as Promise<Order>;
  }

  async convertCartToOrder(clientId: number, orderData: Partial<InsertOrder>): Promise<Order> {
    const cart = await this.getCartByClient(clientId);
    if (!cart) {
      throw new Error("Cart not found");
    }

    // Resolve provider ID from cart items
    let resolvedProviderId: number | null = null;
    const providerIds = new Set<number>();
    
    for (const item of cart.items) {
      if (item.providerServiceId) {
        // Fetch the provider service to get the providerId
        const providerService = await this.getProviderServiceById(item.providerServiceId);
        if (providerService) {
          providerIds.add(providerService.providerId);
        }
      }
    }
    
    // Check if all items belong to the same provider
    if (providerIds.size === 1) {
      resolvedProviderId = Array.from(providerIds)[0];
    } else if (providerIds.size > 1) {
      throw new Error("Carrinho contém serviços de múltiplos provedores. Por favor, finalize pedidos separados para cada provedor.");
    }
    // If providerIds.size === 0, it's a catalog-only order, so providerId remains null

    // Calculate totals
    const subtotal = cart.items.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);
    const serviceAmount = subtotal * 0.1; // 10% service fee
    const totalAmount = subtotal + serviceAmount - parseFloat(orderData.discountAmount || "0");

    // Orders start as pending and require provider acceptance
    // Only set as confirmed if payment method requires it (like online payment)
    const initialStatus = orderData.paymentMethod === 'cash' ? 'pending' : 'pending';

    const [updatedOrder] = await db
      .update(orders)
      .set({
        ...orderData,
        providerId: resolvedProviderId,
        status: initialStatus,
        subtotal: subtotal.toString(),
        serviceAmount: serviceAmount.toString(),
        totalAmount: totalAmount.toString(),
        updatedAt: new Date()
      })
      .where(eq(orders.id, cart.id))
      .returning();

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

  async findOrCreateConversation(participantOneId: number, participantTwoId: number, serviceRequestId?: number, orderId?: number): Promise<ChatConversation> {
    // Try to find existing conversation for the same participants and service/order
    let whereCondition;
    
    if (serviceRequestId) {
      whereCondition = or(
        and(
          eq(chatConversations.participantOneId, participantOneId),
          eq(chatConversations.participantTwoId, participantTwoId),
          eq(chatConversations.serviceRequestId, serviceRequestId)
        ),
        and(
          eq(chatConversations.participantOneId, participantTwoId),
          eq(chatConversations.participantTwoId, participantOneId),
          eq(chatConversations.serviceRequestId, serviceRequestId)
        )
      );
    } else if (orderId) {
      whereCondition = or(
        and(
          eq(chatConversations.participantOneId, participantOneId),
          eq(chatConversations.participantTwoId, participantTwoId),
          eq(chatConversations.orderId, orderId)
        ),
        and(
          eq(chatConversations.participantOneId, participantTwoId),
          eq(chatConversations.participantTwoId, participantOneId),
          eq(chatConversations.orderId, orderId)
        )
      );
    } else {
      whereCondition = or(
        and(
          eq(chatConversations.participantOneId, participantOneId),
          eq(chatConversations.participantTwoId, participantTwoId)
        ),
        and(
          eq(chatConversations.participantOneId, participantTwoId),
          eq(chatConversations.participantTwoId, participantOneId)
        )
      );
    }

    const [existingConversation] = await db
      .select()
      .from(chatConversations)
      .where(whereCondition);

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
        orderId,
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
    transaction_amount: number; 
    token: string; 
    description: string; 
    installments: number;
    payment_method_id: string;
    issuer_id?: string;
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

      // Create card payment request following MercadoPago structure
      const paymentRequest = {
        transaction_amount: Number(data.transaction_amount),
        token: data.token,
        description: data.description,
        installments: Number(data.installments),
        payment_method_id: data.payment_method_id,
        issuer_id: data.issuer_id,
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

      return response; // Return the full response from MercadoPago
    } catch (error) {
      console.error('Error creating card payment:', error);
      throw error;
    }
  }

  // PIX payment integration with MercadoPago
  async createPixPayment(data: { transaction_amount: number; description: string; payerEmail: string }): Promise<any> {
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

      // Create PIX payment request following MercadoPago structure
      const paymentRequest = {
        transaction_amount: Number(data.transaction_amount),
        description: data.description,
        payment_method_id: 'pix',
        payer: { 
          email: data.payerEmail 
        }
      };

      console.log('PIX payment request:', paymentRequest);
      const response = await payment.create({ body: paymentRequest });
      console.log('PIX payment response:', response);
      
      return {
        id: response.id,
        status: response.status,
        qr_code: response.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: response.point_of_interaction?.transaction_data?.qr_code_base64,
        ticket_url: response.point_of_interaction?.transaction_data?.ticket_url
      };
    } catch (error) {
      console.error('Error creating PIX payment:', error);
      throw error;
    }
  }

  // Provider service requests methods
  async getProviderServiceRequests(): Promise<(ProviderServiceRequest & { provider: Provider & { user: User }; category: ServiceCategory })[]> {
    return await db
      .select({
        id: providerServiceRequests.id,
        providerId: providerServiceRequests.providerId,
        categoryId: providerServiceRequests.categoryId,
        name: providerServiceRequests.name,
        description: providerServiceRequests.description,
        status: providerServiceRequests.status,
        adminResponse: providerServiceRequests.adminResponse,
        createdAt: providerServiceRequests.createdAt,
        updatedAt: providerServiceRequests.updatedAt,
        provider: {
          id: providers.id,
          userId: providers.userId,
          status: providers.status,
          city: providers.city,
          state: providers.state,
          serviceRadius: providers.serviceRadius,
          basePrice: providers.basePrice,
          description: providers.description,
          experience: providers.experience,
          cpfCnpj: providers.cpfCnpj,
          registrationStep: providers.registrationStep,
          registrationData: providers.registrationData,
          bankName: providers.bankName,
          bankAgency: providers.bankAgency,
          bankAccount: providers.bankAccount,
          documents: providers.documents,
          identityDocument: providers.identityDocument,
          portfolioImages: providers.portfolioImages,
          fullName: providers.fullName,
          birthDate: providers.birthDate,
          cnpj: providers.cnpj,
          addressProof: providers.addressProof,
          acceptedTerms: providers.acceptedTerms,
          workingHours: providers.workingHours,
          rating: providers.rating,
          totalReviews: providers.totalReviews,
          totalServices: providers.totalServices,
          isTrialActive: providers.isTrialActive,
          trialEndsAt: providers.trialEndsAt,
          createdAt: providers.createdAt,
          updatedAt: providers.updatedAt,
          user: users,
        },
        category: serviceCategories,
      })
      .from(providerServiceRequests)
      .innerJoin(providers, eq(providerServiceRequests.providerId, providers.id))
      .innerJoin(users, eq(providers.userId, users.id))
      .innerJoin(serviceCategories, eq(providerServiceRequests.categoryId, serviceCategories.id))
      .orderBy(desc(providerServiceRequests.createdAt));
  }

  async getProviderServiceRequestsByProvider(providerId: number): Promise<(ProviderServiceRequest & { category: ServiceCategory })[]> {
    return await db
      .select({
        id: providerServiceRequests.id,
        providerId: providerServiceRequests.providerId,
        categoryId: providerServiceRequests.categoryId,
        name: providerServiceRequests.name,
        description: providerServiceRequests.description,
        status: providerServiceRequests.status,
        adminResponse: providerServiceRequests.adminResponse,
        createdAt: providerServiceRequests.createdAt,
        updatedAt: providerServiceRequests.updatedAt,
        category: serviceCategories,
      })
      .from(providerServiceRequests)
      .innerJoin(serviceCategories, eq(providerServiceRequests.categoryId, serviceCategories.id))
      .where(eq(providerServiceRequests.providerId, providerId))
      .orderBy(desc(providerServiceRequests.createdAt));
  }

  async createProviderServiceRequest(request: InsertProviderServiceRequest): Promise<ProviderServiceRequest> {
    const [newRequest] = await db
      .insert(providerServiceRequests)
      .values(request)
      .returning();
    return newRequest;
  }

  async updateProviderServiceRequestStatus(id: number, status: "pending" | "approved" | "rejected", adminResponse?: string): Promise<ProviderServiceRequest> {
    const [updatedRequest] = await db
      .update(providerServiceRequests)
      .set({
        status,
        adminResponse,
        updatedAt: new Date(),
      })
      .where(eq(providerServiceRequests.id, id))
      .returning();
    return updatedRequest;
  }

  // Page configurations
  async getPageConfigurations(): Promise<PageConfiguration[]> {
    return await db.select().from(pageConfigurations).orderBy(pageConfigurations.pageKey);
  }

  async getPageConfiguration(pageKey: string): Promise<PageConfiguration | undefined> {
    const [config] = await db.select().from(pageConfigurations).where(eq(pageConfigurations.pageKey, pageKey));
    return config || undefined;
  }

  async createPageConfiguration(config: InsertPageConfiguration): Promise<PageConfiguration> {
    const [newConfig] = await db
      .insert(pageConfigurations)
      .values(config)
      .returning();
    return newConfig;
  }

  async updatePageConfiguration(pageKey: string, config: Partial<InsertPageConfiguration>): Promise<PageConfiguration> {
    const [updatedConfig] = await db
      .update(pageConfigurations)
      .set({ ...config, updatedAt: new Date() })
      .where(eq(pageConfigurations.pageKey, pageKey))
      .returning();
    return updatedConfig;
  }

  async deletePageConfiguration(pageKey: string): Promise<void> {
    await db.delete(pageConfigurations).where(eq(pageConfigurations.pageKey, pageKey));
  }

  // Page settings methods
  async getPageSettings(): Promise<PageSettings | undefined> {
    const [settings] = await db.select().from(pageSettings).limit(1);
    
    // If no settings exist, create default settings
    if (!settings) {
      const [newSettings] = await db
        .insert(pageSettings)
        .values({
          siteName: "Qserviços",
          siteDescription: "Plataforma de marketplace de serviços",
          siteLogo: "",
          primaryColor: "#0ea5e9",
          secondaryColor: "#64748b",
          footerText: "© 2024 Qserviços. Todos os direitos reservados.",
          seoTitle: "Qserviços - Marketplace de Serviços",
          seoDescription: "Conecte-se com prestadores de serviços qualificados em sua região",
          seoKeywords: "serviços, marketplace, prestadores, profissionais",
          analyticsId: "",
          enableAnalytics: false,
        })
        .returning();
      return newSettings;
    }
    
    return settings;
  }

  async updatePageSettings(settings: Partial<InsertPageSettings>): Promise<PageSettings> {
    // Check if settings exist
    const existing = await this.getPageSettings();
    
    // Remove timestamp fields that shouldn't be updated directly
    const { id, createdAt, updatedAt, ...settingsToUpdate } = settings as any;
    
    if (existing) {
      // Update existing settings
      const [updatedSettings] = await db
        .update(pageSettings)
        .set({ ...settingsToUpdate, updatedAt: new Date() })
        .where(eq(pageSettings.id, existing.id))
        .returning();
      return updatedSettings;
    } else {
      // Create new settings if none exist
      const [newSettings] = await db
        .insert(pageSettings)
        .values({ ...settingsToUpdate })
        .returning();
      return newSettings;
    }
  }

  // Social settings methods
  async getSocialSettings(): Promise<SocialSettings | undefined> {
    const [settings] = await db.select().from(socialSettings).limit(1);
    
    // If no settings exist, create default settings
    if (!settings) {
      const [newSettings] = await db
        .insert(socialSettings)
        .values({
          facebook: "",
          instagram: "",
          twitter: "",
          linkedin: "",
          youtube: "",
          whatsapp: "",
        })
        .returning();
      return newSettings;
    }
    
    return settings;
  }

  async updateSocialSettings(settings: Partial<InsertSocialSettings>): Promise<SocialSettings> {
    // Check if settings exist
    const existing = await this.getSocialSettings();
    
    // Remove timestamp fields that shouldn't be updated directly
    const { id, createdAt, updatedAt, ...settingsToUpdate } = settings as any;
    
    if (existing) {
      // Update existing settings
      const [updatedSettings] = await db
        .update(socialSettings)
        .set({ ...settingsToUpdate, updatedAt: new Date() })
        .where(eq(socialSettings.id, existing.id))
        .returning();
      return updatedSettings;
    } else {
      // Create new settings if none exist
      const [newSettings] = await db
        .insert(socialSettings)
        .values({ ...settingsToUpdate })
        .returning();
      return newSettings;
    }
  }

  // Cities methods
  async getActiveCities(): Promise<City[]> {
    const activeCities = await db
      .select()
      .from(cities)
      .where(eq(cities.isActive, true))
      .orderBy(asc(cities.name));
    
    return activeCities;
  }
}

export const storage = new DatabaseStorage();
