// Traceability: user-authentication
// REQ 1.2 -> it('accepts valid registration data')
// REQ 1.3 -> it('rejects when name/email/password is missing/empty')
// REQ 1.5 -> it('rejects when password is too short')
// REQ 2.1 -> it('accepts valid login data')
// REQ 2.4 -> it('rejects when email/password is missing/empty')
// PROP 1  -> it('registration accepts any valid name/email/password combination')
// PROP 2  -> it('registration rejects any input with missing required fields')
// PROP 3  -> it('registration rejects any password shorter than 8 characters')
// PROP 4  -> it('login schema accepts any valid email and non-empty password')
// PROP 5  -> it('login schema rejects any input with missing or empty email')
// PROP 10 -> it('login schema output preserves all fields needed for timestamp recording')

import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { registrationSchema, loginSchema } from "./auth";

describe("registrationSchema", () => {
  describe("good cases", () => {
    it("accepts valid registration data", () => {
      const result = registrationSchema.safeParse({
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("John Doe");
        expect(result.data.email).toBe("john@example.com");
        expect(result.data.password).toBe("password123");
      }
    });

    it("accepts name with 1 character", () => {
      const result = registrationSchema.safeParse({
        name: "A",
        email: "a@example.com",
        password: "12345678",
      });

      expect(result.success).toBe(true);
    });

    it("accepts name with 100 characters", () => {
      const result = registrationSchema.safeParse({
        name: "A".repeat(100),
        email: "long@example.com",
        password: "12345678",
      });

      expect(result.success).toBe(true);
    });

    it("accepts password with exactly 8 characters", () => {
      const result = registrationSchema.safeParse({
        name: "Test User",
        email: "test@example.com",
        password: "12345678",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("bad cases", () => {
    it("rejects when name is empty", () => {
      const result = registrationSchema.safeParse({
        name: "",
        email: "john@example.com",
        password: "password123",
      });

      expect(result.success).toBe(false);
    });

    it("rejects when name exceeds 100 characters", () => {
      const result = registrationSchema.safeParse({
        name: "A".repeat(101),
        email: "john@example.com",
        password: "password123",
      });

      expect(result.success).toBe(false);
    });

    it("rejects when email is missing", () => {
      const result = registrationSchema.safeParse({
        name: "John Doe",
        password: "password123",
      });

      expect(result.success).toBe(false);
    });

    it("rejects when email is empty", () => {
      const result = registrationSchema.safeParse({
        name: "John Doe",
        email: "",
        password: "password123",
      });

      expect(result.success).toBe(false);
    });

    it("rejects when email is invalid format", () => {
      const result = registrationSchema.safeParse({
        name: "John Doe",
        email: "not-an-email",
        password: "password123",
      });

      expect(result.success).toBe(false);
    });

    it("rejects when password is missing", () => {
      const result = registrationSchema.safeParse({
        name: "John Doe",
        email: "john@example.com",
      });

      expect(result.success).toBe(false);
    });

    it("rejects when password is too short (less than 8 chars)", () => {
      const result = registrationSchema.safeParse({
        name: "John Doe",
        email: "john@example.com",
        password: "1234567",
      });

      expect(result.success).toBe(false);
    });

    it("rejects when name is missing", () => {
      const result = registrationSchema.safeParse({
        email: "john@example.com",
        password: "password123",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("trims whitespace-only name as invalid", () => {
      const result = registrationSchema.safeParse({
        name: "   ",
        email: "john@example.com",
        password: "password123",
      });

      expect(result.success).toBe(false);
    });

    it("rejects email without domain", () => {
      const result = registrationSchema.safeParse({
        name: "John",
        email: "test@",
        password: "password123",
      });

      expect(result.success).toBe(false);
    });

    it("rejects email without local part", () => {
      const result = registrationSchema.safeParse({
        name: "John",
        email: "@example.com",
        password: "password123",
      });

      expect(result.success).toBe(false);
    });
  });
});

describe("loginSchema", () => {
  describe("good cases", () => {
    it("accepts valid login data", () => {
      const result = loginSchema.safeParse({
        email: "john@example.com",
        password: "password123",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("john@example.com");
        expect(result.data.password).toBe("password123");
      }
    });
  });

  describe("bad cases", () => {
    it("rejects when email is missing", () => {
      const result = loginSchema.safeParse({
        password: "password123",
      });

      expect(result.success).toBe(false);
    });

    it("rejects when email is empty", () => {
      const result = loginSchema.safeParse({
        email: "",
        password: "password123",
      });

      expect(result.success).toBe(false);
    });

    it("rejects when email is invalid format", () => {
      const result = loginSchema.safeParse({
        email: "invalid",
        password: "password123",
      });

      expect(result.success).toBe(false);
    });

    it("rejects when password is missing", () => {
      const result = loginSchema.safeParse({
        email: "john@example.com",
      });

      expect(result.success).toBe(false);
    });

    it("rejects when password is empty", () => {
      const result = loginSchema.safeParse({
        email: "john@example.com",
        password: "",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("accepts any password length for login (server validates)", () => {
      const result = loginSchema.safeParse({
        email: "john@example.com",
        password: "x",
      });

      expect(result.success).toBe(true);
    });
  });
});

describe("property-based tests", () => {
  // Feature: user-authentication, Property 2: Form Validation Rejects Missing Fields
  it("registration rejects any input with missing required fields", () => {
    fc.assert(
      fc.property(
        fc
          .record({
            name: fc.option(
              fc.string({ minLength: 1, maxLength: 100 }),
              { nil: undefined as unknown as string }
            ),
            email: fc.option(fc.emailAddress(), {
              nil: undefined as unknown as string,
            }),
            password: fc.option(
              fc.string({ minLength: 8, maxLength: 50 }),
              { nil: undefined as unknown as string }
            ),
          })
          .filter(
            (input) =>
              input.name === undefined ||
              input.email === undefined ||
              input.password === undefined
          ),
        (input) => {
          const result = registrationSchema.safeParse(input);
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: user-authentication, Property 3: Password Length Validation
  it("registration rejects any password shorter than 8 characters", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 7 }),
        (shortPassword) => {
          const result = registrationSchema.safeParse({
            name: "Test User",
            email: "test@example.com",
            password: shortPassword,
          });
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: user-authentication, Property 1: Successful Registration Creates Session (schema part)
  it("registration accepts any valid name/email/password combination", () => {
    const zodSafeEmail = fc
      .tuple(
        fc.stringMatching(/^[a-z][a-z0-9]{0,14}$/),
        fc.stringMatching(/^[a-z]{2,8}\.[a-z]{2,4}$/)
      )
      .map(([local, domain]) => `${local}@${domain}`);

    fc.assert(
      fc.property(
        fc.record({
          name: fc
            .string({ minLength: 1, maxLength: 100 })
            .filter((s) => s.trim().length > 0),
          email: zodSafeEmail,
          password: fc.string({ minLength: 8, maxLength: 50 }),
        }),
        (input) => {
          const result = registrationSchema.safeParse(input);
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: user-authentication, Property 4: Successful Login Creates Persistent Session (schema part)
  it("login schema accepts any valid email and non-empty password", () => {
    const zodSafeEmail = fc
      .tuple(
        fc.stringMatching(/^[a-z][a-z0-9]{0,14}$/),
        fc.stringMatching(/^[a-z]{2,8}\.[a-z]{2,4}$/)
      )
      .map(([local, domain]) => `${local}@${domain}`);

    fc.assert(
      fc.property(
        fc.record({
          email: zodSafeEmail,
          password: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        (input) => {
          const result = loginSchema.safeParse(input);
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.email).toBe(input.email);
            expect(result.data.password).toBe(input.password);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: user-authentication, Property 5: Invalid Credentials Rejected (schema part)
  it("login schema rejects any input with missing or empty email", () => {
    fc.assert(
      fc.property(
        fc.record({
          email: fc.constantFrom("", undefined as unknown as string),
          password: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        (input) => {
          const result = loginSchema.safeParse(input);
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: user-authentication, Property 10: Login Timestamp Recording (schema part)
  it("login schema output preserves all fields needed for timestamp recording", () => {
    const zodSafeEmail = fc
      .tuple(
        fc.stringMatching(/^[a-z][a-z0-9]{0,14}$/),
        fc.stringMatching(/^[a-z]{2,8}\.[a-z]{2,4}$/)
      )
      .map(([local, domain]) => `${local}@${domain}`);

    fc.assert(
      fc.property(
        fc.record({
          email: zodSafeEmail,
          password: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        (input) => {
          const result = loginSchema.safeParse(input);
          expect(result.success).toBe(true);
          if (result.success) {
            expect(typeof result.data.email).toBe("string");
            expect(typeof result.data.password).toBe("string");
            expect(result.data.email).toContain("@");
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
