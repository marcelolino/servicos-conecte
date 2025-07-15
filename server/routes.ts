import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { insertUserSchema, insertProviderSchema, insertServiceRequestSchema, insertReviewSchema } from "@shared/schema";

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

// Middleware to check if user is admin
const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user.userType !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

// Middleware to check if user is provider
const requireProvider = (req: any, res: any, next: any) => {
  if (req.user.userType !== "provider") {
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
      res.status(400).json({ message: "Registration failed", error: error.message });
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
      res.status(500).json({ message: "Login failed", error: error.message });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(500).json({ message: "Failed to get user", error: error.message });
    }
  });

  // Service categories routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getServiceCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to get categories", error: error.message });
    }
  });

  app.post("/api/categories", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const category = await storage.createServiceCategory(req.body);
      res.json(category);
    } catch (error) {
      res.status(400).json({ message: "Failed to create category", error: error.message });
    }
  });

  // Provider routes
  app.post("/api/providers", authenticateToken, async (req, res) => {
    try {
      const providerData = insertProviderSchema.parse({
        ...req.body,
        userId: req.user.id,
      });
      
      const existingProvider = await storage.getProviderByUserId(req.user.id);
      if (existingProvider) {
        return res.status(400).json({ message: "Provider profile already exists" });
      }
      
      const provider = await storage.createProvider(providerData);
      res.json(provider);
    } catch (error) {
      res.status(400).json({ message: "Failed to create provider", error: error.message });
    }
  });

  app.get("/api/providers/me", authenticateToken, requireProvider, async (req, res) => {
    try {
      const provider = await storage.getProviderByUserId(req.user.id);
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }
      res.json(provider);
    } catch (error) {
      res.status(500).json({ message: "Failed to get provider", error: error.message });
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
      if (provider.userId !== req.user.id && req.user.userType !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedProvider = await storage.updateProvider(providerId, req.body);
      res.json(updatedProvider);
    } catch (error) {
      res.status(400).json({ message: "Failed to update provider", error: error.message });
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
      res.status(500).json({ message: "Failed to get providers", error: error.message });
    }
  });

  // Provider services routes
  app.get("/api/providers/:id/services", async (req, res) => {
    try {
      const providerId = parseInt(req.params.id);
      const services = await storage.getProviderServices(providerId);
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Failed to get services", error: error.message });
    }
  });

  app.post("/api/providers/:id/services", authenticateToken, requireProvider, async (req, res) => {
    try {
      const providerId = parseInt(req.params.id);
      const provider = await storage.getProvider(providerId);
      
      if (!provider || provider.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const service = await storage.createProviderService({
        ...req.body,
        providerId,
      });
      
      res.json(service);
    } catch (error) {
      res.status(400).json({ message: "Failed to create service", error: error.message });
    }
  });

  // Service requests routes
  app.post("/api/service-requests", authenticateToken, async (req, res) => {
    try {
      const requestData = insertServiceRequestSchema.parse({
        ...req.body,
        clientId: req.user.id,
      });
      
      const serviceRequest = await storage.createServiceRequest(requestData);
      res.json(serviceRequest);
    } catch (error) {
      res.status(400).json({ message: "Failed to create service request", error: error.message });
    }
  });

  app.get("/api/service-requests/client", authenticateToken, async (req, res) => {
    try {
      const requests = await storage.getServiceRequestsByClient(req.user.id);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to get service requests", error: error.message });
    }
  });

  app.get("/api/service-requests/provider", authenticateToken, requireProvider, async (req, res) => {
    try {
      const provider = await storage.getProviderByUserId(req.user.id);
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }
      
      const requests = await storage.getServiceRequestsByProvider(provider.id);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to get service requests", error: error.message });
    }
  });

  app.put("/api/service-requests/:id", authenticateToken, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const request = await storage.getServiceRequest(requestId);
      
      if (!request) {
        return res.status(404).json({ message: "Service request not found" });
      }
      
      // Check if user is client, provider, or admin
      const canUpdate = request.clientId === req.user.id || 
                       (request.provider && request.provider.userId === req.user.id) ||
                       req.user.userType === "admin";
      
      if (!canUpdate) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedRequest = await storage.updateServiceRequest(requestId, req.body);
      res.json(updatedRequest);
    } catch (error) {
      res.status(400).json({ message: "Failed to update service request", error: error.message });
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
      const hasAccess = request.clientId === req.user.id ||
                       (request.provider && request.provider.userId === req.user.id) ||
                       req.user.userType === "admin";
      
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(request);
    } catch (error) {
      res.status(500).json({ message: "Failed to get service request", error: error.message });
    }
  });

  // Reviews routes
  app.post("/api/reviews", authenticateToken, async (req, res) => {
    try {
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        clientId: req.user.id,
      });
      
      // Verify that the service request exists and belongs to the client
      const serviceRequest = await storage.getServiceRequest(reviewData.serviceRequestId);
      if (!serviceRequest || serviceRequest.clientId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      if (serviceRequest.status !== "completed") {
        return res.status(400).json({ message: "Service must be completed to leave a review" });
      }
      
      const review = await storage.createReview(reviewData);
      res.json(review);
    } catch (error) {
      res.status(400).json({ message: "Failed to create review", error: error.message });
    }
  });

  app.get("/api/reviews/provider/:providerId", async (req, res) => {
    try {
      const providerId = parseInt(req.params.providerId);
      const reviews = await storage.getReviewsByProvider(providerId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to get reviews", error: error.message });
    }
  });

  // Notifications routes
  app.get("/api/notifications", authenticateToken, async (req, res) => {
    try {
      const notifications = await storage.getNotificationsByUser(req.user.id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to get notifications", error: error.message });
    }
  });

  app.put("/api/notifications/:id/read", authenticateToken, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      await storage.markNotificationAsRead(notificationId);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      res.status(400).json({ message: "Failed to mark notification as read", error: error.message });
    }
  });

  // Statistics routes
  app.get("/api/stats/provider", authenticateToken, requireProvider, async (req, res) => {
    try {
      const provider = await storage.getProviderByUserId(req.user.id);
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }
      
      const stats = await storage.getProviderStats(provider.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get provider stats", error: error.message });
    }
  });

  app.get("/api/stats/client", authenticateToken, async (req, res) => {
    try {
      const stats = await storage.getClientStats(req.user.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get client stats", error: error.message });
    }
  });

  app.get("/api/stats/admin", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get admin stats", error: error.message });
    }
  });

  // Admin routes
  app.get("/api/admin/providers", authenticateToken, requireAdmin, async (req, res) => {
    try {
      // This would need to be implemented in storage
      res.json({ message: "Admin provider list endpoint" });
    } catch (error) {
      res.status(500).json({ message: "Failed to get providers", error: error.message });
    }
  });

  app.put("/api/admin/providers/:id/approve", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const providerId = parseInt(req.params.id);
      const provider = await storage.updateProvider(providerId, { status: "approved" });
      
      // Create notification for provider
      await storage.createNotification({
        userId: provider.userId,
        type: "provider_approved",
        title: "Perfil Aprovado",
        message: "Seu perfil de prestador foi aprovado e agora está ativo!",
        relatedId: provider.id,
      });
      
      res.json(provider);
    } catch (error) {
      res.status(400).json({ message: "Failed to approve provider", error: error.message });
    }
  });

  app.put("/api/admin/providers/:id/reject", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const providerId = parseInt(req.params.id);
      const provider = await storage.updateProvider(providerId, { status: "rejected" });
      
      // Create notification for provider
      await storage.createNotification({
        userId: provider.userId,
        type: "provider_rejected",
        title: "Perfil Rejeitado",
        message: "Seu perfil de prestador foi rejeitado. Entre em contato para mais informações.",
        relatedId: provider.id,
      });
      
      res.json(provider);
    } catch (error) {
      res.status(400).json({ message: "Failed to reject provider", error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
