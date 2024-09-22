import { Prisma } from '@prisma/client';
import db from "~/db.server";
export type { Profile }  from "@prisma/client";

export async function getProfile(id: number, shop: string) {
  try {
    const profile = await db.profile.findUnique({
      where: { id, shop },
    });
    return profile;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle Prisma-specific errors
      console.error('Prisma error:', error.message);
      return null;
    }
    // Re-throw other types of errors
    throw error;
  }
}

export async function getProfiles(shop: string) {
  const profiles = await db.profile.findMany({
    where: { shop },
    orderBy: { id: 'asc' },
    select: { id: true, name: true },
  });

  if (profiles.length === 0) return [];

  return profiles;
}
