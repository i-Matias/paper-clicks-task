import { AppError } from "../middleware/error.middleware";

export async function withPrisma<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    if (error.code === "P2002") {
      throw new AppError("A record with this value already exists", 409);
    } else if (error.code === "P2025") {
      throw new AppError("Record not found", 404);
    } else {
      console.error("Database error:", error);
      throw new AppError("Database operation failed", 500);
    }
  }
}
