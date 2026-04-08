import { StaffSummaryService } from "@/lib/staff-summary-service";
import { propertyService } from "@/lib/property-service-instance";
import { PrismaStaffSummaryRepository } from "@/lib/repositories/prisma/prisma-staff-summary-repository";

const staffSummaryRepo = new PrismaStaffSummaryRepository();

export const staffSummaryService = new StaffSummaryService(
  staffSummaryRepo,
  propertyService
);
