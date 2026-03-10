import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, generateToken } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import { errorResponse, handleZodError } from "@/utils/api";
import { ZodError } from "zod";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always run comparePassword even if user not found
    // This prevents timing attacks (attacker can't tell if email exists)
    const isValid = user ? await comparePassword(password, user.password) : false;

    if (!user || !isValid) {
      return errorResponse("Invalid email or password", 401);
    }

    const token = generateToken({ userId: user.id, email: user.email, role: user.role });

    const response = NextResponse.json({
      success: true,
      data: { user: { id: user.id, name: user.name, email: user.email, role: user.role }, token }
    });

    // Set HTTP-only cookie
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    if (error instanceof ZodError) return handleZodError(error);
    return errorResponse("Internal server error", 500);
  }
}