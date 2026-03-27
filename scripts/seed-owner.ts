#!/usr/bin/env tsx
// Usage: npm run db:seed-owner
// Or: npm run db:seed-owner -- --name "Ahmad" --email "ahmad@example.com" --password "secret123" --property "My Kost"

import { parseArgs } from "node:util";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
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

  const name = values.name ?? await prompt(rl, "Full name: ");
  const email = values.email ?? await prompt(rl, "Email: ");
  const password = values.password ?? await prompt(rl, "Password: ");
  const propertyName = values.property ?? await prompt(rl, "Property name (your kost): ");

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

  // Use better-auth's own password hashing (scrypt via @noble/hashes)
  const { hashPassword } = await import("better-auth/dist/crypto/password.mjs");
  const hashedPassword = await hashPassword(password);

  const now = new Date();
  const userId = crypto.randomUUID();

  const user = await prisma.user.create({
    data: {
      id: userId,
      name,
      email,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    },
  });

  // Create account (credential provider)
  await prisma.account.create({
    data: {
      id: crypto.randomUUID(),
      userId: user.id,
      providerId: "credential",
      accountId: email,
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
    },
  });

  // Create property
  const property = await prisma.property.create({
    data: {
      id: crypto.randomUUID(),
      name: propertyName,
      ownerId: user.id,
      createdAt: now,
      updatedAt: now,
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
