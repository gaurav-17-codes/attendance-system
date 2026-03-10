import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth, requireRole } from "@/lib/auth";
import { markAttendanceSchema } from "@/lib/validations";
import { markAttendance } from "@/lib/services/attendance.service";
import { successResponse, errorResponse, handleZodError } from "@/utils/api";
import { ZodError } from "zod";

export async function GET(request: NextRequest) {
  const auth = verifyAuth(request);
  if (!auth) return errorResponse("Unauthorized", 401);

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("classId");
  const date = searchParams.get("date");
  const studentId = searchParams.get("studentId");

  if (classId && date) {
    // Get all students + their attendance for this class+date
    const [existing, enrolled] = await Promise.all([
      prisma.attendance.findMany({
        where: { classId, date: new Date(date) },
        include: { student: { select: { id: true, name: true, email: true } } },
      }),
      prisma.studentClass.findMany({
        where: { classId },
        include: { student: { select: { id: true, name: true, email: true } } },
      }),
    ]);

    const attendanceMap = new Map(existing.map(r => [r.studentId, r]));

    return successResponse(
      enrolled.map(e => ({
        student: e.student,
        attendance: attendanceMap.get(e.studentId) ?? null,
      }))
    );
  }

  if (studentId) {
    // Students can only view their own data
    if (auth.role === "STUDENT" && studentId !== auth.userId) {
      return errorResponse("Access denied", 403);
    }

    const records = await prisma.attendance.findMany({
      where: { studentId },
      include: { class: { select: { id: true, name: true, subject: true } } },
      orderBy: { date: "desc" },
      take: 20,
    });

    return successResponse({ records, total: records.length });
  }

  return errorResponse("classId+date or studentId required", 400);
}

export async function POST(request: NextRequest) {
  const auth = verifyAuth(request);
  const roleError = requireRole(auth, ["TEACHER", "ADMIN"]);
  if (roleError) return errorResponse(roleError.error, roleError.status);

  try {
    const body = await request.json();
    const { classId, date, records } = markAttendanceSchema.parse(body);

    // Prevent future date attendance
    if (new Date(date) > new Date()) {
      return errorResponse("Cannot mark attendance for future dates", 400);
    }

    const result = await markAttendance(classId, date, records as never, auth!.userId);
    return successResponse({ marked: result.length }, 201);
  } catch (error) {
    if (error instanceof ZodError) return handleZodError(error);
    return errorResponse("Server error", 500);
  }
}