#!/usr/bin/env tsx
// Usage: npm run db:seed-owner
// Or: npm run db:seed-owner -- --name "Ahmad" --email "ahmad@example.com" --password "yourpassword" --property "My Kost"

import "dotenv/config";
import { parseArgs } from "node:util";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function prompt(rl: readline.Interface, question: string): Promise<string> {
  const answer = await rl.question(question);
  return answer.trim();
}

async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      name: { type: "string" },
      email: { type: "string" },
      password: { type: "string" },
      property: { type: "string" },
    },
    strict: false,
  });

  const rl = readline.createInterface({ input, output });

  const name = (values.name as string | undefined) ?? await prompt(rl, "Full name: ");
  const email = (values.email as string | undefined) ?? await prompt(rl, "Email: ");
  const password = (values.password as string | undefined) ?? await prompt(rl, "Password: ");
  const propertyName = (values.property as string | undefined) ?? await prompt(rl, "Property name (your kost): ");

  rl.close();

  if (!name || !email || !password || !propertyName) {
    console.error("All fields are required.");
    process.exit(1);
  }

  // Check for existing user
  const existing = await prisma.user.findFirst({ where: { email } });
  if (existing) {
    console.log(`User with email ${email} already exists. Skipping.`);
    process.exit(0);
  }

  // Delegate user creation to Better Auth — handles hashing, account creation, etc.
  const response = await auth.api.signUpEmail({
    body: { name, email, password },
  });

  if (!response?.user) {
    console.error("Failed to create user via Better Auth.");
    process.exit(1);
  }

  // Create first property owned by the new user
  const property = await prisma.property.create({
    data: {
      name: propertyName,
      ownerId: response.user.id,
    },
  });

  console.log(`✅ Owner created: ${name} <${email}>`);
  console.log(`✅ Property created: ${propertyName} (${property.id})`);
  console.log(`\nYou can now log in at /login with email: ${email}`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
