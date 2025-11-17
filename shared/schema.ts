import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userTypeEnum = pgEnum("user_type", ["client", "provider", "admin", "employee"]);
export const serviceStatusEnum = pgEnum("service_status", ["pending", "accepted", "in_progress", "completed", "cancelled"]);
export const providerStatusEnum = pgEnum("provider_status", ["pending", "approved", "rejected", "suspended"]);
export const paymentMethodEnum = pgEnum("payment_method", ["digital", "cash", "credit_card", "debit_card", "pix"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "processing", "completed", "failed", "refunded"]);
export const bannerStatusEnum = pgEnum("banner_status", ["active", "inactive", "scheduled"]);
export const orderStatusEnum = pgEnum("order_status", ["cart", "pending", "pending_payment", "confirmed", "in_progress", "completed", "cancelled"]);
export const withdrawalStatusEnum = pgEnum("withdrawal_status", ["pending", "approved", "rejected", "completed"]);
export const chatStatusEnum = pgEnum("chat_status", ["active", "closed", "archived"]);
export const messageStatusEnum = pgEnum("message_status", ["sent", "delivered", "read"]);
export const chargingTypeEnum = pgEnum("charging_type", ["visit", "hour", "daily", "package", "quote", "servico", "project"]);
export const requestStatusEnum = pgEnum("request_status", ["pending", "approved", "rejected"]);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  userType: userTypeEnum("user_type").notNull().default("client"),
  address: text("address"),
  cep: varchar("cep", { length: 10 }),
  cpf: varchar("cpf", { length: 14 }), // Campo CPF para clientes
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  avatar: text("avatar"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Service categories table with subcategories support
export const serviceCategories = pgTable("service_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }),
  imageUrl: text("image_url"), // Category image
  color: varchar("color", { length: 20 }),
  parentId: integer("parent_id").references(() => serviceCategories.id), // For subcategories
  level: integer("level").default(0), // 0 = main category, 1 = subcategory
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Providers table
export const providers = pgTable("providers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  categoryId: integer("category_id").references(() => serviceCategories.id), // Primary service category
  status: providerStatusEnum("status").default("pending"),
  // Location fields for filtering by city
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  serviceRadius: integer("service_radius").default(10), // in kilometers
  basePrice: decimal("base_price", { precision: 10, scale: 2 }),
  description: text("description"),
  experience: text("experience"),
  // Registration flow fields
  cpfCnpj: varchar("cpf_cnpj", { length: 20 }), // CPF or CNPJ
  registrationStep: integer("registration_step").default(1), // Current step in wizard
  registrationData: text("registration_data"), // JSON for draft data
  // Banking information
  bankName: varchar("bank_name", { length: 100 }),
  bankAgency: varchar("bank_agency", { length: 10 }),
  bankAccount: varchar("bank_account", { length: 20 }),
  documents: text("documents"), // JSON array of document URLs
  identityDocument: text("identity_document"), // URL for identity document (RG/CNH)
  portfolioImages: text("portfolio_images"), // JSON array of portfolio image URLs
  // New 8-step registration fields
  fullName: varchar("full_name", { length: 255 }), // Full legal name
  birthDate: varchar("birth_date", { length: 10 }), // Date of birth
  cnpj: varchar("cnpj", { length: 20 }), // Company CNPJ (optional)
  addressProof: text("address_proof"), // Address proof document URL
  acceptedTerms: boolean("accepted_terms").default(false), // Partnership terms
  workingHours: text("working_hours"), // Working hours schedule
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  totalReviews: integer("total_reviews").default(0),
  totalServices: integer("total_services").default(0),
  isTrialActive: boolean("is_trial_active").default(true),
  trialEndsAt: timestamp("trial_ends_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Global services catalog - independent of providers
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => serviceCategories.id).notNull(),
  subcategoryId: integer("subcategory_id").references(() => serviceCategories.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  shortDescription: varchar("short_description", { length: 500 }),
  estimatedDuration: varchar("estimated_duration", { length: 100 }), // e.g., "1h", "2h", "1 dia"
  durationType: varchar("duration_type", { length: 20 }).default("hours"), // "hours", "days", "visits"
  materialsIncluded: boolean("materials_included").default(false),
  materialsDescription: text("materials_description"), // What materials are included
  defaultChargingType: chargingTypeEnum("default_charging_type").default("visit"),
  price: decimal("price", { precision: 10, scale: 2 }), // Fixed price for catalog services without provider
  suggestedMinPrice: decimal("suggested_min_price", { precision: 10, scale: 2 }),
  suggestedMaxPrice: decimal("suggested_max_price", { precision: 10, scale: 2 }),
  tags: text("tags"), // JSON array of tags for better search
  requirements: text("requirements"), // What the service requires
  imageUrl: text("image_url"), // Representative service image
  // Location fields for service availability by region
  city: varchar("city", { length: 100 }), // Available in specific city (null = all cities)
  state: varchar("state", { length: 50 }), // Available in specific state (null = all states)
  availableLocations: text("available_locations"), // JSON array of specific locations/regions where service is available
  isActive: boolean("is_active").default(true),
  visibleOnHome: boolean("visible_on_home").default(false), // If the service should be visible on home page
  isOnSale: boolean("is_on_sale").default(false), // If the service is on sale/offer
  salePercentage: decimal("sale_percentage", { precision: 5, scale: 2 }), // Discount percentage (0-100)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Provider services - providers adopt services from catalog with their own conditions
export const providerServices = pgTable("provider_services", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").references(() => providers.id).notNull(),
  categoryId: integer("category_id").references(() => serviceCategories.id).notNull(),
  serviceId: integer("service_id").references(() => services.id), // Reference to global service (optional)
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }),
  minimumPrice: decimal("minimum_price", { precision: 10, scale: 2 }),
  estimatedDuration: varchar("estimated_duration", { length: 100 }),
  durationType: varchar("duration_type", { length: 20 }).default("hours"), // "hours", "days", "visits"
  suggestedMinPrice: decimal("suggested_min_price", { precision: 10, scale: 2 }),
  suggestedMaxPrice: decimal("suggested_max_price", { precision: 10, scale: 2 }),
  tags: text("tags"), // JSON array of tags for better search
  chargingType: chargingTypeEnum("charging_type").default("visit"),
  requirements: text("requirements"),
  serviceZone: text("service_zone"),
  images: text("images"), // JSON array of service images
  customName: varchar("custom_name", { length: 255 }), // Provider can customize name
  customDescription: text("custom_description"), // Provider's custom description
  serviceRadius: integer("service_radius").default(10), // Service radius in km
  serviceZones: text("service_zones"), // JSON array of specific zones/neighborhoods
  availableHours: text("available_hours"), // JSON with availability schedule
  customRequirements: text("custom_requirements"), // Additional provider requirements
  portfolioImages: text("portfolio_images"), // JSON array of provider's work examples
  specialNotes: text("special_notes"), // Provider's special notes or differentials
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Service charging types - Multiple pricing options per service
export const serviceChargingTypes = pgTable("service_charging_types", {
  id: serial("id").primaryKey(),
  providerServiceId: integer("provider_service_id").references(() => providerServices.id).notNull(),
  chargingType: chargingTypeEnum("charging_type").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }), // Removido notNull para permitir orçamentos personalizados
  description: text("description"), // Additional details like "Pacote de 5 visitas com desconto"
  minimumQuantity: integer("minimum_quantity").default(1), // For packages
  maximumQuantity: integer("maximum_quantity"), // For packages
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Provider categories table - many-to-many relationship between providers and categories
export const providerCategories = pgTable("provider_categories", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").references(() => providers.id).notNull(),
  categoryId: integer("category_id").references(() => serviceCategories.id).notNull(),
  isPrimary: boolean("is_primary").default(false), // Mark the primary category
  createdAt: timestamp("created_at").defaultNow(),
});

// Provider service requests (for admin approval)
export const providerServiceRequests = pgTable("provider_service_requests", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").references(() => providers.id).notNull(),
  categoryId: integer("category_id").references(() => serviceCategories.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  status: requestStatusEnum("status").default("pending"),
  adminResponse: text("admin_response"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Service requests table
export const serviceRequests = pgTable("service_requests", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => users.id).notNull(),
  categoryId: integer("category_id").references(() => serviceCategories.id).notNull(),
  providerId: integer("provider_id").references(() => providers.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  address: text("address").notNull(),
  cep: varchar("cep", { length: 10 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 50 }).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  estimatedPrice: decimal("estimated_price", { precision: 10, scale: 2 }),
  finalPrice: decimal("final_price", { precision: 10, scale: 2 }),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
  paymentMethod: paymentMethodEnum("payment_method"),
  paymentStatus: paymentStatusEnum("payment_status").default("pending"),
  notes: text("notes"),
  status: serviceStatusEnum("status").default("pending"),
  scheduledAt: timestamp("scheduled_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Reviews table
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  serviceRequestId: integer("service_request_id").references(() => serviceRequests.id).notNull(),
  clientId: integer("client_id").references(() => users.id).notNull(),
  providerId: integer("provider_id").references(() => providers.id).notNull(),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'service_request', 'service_accepted', etc.
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  relatedId: integer("related_id"), // ID of related record (service request, etc.)
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// File uploads table for tracking and management
export const fileUploads = pgTable("file_uploads", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(), // 'banners', 'services', 'categories', 'providers', 'avatars'
  isActive: boolean("is_active").default(true),
  virusScanned: boolean("virus_scanned").default(false),
  virusScanResult: varchar("virus_scan_result", { length: 50 }).default("pending"), // 'clean', 'infected', 'pending', 'error'
  lastAccessed: timestamp("last_accessed").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User upload limits and statistics
export const userUploadStats = pgTable("user_upload_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  dailyUploads: integer("daily_uploads").default(0),
  monthlyUploads: integer("monthly_uploads").default(0),
  totalUploads: integer("total_uploads").default(0),
  totalSize: integer("total_size").default(0), // in bytes
  lastUpload: timestamp("last_upload"),
  lastDailyReset: timestamp("last_daily_reset").defaultNow(),
  lastMonthlyReset: timestamp("last_monthly_reset").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Employees table (workers under providers)
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").references(() => providers.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  specialization: text("specialization"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Service zones table
export const serviceZones = pgTable("service_zones", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  coordinates: text("coordinates"), // JSON with polygon coordinates
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Promotional banners table
export const promotionalBanners = pgTable("promotional_banners", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  categoryId: integer("category_id").references(() => serviceCategories.id),
  targetUrl: text("target_url"),
  status: bannerStatusEnum("status").default("active"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  clickCount: integer("click_count").default(0),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payments table
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  serviceRequestId: integer("service_request_id").references(() => serviceRequests.id).notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  commissionAmount: decimal("commission_amount", { precision: 10, scale: 2 }),
  status: paymentStatusEnum("status").default("pending"),
  transactionId: varchar("transaction_id", { length: 255 }),
  gatewayResponse: text("gateway_response"), // JSON response from payment gateway
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Coupons table
export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  discountType: varchar("discount_type", { length: 20 }).notNull(), // 'percentage', 'fixed'
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  minimumAmount: decimal("minimum_amount", { precision: 10, scale: 2 }),
  maximumUses: integer("maximum_uses"),
  currentUses: integer("current_uses").default(0),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Service assignments table (for assigning services to employees)
export const serviceAssignments = pgTable("service_assignments", {
  id: serial("id").primaryKey(),
  serviceRequestId: integer("service_request_id").references(() => serviceRequests.id).notNull(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  assignedAt: timestamp("assigned_at").defaultNow(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Orders table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => users.id).notNull(),
  providerId: integer("provider_id").references(() => providers.id),
  serviceRequestId: integer("service_request_id").references(() => serviceRequests.id), // Link to original service request if converted
  status: orderStatusEnum("status").default("cart"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).default("0.00"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0.00"),
  serviceAmount: decimal("service_amount", { precision: 10, scale: 2 }).default("0.00"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).default("0.00"),
  couponCode: varchar("coupon_code", { length: 50 }),
  paymentMethod: paymentMethodEnum("payment_method"),
  address: text("address"),
  cep: varchar("cep", { length: 10 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  scheduledAt: timestamp("scheduled_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Order items table
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  providerServiceId: integer("provider_service_id").references(() => providerServices.id),
  catalogServiceId: integer("catalog_service_id").references(() => services.id),
  serviceChargingTypeId: integer("service_charging_type_id").references(() => serviceChargingTypes.id),
  quantity: integer("quantity").default(1),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  chargingType: chargingTypeEnum("charging_type").default("visit"), // Default para não quebrar dados existentes
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// System settings table
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  type: varchar("type", { length: 50 }).default("string"), // 'string', 'number', 'boolean', 'json'
  description: text("description"),
  isSystem: boolean("is_system").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Provider earnings table
export const providerEarnings = pgTable("provider_earnings", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").references(() => providers.id).notNull(),
  serviceRequestId: integer("service_request_id").references(() => serviceRequests.id).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull(), // Percentage
  commissionAmount: decimal("commission_amount", { precision: 10, scale: 2 }).notNull(),
  providerAmount: decimal("provider_amount", { precision: 10, scale: 2 }).notNull(), // Amount provider receives
  isWithdrawn: boolean("is_withdrawn").default(false),
  withdrawnAt: timestamp("withdrawn_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Provider bank accounts table
export const providerBankAccounts = pgTable("provider_bank_accounts", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").references(() => providers.id).notNull(),
  bankName: varchar("bank_name", { length: 255 }).notNull(),
  agency: varchar("agency", { length: 20 }).notNull(),
  accountNumber: varchar("account_number", { length: 50 }).notNull(),
  accountHolder: varchar("account_holder", { length: 255 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Provider PIX keys table
export const providerPixKeys = pgTable("provider_pix_keys", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").references(() => providers.id).notNull(),
  pixKey: varchar("pix_key", { length: 255 }).notNull(),
  pixType: varchar("pix_type", { length: 20 }).notNull(), // "cpf", "email", "phone", "random"
  accountHolder: varchar("account_holder", { length: 255 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Withdrawal requests table
export const withdrawalRequests = pgTable("withdrawal_requests", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").references(() => providers.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  bankName: varchar("bank_name", { length: 255 }),
  accountNumber: varchar("account_number", { length: 50 }),
  accountHolderName: varchar("account_holder_name", { length: 255 }),
  cpfCnpj: varchar("cpf_cnpj", { length: 20 }),
  paymentMethod: varchar("payment_method", { length: 50 }),
  pixKey: varchar("pix_key", { length: 255 }),
  status: withdrawalStatusEnum("status").default("pending"),
  requestNotes: text("request_notes"), // Provider notes
  adminNotes: text("admin_notes"), // Admin response notes
  processedBy: integer("processed_by").references(() => users.id), // Admin who processed
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  bankAccountId: integer("bank_account_id").references(() => providerBankAccounts.id),
  pixKeyId: integer("pix_key_id").references(() => providerPixKeys.id),
});

// Chat conversations table
export const chatConversations = pgTable("chat_conversations", {
  id: serial("id").primaryKey(),
  participantOneId: integer("participant_one_id").references(() => users.id).notNull(),
  participantTwoId: integer("participant_two_id").references(() => users.id).notNull(),
  serviceRequestId: integer("service_request_id").references(() => serviceRequests.id), // Optional link to service request
  orderId: integer("order_id").references(() => orders.id), // Optional link to order
  title: varchar("title", { length: 255 }),
  status: chatStatusEnum("status").default("active"),
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat messages table
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => chatConversations.id).notNull(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  messageType: varchar("message_type", { length: 20 }).default("text"), // text, image, file, system
  attachmentUrl: text("attachment_url"), // For images/files
  status: messageStatusEnum("status").default("sent"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payment gateway configurations table
export const paymentGatewayConfigs = pgTable("payment_gateway_configs", {
  id: serial("id").primaryKey(),
  gatewayName: varchar("gateway_name", { length: 50 }).notNull(), // 'stripe', 'mercadopago'
  isActive: boolean("is_active").default(false),
  environmentMode: varchar("environment_mode", { length: 20 }).default("test"), // 'test', 'live'
  publicKey: text("public_key"),
  accessToken: text("access_token"),
  clientId: text("client_id"),
  gatewayTitle: varchar("gateway_title", { length: 255 }),
  logo: text("logo"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Page configurations table
export const pageConfigurations = pgTable("page_configurations", {
  id: serial("id").primaryKey(),
  pageKey: varchar("page_key", { length: 100 }).notNull().unique(), // 'about_us', 'privacy_policy', etc.
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Page settings table for general site configuration
export const pageSettings = pgTable("page_settings", {
  id: serial("id").primaryKey(),
  siteName: varchar("site_name", { length: 255 }).notNull().default("Qserviços"),
  siteDescription: text("site_description").default("Plataforma de marketplace de serviços"),
  siteLogo: text("site_logo"),
  primaryColor: varchar("primary_color", { length: 7 }).default("#0ea5e9"),
  secondaryColor: varchar("secondary_color", { length: 7 }).default("#64748b"),
  footerText: text("footer_text").default("© 2024 Qserviços. Todos os direitos reservados."),
  seoTitle: varchar("seo_title", { length: 255 }).default("Qserviços - Marketplace de Serviços"),
  seoDescription: text("seo_description").default("Conecte-se com prestadores de serviços qualificados em sua região"),
  seoKeywords: text("seo_keywords").default("serviços, marketplace, prestadores, profissionais"),
  analyticsId: varchar("analytics_id", { length: 255 }),
  enableAnalytics: boolean("enable_analytics").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Custom charging types table (extends the enum)
export const customChargingTypes = pgTable("custom_charging_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  provider: one(providers, {
    fields: [users.id],
    references: [providers.userId],
  }),
  serviceRequests: many(serviceRequests),
  orders: many(orders),
  reviews: many(reviews),
  notifications: many(notifications),
}));

export const providersRelations = relations(providers, ({ one, many }) => ({
  user: one(users, {
    fields: [providers.userId],
    references: [users.id],
  }),
  services: many(providerServices),
  serviceRequests: many(serviceRequests),
  reviews: many(reviews),
  earnings: many(providerEarnings),
  withdrawalRequests: many(withdrawalRequests),
  bankAccounts: many(providerBankAccounts),
  pixKeys: many(providerPixKeys),
  categories: many(providerCategories),
}));

export const serviceCategoriesRelations = relations(serviceCategories, ({ one, many }) => ({
  parent: one(serviceCategories, {
    fields: [serviceCategories.parentId],
    references: [serviceCategories.id],
  }),
  subcategories: many(serviceCategories, {
    relationName: "subcategories"
  }),
  services: many(services),
  providerServices: many(providerServices),
  serviceRequests: many(serviceRequests),
  providers: many(providerCategories),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  category: one(serviceCategories, {
    fields: [services.categoryId],
    references: [serviceCategories.id],
  }),
  subcategory: one(serviceCategories, {
    fields: [services.subcategoryId],
    references: [serviceCategories.id],
  }),
  providerServices: many(providerServices),
}));

export const providerServicesRelations = relations(providerServices, ({ one, many }) => ({
  provider: one(providers, {
    fields: [providerServices.providerId],
    references: [providers.id],
  }),
  service: one(services, {
    fields: [providerServices.serviceId],
    references: [services.id],
  }),
  chargingTypes: many(serviceChargingTypes),
}));

export const serviceChargingTypesRelations = relations(serviceChargingTypes, ({ one }) => ({
  providerService: one(providerServices, {
    fields: [serviceChargingTypes.providerServiceId],
    references: [providerServices.id],
  }),
}));

export const serviceRequestsRelations = relations(serviceRequests, ({ one, many }) => ({
  client: one(users, {
    fields: [serviceRequests.clientId],
    references: [users.id],
  }),
  provider: one(providers, {
    fields: [serviceRequests.providerId],
    references: [providers.id],
  }),
  category: one(serviceCategories, {
    fields: [serviceRequests.categoryId],
    references: [serviceCategories.id],
  }),
  reviews: many(reviews),
  orders: many(orders),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  serviceRequest: one(serviceRequests, {
    fields: [reviews.serviceRequestId],
    references: [serviceRequests.id],
  }),
  client: one(users, {
    fields: [reviews.clientId],
    references: [users.id],
  }),
  provider: one(providers, {
    fields: [reviews.providerId],
    references: [providers.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const employeesRelations = relations(employees, ({ one }) => ({
  provider: one(providers, {
    fields: [employees.providerId],
    references: [providers.id],
  }),
  user: one(users, {
    fields: [employees.userId],
    references: [users.id],
  }),
}));

export const serviceZonesRelations = relations(serviceZones, ({ many }) => ({
  // Add relations as needed
}));

export const promotionalBannersRelations = relations(promotionalBanners, ({ one }) => ({
  category: one(serviceCategories, {
    fields: [promotionalBanners.categoryId],
    references: [serviceCategories.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  serviceRequest: one(serviceRequests, {
    fields: [payments.serviceRequestId],
    references: [serviceRequests.id],
  }),
}));

export const couponsRelations = relations(coupons, ({ many }) => ({
  // Add relations as needed
}));

export const serviceAssignmentsRelations = relations(serviceAssignments, ({ one }) => ({
  serviceRequest: one(serviceRequests, {
    fields: [serviceAssignments.serviceRequestId],
    references: [serviceRequests.id],
  }),
  employee: one(employees, {
    fields: [serviceAssignments.employeeId],
    references: [employees.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  client: one(users, {
    fields: [orders.clientId],
    references: [users.id],
  }),
  provider: one(providers, {
    fields: [orders.providerId],
    references: [providers.id],
  }),
  serviceRequest: one(serviceRequests, {
    fields: [orders.serviceRequestId],
    references: [serviceRequests.id],
  }),
  items: many(orderItems),
  payment: one(payments, {
    fields: [orders.id],
    references: [payments.serviceRequestId], // Reusing for order payments
  }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  providerService: one(providerServices, {
    fields: [orderItems.providerServiceId],
    references: [providerServices.id],
  }),
  serviceChargingType: one(serviceChargingTypes, {
    fields: [orderItems.serviceChargingTypeId],
    references: [serviceChargingTypes.id],
  }),
}));

export const systemSettingsRelations = relations(systemSettings, ({ many }) => ({
  // Add relations as needed
}));

export const providerEarningsRelations = relations(providerEarnings, ({ one }) => ({
  provider: one(providers, {
    fields: [providerEarnings.providerId],
    references: [providers.id],
  }),
  serviceRequest: one(serviceRequests, {
    fields: [providerEarnings.serviceRequestId],
    references: [serviceRequests.id],
  }),
}));

export const providerBankAccountsRelations = relations(providerBankAccounts, ({ one, many }) => ({
  provider: one(providers, {
    fields: [providerBankAccounts.providerId],
    references: [providers.id],
  }),
  withdrawalRequests: many(withdrawalRequests),
}));

export const providerPixKeysRelations = relations(providerPixKeys, ({ one, many }) => ({
  provider: one(providers, {
    fields: [providerPixKeys.providerId],
    references: [providers.id],
  }),
  withdrawalRequests: many(withdrawalRequests),
}));

export const withdrawalRequestsRelations = relations(withdrawalRequests, ({ one }) => ({
  provider: one(providers, {
    fields: [withdrawalRequests.providerId],
    references: [providers.id],
  }),
  bankAccount: one(providerBankAccounts, {
    fields: [withdrawalRequests.bankAccountId],
    references: [providerBankAccounts.id],
  }),
  pixKey: one(providerPixKeys, {
    fields: [withdrawalRequests.pixKeyId],
    references: [providerPixKeys.id],
  }),
  processedBy: one(users, {
    fields: [withdrawalRequests.processedBy],
    references: [users.id],
  }),
}));

export const chatConversationsRelations = relations(chatConversations, ({ one, many }) => ({
  participantOne: one(users, {
    fields: [chatConversations.participantOneId],
    references: [users.id],
  }),
  participantTwo: one(users, {
    fields: [chatConversations.participantTwoId],
    references: [users.id],
  }),
  serviceRequest: one(serviceRequests, {
    fields: [chatConversations.serviceRequestId],
    references: [serviceRequests.id],
  }),
  order: one(orders, {
    fields: [chatConversations.orderId],
    references: [orders.id],
  }),
  messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  conversation: one(chatConversations, {
    fields: [chatMessages.conversationId],
    references: [chatConversations.id],
  }),
  sender: one(users, {
    fields: [chatMessages.senderId],
    references: [users.id],
  }),
}));

export const paymentGatewayConfigsRelations = relations(paymentGatewayConfigs, ({ many }) => ({
  // Add relations as needed
}));

export const pageConfigurationsRelations = relations(pageConfigurations, ({ many }) => ({
  // Add relations as needed
}));

export const providerCategoriesRelations = relations(providerCategories, ({ one }) => ({
  provider: one(providers, {
    fields: [providerCategories.providerId],
    references: [providers.id],
  }),
  category: one(serviceCategories, {
    fields: [providerCategories.categoryId],
    references: [serviceCategories.id],
  }),
}));

export const providerServiceRequestsRelations = relations(providerServiceRequests, ({ one }) => ({
  provider: one(providers, {
    fields: [providerServiceRequests.providerId],
    references: [providers.id],
  }),
  category: one(serviceCategories, {
    fields: [providerServiceRequests.categoryId],
    references: [serviceCategories.id],
  }),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProviderSchema = createInsertSchema(providers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertServiceCategorySchema = createInsertSchema(serviceCategories).omit({
  id: true,
  createdAt: true,
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProviderServiceSchema = createInsertSchema(providerServices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProviderCategorySchema = createInsertSchema(providerCategories).omit({
  id: true,
  createdAt: true,
});

export const insertServiceChargingTypeSchema = createInsertSchema(serviceChargingTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProviderServiceRequestSchema = createInsertSchema(providerServiceRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertServiceRequestSchema = createInsertSchema(serviceRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertServiceZoneSchema = createInsertSchema(serviceZones).omit({
  id: true,
  createdAt: true,
});

export const insertPromotionalBannerSchema = createInsertSchema(promotionalBanners).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  clickCount: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCouponSchema = createInsertSchema(coupons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  currentUses: true,
});

export const insertServiceAssignmentSchema = createInsertSchema(serviceAssignments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSystemSettingSchema = createInsertSchema(systemSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertFileUploadSchema = createInsertSchema(fileUploads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProviderBankAccountSchema = createInsertSchema(providerBankAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProviderPixKeySchema = createInsertSchema(providerPixKeys).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserUploadStatsSchema = createInsertSchema(userUploadStats).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProviderEarningSchema = createInsertSchema(providerEarnings).omit({
  id: true,
  createdAt: true,
});

export const insertWithdrawalRequestSchema = createInsertSchema(withdrawalRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  amount: z.union([z.string(), z.number()]).transform(val => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return num.toString();
  }),
});

export const insertChatConversationSchema = createInsertSchema(chatConversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentGatewayConfigSchema = createInsertSchema(paymentGatewayConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPageConfigurationSchema = createInsertSchema(pageConfigurations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPageSettingsSchema = createInsertSchema(pageSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Provider = typeof providers.$inferSelect;
export type InsertProvider = z.infer<typeof insertProviderSchema>;
export type ServiceCategory = typeof serviceCategories.$inferSelect;
export type InsertServiceCategory = z.infer<typeof insertServiceCategorySchema>;
export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type ProviderService = typeof providerServices.$inferSelect;
export type InsertProviderService = z.infer<typeof insertProviderServiceSchema>;
export type ProviderCategory = typeof providerCategories.$inferSelect;
export type InsertProviderCategory = z.infer<typeof insertProviderCategorySchema>;
export type ServiceChargingType = typeof serviceChargingTypes.$inferSelect;
export type InsertServiceChargingType = z.infer<typeof insertServiceChargingTypeSchema>;
export type ProviderServiceRequest = typeof providerServiceRequests.$inferSelect;
export type InsertProviderServiceRequest = z.infer<typeof insertProviderServiceRequestSchema>;
export type ServiceRequest = typeof serviceRequests.$inferSelect;
export type InsertServiceRequest = z.infer<typeof insertServiceRequestSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type ServiceZone = typeof serviceZones.$inferSelect;
export type InsertServiceZone = z.infer<typeof insertServiceZoneSchema>;
export type PromotionalBanner = typeof promotionalBanners.$inferSelect;
export type InsertPromotionalBanner = z.infer<typeof insertPromotionalBannerSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = z.infer<typeof insertCouponSchema>;
export type ServiceAssignment = typeof serviceAssignments.$inferSelect;
export type InsertServiceAssignment = z.infer<typeof insertServiceAssignmentSchema>;
export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;
export type FileUpload = typeof fileUploads.$inferSelect;
export type InsertFileUpload = z.infer<typeof insertFileUploadSchema>;
export type UserUploadStats = typeof userUploadStats.$inferSelect;
export type InsertUserUploadStats = z.infer<typeof insertUserUploadStatsSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type ProviderEarning = typeof providerEarnings.$inferSelect;
export type InsertProviderEarning = z.infer<typeof insertProviderEarningSchema>;
export type WithdrawalRequest = typeof withdrawalRequests.$inferSelect;
export type InsertWithdrawalRequest = z.infer<typeof insertWithdrawalRequestSchema>;
export type ProviderBankAccount = typeof providerBankAccounts.$inferSelect;
export type InsertProviderBankAccount = z.infer<typeof insertProviderBankAccountSchema>;
export type ProviderPixKey = typeof providerPixKeys.$inferSelect;
export type InsertProviderPixKey = z.infer<typeof insertProviderPixKeySchema>;
export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertChatConversation = z.infer<typeof insertChatConversationSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type PaymentGatewayConfig = typeof paymentGatewayConfigs.$inferSelect;
export type InsertPaymentGatewayConfig = z.infer<typeof insertPaymentGatewayConfigSchema>;
export type PageConfiguration = typeof pageConfigurations.$inferSelect;
export type InsertPageConfiguration = z.infer<typeof insertPageConfigurationSchema>;
export type PageSettings = typeof pageSettings.$inferSelect;
export type InsertPageSettings = z.infer<typeof insertPageSettingsSchema>;

// Social Settings Table
export const socialSettings = pgTable('social_settings', {
  id: serial('id').primaryKey(),
  facebook: text('facebook').default(''),
  instagram: text('instagram').default(''),
  twitter: text('twitter').default(''),
  linkedin: text('linkedin').default(''),
  youtube: text('youtube').default(''),
  whatsapp: text('whatsapp').default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertSocialSettingsSchema = createInsertSchema(socialSettings);
export type SocialSettings = typeof socialSettings.$inferSelect;
export type InsertSocialSettings = z.infer<typeof insertSocialSettingsSchema>;

// Custom charging types schemas
export const insertCustomChargingTypeSchema = createInsertSchema(customChargingTypes);
export type InsertCustomChargingType = z.infer<typeof insertCustomChargingTypeSchema>;
export type CustomChargingType = typeof customChargingTypes.$inferSelect;
