import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth, requireRole } from "@/lib/auth";
import { createClassSchema } from "@/lib/validations";
import { successResponse, errorResponse, handleZodError, handlePrismaError } from "@/utils/api";
import { ZodError } from "zod";

export async function GET(request: NextRequest) {
  const auth = verifyAuth(request);
  if (!auth) return errorResponse("Unauthorized", 401);

  // Role-based filtering — each role sees only what's relevant to them
  let classes;
  if (auth.role === "ADMIN") {
    classes = await prisma.class.findMany({
      where: { isActive: true },
      include: { teacher: { select: { id: true, name: true } }, _count: { select: { enrollments: true } } },
    });
  } else if (auth.role === "TEACHER") {
    classes = await prisma.class.findMany({
      where: { teacherId: auth.userId, isActive: true },
      include: { teacher: { select: { id: true, name: true } }, _count: { select: { enrollments: true } } },
    });
  } else {
    // Student: find classes through the junction table
    const enrollments = await prisma.studentClass.findMany({
      where: { studentId: auth.userId },
      include: { class: { include: { teacher: { select: { id: true, name: true } } } } },
    });
    classes = enrollments.map(e => e.class);
  }

  return successResponse(classes);
}

export async function POST(request: NextRequest) {
  const auth = verifyAuth(request);
  const roleError = requireRole(auth, ["ADMIN"]);
  if (roleError) return errorResponse(roleError.error, roleError.status);

  try {
    const body = await request.json();
    const data = createClassSchema.parse(body);

    const newClass = await prisma.class.create({
      data: { ...data, createdBy: auth!.userId },
      include: { teacher: { select: { id: true, name: true } } },
    });

    return successResponse(newClass, 201);
  } catch (error) {
    if (error instanceof ZodError) return handleZodError(error);
    return handlePrismaError(error);
  }
}