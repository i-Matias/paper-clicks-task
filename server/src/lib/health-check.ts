import prisma from "./prisma";

/**
 * Check database connection health
 * @returns Object with connection status
 */
export async function checkDatabaseHealth(): Promise<{
  status: string;
  message?: string;
}> {
  try {
    // Execute a simple query to check the connection
    await prisma.$queryRaw`SELECT 1`;
    return { status: "ok" };
  } catch (error: any) {
    console.error("Database health check failed:", error);
    return {
      status: "error",
      message: "Database connection failed",
    };
  }
}
