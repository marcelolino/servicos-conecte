import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userTypeEnum = pgEnum("user_type", ["client", "provider", "admin"]);
export const serviceStatusEnum = pgEnum("service_status", ["pending", "accepted", "in_progress", "completed", "cancelled"]);
export const providerStatusEnum = pgEnum("provider_status", ["pending", "approved", "rejected", "suspended"]);

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
