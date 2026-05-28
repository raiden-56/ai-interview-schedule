// Prisma 7 uses a WASM query engine for ALL databases and always requires
// a driver adapter. Choose the right adapter based on the DB protocol.
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";
dotenv.config();

const databaseUrl = process.env.DATABASE_URL || "";

const logLevel =
  process.env.NODE_ENV === "development"
    ? ["query" as const, "error" as const, "warn" as const]
    : ["error" as const];

function createPrismaClient() {
  // prisma+postgres:// — local `prisma dev` server or Prisma Postgres cloud
  if (databaseUrl.startsWith("prisma+postgres://")) {
    return new PrismaClient({ accelerateUrl: databaseUrl, log: logLevel });
  }

  // postgresql:// or postgres:// — standard PostgreSQL (Docker / local pg)
  const adapter = new PrismaPg(databaseUrl);
  return new PrismaClient({ adapter, log: logLevel });
}

const prisma = createPrismaClient();

export default prisma;
