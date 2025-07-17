import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { insertUserSchema, insertProviderSchema, insertServiceRequestSchema, insertReviewSchema, insertProviderServiceSchema, insertOrderSchema, insertOrderItemSchema } from "@shared/schema";
import { 
  upload, 
  uploadBannerImage, 
  uploadServiceImage, 
  uploadCategoryImage, 
  uploadProviderImage, 
  uploadMultipleImages, 
  deleteImage, 
  getImageInfo 
} from "./upload";
import { 
  advancedUploadHandler, 
  getUserUploadStats, 
  getFileUploadHistory, 
  deleteUploadedFile, 
  trackFileAccess 
} from "./advanced-upload";

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        userType: string;
      };
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Middleware to verify JWT token
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    console.log("No token provided");
    return res.status(401).json({ message: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      console.log("JWT verification failed:", err.message);
      return res.status(403).json({ message: "Invalid token" });
    }
    req.user = user;
    next();
  });
};

// Middleware to check if user is admin
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.userType !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

// Middleware to check if user is provider
const requireProvider = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.userType !== "provider") {
    return res.status(403).json({ message: "Provider access required" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(userData.email);
      
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }
      
      const user = await storage.createUser(userData);
      const token = jwt.sign(
        { id: user.id, email: user.email, userType: user.userType },
        JWT_SECRET,
        { expiresIn: "30d" }
      );
      
      res.json({ user: { ...user, password: undefined }, token });
    } catch (error) {
      res.status(400).json({ message: "Registration failed", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }
      
      const user = await storage.validateUser(email, password);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const token = jwt.sign(
        { id: user.id, email: user.email, userType: user.userType },
        JWT_SECRET,
        { expiresIn: "30d" }
      );
      
      res.json({ user: { ...user, password: undefined }, token });
    } catch (error) {
      res.status(500).json({ message: "Login failed", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(500).json({ message: "Failed to get user", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Service categories routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getServiceCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to get categories", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/categories", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const category = await storage.createServiceCategory(req.body);
      res.json(category);
    } catch (error) {
      res.status(400).json({ message: "Failed to create category", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.put("/api/categories/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      const category = await storage.updateServiceCategory(categoryId, req.body);
      res.json(category);
    } catch (error) {
      res.status(400).json({ message: "Failed to update category", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.delete("/api/categories/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      
      // Instead of deleting, we'll mark as inactive
      await storage.updateServiceCategory(categoryId, { isActive: false });
      
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: "Failed to delete category", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Provider routes
  app.post("/api/providers", authenticateToken, async (req, res) => {
    try {
      const providerData = insertProviderSchema.parse({
        ...req.body,
        userId: req.user!.id,
      });
      
      const existingProvider = await storage.getProviderByUserId(req.user!.id);
      if (existingProvider) {
        return res.status(400).json({ message: "Provider profile already exists" });
      }
      
      const provider = await storage.createProvider(providerData);
      res.json(provider);
    } catch (error) {
      res.status(400).json({ message: "Failed to create provider", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/providers/me", authenticateToken, async (req, res) => {
    try {
      const provider = await storage.getProviderByUserId(req.user!.id);
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }
      res.json(provider);
    } catch (error) {
      res.status(500).json({ message: "Failed to get provider", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Provider profile endpoint - must be before the generic :id route
  app.get("/api/provider-profile/:id", async (req, res) => {
    try {
      const providerId = parseInt(req.params.id);
      
      // Get provider with user data
      const providerWithUser = await storage.getAllProviders();
      const fullProvider = providerWithUser.find(p => p.id === providerId);
      
      if (!fullProvider) {
        return res.status(404).json({ message: "Provider not found" });
      }
      
      // Ensure response is JSON
      res.setHeader('Content-Type', 'application/json');
      res.json(fullProvider);
    } catch (error) {
      res.status(500).json({ message: "Failed to get provider", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.put("/api/providers/:id", authenticateToken, async (req, res) => {
    try {
      const providerId = parseInt(req.params.id);
      const provider = await storage.getProvider(providerId);
      
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }
      
      // Check if user owns this provider or is admin
      if (provider.userId !== req.user!.id && req.user!.userType !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedProvider = await storage.updateProvider(providerId, req.body);
      res.json(updatedProvider);
    } catch (error) {
      res.status(400).json({ message: "Failed to update provider", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/providers/category/:categoryId", async (req, res) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      const { latitude, longitude, radius } = req.query;
      
      const providers = await storage.getProvidersByCategory(
        categoryId,
        latitude ? parseFloat(latitude as string) : undefined,
        longitude ? parseFloat(longitude as string) : undefined,
        radius ? parseInt(radius as string) : undefined
      );
      
      res.json(providers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get providers", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Provider services routes
  app.get("/api/providers/:id/services", async (req, res) => {
    try {
      const providerId = parseInt(req.params.id);
      const services = await storage.getProviderServices(providerId);
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Failed to get services", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/providers/:id/reviews", async (req, res) => {
    try {
      const providerId = parseInt(req.params.id);
      const reviews = await storage.getReviewsByProvider(providerId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to get reviews", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/providers/:id/services", authenticateToken, requireProvider, async (req, res) => {
    try {
      const providerId = parseInt(req.params.id);
      const provider = await storage.getProvider(providerId);
      
      if (!provider || provider.userId !== req.user!.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const serviceData = {
        ...req.body,
        providerId,
      };
      
      const service = await storage.createProviderService(serviceData);
      res.json(service);
    } catch (error) {
      res.status(400).json({ message: "Failed to create service", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Get services for current provider
  app.get("/api/providers/services", authenticateToken, requireProvider, async (req, res) => {
    try {
      const provider = await storage.getProviderByUserId(req.user!.id);
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }
      
      const services = await storage.getProviderServices(provider.id);
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Failed to get services", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Create new service
  app.post("/api/services", authenticateToken, requireProvider, async (req, res) => {
    try {
      const provider = await storage.getProviderByUserId(req.user!.id);
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }
      
      const serviceData = {
        ...req.body,
        providerId: provider.id,
      };
      
      const service = await storage.createProviderService(serviceData);
      res.json(service);
    } catch (error) {
      res.status(400).json({ message: "Failed to create service", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Update service
  app.put("/api/services/:id", authenticateToken, requireProvider, async (req, res) => {
    try {
      const serviceId = parseInt(req.params.id);
      const provider = await storage.getProviderByUserId(req.user!.id);
      
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }
      
      // Get the service to verify ownership
      const services = await storage.getProviderServices(provider.id);
      const service = services.find(s => s.id === serviceId);
      
      if (!service) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedService = await storage.updateProviderService(serviceId, req.body);
      res.json(updatedService);
    } catch (error) {
      res.status(400).json({ message: "Failed to update service", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Delete service
  app.delete("/api/services/:id", authenticateToken, requireProvider, async (req, res) => {
    try {
      const serviceId = parseInt(req.params.id);
      const provider = await storage.getProviderByUserId(req.user!.id);
      
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }
      
      // Get the service to verify ownership
      const services = await storage.getProviderServices(provider.id);
      const service = services.find(s => s.id === serviceId);
      
      if (!service) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteProviderService(serviceId);
      res.json({ message: "Service deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: "Failed to delete service", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Service requests routes
  app.post("/api/service-requests", authenticateToken, async (req, res) => {
    try {
      const requestData = insertServiceRequestSchema.parse({
        ...req.body,
        clientId: req.user!.id,
      });
      
      const serviceRequest = await storage.createServiceRequest(requestData);
      res.json(serviceRequest);
    } catch (error) {
      res.status(400).json({ message: "Failed to create service request", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/service-requests/client", authenticateToken, async (req, res) => {
    try {
      const requests = await storage.getServiceRequestsByClient(req.user!.id);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to get service requests", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/service-requests/provider", authenticateToken, requireProvider, async (req, res) => {
    try {
      const provider = await storage.getProviderByUserId(req.user!.id);
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }
      
      const requests = await storage.getServiceRequestsByProvider(provider.id);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to get service requests", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.put("/api/service-requests/:id", authenticateToken, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const request = await storage.getServiceRequest(requestId);
      
      if (!request) {
        return res.status(404).json({ message: "Service request not found" });
      }
      
      // Check if user can update this request
      let canUpdate = false;
      
      // Client can always update their own requests
      if (request.clientId === req.user!.id) {
        canUpdate = true;
      }
      // Admin can update any request
      else if (req.user!.userType === "admin") {
        canUpdate = true;
      }
      // Provider can update if they're assigned to the request
      else if (request.provider && request.provider.userId === req.user!.id) {
        canUpdate = true;
      }
      // Provider can accept pending requests (when providerId is null and they want to accept)
      else if (req.user!.userType === "provider" && !request.providerId && req.body.status === "accepted") {
        // Get provider info to set providerId
        const provider = await storage.getProviderByUserId(req.user!.id);
        if (provider) {
          req.body.providerId = provider.id;
          canUpdate = true;
        }
      }
      
      if (!canUpdate) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedRequest = await storage.updateServiceRequest(requestId, req.body);
      res.json(updatedRequest);
    } catch (error) {
      res.status(400).json({ message: "Failed to update service request", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/service-requests/:id", authenticateToken, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const request = await storage.getServiceRequest(requestId);
      
      if (!request) {
        return res.status(404).json({ message: "Service request not found" });
      }
      
      // Check if user has access to this request
      const hasAccess = request.clientId === req.user!.id ||
                       (request.provider && request.provider.userId === req.user!.id) ||
                       req.user!.userType === "admin";
      
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(request);
    } catch (error) {
      res.status(500).json({ message: "Failed to get service request", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Reviews routes
  app.post("/api/reviews", authenticateToken, async (req, res) => {
    try {
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        clientId: req.user!.id,
      });
      
      // Verify the service request exists and belongs to the user
      const serviceRequest = await storage.getServiceRequest(reviewData.serviceRequestId);
      if (!serviceRequest || serviceRequest.clientId !== req.user!.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const review = await storage.createReview(reviewData);
      res.json(review);
    } catch (error) {
      res.status(400).json({ message: "Failed to create review", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/reviews/provider/:id", async (req, res) => {
    try {
      const providerId = parseInt(req.params.id);
      const reviews = await storage.getReviewsByProvider(providerId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to get reviews", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Notifications routes
  app.get("/api/notifications", authenticateToken, async (req, res) => {
    try {
      const notifications = await storage.getNotificationsByUser(req.user!.id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to get notifications", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.put("/api/notifications/:id/read", authenticateToken, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      await storage.markNotificationAsRead(notificationId);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      res.status(400).json({ message: "Failed to mark notification as read", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Admin routes for services
  app.get("/api/admin/services", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const services = await storage.getAllServicesForAdmin();
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Failed to get all services", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/admin/services", authenticateToken, requireAdmin, async (req, res) => {
    try {
      // Convert and validate the data manually
      const serviceData = {
        providerId: parseInt(req.body.providerId),
        categoryId: parseInt(req.body.categoryId),
        name: req.body.name || null,
        description: req.body.description || null,
        price: req.body.price ? req.body.price.toString() : null,
        minimumPrice: req.body.minimumPrice ? req.body.minimumPrice.toString() : null,
        estimatedDuration: req.body.estimatedDuration || null,
        requirements: req.body.requirements || null,
        serviceZone: req.body.serviceZone || null,
        isActive: req.body.isActive !== undefined ? req.body.isActive : true,
        images: req.body.images || null,
      };
      
      const service = await storage.createProviderService(serviceData);
      res.json(service);
    } catch (error) {
      console.error("Error creating service:", error);
      res.status(400).json({ message: "Failed to create service", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.put("/api/admin/services/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const serviceId = parseInt(req.params.id);
      // Convert and validate the data manually
      const serviceData = {
        providerId: req.body.providerId ? parseInt(req.body.providerId) : undefined,
        categoryId: req.body.categoryId ? parseInt(req.body.categoryId) : undefined,
        name: req.body.name || null,
        description: req.body.description || null,
        price: req.body.price ? req.body.price.toString() : null,
        minimumPrice: req.body.minimumPrice ? req.body.minimumPrice.toString() : null,
        estimatedDuration: req.body.estimatedDuration || null,
        requirements: req.body.requirements || null,
        serviceZone: req.body.serviceZone || null,
        isActive: req.body.isActive !== undefined ? req.body.isActive : undefined,
      };
      
      // Remove undefined values
      const cleanedData = Object.fromEntries(
        Object.entries(serviceData).filter(([_, value]) => value !== undefined)
      );
      
      const service = await storage.updateProviderService(serviceId, cleanedData);
      res.json(service);
    } catch (error) {
      console.error("Error updating service:", error);
      res.status(400).json({ message: "Failed to update service", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.delete("/api/admin/services/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const serviceId = parseInt(req.params.id);
      await storage.deleteProviderService(serviceId);
      res.json({ message: "Service deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: "Failed to delete service", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Statistics routes
  app.get("/api/stats/provider", authenticateToken, requireProvider, async (req, res) => {
    try {
      const provider = await storage.getProviderByUserId(req.user!.id);
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }
      
      const stats = await storage.getProviderStats(provider.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get provider stats", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/stats/client", authenticateToken, async (req, res) => {
    try {
      const stats = await storage.getClientStats(req.user!.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get client stats", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/stats/admin", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get admin stats", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Admin routes for managing users and providers
  app.get("/api/admin/users", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to get users", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/admin/providers", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const providers = await storage.getAllProviders();
      res.json(providers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get providers", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.put("/api/admin/providers/:id/approve", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const providerId = parseInt(req.params.id);
      const provider = await storage.updateProvider(providerId, { status: "approved" });
      res.json(provider);
    } catch (error) {
      res.status(400).json({ message: "Failed to approve provider", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.put("/api/admin/providers/:id/reject", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const providerId = parseInt(req.params.id);
      const provider = await storage.updateProvider(providerId, { status: "rejected" });
      res.json(provider);
    } catch (error) {
      res.status(400).json({ message: "Failed to reject provider", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.put("/api/provider-profile/:id/portfolio", authenticateToken, async (req, res) => {
    try {
      const providerId = parseInt(req.params.id);
      const { portfolioImages } = req.body;

      // Check if user owns this provider profile or is admin
      const provider = await storage.getProvider(providerId);
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }

      if (req.user!.userType !== "admin" && provider.userId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized to update this portfolio" });
      }

      const updatedProvider = await storage.updateProvider(providerId, { 
        portfolioImages: portfolioImages 
      });
      res.json(updatedProvider);
    } catch (error) {
      res.status(400).json({ message: "Failed to update portfolio", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/admin/bookings", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const bookings = await storage.getAllBookingsForAdmin();
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to get bookings", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Banners routes
  app.get("/api/banners", async (req, res) => {
    try {
      const banners = await storage.getPromotionalBanners();
      const activeBanners = banners.filter(banner => 
        banner.status === "active" && 
        (!banner.startDate || new Date(banner.startDate) <= new Date()) &&
        (!banner.endDate || new Date(banner.endDate) >= new Date())
      );
      res.json(activeBanners);
    } catch (error) {
      res.status(500).json({ message: "Failed to get banners", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/banners/:id/click", async (req, res) => {
    try {
      const bannerId = parseInt(req.params.id);
      await storage.incrementBannerClick(bannerId);
      res.json({ message: "Click recorded" });
    } catch (error) {
      res.status(400).json({ message: "Failed to record click", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Admin banner management
  app.get("/api/admin/banners", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const banners = await storage.getPromotionalBanners();
      res.json(banners);
    } catch (error) {
      res.status(500).json({ message: "Failed to get banners", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/admin/banners", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const bannerData = {
        title: req.body.title,
        description: req.body.description || null,
        imageUrl: req.body.imageUrl || null,
        categoryId: req.body.categoryId ? parseInt(req.body.categoryId) : null,
        targetUrl: req.body.targetUrl || null,
        status: req.body.status || "active",
        startDate: req.body.startDate ? new Date(req.body.startDate) : null,
        endDate: req.body.endDate ? new Date(req.body.endDate) : null,
        displayOrder: req.body.displayOrder ? parseInt(req.body.displayOrder) : 0,
      };
      
      const banner = await storage.createPromotionalBanner(bannerData);
      res.json(banner);
    } catch (error) {
      res.status(400).json({ message: "Failed to create banner", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.put("/api/admin/banners/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const bannerId = parseInt(req.params.id);
      const bannerData = {
        title: req.body.title,
        description: req.body.description || null,
        imageUrl: req.body.imageUrl || null,
        categoryId: req.body.categoryId ? parseInt(req.body.categoryId) : null,
        targetUrl: req.body.targetUrl || null,
        status: req.body.status || "active",
        startDate: req.body.startDate ? new Date(req.body.startDate) : null,
        endDate: req.body.endDate ? new Date(req.body.endDate) : null,
        displayOrder: req.body.displayOrder ? parseInt(req.body.displayOrder) : 0,
      };
      
      const banner = await storage.updatePromotionalBanner(bannerId, bannerData);
      res.json(banner);
    } catch (error) {
      res.status(400).json({ message: "Failed to update banner", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.delete("/api/admin/banners/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const bannerId = parseInt(req.params.id);
      await storage.deletePromotionalBanner(bannerId);
      res.json({ message: "Banner deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: "Failed to delete banner", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Popular providers route
  app.get("/api/providers/popular", async (req, res) => {
    try {
      const providers = await storage.getAllProviders();
      // Sort by rating and total reviews to get popular providers
      const popularProviders = providers
        .filter(provider => provider.status === "approved")
        .sort((a, b) => {
          const aScore = (parseFloat(a.rating) || 0) * (a.totalReviews || 0);
          const bScore = (parseFloat(b.rating) || 0) * (b.totalReviews || 0);
          return bScore - aScore;
        })
        .slice(0, 10);
      
      res.json(popularProviders);
    } catch (error) {
      res.status(500).json({ message: "Failed to get popular providers", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Employee management routes
  app.get("/api/employees", authenticateToken, requireProvider, async (req, res) => {
    try {
      const provider = await storage.getProviderByUserId(req.user!.id);
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }
      
      const employees = await storage.getEmployeesByProvider(provider.id);
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "Failed to get employees", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/employees", authenticateToken, requireProvider, async (req, res) => {
    try {
      const provider = await storage.getProviderByUserId(req.user!.id);
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }
      
      // First create user account for employee
      const userData = {
        email: req.body.email,
        password: req.body.password || "defaultpass123",
        name: req.body.name,
        phone: req.body.phone,
        userType: "employee" as const,
        isActive: true,
      };
      
      const user = await storage.createUser(userData);
      
      // Then create employee record
      const employeeData = {
        providerId: provider.id,
        userId: user.id,
        name: req.body.name,
        phone: req.body.phone,
        email: req.body.email,
        specialization: req.body.specialization || null,
        isActive: true,
      };
      
      const employee = await storage.createEmployee(employeeData);
      res.json(employee);
    } catch (error) {
      res.status(400).json({ message: "Failed to create employee", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.put("/api/employees/:id", authenticateToken, requireProvider, async (req, res) => {
    try {
      const employeeId = parseInt(req.params.id);
      const employeeData = {
        name: req.body.name,
        phone: req.body.phone,
        email: req.body.email,
        specialization: req.body.specialization || null,
        isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      };
      
      const employee = await storage.updateEmployee(employeeId, employeeData);
      res.json(employee);
    } catch (error) {
      res.status(400).json({ message: "Failed to update employee", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.delete("/api/employees/:id", authenticateToken, requireProvider, async (req, res) => {
    try {
      const employeeId = parseInt(req.params.id);
      await storage.deleteEmployee(employeeId);
      res.json({ message: "Employee deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: "Failed to delete employee", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Service assignment routes
  app.get("/api/assignments", authenticateToken, async (req, res) => {
    try {
      // Check if user is employee
      if (req.user!.userType !== "employee") {
        return res.status(403).json({ message: "Employee access required" });
      }
      
      // Find employee record
      const employees = await storage.getEmployeesByProvider(0); // This is not ideal, need to fix
      const employee = employees.find(emp => emp.userId === req.user!.id);
      
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      const assignments = await storage.getServiceAssignmentsByEmployee(employee.id);
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ message: "Failed to get assignments", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/assignments", authenticateToken, requireProvider, async (req, res) => {
    try {
      const assignmentData = {
        serviceRequestId: parseInt(req.body.serviceRequestId),
        employeeId: parseInt(req.body.employeeId),
        notes: req.body.notes || null,
      };
      
      const assignment = await storage.createServiceAssignment(assignmentData);
      res.json(assignment);
    } catch (error) {
      res.status(400).json({ message: "Failed to create assignment", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.put("/api/assignments/:id", authenticateToken, async (req, res) => {
    try {
      const assignmentId = parseInt(req.params.id);
      const assignmentData = {
        startedAt: req.body.startedAt ? new Date(req.body.startedAt) : null,
        completedAt: req.body.completedAt ? new Date(req.body.completedAt) : null,
        notes: req.body.notes || null,
      };
      
      const assignment = await storage.updateServiceAssignment(assignmentId, assignmentData);
      res.json(assignment);
    } catch (error) {
      res.status(400).json({ message: "Failed to update assignment", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Coupons routes
  app.get("/api/coupons/validate/:code", async (req, res) => {
    try {
      const couponCode = req.params.code;
      const coupon = await storage.getCouponByCode(couponCode);
      
      if (!coupon) {
        return res.status(404).json({ message: "Coupon not found" });
      }
      
      const now = new Date();
      if (now < new Date(coupon.startDate) || now > new Date(coupon.endDate)) {
        return res.status(400).json({ message: "Coupon expired" });
      }
      
      if (coupon.maximumUses && coupon.currentUses >= coupon.maximumUses) {
        return res.status(400).json({ message: "Coupon limit reached" });
      }
      
      res.json(coupon);
    } catch (error) {
      res.status(500).json({ message: "Failed to validate coupon", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/coupons/:id/use", authenticateToken, async (req, res) => {
    try {
      const couponId = parseInt(req.params.id);
      await storage.useCoupon(couponId);
      res.json({ message: "Coupon used successfully" });
    } catch (error) {
      res.status(400).json({ message: "Failed to use coupon", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Admin coupon management
  app.get("/api/admin/coupons", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const coupons = await storage.getCoupons();
      res.json(coupons);
    } catch (error) {
      res.status(500).json({ message: "Failed to get coupons", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/admin/coupons", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const couponData = {
        code: req.body.code,
        name: req.body.name,
        description: req.body.description || null,
        discountType: req.body.discountType,
        discountValue: req.body.discountValue,
        minimumAmount: req.body.minimumAmount || null,
        maximumUses: req.body.maximumUses || null,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
        isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      };
      
      const coupon = await storage.createCoupon(couponData);
      res.json(coupon);
    } catch (error) {
      res.status(400).json({ message: "Failed to create coupon", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Order management routes
  
  // Get client's cart
  app.get("/api/cart", authenticateToken, async (req, res) => {
    try {
      const cart = await storage.getCartByClient(req.user!.id);
      res.json(cart || { items: [] });
    } catch (error) {
      res.status(500).json({ message: "Failed to get cart", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Add item to cart
  app.post("/api/cart/items", authenticateToken, async (req, res) => {
    try {
      const itemData = {
        providerServiceId: parseInt(req.body.providerServiceId),
        quantity: parseInt(req.body.quantity) || 1,
        unitPrice: req.body.unitPrice,
        totalPrice: req.body.unitPrice, // Will be calculated in storage
        notes: req.body.notes || null,
      };

      const item = await storage.addItemToCart(req.user!.id, itemData);
      res.json(item);
    } catch (error) {
      res.status(400).json({ message: "Failed to add item to cart", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Update cart item
  app.put("/api/cart/items/:id", authenticateToken, async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const quantity = parseInt(req.body.quantity);

      if (quantity <= 0) {
        await storage.removeCartItem(itemId);
        res.json({ message: "Item removed from cart" });
      } else {
        const item = await storage.updateCartItem(itemId, quantity);
        res.json(item);
      }
    } catch (error) {
      res.status(400).json({ message: "Failed to update cart item", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Remove item from cart
  app.delete("/api/cart/items/:id", authenticateToken, async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      await storage.removeCartItem(itemId);
      res.json({ message: "Item removed from cart" });
    } catch (error) {
      res.status(400).json({ message: "Failed to remove cart item", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Clear cart
  app.delete("/api/cart", authenticateToken, async (req, res) => {
    try {
      await storage.clearCart(req.user!.id);
      res.json({ message: "Cart cleared" });
    } catch (error) {
      res.status(400).json({ message: "Failed to clear cart", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Convert cart to order
  app.post("/api/orders", authenticateToken, async (req, res) => {
    try {
      const orderData = {
        address: req.body.address,
        cep: req.body.cep,
        city: req.body.city,
        state: req.body.state,
        latitude: req.body.latitude || null,
        longitude: req.body.longitude || null,
        scheduledAt: req.body.scheduledAt ? new Date(req.body.scheduledAt) : null,
        notes: req.body.notes || null,
        couponCode: req.body.couponCode || null,
        discountAmount: req.body.discountAmount || "0.00",
        paymentMethod: req.body.paymentMethod || null,
      };

      const order = await storage.convertCartToOrder(req.user!.id, orderData);
      res.json(order);
    } catch (error) {
      res.status(400).json({ message: "Failed to create order", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Get client's orders
  app.get("/api/orders", authenticateToken, async (req, res) => {
    try {
      const orders = await storage.getOrdersByClient(req.user!.id);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to get orders", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Get specific order
  app.get("/api/orders/:id", authenticateToken, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const order = await storage.getOrderById(orderId);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check if user has access to this order
      const hasAccess = order.clientId === req.user!.id ||
                       (order.provider && order.provider.userId === req.user!.id) ||
                       req.user!.userType === "admin";

      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to get order", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Update order status
  app.put("/api/orders/:id", authenticateToken, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const order = await storage.getOrderById(orderId);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check permissions for update
      let canUpdate = false;
      if (order.clientId === req.user!.id) {
        canUpdate = true;
      } else if (req.user!.userType === "admin") {
        canUpdate = true;
      } else if (order.provider && order.provider.userId === req.user!.id) {
        canUpdate = true;
      }

      if (!canUpdate) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updateData: any = {};
      if (req.body.status) updateData.status = req.body.status;
      if (req.body.paymentMethod) updateData.paymentMethod = req.body.paymentMethod;
      if (req.body.providerId) updateData.providerId = req.body.providerId;
      if (req.body.scheduledAt) updateData.scheduledAt = new Date(req.body.scheduledAt);
      if (req.body.notes) updateData.notes = req.body.notes;

      const updatedOrder = await storage.updateOrder(orderId, updateData);
      res.json(updatedOrder);
    } catch (error) {
      res.status(400).json({ message: "Failed to update order", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Placeholder image route
  app.get("/api/placeholder/:width/:height", (req, res) => {
    const width = parseInt(req.params.width) || 400;
    const height = parseInt(req.params.height) || 400;
    
    // Generate a simple SVG placeholder
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" fill="#f0f0f0" stroke="#ccc" stroke-width="2"/>
        <text x="50%" y="50%" text-anchor="middle" fill="#666" font-family="Arial, sans-serif" font-size="16">
          ${width} × ${height}
        </text>
      </svg>
    `;
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(svg);
  });

  // Image upload routes
  app.post("/api/upload/banner", authenticateToken, requireAdmin, upload.single('image'), uploadBannerImage);
  app.post("/api/upload/service", authenticateToken, upload.single('image'), uploadServiceImage);
  app.post("/api/upload/category", authenticateToken, requireAdmin, upload.single('image'), uploadCategoryImage);
  app.post("/api/upload/provider", authenticateToken, requireProvider, upload.single('image'), uploadProviderImage);
  app.post("/api/upload/multiple", authenticateToken, upload.array('images', 10), uploadMultipleImages);
  
  // Advanced upload routes with limits, virus scanning, and caching
  app.post("/api/upload/advanced/banner", authenticateToken, requireAdmin, upload.single('image'), advancedUploadHandler('banners'));
  app.post("/api/upload/advanced/service", authenticateToken, upload.single('image'), advancedUploadHandler('services'));
  app.post("/api/upload/advanced/category", authenticateToken, requireAdmin, upload.single('image'), advancedUploadHandler('categories'));
  app.post("/api/upload/advanced/provider", authenticateToken, requireProvider, upload.single('image'), advancedUploadHandler('providers'));
  app.post("/api/upload/advanced/avatar", authenticateToken, upload.single('image'), advancedUploadHandler('avatars'));
  
  // Upload management routes
  app.get("/api/upload/stats", authenticateToken, getUserUploadStats);
  app.get("/api/upload/history", authenticateToken, getFileUploadHistory);
  app.delete("/api/upload/file/:id", authenticateToken, deleteUploadedFile);
  
  // Image management routes
  app.delete("/api/upload/image", authenticateToken, deleteImage);
  app.get("/api/upload/info/:imagePath", getImageInfo);

  const httpServer = createServer(app);
  return httpServer;
}