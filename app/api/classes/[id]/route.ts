import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth, requireRole } from "@/lib/auth";
import { successResponse, errorResponse, handlePrismaError } from "@/utils/api";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = verifyAuth(request);
  if (!auth) return errorResponse("Unauthorized", 401);

  const classData = await prisma.class.findUnique({
    where: { id: params.id },
    include: {
      teacher: { select: { id: true, name: true, email: true } },
      enrollments: { include: { student: { select: { id: true, name: true, email: true } } } },
    },
  });

  if (!classData) return errorResponse("Class not found", 404);
  return successResponse(classData);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = verifyAuth(request);
  const roleError = requireRole(auth, ["ADMIN"]);
  if (roleError) return errorResponse(roleError.error, roleError.status);

  try {
    await prisma.class.update({ where: { id: params.id }, data: { isActive: false } });
    return successResponse({ message: "Class deactivated" });
  } catch (error) {
    return handlePrismaError(error);
  }
}