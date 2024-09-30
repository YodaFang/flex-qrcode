import { PrismaClient } from "@prisma/client";
import { singleton } from "~/utils/singleton.server";

const prisma = singleton('db_prisma_client', () => new PrismaClient());

export default prisma;
