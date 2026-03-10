import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth, requireRole, hashPassword } from "@/lib/auth";
import { createUserSchema } from "@/lib/validations";
import { successResponse, errorResponse, handleZodError, handlePrismaError } from "@/utils/api";
import { ZodError } from "zod";

export async function GET(request: NextRequest) {
  const auth = verifyAuth(request);
  const roleError = requireRole(auth, ["ADMIN"]);
  if (roleError) return errorResponse(roleError.error, roleError.status);

  const teachers = await prisma.user.findMany({
    where: { role: "TEACHER", isActive: true },
    select: { id: true, name: true, email: true, createdAt: true },
    orderBy: { name: "asc" },
  });
  return successResponse(teachers);
}

export async function POST(request: NextRequest) {
  const auth = verifyAuth(request);
  const roleError = requireRole(auth, ["ADMIN"]);
  if (roleError) return errorResponse(roleError.error, roleError.status);

  try {
    const body = await request.json();
    const data = createUserSchema.parse({ ...body, role: "TEACHER" });
    const hashedPassword = await hashPassword(data.password);

    const teacher = await prisma.user.create({
      data: { ...data, email: data.email.toLowerCase(), password: hashedPassword },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    return successResponse(teacher, 201);
  } catch (error) {
    if (error instanceof ZodError) return handleZodError(error);
    return handlePrismaError(error);
  }
}