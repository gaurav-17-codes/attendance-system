import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { getClassAttendanceStats, convertToCSV } from "@/lib/services/attendance.service";
import { errorResponse, successResponse, parseDateString } from "@/utils/api";

export async function GET(request: NextRequest) {
  const auth = verifyAuth(request);
  if (!auth) return errorResponse("Unauthorized", 401);

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("classId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const format = searchParams.get("format");

  const startDateObj = startDate ? parseDateString(startDate) : undefined;
  const endDateObj = endDate ? parseDateString(endDate) : undefined;

  if (auth.role === "STUDENT") {
    const enrollments = await prisma.studentClass.findMany({
      where: { studentId: auth.userId },
      include: { class: { select: { id: true, name: true, subject: true } } },
    });

    const reports = await Promise.all(
      enrollments.map(async (e) => {
        const stats = await getClassAttendanceStats(e.classId, startDateObj, endDateObj);
        const myStats = stats.find((s) => s.student.id === auth.userId);
        return { class: e.class, stats: myStats?.stats ?? null };
      })
    );
    return successResponse(reports);
  }

  const classFilter = classId
    ? { id: classId, ...(auth.role === "TEACHER" ? { teacherId: auth.userId } : {}) }
    : { ...(auth.role === "TEACHER" ? { teacherId: auth.userId } : {}) };

  const classes = await prisma.class.findMany({
    where: { ...classFilter, isActive: true },
    include: { teacher: { select: { id: true, name: true } } },
  });

  if (format === "csv" && classId) {
    const records = await prisma.attendance.findMany({
      where: {
        classId,
        ...(startDateObj || endDateObj ? { date: { ...(startDateObj && { gte: startDateObj }), ...(endDateObj && { lte: endDateObj }) } } : {}),
      },
      include: {
        student: { select: { name: true, email: true } },
        class: { select: { name: true } },
      },
      orderBy: [{ date: "asc" }],
    });

    const csv = convertToCSV(records as never);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="attendance-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  }

  const reports = await Promise.all(
    classes.map(async (cls) => ({
      class: cls,
      studentStats: await getClassAttendanceStats(cls.id, startDateObj, endDateObj),
    }))
  );

  return successResponse(reports);
}