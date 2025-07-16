import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userTypeEnum = pgEnum("user_type", ["client", "provider", "admin", "employee"]);
export const serviceStatusEnum = pgEnum("service_status", ["pending", "accepted", "in_progress", "completed", "cancelled"]);
export const providerStatusEnum = pgEnum("provider_status", ["pending", "approved", "rejected", "suspended"]);
export const paymentMethodEnum = pgEnum("payment_method", ["digital", "cash", "credit_card", "pix"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "processing", "completed", "failed", "refunded"]);
export const bannerStatusEnum = pgEnum("banner_status", ["active", "inactive", "scheduled"]);

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
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  avatar: text("avatar"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Service categories table
export const serviceCategories = pgTable("service_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }),
  imageUrl: text("image_url"), // Category image
  color: varchar("color", { length: 20 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Providers table
export const providers = pgTable("providers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  status: providerStatusEnum("status").default("pending"),
  serviceRadius: integer("service_radius").default(10), // in kilometers
  basePrice: decimal("base_price", { precision: 10, scale: 2 }),
  description: text("description"),
  experience: text("experience"),
  documents: text("documents"), // JSON array of document URLs
  portfolioImages: text("portfolio_images"), // JSON array of portfolio image URLs
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  totalReviews: integer("total_reviews").default(0),
  totalServices: integer("total_services").default(0),
  isTrialActive: boolean("is_trial_active").default(true),
  trialEndsAt: timestamp("trial_ends_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Provider services (many-to-many relationship)
export const providerServices = pgTable("provider_services", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").references(() => providers.id).notNull(),
  categoryId: integer("category_id").references(() => serviceCategories.id).notNull(),
  name: varchar("name", { length: 255 }),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }),
  minimumPrice: decimal("minimum_price", { precision: 10, scale: 2 }),
  estimatedDuration: varchar("estimated_duration", { length: 100 }),
  requirements: text("requirements"),
  serviceZone: text("service_zone"),
  images: text("images"), // JSON array of service image URLs
  isActive: boolean("is_active").default(true),
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

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  provider: one(providers, {
    fields: [users.id],
    references: [providers.userId],
  }),
  serviceRequests: many(serviceRequests),
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
}));

export const serviceCategoriesRelations = relations(serviceCategories, ({ many }) => ({
  providerServices: many(providerServices),
  serviceRequests: many(serviceRequests),
}));

export const providerServicesRelations = relations(providerServices, ({ one }) => ({
  provider: one(providers, {
    fields: [providerServices.providerId],
    references: [providers.id],
  }),
  category: one(serviceCategories, {
    fields: [providerServices.categoryId],
    references: [serviceCategories.id],
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

export const systemSettingsRelations = relations(systemSettings, ({ many }) => ({
  // Add relations as needed
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

export const insertProviderServiceSchema = createInsertSchema(providerServices).omit({
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

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Provider = typeof providers.$inferSelect;
export type InsertProvider = z.infer<typeof insertProviderSchema>;
export type ServiceCategory = typeof serviceCategories.$inferSelect;
export type InsertServiceCategory = z.infer<typeof insertServiceCategorySchema>;
export type ProviderService = typeof providerServices.$inferSelect;
export type InsertProviderService = z.infer<typeof insertProviderServiceSchema>;
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
