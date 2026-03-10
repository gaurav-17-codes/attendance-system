import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { successResponse, errorResponse } from "@/utils/api";

export async function GET(request: NextRequest) {
  const auth = verifyAuth(request);
  if (!auth) return errorResponse("Unauthorized", 401);

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!user) return errorResponse("User not found", 404);
  return successResponse(user);
}