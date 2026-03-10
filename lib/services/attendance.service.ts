// import { prisma } from "@/lib/prisma";

// // Mark attendance using UPSERT
// // Upsert = "update if exists, create if not" — one atomic operation
// export async function markAttendance(
//   classId: string,
//   date: string,
//   records: { studentId: string; status: string; notes?: string }[],
//   markedBy: string
// ) {
//   const dateObj = new Date(date);

//   // Transaction = all records saved together, or none (atomic)
//   return prisma.$transaction(
//     records.map(record =>
//       prisma.attendance.upsert({
//         where: { studentId_classId_date: { studentId: record.studentId, classId, date: dateObj } },
//         update: { status: record.status as never, notes: record.notes, markedBy },
//         create: { studentId: record.studentId, classId, date: dateObj, status: record.status as never, notes: record.notes, markedBy },
//       })
//     )
//   );
// }

// // Calculate attendance percentage for one student in one class
// export async function calculateAttendanceStats(studentId: string, classId: string) {
//   const records = await prisma.attendance.findMany({ where: { studentId, classId } });

//   const total = records.length;
//   const present = records.filter(r => r.status === "PRESENT").length;
//   const absent = records.filter(r => r.status === "ABSENT").length;
//   const late = records.filter(r => r.status === "LATE").length;
  
//   // Late counts as present for the percentage
//   const percentage = total === 0 ? 0 : Math.round(((present + late) / total) * 1000) / 10;

//   return { totalDays: total, presentDays: present, absentDays: absent, lateDays: late, percentage };
// }





import { prisma } from "@/lib/prisma";
import type { AttendanceStatus } from "@/types";

export async function markAttendance(
  classId: string,
  date: string,
  records: { studentId: string; status: AttendanceStatus; notes?: string }[],
  markedBy: string
) {
  const dateObj = new Date(date);

  return prisma.$transaction(
    records.map((record) =>
      prisma.attendance.upsert({
        where: {
          studentId_classId_date: {
            studentId: record.studentId,
            classId,
            date: dateObj,
          },
        },
        update: {
          status: record.status,
          notes: record.notes,
          markedBy,
          updatedAt: new Date(),
        },
        create: {
          studentId: record.studentId,
          classId,
          date: dateObj,
          status: record.status,
          notes: record.notes,
          markedBy,
        },
      })
    )
  );
}

export async function getClassAttendanceForDate(
  classId: string,
  date: string
) {
  const dateObj = new Date(date);

  const [attendanceRecords, enrolledStudents] = await Promise.all([
    prisma.attendance.findMany({
      where: { classId, date: dateObj },
      include: {
        student: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.studentClass.findMany({
      where: { classId },
      include: {
        student: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  const attendanceMap = new Map(
    attendanceRecords.map((r) => [r.studentId, r])
  );

  return enrolledStudents.map((enrollment) => ({
    student: enrollment.student,
    attendance: attendanceMap.get(enrollment.studentId) ?? null,
  }));
}

export async function calculateAttendanceStats(
  studentId: string,
  classId: string,
  startDate?: Date,
  endDate?: Date
) {
  const where: Record<string, unknown> = { studentId, classId };

  if (startDate || endDate) {
    where.date = {
      ...(startDate && { gte: startDate }),
      ...(endDate && { lte: endDate }),
    };
  }

  const records = await prisma.attendance.findMany({ where });

  const totalDays = records.length;
  const presentDays = records.filter((r) => r.status === "PRESENT").length;
  const absentDays = records.filter((r) => r.status === "ABSENT").length;
  const lateDays = records.filter((r) => r.status === "LATE").length;
  const percentage =
    totalDays === 0
      ? 0
      : Math.round(((presentDays + lateDays) / totalDays) * 1000) / 10;

  return { totalDays, presentDays, absentDays, lateDays, percentage };
}

export async function getClassAttendanceStats(
  classId: string,
  startDate?: Date,
  endDate?: Date
) {
  const enrollments = await prisma.studentClass.findMany({
    where: { classId },
    include: {
      student: { select: { id: true, name: true, email: true } },
    },
  });

  return Promise.all(
    enrollments.map(async (e) => ({
      student: e.student,
      stats: await calculateAttendanceStats(
        e.studentId,
        classId,
        startDate,
        endDate
      ),
    }))
  );
}

export function convertToCSV(
  records: Array<{
    student: { name: string; email: string };
    date: Date;
    status: string;
    notes?: string | null;
    class?: { name: string };
  }>
): string {
  const headers = ["Student Name", "Email", "Class", "Date", "Status", "Notes"];
  const rows = records.map((r) => [
    r.student.name,
    r.student.email,
    r.class?.name ?? "",
    r.date.toISOString().split("T")[0],
    r.status,
    r.notes ?? "",
  ]);

  return [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");
}