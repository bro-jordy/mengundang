import { UserRole } from "@prisma/client";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
}
