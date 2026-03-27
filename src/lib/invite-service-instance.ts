import { InviteService } from "./invite-service";
import { PrismaInviteRepository } from "./repositories/prisma/prisma-invite-repository";

export const inviteService = new InviteService(new PrismaInviteRepository());
