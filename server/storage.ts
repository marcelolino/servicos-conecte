import {
  users,
  providers,
  serviceCategories,
  providerServices,
  serviceRequests,
  reviews,
  notifications,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, asc, sql, isNull, count, inArray } from "drizzle-orm";
import bcrypt from "bcrypt";

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

  async getServiceRequestsByClient(clientId: number): Promise<(ServiceRequest & { provider?: Provider; category: ServiceCategory })[]> {
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
        status: serviceRequests.status,
        scheduledAt: serviceRequests.scheduledAt,
        completedAt: serviceRequests.completedAt,
        createdAt: serviceRequests.createdAt,
        updatedAt: serviceRequests.updatedAt,
        provider: providers,
        category: serviceCategories,
      })
      .from(serviceRequests)
      .leftJoin(providers, eq(serviceRequests.providerId, providers.id))
      .innerJoin(serviceCategories, eq(serviceRequests.categoryId, serviceCategories.id))
      .where(eq(serviceRequests.clientId, clientId))
      .orderBy(desc(serviceRequests.createdAt));
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
    const [updatedRequest] = await db
      .update(serviceRequests)
      .set({ ...request, updatedAt: new Date() })
      .where(eq(serviceRequests.id, id))
      .returning();
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
}

export const storage = new DatabaseStorage();
