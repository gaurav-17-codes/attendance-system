import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth, requireRole, hashPassword } from "@/lib/auth";
import { createUserSchema } from "@/lib/validations";
import { successResponse, errorResponse, handleZodError, handlePrismaError } from "@/utils/api";
import { ZodError } from "zod";

export async function GET(request: NextRequest) {
  const auth = verifyAuth(request);
  const roleError = requireRole(auth, ["ADMIN", "TEACHER"]);
  if (roleError) return errorResponse(roleError.error, roleError.status);

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("classId");

  if (classId) {
    const enrollments = await prisma.studentClass.findMany({
      where: { classId },
      include: { student: { select: { id: true, name: true, email: true } } },
    });
    return successResponse(enrollments.map((e) => e.student));
  }

  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    select: { id: true, name: true, email: true, isActive: true, createdAt: true },
    orderBy: { name: "asc" },
  });
  return successResponse(students);
}

export async function POST(request: NextRequest) {
  const auth = verifyAuth(request);
  const roleError = requireRole(auth, ["ADMIN"]);
  if (roleError) return errorResponse(roleError.error, roleError.status);

  try {
    const body = await request.json();
    const data = createUserSchema.parse({ ...body, role: "STUDENT" });
    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: { ...data, email: data.email.toLowerCase(), password: hashedPassword },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    return successResponse(user, 201);
  } catch (error) {
    if (error instanceof ZodError) return handleZodError(error);
    return handlePrismaError(error);
  }
}