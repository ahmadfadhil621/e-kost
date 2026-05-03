export interface UserFixture {
  id: string;
  name: string;
  email: string;
  language: string;
  timezone: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function createUser(overrides: Partial<UserFixture> = {}): UserFixture {
  return {
    id: crypto.randomUUID(),
    name: "Test User",
    email: "test@example.com",
    language: "en",
    timezone: "Asia/Jakarta",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}
