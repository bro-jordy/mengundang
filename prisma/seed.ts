import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({
    where: { email: "admin@udangankami.com" },
  });

  if (existing) {
    console.log("Seed: Admin sudah ada.");
    return;
  }

  const hashed = await bcrypt.hash("admin123", 12);

  await prisma.user.create({
    data: {
      email: "admin@udangankami.com",
      password: hashed,
      name: "Super Admin",
      role: "SUPERADMIN",
    },
  });

  console.log("Seed: Admin berhasil dibuat.");
  console.log("Email: admin@udangankami.com");
  console.log("Password: admin123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
