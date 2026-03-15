import * as fs from "fs";
import * as path from "path";

export function getPropertyId(): string {
  const filePath = path.join(process.cwd(), "e2e/.auth/property-id.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return data.propertyId;
}

/** From auth-with-moved-out-tenant setup; null if that setup was not run. */
export function getMovedOutTenantSetup(): {
  propertyId: string;
  movedOutTenantId: string;
} | null {
  const filePath = path.join(process.cwd(), "e2e/.auth/moved-out-tenant.json");
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  if (!data?.propertyId || !data?.movedOutTenantId) {
    return null;
  }
  return {
    propertyId: data.propertyId,
    movedOutTenantId: data.movedOutTenantId,
  };
}
