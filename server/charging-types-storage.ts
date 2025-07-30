import { db } from "./db";
import { serviceChargingTypes, type ServiceChargingType, type InsertServiceChargingType } from "@shared/schema";
import { eq, and, asc } from "drizzle-orm";

export class ChargingTypesStorage {
  // Get charging types for a specific provider service
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

  // Create a new charging type
  async createServiceChargingType(chargingType: InsertServiceChargingType): Promise<ServiceChargingType> {
    const [newChargingType] = await db
      .insert(serviceChargingTypes)
      .values(chargingType)
      .returning();
    return newChargingType;
  }

  // Update an existing charging type
  async updateServiceChargingType(id: number, chargingType: Partial<InsertServiceChargingType>): Promise<ServiceChargingType> {
    const [updatedChargingType] = await db
      .update(serviceChargingTypes)
      .set({ ...chargingType, updatedAt: new Date() })
      .where(eq(serviceChargingTypes.id, id))
      .returning();
    return updatedChargingType;
  }

  // Delete a charging type
  async deleteServiceChargingType(id: number): Promise<void> {
    await db.delete(serviceChargingTypes).where(eq(serviceChargingTypes.id, id));
  }

  // Bulk create multiple charging types
  async bulkCreateServiceChargingTypes(chargingTypes: InsertServiceChargingType[]): Promise<ServiceChargingType[]> {
    return await db
      .insert(serviceChargingTypes)
      .values(chargingTypes)
      .returning();
  }

  // Delete all charging types for a service (used when deleting a service)
  async deleteServiceChargingTypesByService(providerServiceId: number): Promise<void> {
    await db.delete(serviceChargingTypes).where(eq(serviceChargingTypes.providerServiceId, providerServiceId));
  }
}

export const chargingTypesStorage = new ChargingTypesStorage();