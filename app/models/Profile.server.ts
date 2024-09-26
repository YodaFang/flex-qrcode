import { Prisma } from '@prisma/client';
import db from "~/db.server";
export type { Profile }  from "@prisma/client";

// Fetch a single profile by id and optionally shop
export async function getProfile(id: number, shop?: string) {
  try {
    const profile = await db.profile.findUnique({
      where: {
        id,
        ...(shop && { shop }), // only include shop if provided
      },
    });
    return profile;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('Prisma error:', error.message);
      return null;
    }
    throw error; // re-throw other types of errors
  }
}

export async function getProfiles(shop: string) {
  try {
    return await db.profile.findMany({
      where: { shop },
      orderBy: { id: 'asc' },
      select: { id: true, name: true },
    });
  } catch (error) {
    console.error('Error fetching profiles:', error);
    return [];
  }
}

export async function deleteProfile(profileId: number) {
  try {
    await db.profile.delete({
      where: { id: profileId },
    });
    return { success: true };
  } catch (error) {
    console.error("Error deleting profile with ID:", profileId, error);
    return { success: false, error: "Failed to delete profile" };
  }
}

export async function deleteProfilesByIds(profileIds: number[]) {
  try {
    await db.profile.deleteMany({
      where: { id: { in: profileIds } },
    });
    return { success: true };
  } catch (error) {
    console.error("Error deleting profiles with IDs:", profileIds, error);
    return { success: false, error: "Failed to delete profiles" };
  }
}

