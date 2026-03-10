import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth, requireRole } from "@/lib/auth";
import { successResponse, errorResponse, handlePrismaError } from "@/utils/api";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = verifyAuth(request);
  const roleError = requireRole(auth, ["ADMIN"]);
  if (roleError) return errorResponse(roleError.error, roleError.status);

  const body = await request.json();
  const { studentIds } = body;

  if (!studentIds || studentIds.length === 0) return errorResponse("studentIds required", 400);

  try {
    const result = await prisma.studentClass.createMany({
      data: studentIds.map((studentId: string) => ({ studentId, classId: params.id })),
      skipDuplicates: true,
    });
    return successResponse({ enrolled: result.count }, 201);
  } catch (error) {
    return handlePrismaError(error);
  }
}