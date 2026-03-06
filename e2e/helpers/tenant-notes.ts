import * as fs from "fs";
import * as path from "path";

export function getPropertyId(): string {
  const filePath = path.join(process.cwd(), "e2e/.auth/property-id.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return data.propertyId;
}
