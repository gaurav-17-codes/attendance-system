import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status });
}

export function handleZodError(error: ZodError) {
  const messages = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
  return errorResponse(`Validation error: ${messages.join(", ")}`, 400);
}

export function handlePrismaError(error: unknown) {
  if (typeof error === "object" && error !== null && "code" in error) {
    const e = error as { code: string };
    if (e.code === "P2002") return errorResponse("Already exists", 409);
    if (e.code === "P2025") return errorResponse("Not found", 404);
  }
  console.error("Unhandled error:", error);
  return errorResponse("Internal server error", 500);
}

export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}