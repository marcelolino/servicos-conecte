import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { chargingTypesStorage } from "./charging-types-storage";
import { db } from "./db";
import jwt from "jsonwebtoken";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { insertUserSchema, insertProviderSchema, insertServiceRequestSchema, insertReviewSchema, insertProviderServiceSchema, insertServiceChargingTypeSchema, insertOrderSchema, insertOrderItemSchema, insertWithdrawalRequestSchema, insertProviderEarningSchema, insertProviderBankAccountSchema, insertProviderPixKeySchema, insertChatConversationSchema, insertChatMessageSchema, insertPaymentGatewayConfigSchema, insertProviderServiceRequestSchema } from "@shared/schema";
import { 
  upload, 
  uploadDocument,
  uploadBackup,
  uploadBannerImage, 
  uploadServiceImage, 
  uploadCategoryImage, 
  uploadProviderImage, 
  uploadSimpleProviderImage,
  uploadSimpleClientAvatar,
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

// Extend Request type to include user and file
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        userType: string;
      };
      file?: Express.Multer.File;
      files?: { [fieldname: string]: Express.Multer.File[]; } | Express.Multer.File[];
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
  /**
   * @swagger
   * /api/auth/register:
   *   post:
   *     tags: [Authentication]
   *     summary: Registrar novo usuário
   *     description: Cria uma nova conta de usuário (cliente, prestador ou admin)
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RegisterRequest'
   *     responses:
   *       201:
   *         description: Usuário criado com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AuthResponse'
   *       400:
   *         description: Dados inválidos
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       409:
   *         description: Email já existe
   */
  
  // Check if email exists
  app.get("/api/auth/check-email", async (req: Request, res: Response) => {
    try {
      const { email } = req.query;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      const existingUser = await storage.getUserByEmail(email as string);
      res.json({ exists: !!existingUser });
    } catch (error) {
      console.error("Email check error:", error);
      res.status(500).json({ message: "Error checking email" });
    }
  });

  // Check if phone exists
  app.get("/api/auth/check-phone", async (req: Request, res: Response) => {
    try {
      const { phone } = req.query;
      if (!phone) {
        return res.status(400).json({ message: "Phone is required" });
      }
      
      const existingUser = await storage.getUserByPhone(phone as string);
      res.json({ exists: !!existingUser });
    } catch (error) {
      console.error("Phone check error:", error);
      res.status(500).json({ message: "Error checking phone" });
    }
  });

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

  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     tags: [Authentication]
   *     summary: Login do usuário
   *     description: Autentica usuário e retorna token JWT
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LoginRequest'
   *     responses:
   *       200:
   *         description: Login realizado com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AuthResponse'
   *       401:
   *         description: Credenciais inválidas
   *       400:
   *         description: Email e senha obrigatórios
   */
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

  /**
   * @swagger
   * /api/auth/me:
   *   get:
   *     tags: [Authentication]
   *     summary: Obter dados do usuário atual
   *     description: Retorna informações do usuário autenticado
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Dados do usuário
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       401:
   *         description: Token não fornecido
   *       403:
   *         description: Token inválido
   *       404:
   *         description: Usuário não encontrado
   */
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

  // Update user location profile endpoint
  app.put("/api/users/profile/location", authenticateToken, async (req, res) => {
    try {
      const { latitude, longitude, address, city, state, cep } = req.body;
      
      console.log('DEBUG - Location update request:', { latitude, longitude, address, city, state, cep });
      
      if (!latitude || !longitude || !address) {
        return res.status(400).json({ message: "Latitude, longitude e endereço são obrigatórios" });
      }

      const updateData = {
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        address,
        ...(city && { city }),
        ...(state && { state }),
        ...(cep && { cep })
      };

      const updatedUser = await storage.updateUser(req.user!.id, updateData);
      res.json({ 
        message: "Localização salva com sucesso",
        user: { ...updatedUser, password: undefined }
      });
    } catch (error) {
      console.error("Erro ao salvar localização:", error);
      res.status(500).json({ message: "Falha ao salvar localização", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  /**
   * @swagger
   * /api/categories:
   *   get:
   *     tags: [Service Categories]
   *     summary: Listar todas as categorias de serviços
   *     description: Retorna lista de todas as categorias de serviços ativas
   *     responses:
   *       200:
   *         description: Lista de categorias
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/ServiceCategory'
   *       500:
   *         description: Erro interno do servidor
   */
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

  app.get("/api/providers/:id/employees", async (req, res) => {
    try {
      const providerId = parseInt(req.params.id);
      const employees = await storage.getEmployeesByProvider(providerId);
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "Failed to get employees", error: error instanceof Error ? error.message : "Unknown error" });
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

  // Subscribe to a service (provider service subscription)
  app.post("/api/provider-services", authenticateToken, requireProvider, async (req, res) => {
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
      res.status(400).json({ message: "Failed to subscribe to service", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Update provider service
  app.put("/api/provider-services/:id", authenticateToken, requireProvider, async (req, res) => {
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

  // Unsubscribe from a service (delete provider service)
  app.delete("/api/provider-services/:id", authenticateToken, requireProvider, async (req, res) => {
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
      res.json({ message: "Service unsubscribed successfully" });
    } catch (error) {
      res.status(400).json({ message: "Failed to unsubscribe from service", error: error instanceof Error ? error.message : "Unknown error" });
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

  // Service charging types routes
  // Get charging types for a service
  app.get("/api/services/:serviceId/charging-types", authenticateToken, async (req, res) => {
    try {
      const serviceId = parseInt(req.params.serviceId);
      const chargingTypes = await chargingTypesStorage.getServiceChargingTypes(serviceId);
      res.json(chargingTypes);
    } catch (error) {
      res.status(500).json({ message: "Failed to get charging types", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Create charging type for a service
  app.post("/api/services/:serviceId/charging-types", authenticateToken, requireProvider, async (req, res) => {
    try {
      const serviceId = parseInt(req.params.serviceId);
      const provider = await storage.getProviderByUserId(req.user!.id);
      
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }
      
      // Verify service ownership
      const services = await storage.getProviderServices(provider.id);
      const service = services.find(s => s.id === serviceId);
      
      if (!service) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const chargingTypeData = insertServiceChargingTypeSchema.parse({
        ...req.body,
        providerServiceId: serviceId,
      });
      
      const chargingType = await chargingTypesStorage.createServiceChargingType(chargingTypeData);
      res.json(chargingType);
    } catch (error) {
      res.status(400).json({ message: "Failed to create charging type", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Update charging type
  app.put("/api/services/:serviceId/charging-types/:chargingTypeId", authenticateToken, requireProvider, async (req, res) => {
    try {
      const serviceId = parseInt(req.params.serviceId);
      const chargingTypeId = parseInt(req.params.chargingTypeId);
      const provider = await storage.getProviderByUserId(req.user!.id);
      
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }
      
      // Verify service ownership
      const services = await storage.getProviderServices(provider.id);
      const service = services.find(s => s.id === serviceId);
      
      if (!service) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedChargingType = await chargingTypesStorage.updateServiceChargingType(chargingTypeId, req.body);
      res.json(updatedChargingType);
    } catch (error) {
      res.status(400).json({ message: "Failed to update charging type", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Delete charging type
  app.delete("/api/services/:serviceId/charging-types/:chargingTypeId", authenticateToken, requireProvider, async (req, res) => {
    try {
      const serviceId = parseInt(req.params.serviceId);
      const chargingTypeId = parseInt(req.params.chargingTypeId);
      const provider = await storage.getProviderByUserId(req.user!.id);
      
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }
      
      // Verify service ownership
      const services = await storage.getProviderServices(provider.id);
      const service = services.find(s => s.id === serviceId);
      
      if (!service) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await chargingTypesStorage.deleteServiceChargingType(chargingTypeId);
      res.json({ message: "Charging type deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: "Failed to delete charging type", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Bulk create charging types for a service
  app.post("/api/services/:serviceId/charging-types/bulk", authenticateToken, requireProvider, async (req, res) => {
    try {
      const serviceId = parseInt(req.params.serviceId);
      const provider = await storage.getProviderByUserId(req.user!.id);
      
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }
      
      // Verify service ownership
      const services = await storage.getProviderServices(provider.id);
      const service = services.find(s => s.id === serviceId);
      
      if (!service) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const chargingTypesData = req.body.chargingTypes.map((ct: any) => ({
        ...ct,
        providerServiceId: serviceId,
      }));
      
      // Validate each charging type
      const validatedChargingTypes = chargingTypesData.map((ct: any) => 
        insertServiceChargingTypeSchema.parse(ct)
      );
      
      const chargingTypes = await chargingTypesStorage.bulkCreateServiceChargingTypes(validatedChargingTypes);
      res.json(chargingTypes);
    } catch (error) {
      res.status(400).json({ message: "Failed to create charging types", error: error instanceof Error ? error.message : "Unknown error" });
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
          // Check if provider is approved
          if (provider.status !== "approved") {
            return res.status(403).json({ 
              message: "Seu perfil precisa ser aprovado pelo administrador antes de aceitar reservas. Status atual: " + 
                      (provider.status === "pending" ? "Aguardando aprovação" : 
                       provider.status === "rejected" ? "Rejeitado" : provider.status)
            });
          }
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

  // Service request control endpoints for clients
  app.put("/api/service-requests/:id/start", authenticateToken, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const request = await storage.getServiceRequest(requestId);
      
      if (!request) {
        return res.status(404).json({ message: "Service request not found" });
      }
      
      // Only the client can start their service
      if (request.clientId !== req.user!.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Service must be accepted to be started
      if (request.status !== "accepted") {
        return res.status(400).json({ message: "Service must be accepted before it can be started" });
      }
      
      const updatedRequest = await storage.updateServiceRequest(requestId, { 
        status: "in_progress"
      });
      
      res.json(updatedRequest);
    } catch (error) {
      res.status(400).json({ message: "Failed to start service", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.put("/api/service-requests/:id/complete", authenticateToken, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const request = await storage.getServiceRequest(requestId);
      
      if (!request) {
        return res.status(404).json({ message: "Service request not found" });
      }
      
      // Only the client can complete their service
      if (request.clientId !== req.user!.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Check service status
      if (request.status === "completed") {
        return res.status(400).json({ message: "Serviço já foi finalizado" });
      }
      
      if (request.status !== "in_progress") {
        return res.status(400).json({ message: "Service must be in progress before it can be completed" });
      }
      
      const updatedRequest = await storage.updateServiceRequest(requestId, { 
        status: "completed",
        completedAt: new Date()
      });
      
      // Create provider earning record after completing the service
      if (updatedRequest) {
        console.log('Creating provider earning for request:', updatedRequest.id);
        await storage.createProviderEarning(updatedRequest);
        console.log('Provider earning created successfully');
      }
      
      res.json(updatedRequest);
    } catch (error) {
      console.error('Error in complete service endpoint:', error);
      res.status(400).json({ message: "Failed to complete service", error: error instanceof Error ? error.message : "Unknown error" });
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
      
      // Verify service is completed
      if (serviceRequest.status !== "completed") {
        return res.status(400).json({ message: "Só é possível avaliar serviços concluídos" });
      }
      
      const review = await storage.createReview(reviewData);
      res.json(review);
    } catch (error) {
      res.status(400).json({ message: "Failed to create review", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/reviews/service-request/:id", authenticateToken, async (req, res) => {
    try {
      const serviceRequestId = parseInt(req.params.id);
      
      // Verify the service request belongs to the user
      const serviceRequest = await storage.getServiceRequest(serviceRequestId);
      if (!serviceRequest || serviceRequest.clientId !== req.user!.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const review = await storage.getReviewByServiceRequest(serviceRequestId);
      res.json(review || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to get review", error: error instanceof Error ? error.message : "Unknown error" });
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

  // Provider route to access admin services for subscription
  app.get("/api/admin/services/available", authenticateToken, requireProvider, async (req, res) => {
    try {
      const services = await storage.getAllServicesForAdmin();
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Failed to get available services", error: error instanceof Error ? error.message : "Unknown error" });
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

  // User profile routes
  app.put("/api/users/profile", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;
      const userData = req.body;
      
      // Remove sensitive fields that shouldn't be updated via this endpoint
      const { password, userType, ...updateData } = userData;
      
      const updatedUser = await storage.updateUser(userId, updateData);
      res.json(updatedUser);
    } catch (error) {
      res.status(400).json({ message: "Failed to update profile", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.put("/api/users/password", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { currentPassword, newPassword } = req.body;
      
      // Get current user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Verify current password
      const bcrypt = await import('bcrypt');
      const isCurrentPasswordValid = await bcrypt.default.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      // Hash new password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.default.hash(newPassword, saltRounds);
      
      await storage.updateUser(userId, { password: hashedPassword });
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      res.status(400).json({ message: "Failed to update password", error: error instanceof Error ? error.message : "Unknown error" });
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

  // PATCH /api/admin/bookings/:id/status - Atualizar status da reserva
  app.patch("/api/admin/bookings/:id/status", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const { status, note, providerId } = req.body;

      if (!status) {
        return res.status(400).json({ message: "Status é obrigatório" });
      }

      // Validar status permitidos
      const allowedStatuses = ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: "Status inválido" });
      }

      // Verificar se é necessário um prestador para os status aceito ou em andamento
      if ((status === 'accepted' || status === 'in_progress') && !providerId) {
        return res.status(400).json({ message: "Prestador é obrigatório para aceitar ou iniciar a reserva" });
      }

      // Verificar se a reserva existe
      const booking = await storage.getServiceRequest(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Reserva não encontrada" });
      }

      // Se um prestador foi selecionado, verificar se ele existe e está aprovado
      if (providerId) {
        const provider = await storage.getProvider(providerId);
        if (!provider) {
          return res.status(404).json({ message: "Prestador não encontrado" });
        }
        if (provider.status !== 'approved') {
          return res.status(400).json({ message: "Prestador não está aprovado" });
        }
      }

      // Atualizar o status e prestador
      const updateData: any = { status };
      if (providerId) {
        updateData.providerId = providerId;
      }

      const updatedBooking = await storage.updateServiceRequest(bookingId, updateData);

      // Log da alteração
      const logMessage = `Admin ${req.user!.id} alterou status da reserva ${bookingId} para ${status}`;
      const providerLog = providerId ? ` e atribuiu prestador ${providerId}` : '';
      const noteLog = note ? `. Observação: ${note}` : '';
      console.log(logMessage + providerLog + noteLog);

      res.json({ 
        message: "Status atualizado com sucesso",
        booking: updatedBooking 
      });
    } catch (error) {
      console.error('Erro ao atualizar status da reserva:', error);
      res.status(500).json({ message: "Erro ao atualizar status", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // PATCH /api/admin/bookings/:id/cancel - Cancelar reserva
  app.patch("/api/admin/bookings/:id/cancel", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);

      // Verificar se a reserva existe
      const booking = await storage.getServiceRequest(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Reserva não encontrada" });
      }

      // Verificar se a reserva já não está cancelada
      if (booking.status === 'cancelled') {
        return res.status(400).json({ message: "Esta reserva já está cancelada" });
      }

      // Cancelar a reserva
      const updatedBooking = await storage.updateServiceRequest(bookingId, { 
        status: 'cancelled'
      });

      // Log do cancelamento
      console.log(`Admin ${req.user!.id} cancelou a reserva ${bookingId}`);

      res.json({ 
        message: "Reserva cancelada com sucesso",
        booking: updatedBooking 
      });
    } catch (error) {
      console.error('Erro ao cancelar reserva:', error);
      res.status(500).json({ message: "Erro ao cancelar reserva", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // PATCH /api/admin/bookings/:id - Editar dados completos da reserva
  app.patch("/api/admin/bookings/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const { address, cep, city, state, notes, scheduledAt, totalAmount } = req.body;

      // Validar campos obrigatórios
      if (!address || !cep || !city || !state || !scheduledAt || !totalAmount) {
        return res.status(400).json({ message: "Todos os campos obrigatórios devem ser preenchidos" });
      }

      // Validar formato de data
      const scheduledDate = new Date(scheduledAt);
      if (isNaN(scheduledDate.getTime())) {
        return res.status(400).json({ message: "Data/hora agendada inválida" });
      }

      // Validar valor
      const amount = parseFloat(totalAmount);
      if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({ message: "Valor total deve ser um número positivo" });
      }

      // Verificar se a reserva existe
      const booking = await storage.getServiceRequest(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Reserva não encontrada" });
      }

      // Atualizar dados da reserva
      const updateData = {
        address: address.trim(),
        cep: cep.trim(),
        city: city.trim(),
        state: state.trim().toUpperCase(),
        notes: notes?.trim() || null,
        scheduledAt: scheduledDate,
        totalAmount: amount.toString()
      };

      const updatedBooking = await storage.updateServiceRequest(bookingId, updateData);

      // Log da alteração
      console.log(`Admin ${req.user!.id} editou dados da reserva ${bookingId}`);

      res.json({ 
        message: "Reserva atualizada com sucesso",
        booking: updatedBooking 
      });
    } catch (error) {
      console.error('Erro ao editar reserva:', error);
      res.status(500).json({ message: "Erro ao editar reserva", error: error instanceof Error ? error.message : "Unknown error" });
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

  // Admin user management
  app.patch("/api/admin/users/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { name, email, phone, userType, isActive } = req.body;

      // Validar campos obrigatórios
      if (!name || !email) {
        return res.status(400).json({ message: "Nome e email são obrigatórios" });
      }

      // Verificar se o usuário existe
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Atualizar dados do usuário
      const updateData = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        userType: userType || user.userType,
        isActive: isActive !== undefined ? isActive : user.isActive
      };

      const updatedUser = await storage.updateUser(userId, updateData);

      // Log da alteração
      console.log(`Admin ${req.user!.id} editou usuário ${userId}`);

      res.json({ 
        message: "Usuário atualizado com sucesso",
        user: updatedUser 
      });
    } catch (error) {
      console.error('Erro ao editar usuário:', error);
      res.status(500).json({ message: "Erro ao editar usuário", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.patch("/api/admin/users/:id/toggle", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { isActive } = req.body;

      // Verificar se o usuário existe
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Atualizar status do usuário
      const updatedUser = await storage.updateUser(userId, { isActive });

      // Log da alteração
      console.log(`Admin ${req.user!.id} ${isActive ? 'ativou' : 'desativou'} usuário ${userId}`);

      res.json({ 
        message: "Status do usuário alterado com sucesso",
        user: updatedUser 
      });
    } catch (error) {
      console.error('Erro ao alterar status do usuário:', error);
      res.status(500).json({ message: "Erro ao alterar status do usuário", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/admin/users/:id/bookings", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Buscar reservas específicas do usuário usando o método correto
      const userBookings = await storage.getServiceRequestsByClient(userId);
      
      res.json(userBookings);
    } catch (error) {
      console.error('Erro ao buscar histórico de reservas do usuário:', error);
      res.status(500).json({ message: "Erro ao buscar histórico de reservas", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Admin provider management
  app.patch("/api/admin/providers/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const providerId = parseInt(req.params.id);
      const { 
        businessName, 
        description, 
        cnpj, 
        address, 
        city, 
        state, 
        cep, 
        status,
        userName,
        userEmail,
        userPhone,
        userIsActive
      } = req.body;

      // Validar campos obrigatórios
      if (!businessName || !userName || !userEmail) {
        return res.status(400).json({ message: "Nome da empresa, nome do responsável e email são obrigatórios" });
      }

      // Verificar se o prestador existe
      const provider = await storage.getProvider(providerId);
      if (!provider) {
        return res.status(404).json({ message: "Prestador não encontrado" });
      }

      // Atualizar dados do prestador
      const providerUpdateData = {
        businessName: businessName.trim(),
        description: description?.trim() || null,
        cnpj: cnpj?.trim() || null,
        address: address?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim()?.toUpperCase() || null,
        cep: cep?.trim() || null,
        status: status || provider.status
      };

      const updatedProvider = await storage.updateProvider(providerId, providerUpdateData);

      // Atualizar dados do usuário responsável
      if (provider.userId) {
        const userUpdateData = {
          name: userName.trim(),
          email: userEmail.trim().toLowerCase(),
          phone: userPhone?.trim() || null,
          isActive: userIsActive !== undefined ? userIsActive : true
        };

        await storage.updateUser(provider.userId, userUpdateData);
      }

      // Log da alteração
      console.log(`Admin ${req.user!.id} editou prestador ${providerId}`);

      res.json({ 
        message: "Prestador atualizado com sucesso",
        provider: updatedProvider 
      });
    } catch (error) {
      console.error('Erro ao editar prestador:', error);
      res.status(500).json({ message: "Erro ao editar prestador", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.patch("/api/admin/providers/:id/status", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const providerId = parseInt(req.params.id);
      const { status } = req.body;

      // Validar status permitidos
      const allowedStatuses = ['pending', 'approved', 'rejected', 'suspended'];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: "Status inválido" });
      }

      // Verificar se o prestador existe
      const provider = await storage.getProvider(providerId);
      if (!provider) {
        return res.status(404).json({ message: "Prestador não encontrado" });
      }

      // Atualizar status do prestador
      const updatedProvider = await storage.updateProvider(providerId, { status });

      // Log da alteração
      console.log(`Admin ${req.user!.id} alterou status do prestador ${providerId} para ${status}`);

      res.json({ 
        message: "Status do prestador alterado com sucesso",
        provider: updatedProvider 
      });
    } catch (error) {
      console.error('Erro ao alterar status do prestador:', error);
      res.status(500).json({ message: "Erro ao alterar status do prestador", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/admin/providers/:id/bookings", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const providerId = parseInt(req.params.id);
      
      // Buscar reservas específicas do prestador usando o método correto
      const providerBookings = await storage.getServiceRequestsByProvider(providerId);
      
      res.json(providerBookings);
    } catch (error) {
      console.error('Erro ao buscar histórico de reservas do prestador:', error);
      res.status(500).json({ message: "Erro ao buscar histórico de reservas", error: error instanceof Error ? error.message : "Unknown error" });
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
          const aScore = (parseFloat(a.rating || '0') || 0) * (a.totalReviews || 0);
          const bScore = (parseFloat(b.rating || '0') || 0) * (b.totalReviews || 0);
          return bScore - aScore;
        })
        .slice(0, 10);

      // Add services with charging types for each provider
      const providersWithServices = await Promise.all(
        popularProviders.map(async (provider) => {
          const services = await storage.getProviderServices(provider.id);
          return {
            ...provider,
            services
          };
        })
      );
      
      res.json(providersWithServices);
    } catch (error) {
      res.status(500).json({ message: "Failed to get popular providers", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Get nearby providers based on location
  app.get("/api/providers/nearby", async (req, res) => {
    try {
      const { lat, lng, radius = '10', category } = req.query;
      
      if (!lat || !lng) {
        return res.status(400).json({ message: "Latitude and longitude are required" });
      }
      
      const userLat = parseFloat(lat as string);
      const userLng = parseFloat(lng as string);
      const radiusKm = parseFloat(radius as string);
      
      // Get all approved providers
      const providers = await storage.getAllProviders();
      const approvedProviders = providers.filter(provider => provider.status === "approved");
      
      // Calculate distance and filter by radius
      const nearbyProviders = approvedProviders
        .map(provider => {
          // Simple distance calculation (Haversine formula approximation)
          const providerLat = parseFloat(provider.user.latitude || '0');
          const providerLng = parseFloat(provider.user.longitude || '0');
          
          if (providerLat === 0 || providerLng === 0) {
            return null; // Skip providers without location
          }
          
          const dLat = (userLat - providerLat) * Math.PI / 180;
          const dLng = (userLng - providerLng) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                   Math.cos(providerLat * Math.PI / 180) * Math.cos(userLat * Math.PI / 180) *
                   Math.sin(dLng/2) * Math.sin(dLng/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const distance = 6371 * c; // Earth radius in km
          
          return {
            ...provider,
            distance: Math.round(distance * 100) / 100 // Round to 2 decimal places
          };
        })
        .filter(provider => provider && provider.distance <= radiusKm)
        .sort((a, b) => a!.distance - b!.distance);
      
      // Filter by category if provided
      let filteredProviders = nearbyProviders;
      if (category && category !== 'all') {
        const categoryId = parseInt(category as string);
        const providerServices = await storage.getAllProviderServices();
        const providerIdsWithCategory = providerServices
          .filter(service => service.categoryId === categoryId)
          .map(service => service.providerId);
        
        filteredProviders = nearbyProviders.filter(provider => 
          providerIdsWithCategory.includes(provider!.id)
        );
      }

      // Add services for each provider
      const providersWithServices = await Promise.all(
        filteredProviders.slice(0, 20).map(async (provider) => {
          const services = await storage.getProviderServices(provider!.id);
          return {
            ...provider,
            services
          };
        })
      );
      
      res.json(providersWithServices);
    } catch (error) {
      console.error("Error in /api/providers/nearby:", error);
      res.status(500).json({ 
        message: "Failed to get nearby providers", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // ===========================================
  // SERVICES ENDPOINTS FOR MOBILE APP
  // ===========================================

  // Test endpoint to verify API is working
  app.get("/api/services/test", async (req, res) => {
    try {
      const services = await storage.getAllProviderServices();
      res.json({
        status: "API Working",
        version: "1.0",
        servicesCount: services.length,
        availableEndpoints: [
          "GET /api/services",
          "GET /api/services/:id",
          "GET /api/services/category/:categoryId",
          "GET /api/services/provider/:providerId",
          "GET /api/services/popular",
          "GET /api/services/search?q=term"
        ],
        sampleService: services[0] || null
      });
    } catch (error) {
      res.status(500).json({ 
        status: "Error",
        message: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Get all services (specific endpoint)
  app.get("/api/services/all", async (req, res) => {
    try {
      const { category, city, state, search } = req.query;
      
      let services = await storage.getAllProviderServices();
      
      // Filter by category if provided
      if (category) {
        services = services.filter(service => 
          service.categoryId === parseInt(category as string)
        );
      }
      
      // Filter by location if provided
      if (city || state) {
        const providers = await storage.getAllProviders();
        const filteredProviderIds = providers
          .filter(provider => 
            (!city || provider.city === city) &&
            (!state || provider.state === state)
          )
          .map(provider => provider.id);
        
        services = services.filter(service => 
          filteredProviderIds.includes(service.providerId)
        );
      }
      
      // Filter by search term if provided
      if (search) {
        const searchTerm = (search as string).toLowerCase();
        services = services.filter(service => 
          service.name?.toLowerCase().includes(searchTerm) ||
          service.description?.toLowerCase().includes(searchTerm)
        );
      }
      
      res.json(services);
    } catch (error) {
      console.error("Error in /api/services/all:", error);
      res.status(500).json({ 
        message: "Failed to get services", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Get all services (public endpoint for mobile app)
  app.get("/api/services", async (req, res) => {
    try {
      const { category, city, state, search } = req.query;
      
      let services = await storage.getAllProviderServices();
      
      // Filter by category if provided
      if (category) {
        services = services.filter(service => 
          service.categoryId === parseInt(category as string)
        );
      }
      
      // Filter by location if provided
      if (city || state) {
        const providers = await storage.getAllProviders();
        const filteredProviderIds = providers
          .filter(provider => 
            (!city || provider.city === city) &&
            (!state || provider.state === state)
          )
          .map(provider => provider.id);
        
        services = services.filter(service => 
          filteredProviderIds.includes(service.providerId)
        );
      }
      
      // Filter by search term if provided
      if (search) {
        const searchTerm = (search as string).toLowerCase();
        services = services.filter(service => 
          service.name?.toLowerCase().includes(searchTerm) ||
          service.description?.toLowerCase().includes(searchTerm)
        );
      }
      
      res.json(services);
    } catch (error) {
      console.error("Error in /api/services:", error);
      res.status(500).json({ 
        message: "Failed to get services", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Get services by category (public endpoint)
  app.get("/api/services/category/:categoryId", async (req, res) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      const services = await storage.getAllProviderServices();
      
      const categoryServices = services.filter(service => 
        service.categoryId === categoryId
      );
      
      res.json(categoryServices);
    } catch (error) {
      console.error("Error in /api/services/category/:categoryId:", error);
      res.status(500).json({ 
        message: "Failed to get services by category", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Get services by provider (public endpoint)
  app.get("/api/services/provider/:providerId", async (req, res) => {
    try {
      const providerId = parseInt(req.params.providerId);
      const services = await storage.getProviderServices(providerId);
      res.json(services);
    } catch (error) {
      console.error("Error in /api/services/provider/:providerId:", error);
      res.status(500).json({ 
        message: "Failed to get services by provider", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Get popular/featured services (public endpoint)
  app.get("/api/services/popular", async (req, res) => {
    try {
      const services = await storage.getAllProviderServices();
      const providers = await storage.getAllProviders();
      
      // Get providers with high ratings
      const popularProviders = providers
        .filter(provider => provider.status === "approved")
        .sort((a, b) => {
          const aScore = (parseFloat(a.rating || '0') || 0) * (a.totalReviews || 0);
          const bScore = (parseFloat(b.rating || '0') || 0) * (b.totalReviews || 0);
          return bScore - aScore;
        })
        .slice(0, 10)
        .map(p => p.id);
      
      const popularServices = services
        .filter(service => popularProviders.includes(service.providerId))
        .slice(0, 20);
      
      res.json(popularServices);
    } catch (error) {
      console.error("Error in /api/services/popular:", error);
      res.status(500).json({ 
        message: "Failed to get popular services", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Search services (public endpoint)
  app.get("/api/services/search", async (req, res) => {
    try {
      const { q, category, city, state, minPrice, maxPrice } = req.query;
      
      if (!q) {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      let services = await storage.getAllProviderServices();
      const searchTerm = (q as string).toLowerCase();
      
      // Filter by search term
      services = services.filter(service => 
        service.name?.toLowerCase().includes(searchTerm) ||
        service.description?.toLowerCase().includes(searchTerm)
      );
      
      // Apply additional filters
      if (category) {
        services = services.filter(service => 
          service.categoryId === parseInt(category as string)
        );
      }
      
      if (minPrice || maxPrice) {
        services = services.filter(service => {
          const price = parseFloat(service.price || "0");
          return (!minPrice || price >= parseFloat(minPrice as string)) &&
                 (!maxPrice || price <= parseFloat(maxPrice as string));
        });
      }
      
      if (city || state) {
        const providers = await storage.getAllProviders();
        const filteredProviderIds = providers
          .filter(provider => 
            (!city || provider.city === city) &&
            (!state || provider.state === state)
          )
          .map(provider => provider.id);
        
        services = services.filter(service => 
          filteredProviderIds.includes(service.providerId)
        );
      }
      
      res.json(services);
    } catch (error) {
      console.error("Error in /api/services/search:", error);
      res.status(500).json({ 
        message: "Failed to search services", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Legacy endpoint (keep for backward compatibility)
  app.get("/api/services/all", async (req, res) => {
    try {
      console.log("Getting all provider services...");
      const services = await storage.getAllProviderServices();
      console.log("Retrieved services count:", services.length);
      res.json(services);
    } catch (error) {
      console.error("Error in /api/services/all:", error);
      res.status(500).json({ message: "Failed to get provider services", error: error instanceof Error ? error.message : "Unknown error" });
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
      
      if (coupon.maximumUses && (coupon.currentUses || 0) >= coupon.maximumUses) {
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
        orderId: 1, // Temporary orderId, will be set properly in storage
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
      const { quantity, unitPrice } = req.body;

      if (quantity !== undefined && quantity <= 0) {
        await storage.removeCartItem(itemId);
        res.json({ message: "Item removed from cart" });
      } else {
        const item = await storage.updateCartItem(itemId, quantity, unitPrice);
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
      console.log("Creating order for user:", req.user!.id);
      
      // Check if cart exists, if not create order directly from provided data
      const cart = await storage.getCartByClient(req.user!.id);
      
      if (!cart && req.body.items) {
        // Create order directly from provided data (after payment)
        const orderData = {
          clientId: req.user!.id,
          status: "confirmed" as const,
          subtotal: req.body.subtotal || "0.00",
          serviceAmount: req.body.serviceAmount || "0.00", 
          totalAmount: req.body.totalAmount || "0.00",
          paymentMethod: req.body.paymentMethod || null,
          paymentId: req.body.paymentId || null,
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
        };

        const order = await storage.createOrderFromData(orderData, req.body.items);
        console.log("Order created successfully from payment data:", order);
        res.json(order);
      } else if (cart) {
        // Convert existing cart to order
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
          paymentId: req.body.paymentId || null,
        };

        const order = await storage.convertCartToOrder(req.user!.id, orderData);
        console.log("Order created successfully from cart:", order);
        res.json(order);
      } else {
        throw new Error("No cart found and no items provided");
      }
    } catch (error) {
      console.error("Failed to create order:", error);
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
  
  // Public upload routes for registration (no auth required)
  app.post("/api/upload/public/providers", upload.single('image'), uploadSimpleProviderImage);
  app.post("/api/upload/public/avatars", upload.single('image'), uploadSimpleClientAvatar);
  app.post("/api/upload/public/documents", uploadDocument.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Ensure documents directory exists
      const documentsDir = path.join(process.cwd(), 'uploads', 'documents');
      if (!fs.existsSync(documentsDir)) {
        fs.mkdirSync(documentsDir, { recursive: true });
      }

      // Generate unique filename
      const fileExtension = path.extname(req.file.originalname);
      const filename = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${fileExtension}`;
      const finalPath = path.join(documentsDir, filename);

      // Write buffer to file (since we're using memory storage)
      fs.writeFileSync(finalPath, req.file.buffer);

      const imageUrl = `/uploads/documents/${filename}`;
      res.json({ imageUrl, message: 'Document uploaded successfully' });
    } catch (error) {
      console.error('Document upload error:', error);
      res.status(500).json({ message: 'Error uploading document' });
    }
  });
  
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

  // System settings endpoints
  app.get('/api/admin/settings', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const settings = await storage.getSystemSettings();
      res.json(settings);
    } catch (error) {
      console.error('Error fetching system settings:', error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.get('/api/admin/settings/:key', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const setting = await storage.getSystemSetting(key);
      if (!setting) {
        return res.status(404).json({ message: "Setting not found" });
      }
      res.json(setting);
    } catch (error) {
      console.error('Error fetching system setting:', error);
      res.status(500).json({ message: "Failed to fetch setting" });
    }
  });

  app.post('/api/admin/settings', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { key, value, type = 'string', description } = req.body;
      
      if (!key || value === undefined) {
        return res.status(400).json({ message: "Key and value are required" });
      }

      // Check if setting exists
      const existingSetting = await storage.getSystemSetting(key);
      
      if (existingSetting) {
        // Update existing setting
        const updatedSetting = await storage.updateSystemSetting(key, value.toString());
        res.json(updatedSetting);
      } else {
        // Create new setting
        const newSetting = await storage.createSystemSetting({
          key,
          value: value.toString(),
          type,
          description,
          isSystem: false
        });
        res.json(newSetting);
      }
    } catch (error) {
      console.error('Error creating/updating system setting:', error);
      res.status(500).json({ message: "Failed to save setting" });
    }
  });

  app.put('/api/admin/settings/:key', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const { value } = req.body;
      
      if (value === undefined) {
        return res.status(400).json({ message: "Value is required" });
      }

      const updatedSetting = await storage.updateSystemSetting(key, value.toString());
      res.json(updatedSetting);
    } catch (error) {
      console.error('Error updating system setting:', error);
      res.status(500).json({ message: "Failed to update setting" });
    }
  });

  // Database backup and restore routes
  app.post('/api/admin/database/backup', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { spawn } = await import('child_process');
      const fs = await import('fs');
      const path = await import('path');
      
      const { backupName = `backup_qservicos_${new Date().toISOString().split('T')[0].replace(/-/g, '')}`, backupType = 'full' } = req.body;
      
      const backupDir = path.default.join(process.cwd(), 'backups');
      if (!fs.default.existsSync(backupDir)) {
        fs.default.mkdirSync(backupDir, { recursive: true });
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const backupFileName = `${backupName}_${timestamp}.sql`;
      const backupPath = path.default.join(backupDir, backupFileName);
      
      // Get database connection details from environment
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        return res.status(500).json({ message: "Database URL not configured" });
      }
      
      // Parse database URL
      const dbUrlParts = new URL(dbUrl);
      const dbHost = dbUrlParts.hostname;
      const dbPort = dbUrlParts.port || '5432';
      const dbName = dbUrlParts.pathname.slice(1);
      const dbUser = dbUrlParts.username;
      const dbPassword = dbUrlParts.password;
      
      // Build pg_dump command arguments
      let pgDumpArgs = [
        '--host', dbHost,
        '--port', dbPort,
        '--username', dbUser,
        '--dbname', dbName,
        '--verbose',
        '--no-owner',
        '--no-privileges'
      ];
      
      // Add backup type specific options
      if (backupType === 'data-only') {
        pgDumpArgs.push('--data-only');
      } else if (backupType === 'schema-only') {
        pgDumpArgs.push('--schema-only');
      } else {
        // Only add --clean for full backups (not compatible with --data-only)
        pgDumpArgs.push('--clean');
      }
      
      pgDumpArgs.push('--file', backupPath);
      
      // Set environment variable for password
      const env = { ...process.env, PGPASSWORD: dbPassword };
      
      const pgDump = spawn('pg_dump', pgDumpArgs, { env });
      
      let errorOutput = '';
      
      pgDump.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.log('pg_dump stderr:', data.toString());
      });
      
      pgDump.on('close', (code) => {
        if (code === 0) {
          console.log('Backup created successfully:', backupPath);
          
          // Set headers for file download
          res.setHeader('Content-Disposition', `attachment; filename="${backupFileName}"`);
          res.setHeader('Content-Type', 'application/sql');
          
          // Stream the file to response
          const fileStream = fs.default.createReadStream(backupPath);
          fileStream.pipe(res);
          
          // Clean up backup file after sending (optional)
          fileStream.on('end', () => {
            setTimeout(() => {
              if (fs.default.existsSync(backupPath)) {
                fs.default.unlinkSync(backupPath);
              }
            }, 5000); // Delete after 5 seconds
          });
          
        } else {
          console.error('pg_dump exited with code:', code);
          res.status(500).json({ 
            message: "Backup failed", 
            error: errorOutput || `pg_dump exited with code ${code}` 
          });
        }
      });
      
      pgDump.on('error', (error) => {
        console.error('pg_dump error:', error);
        res.status(500).json({ 
          message: "Backup failed", 
          error: error.message 
        });
      });
      
    } catch (error) {
      console.error('Error creating backup:', error);
      res.status(500).json({ 
        message: "Failed to create backup", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.post('/api/admin/database/restore', authenticateToken, requireAdmin, uploadBackup.single('backupFile'), async (req: Request, res: Response) => {
    try {
      const { spawn } = await import('child_process');
      const fs = await import('fs');
      
      if (!req.file) {
        return res.status(400).json({ message: "Backup file is required" });
      }
      
      const backupFilePath = req.file.path;
      
      // Get database connection details from environment
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        return res.status(500).json({ message: "Database URL not configured" });
      }
      
      // Parse database URL
      const dbUrlParts = new URL(dbUrl);
      const dbHost = dbUrlParts.hostname;
      const dbPort = dbUrlParts.port || '5432';
      const dbName = dbUrlParts.pathname.slice(1);
      const dbUser = dbUrlParts.username;
      const dbPassword = dbUrlParts.password;
      
      // Build psql command arguments
      const psqlArgs = [
        '--host', dbHost,
        '--port', dbPort,
        '--username', dbUser,
        '--dbname', dbName,
        '--file', backupFilePath
      ];
      
      // Set environment variable for password
      const env = { ...process.env, PGPASSWORD: dbPassword };
      
      const psql = spawn('psql', psqlArgs, { env });
      
      let output = '';
      let errorOutput = '';
      
      psql.stdout.on('data', (data) => {
        output += data.toString();
        console.log('psql stdout:', data.toString());
      });
      
      psql.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.log('psql stderr:', data.toString());
      });
      
      psql.on('close', (code) => {
        // Clean up uploaded file
        if (fs.default.existsSync(backupFilePath)) {
          fs.default.unlinkSync(backupFilePath);
        }
        
        if (code === 0) {
          console.log('Database restored successfully');
          res.json({ 
            message: "Database restored successfully",
            output: output
          });
        } else {
          console.error('psql exited with code:', code);
          res.status(500).json({ 
            message: "Restore failed", 
            error: errorOutput || `psql exited with code ${code}`,
            output: output
          });
        }
      });
      
      psql.on('error', (error) => {
        console.error('psql error:', error);
        
        // Clean up uploaded file
        if (fs.default.existsSync(backupFilePath)) {
          fs.default.unlinkSync(backupFilePath);
        }
        
        res.status(500).json({ 
          message: "Restore failed", 
          error: error.message 
        });
      });
      
    } catch (error) {
      console.error('Error restoring database:', error);
      res.status(500).json({ 
        message: "Failed to restore database", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.get('/api/admin/database/info', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      
      // Get PostgreSQL version
      const versionResult = await db.execute("SELECT version()");
      const version = versionResult.rows[0]?.version || 'Unknown';
      
      // Get database size
      const sizeResult = await db.execute(`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `);
      const size = sizeResult.rows[0]?.size || 'Unknown';
      
      // Get connection status
      const connectionResult = await db.execute("SELECT 1 as connected");
      const connected = connectionResult.rows.length > 0;
      
      // Get table count
      const tableCountResult = await db.execute(`
        SELECT count(*) as table_count 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      const tableCount = tableCountResult.rows[0]?.table_count || 0;
      
      res.json({
        connected,
        version: (typeof version === 'string' ? version.split(' ')[1] : 'Unknown') || 'Unknown', // Extract version number
        size,
        tableCount,
        lastBackup: 'Nunca' // This could be enhanced to track actual backup history
      });
      
    } catch (error) {
      console.error('Error getting database info:', error);
      res.status(500).json({ 
        message: "Failed to get database info", 
        error: error instanceof Error ? error.message : "Unknown error",
        connected: false
      });
    }
  });

  // Media management routes
  app.get("/api/media/files", authenticateToken, async (req, res) => {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const uploadsDir = path.default.join(process.cwd(), 'uploads');
      const categories = ['banners', 'services', 'categories', 'providers', 'avatars', 'general', 'portfolio'];
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
                         category, // Keep as-is for 'general' and 'portfolio'
                createdAt: stats.birthtime || stats.mtime,
                lastModified: stats.mtime
              });
            }
          }
        }
      }
      
      // Sort by creation date (newest first)
      mediaFiles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      res.json(mediaFiles);
    } catch (error) {
      console.error('Error fetching media files:', error);
      res.status(500).json({ message: "Failed to fetch media files", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Delete media file
  app.delete("/api/media/files/:category/:filename", authenticateToken, async (req, res) => {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const { category, filename } = req.params;
      
      // Map singular category names to plural folder names
      let folderName = category;
      switch(category) {
        case 'banner':
          folderName = 'banners';
          break;
        case 'service':
          folderName = 'services';
          break;
        case 'category':
          folderName = 'categories';
          break;
        case 'provider':
          folderName = 'providers';
          break;
        case 'avatar':
          folderName = 'avatars';
          break;
        // 'general' and 'portfolio' stay the same
      }
      
      const filePath = path.default.join(process.cwd(), 'uploads', folderName, filename);
      
      if (fs.default.existsSync(filePath)) {
        fs.default.unlinkSync(filePath);
        res.json({ message: "File deleted successfully" });
      } else {
        res.status(404).json({ message: "File not found" });
      }
    } catch (error) {
      console.error('Error deleting media file:', error);
      res.status(500).json({ message: "Failed to delete file", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Provider earnings routes
  app.get('/api/provider/earnings', authenticateToken, requireProvider, async (req: Request, res: Response) => {
    try {
      const provider = await storage.getProviderByUserId(req.user!.id);
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }

      const earnings = await storage.getProviderEarnings(provider.id);
      const availableBalance = await storage.getProviderAvailableBalance(provider.id);

      res.json({ earnings, availableBalance });
    } catch (error) {
      console.error('Error fetching provider earnings:', error);
      res.status(500).json({ message: "Failed to fetch earnings" });
    }
  });

  app.get('/api/admin/earnings', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const earnings = await storage.getAllEarnings();
      res.json(earnings);
    } catch (error) {
      console.error('Error fetching all earnings:', error);
      res.status(500).json({ message: "Failed to fetch earnings" });
    }
  });

  // Withdrawal request routes
  app.get('/api/provider/withdrawal-requests', authenticateToken, requireProvider, async (req: Request, res: Response) => {
    try {
      const provider = await storage.getProviderByUserId(req.user!.id);
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }

      const requests = await storage.getWithdrawalRequests(provider.id);
      res.json(requests);
    } catch (error) {
      console.error('Error fetching withdrawal requests:', error);
      res.status(500).json({ message: "Failed to fetch withdrawal requests" });
    }
  });

  app.post('/api/provider/withdrawal-requests', authenticateToken, requireProvider, async (req: Request, res: Response) => {
    try {
      const provider = await storage.getProviderByUserId(req.user!.id);
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }

      const requestData = insertWithdrawalRequestSchema.parse({
        ...req.body,
        providerId: provider.id,
        status: 'pending'
      });

      // Check if provider has enough balance
      const availableBalance = await storage.getProviderAvailableBalance(provider.id);
      const requestAmount = parseFloat(requestData.amount);

      if (requestAmount > availableBalance) {
        return res.status(400).json({ 
          message: `Insufficient balance. Available: R$ ${availableBalance.toFixed(2)}` 
        });
      }

      const newRequest = await storage.createWithdrawalRequest(requestData);
      res.json(newRequest);
    } catch (error) {
      console.error('Error creating withdrawal request:', error);
      res.status(500).json({ message: "Failed to create withdrawal request" });
    }
  });

  app.get('/api/admin/withdrawal-requests', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const requests = await storage.getWithdrawalRequests();
      res.json(requests);
    } catch (error) {
      console.error('Error fetching all withdrawal requests:', error);
      res.status(500).json({ message: "Failed to fetch withdrawal requests" });
    }
  });

  // Provider bank accounts routes
  app.get('/api/provider/bank-accounts', authenticateToken, requireProvider, async (req: Request, res: Response) => {
    try {
      const provider = await storage.getProviderByUserId(req.user!.id);
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }

      const accounts = await storage.getProviderBankAccounts(provider.id);
      res.json(accounts);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      res.status(500).json({ message: "Failed to fetch bank accounts" });
    }
  });

  app.post('/api/provider/bank-accounts', authenticateToken, requireProvider, async (req: Request, res: Response) => {
    try {
      const provider = await storage.getProviderByUserId(req.user!.id);
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }

      const accountData = {
        ...req.body,
        providerId: provider.id,
      };

      const newAccount = await storage.createProviderBankAccount(accountData);
      res.json(newAccount);
    } catch (error) {
      console.error('Error creating bank account:', error);
      res.status(500).json({ message: "Failed to create bank account" });
    }
  });

  app.put('/api/provider/bank-accounts/:id', authenticateToken, requireProvider, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const provider = await storage.getProviderByUserId(req.user!.id);
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }

      const updatedAccount = await storage.updateProviderBankAccount(parseInt(id), req.body);
      res.json(updatedAccount);
    } catch (error) {
      console.error('Error updating bank account:', error);
      res.status(500).json({ message: "Failed to update bank account" });
    }
  });

  app.delete('/api/provider/bank-accounts/:id', authenticateToken, requireProvider, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const provider = await storage.getProviderByUserId(req.user!.id);
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }

      await storage.deleteProviderBankAccount(parseInt(id));
      res.json({ message: "Bank account deleted successfully" });
    } catch (error) {
      console.error('Error deleting bank account:', error);
      res.status(500).json({ message: "Failed to delete bank account" });
    }
  });

  // Provider PIX keys routes
  app.get('/api/provider/pix-keys', authenticateToken, requireProvider, async (req: Request, res: Response) => {
    try {
      const provider = await storage.getProviderByUserId(req.user!.id);
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }

      const pixKeys = await storage.getProviderPixKeys(provider.id);
      res.json(pixKeys);
    } catch (error) {
      console.error('Error fetching PIX keys:', error);
      res.status(500).json({ message: "Failed to fetch PIX keys" });
    }
  });

  app.post('/api/provider/pix-keys', authenticateToken, requireProvider, async (req: Request, res: Response) => {
    try {
      const provider = await storage.getProviderByUserId(req.user!.id);
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }

      const pixKeyData = {
        ...req.body,
        providerId: provider.id,
      };

      const newPixKey = await storage.createProviderPixKey(pixKeyData);
      res.json(newPixKey);
    } catch (error) {
      console.error('Error creating PIX key:', error);
      res.status(500).json({ message: "Failed to create PIX key" });
    }
  });

  app.put('/api/provider/pix-keys/:id', authenticateToken, requireProvider, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const provider = await storage.getProviderByUserId(req.user!.id);
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }

      const updatedPixKey = await storage.updateProviderPixKey(parseInt(id), req.body);
      res.json(updatedPixKey);
    } catch (error) {
      console.error('Error updating PIX key:', error);
      res.status(500).json({ message: "Failed to update PIX key" });
    }
  });

  app.delete('/api/provider/pix-keys/:id', authenticateToken, requireProvider, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const provider = await storage.getProviderByUserId(req.user!.id);
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }

      await storage.deleteProviderPixKey(parseInt(id));
      res.json({ message: "PIX key deleted successfully" });
    } catch (error) {
      console.error('Error deleting PIX key:', error);
      res.status(500).json({ message: "Failed to delete PIX key" });
    }
  });

  app.put('/api/admin/withdrawal-requests/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;

      console.log('Processing withdrawal request:', { id, status, adminNotes, userId: req.user!.id });

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const updatedRequest = await storage.processWithdrawalRequest(
        parseInt(id),
        status,
        req.user!.id,
        adminNotes || undefined
      );

      console.log('Withdrawal request processed successfully:', updatedRequest);
      res.json(updatedRequest);
    } catch (error) {
      console.error('Error processing withdrawal request:', error);
      res.status(500).json({ message: "Failed to process withdrawal request", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Provider bank accounts routes
  app.get("/api/provider/bank-accounts", authenticateToken, requireProvider, async (req, res) => {
    try {
      const provider = await storage.getProviderByUserId(req.user!.id);
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }

      const bankAccounts = await storage.getProviderBankAccounts(provider.id);
      res.json(bankAccounts);
    } catch (error) {
      res.status(500).json({ message: "Failed to get bank accounts", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/provider/bank-accounts", authenticateToken, requireProvider, async (req, res) => {
    try {
      const provider = await storage.getProviderByUserId(req.user!.id);
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }

      const accountData = insertProviderBankAccountSchema.parse({
        ...req.body,
        providerId: provider.id
      });

      const bankAccount = await storage.createProviderBankAccount(accountData);
      res.json(bankAccount);
    } catch (error) {
      res.status(400).json({ message: "Failed to create bank account", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.put("/api/provider/bank-accounts/:id", authenticateToken, requireProvider, async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const updateData = req.body;

      const updatedAccount = await storage.updateProviderBankAccount(accountId, updateData);
      res.json(updatedAccount);
    } catch (error) {
      res.status(400).json({ message: "Failed to update bank account", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.delete("/api/provider/bank-accounts/:id", authenticateToken, requireProvider, async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      await storage.deleteProviderBankAccount(accountId);
      res.json({ message: "Bank account deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: "Failed to delete bank account", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Provider PIX keys routes
  app.get("/api/provider/pix-keys", authenticateToken, requireProvider, async (req, res) => {
    try {
      const provider = await storage.getProviderByUserId(req.user!.id);
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }

      const pixKeys = await storage.getProviderPixKeys(provider.id);
      res.json(pixKeys);
    } catch (error) {
      res.status(500).json({ message: "Failed to get PIX keys", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/provider/pix-keys", authenticateToken, requireProvider, async (req, res) => {
    try {
      const provider = await storage.getProviderByUserId(req.user!.id);
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }

      const pixKeyData = insertProviderPixKeySchema.parse({
        ...req.body,
        providerId: provider.id
      });

      const pixKey = await storage.createProviderPixKey(pixKeyData);
      res.json(pixKey);
    } catch (error) {
      res.status(400).json({ message: "Failed to create PIX key", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.put("/api/provider/pix-keys/:id", authenticateToken, requireProvider, async (req, res) => {
    try {
      const pixKeyId = parseInt(req.params.id);
      const updateData = req.body;

      const updatedPixKey = await storage.updateProviderPixKey(pixKeyId, updateData);
      res.json(updatedPixKey);
    } catch (error) {
      res.status(400).json({ message: "Failed to update PIX key", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.delete("/api/provider/pix-keys/:id", authenticateToken, requireProvider, async (req, res) => {
    try {
      const pixKeyId = parseInt(req.params.id);
      await storage.deleteProviderPixKey(pixKeyId);
      res.json({ message: "PIX key deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: "Failed to delete PIX key", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Admin Payment Gateway Configuration routes
  app.get("/api/admin/payment-gateways", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const configs = await storage.getPaymentGatewayConfigs();
      res.json(configs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payment gateway configurations", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/admin/payment-gateways/:gatewayName", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const config = await storage.getPaymentGatewayConfig(req.params.gatewayName);
      if (!config) {
        return res.status(404).json({ message: "Payment gateway configuration not found" });
      }
      res.json(config);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payment gateway configuration", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/admin/payment-gateways", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const configData = insertPaymentGatewayConfigSchema.parse(req.body);
      const config = await storage.createPaymentGatewayConfig(configData);
      res.json(config);
    } catch (error) {
      res.status(400).json({ message: "Failed to create payment gateway configuration", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.put("/api/admin/payment-gateways/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const configId = parseInt(req.params.id);
      const updateData = req.body;
      const updatedConfig = await storage.updatePaymentGatewayConfig(configId, updateData);
      res.json(updatedConfig);
    } catch (error) {
      res.status(400).json({ message: "Failed to update payment gateway configuration", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.delete("/api/admin/payment-gateways/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const configId = parseInt(req.params.id);
      await storage.deletePaymentGatewayConfig(configId);
      res.json({ message: "Payment gateway configuration deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: "Failed to delete payment gateway configuration", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Chat conversation routes
  app.get('/api/chat/conversations', authenticateToken, async (req: Request, res: Response) => {
    try {
      const conversations = await storage.getChatConversationsByUser(req.user!.id);
      
      // Filter conversations based on chat permissions (admin can see all)
      if (req.user!.userType === "admin") {
        res.json(conversations);
      } else {
        // For non-admin users, filter conversations where they can still chat
        const allowedConversations = [];
        for (const conv of conversations) {
          const otherParticipantId = conv.participantOneId === req.user!.id 
            ? conv.participantTwoId 
            : conv.participantOneId;
          
          const canChat = await storage.canUsersChat(req.user!.id, otherParticipantId);
          if (canChat) {
            allowedConversations.push(conv);
          }
        }
        res.json(allowedConversations);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get('/api/chat/conversations/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      const conversation = await storage.getChatConversation(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      // Check if user is participant
      if (conversation.participantOneId !== req.user!.id && conversation.participantTwoId !== req.user!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(conversation);
    } catch (error) {
      console.error('Error fetching conversation:', error);
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  app.post('/api/chat/conversations', authenticateToken, async (req: Request, res: Response) => {
    try {
      const { participantId, serviceRequestId, title } = req.body;

      if (!participantId) {
        return res.status(400).json({ message: "Participant ID is required" });
      }

      // Check if users can chat (admin can chat with anyone)
      if (req.user!.userType !== "admin") {
        const canChat = await storage.canUsersChat(req.user!.id, participantId);
        if (!canChat) {
          return res.status(403).json({ message: "Chat só é permitido após o prestador aceitar um pedido de serviço" });
        }
      }

      const conversation = await storage.findOrCreateConversation(
        req.user!.id,
        participantId,
        serviceRequestId
      );

      if (title && !conversation.title) {
        await storage.updateChatConversation(conversation.id, { title });
      }

      res.json(conversation);
    } catch (error) {
      console.error('Error creating conversation:', error);
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  // Chat message routes
  app.get('/api/chat/conversations/:id/messages', authenticateToken, async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      
      // Verify user has access to this conversation
      const conversation = await storage.getChatConversation(conversationId);
      if (!conversation || 
          (conversation.participantOneId !== req.user!.id && conversation.participantTwoId !== req.user!.id)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const messages = await storage.getChatMessages(conversationId);
      res.json(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/chat/conversations/:id/messages', authenticateToken, async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { content, messageType, attachmentUrl } = req.body;

      if (!content && !attachmentUrl) {
        return res.status(400).json({ message: "Message content or attachment is required" });
      }

      // Verify user has access to this conversation
      const conversation = await storage.getChatConversation(conversationId);
      if (!conversation || 
          (conversation.participantOneId !== req.user!.id && conversation.participantTwoId !== req.user!.id)) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Additional check: verify users can still chat (admin can always chat)
      if (req.user!.userType !== "admin") {
        const otherParticipantId = conversation.participantOneId === req.user!.id 
          ? conversation.participantTwoId 
          : conversation.participantOneId;
        
        const canChat = await storage.canUsersChat(req.user!.id, otherParticipantId);
        if (!canChat) {
          return res.status(403).json({ message: "Chat só é permitido após o prestador aceitar um pedido de serviço" });
        }
      }

      const messageData = insertChatMessageSchema.parse({
        conversationId,
        senderId: req.user!.id,
        content: content || '',
        messageType: messageType || 'text',
        attachmentUrl: attachmentUrl || null
      });

      const newMessage = await storage.createChatMessage(messageData);
      res.json(newMessage);
    } catch (error) {
      console.error('Error creating message:', error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.put('/api/chat/messages/:id/read', authenticateToken, async (req: Request, res: Response) => {
    try {
      const messageId = parseInt(req.params.id);
      const updatedMessage = await storage.markMessageAsRead(messageId);
      res.json(updatedMessage);
    } catch (error) {
      console.error('Error marking message as read:', error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  app.get('/api/chat/unread-count', authenticateToken, async (req: Request, res: Response) => {
    try {
      const count = await storage.getUnreadMessageCount(req.user!.id);
      res.json({ count });
    } catch (error) {
      console.error('Error fetching unread count:', error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  // Get active payment methods for checkout
  app.get('/api/payment-methods/active', async (req: Request, res: Response) => {
    try {
      const paymentMethods = await storage.getActivePaymentMethods();
      res.json(paymentMethods);
    } catch (error) {
      console.error('Error fetching active payment methods:', error);
      res.status(500).json({ message: "Failed to fetch payment methods" });
    }
  });

  // Get card info (payment method and issuer) based on BIN
  app.post('/api/payments/card-info', authenticateToken, async (req: Request, res: Response) => {
    try {
      const { bin } = req.body; // First 6 digits of card number
      
      if (!bin || bin.length < 6) {
        return res.status(400).json({ message: 'BIN must have at least 6 digits' });
      }
      
      const mercadoPagoConfig = await storage.getActivePaymentMethods();
      const mpConfig = mercadoPagoConfig.find((pm: any) => pm.gatewayName === 'mercadopago' && pm.isActive);
      
      if (!mpConfig || !mpConfig.publicKey) {
        return res.status(400).json({ message: 'MercadoPago not configured' });
      }

      console.log('Searching payment method for BIN:', bin, 'with public key:', mpConfig.publicKey?.substring(0, 10) + '...');

      // Get payment method info from bin
      const paymentMethodResponse = await fetch(`https://api.mercadopago.com/v1/payment_methods/search?bin=${bin}&public_key=${mpConfig.publicKey}`);
      const paymentMethodData = await paymentMethodResponse.json();
      
      console.log('Payment method response:', paymentMethodData);
      
      if (!paymentMethodResponse.ok) {
        console.error('MercadoPago API error:', paymentMethodData);
        return res.status(400).json({ 
          message: 'Error connecting to MercadoPago', 
          error: paymentMethodData 
        });
      }
      
      if (!paymentMethodData.results?.length) {
        console.log('No payment methods found for BIN:', bin);
        return res.status(400).json({ message: 'Invalid card number or unsupported card' });
      }

      const paymentMethod = paymentMethodData.results[0];
      
      // Get issuer info
      const issuerResponse = await fetch(`https://api.mercadopago.com/v1/payment_methods/card_issuers?payment_method_id=${paymentMethod.id}&bin=${bin}&public_key=${mpConfig.publicKey}`);
      const issuerData = await issuerResponse.json();
      
      console.log('Issuer response:', issuerResponse.ok, issuerData);
      
      let issuerId = null;
      if (issuerResponse.ok && issuerData.length > 0) {
        issuerId = issuerData[0].id;
      } else if (paymentMethod.id === 'consumer_credits') {
        // For consumer credits, we don't need issuer_id
        console.log('Consumer credits detected - no issuer required');
        issuerId = null;
      } else {
        console.log('No issuer found, trying to get default issuer from payment method');
        // Try to get issuer from payment method itself if available
        if (paymentMethod.issuer) {
          issuerId = paymentMethod.issuer.id;
        } else if (paymentMethod.issuers && paymentMethod.issuers.length > 0) {
          issuerId = paymentMethod.issuers[0].id;
        }
      }

      console.log('Card info detected:', {
        payment_method_id: paymentMethod.id,
        issuer_id: issuerId,
        payment_type_id: paymentMethod.payment_type_id,
        installments: paymentMethod.installments || null,
        processing_modes: paymentMethod.processing_modes || null
      });

      res.json({
        payment_method_id: paymentMethod.id,
        issuer_id: issuerId,
        payment_type_id: paymentMethod.payment_type_id,
        thumbnail: paymentMethod.thumbnail,
        secure_thumbnail: paymentMethod.secure_thumbnail
      });
    } catch (error) {
      console.error('Card info error:', error);
      res.status(500).json({ message: 'Failed to get card info' });
    }
  });

  // Create card token endpoint - for real token generation
  app.post('/api/payments/create-card-token', async (req: Request, res: Response) => {
    try {
      console.log('Creating card token with data:', req.body);
      
      const mercadoPagoConfig = await storage.getActivePaymentMethods();
      const mpConfig = mercadoPagoConfig.find((pm: any) => pm.gatewayName === 'mercadopago' && pm.isActive);
      
      if (!mpConfig || !mpConfig.accessToken) {
        return res.status(400).json({ error: 'MercadoPago not configured' });
      }

      const { MercadoPagoConfig, CardToken } = await import('mercadopago');
      
      const client = new MercadoPagoConfig({ 
        accessToken: mpConfig.accessToken,
        options: { timeout: 5000 }
      });
      const cardToken = new CardToken(client);

      // Ensure proper data types and formatting
      const tokenData = {
        card_number: String(req.body.card_number).replace(/\D/g, ''), // Remove any non-digit characters
        security_code: String(req.body.security_code),
        expiration_month: String(req.body.expiration_month).padStart(2, '0'), // Ensure 2-digit format
        expiration_year: String(req.body.expiration_year),
        cardholder: {
          name: String(req.body.cardholder_name).toUpperCase(),
          identification: {
            type: String(req.body.cardholder_identification_type),
            number: String(req.body.cardholder_identification_number).replace(/\D/g, '') // Clean CPF/CNPJ
          }
        }
      };

      console.log('Token creation request:', {
        ...tokenData,
        card_number: tokenData.card_number.substring(0, 6) + '******' + tokenData.card_number.slice(-4),
        security_code: '***'
      });

      const result = await cardToken.create({ body: tokenData });
      
      res.json(result);
    } catch (error) {
      console.error('Error creating card token:', error);
      res.status(500).json({ 
        message: 'Failed to create card token', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Card payment route - MercadoPago transparent checkout
  app.post('/api/payments/card', async (req: Request, res: Response) => {
    try {
      console.log('Creating card payment with data:', req.body);
      
      const mercadoPagoConfig = await storage.getActivePaymentMethods();
      console.log('MercadoPago config:', mercadoPagoConfig);
      
      const mpConfig = mercadoPagoConfig.find((pm: any) => pm.gatewayName === 'mercadopago' && pm.isActive);
      if (!mpConfig || !mpConfig.accessToken) {
        return res.status(400).json({ error: 'MercadoPago not configured' });
      }

      console.log('Using access token for card payment:', mpConfig.accessToken.substring(0, 20) + '...');

      const { MercadoPagoConfig, Payment } = await import('mercadopago');
      
      const client = new MercadoPagoConfig({ 
        accessToken: mpConfig.accessToken,
        options: { timeout: 5000 }
      });
      const payment = new Payment(client);

      let paymentData: any = {
        transaction_amount: Number(req.body.transaction_amount),
        token: String(req.body.token),
        description: String(req.body.description),
        installments: Number(req.body.installments) || 1,
        payment_method_id: String(req.body.payment_method_id),
        payer: {
          email: String(req.body.payer.email),
          identification: {
            type: String(req.body.payer.identification.type),
            number: String(req.body.payer.identification.number).replace(/\D/g, '')
          }
        }
      };
      
      // For known test cards with BIN issues, try without issuer_id first
      const isKnownTestCard = req.body.payment_method_id === 'master' || 
                             req.body.payment_method_id === 'visa' || 
                             req.body.payment_method_id === 'amex';
      
      if (isKnownTestCard) {
        console.log('Detected known test card, trying payment without issuer_id first');
        // First attempt without issuer_id to bypass BIN detection issues
      } else {
        // Only add issuer_id for non-test cards or if payment method requires it
        if (req.body.issuer_id !== null && req.body.issuer_id !== undefined && 
            paymentData.payment_method_id !== 'consumer_credits') {
          paymentData.issuer_id = String(req.body.issuer_id);
        }
      }

      console.log('Card payment request:', paymentData);

      try {
        const result = await payment.create({ body: paymentData });
        res.json(result);
      } catch (firstError: any) {
        // If first attempt failed with BIN error and we have issuer_id, try with it
        if (isKnownTestCard && firstError.message === 'bin_not_found' && req.body.issuer_id) {
          console.log('First attempt failed, retrying with issuer_id');
          paymentData.issuer_id = String(req.body.issuer_id);
          
          try {
            const retryResult = await payment.create({ body: paymentData });
            res.json(retryResult);
          } catch (secondError) {
            throw secondError; // Use the second error for final handling
          }
        } else {
          throw firstError; // Use the first error
        }
      }
      
    } catch (error: any) {
      console.error('Error creating card payment:', error);
      
      // Handle specific MercadoPago errors
      let errorMessage = 'Failed to create card payment';
      let statusCode = 500;
      
      if (error.message === 'bin_not_found') {
        errorMessage = 'BIN do cartão não encontrado. Use cartões de teste oficiais do MercadoPago.';
        statusCode = 400;
      } else if (error.cause && Array.isArray(error.cause)) {
        const cause = error.cause[0];
        if (cause.code === 10105) { // BIN not found
          errorMessage = 'Número do cartão não é válido para testes. Use os cartões de teste do MercadoPago.';
          statusCode = 400;
        }
      }
      
      res.status(statusCode).json({ 
        message: errorMessage,
        error: error instanceof Error ? error.message : 'Unknown error',
        mercadopago_error: error.cause || null
      });
    }
  });

  // PIX payment route - MercadoPago transparent checkout
  app.post('/api/payments/pix', async (req: Request, res: Response) => {
    try {
      const { transaction_amount, description, email } = req.body;
      
      if (!transaction_amount || !description || !email) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const pixPayment = await storage.createPixPayment({
        transaction_amount: parseFloat(transaction_amount),
        description: description,
        payerEmail: email
      });
      
      res.json({
        id: pixPayment.id,
        status: pixPayment.status,
        qr_code: pixPayment.qr_code,
        qr_code_base64: pixPayment.qr_code_base64,
        ticket_url: pixPayment.ticket_url
      });
    } catch (error) {
      console.error('Error creating PIX payment:', error);
      res.status(500).json({ 
        message: 'Failed to create PIX payment',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Provider service request routes
  // Get all provider service requests (admin only)
  app.get("/api/admin/provider-service-requests", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const requests = await storage.getProviderServiceRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to get provider service requests", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Get provider service requests by provider (provider only)
  app.get("/api/provider/service-requests", authenticateToken, requireProvider, async (req, res) => {
    try {
      const provider = await storage.getProviderByUserId(req.user!.id);
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }
      
      const requests = await storage.getProviderServiceRequestsByProvider(provider.id);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to get provider service requests", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Create provider service request (provider only)
  app.post("/api/provider/service-requests", authenticateToken, requireProvider, async (req, res) => {
    try {
      const provider = await storage.getProviderByUserId(req.user!.id);
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }

      const requestData = insertProviderServiceRequestSchema.parse({
        ...req.body,
        providerId: provider.id,
      });
      
      const request = await storage.createProviderServiceRequest(requestData);
      res.json(request);
    } catch (error) {
      res.status(400).json({ message: "Failed to create provider service request", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Update provider service request status (admin only)
  app.put("/api/admin/provider-service-requests/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const { status, adminResponse } = req.body;
      
      if (!["pending", "approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const updatedRequest = await storage.updateProviderServiceRequestStatus(
        requestId, 
        status, 
        adminResponse
      );
      
      // If approved, create the actual provider service
      if (status === "approved") {
        const request = await storage.getProviderServiceRequests();
        const serviceRequest = request.find(r => r.id === requestId);
        
        if (serviceRequest) {
          await storage.createProviderService({
            providerId: serviceRequest.providerId,
            categoryId: serviceRequest.categoryId,
            name: serviceRequest.name,
            description: serviceRequest.description,
            price: "50.00", // Default price
            isActive: true,
          });
        }
      }
      
      res.json(updatedRequest);
    } catch (error) {
      res.status(400).json({ message: "Failed to update provider service request", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Register admin routes
  const adminRoutes = await import('./routes/admin');
  app.use('/api/admin', adminRoutes.default);

  const httpServer = createServer(app);
  return httpServer;
}