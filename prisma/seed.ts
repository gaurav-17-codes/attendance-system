// import { PrismaClient, Role, AttendanceStatus } from "@prisma/client";
// import bcrypt from "bcryptjs";

// const prisma = new PrismaClient();







// async function main() {
//   // Clean existing data (order matters — delete child records first)
//   await prisma.attendance.deleteMany();
//   await prisma.studentClass.deleteMany();
//   await prisma.class.deleteMany();
//   await prisma.user.deleteMany();

//   const hashedPassword = await bcrypt.hash("password123", 12);

//   // Create users for all three roles
//   const admin = await prisma.user.create({
//     data: { name: "Admin User", email: "admin@kalnet.com", password: hashedPassword, role: Role.ADMIN }
//   });

//   const teacher = await prisma.user.create({
//     data: { name: "Priya Sharma", email: "priya@kalnet.com", password: hashedPassword, role: Role.TEACHER }
//   });

//   const student = await prisma.user.create({
//     data: { name: "Arjun Kapoor", email: "arjun@kalnet.com", password: hashedPassword, role: Role.STUDENT }
//   });

//   // Create a class
//   const mathClass = await prisma.class.create({
//     data: { name: "Mathematics 101", subject: "Mathematics", teacherId: teacher.id, createdBy: admin.id }
//   });

//   // Enroll student
//   await prisma.studentClass.create({
//     data: { studentId: student.id, classId: mathClass.id }
//   });

//   console.log("✅ Seed complete!");
// }

// main().catch(console.error).finally(() => prisma.$disconnect());








// cat > prisma/seed.ts << 'EOF'
import { PrismaClient, Role, AttendanceStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  log: ["error"],
});

async function main() {
  console.log("🌱 Seeding database...");

  await prisma.attendance.deleteMany();
  await prisma.studentClass.deleteMany();
  await prisma.class.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash("password123", 12);

  const admin = await prisma.user.create({
    data: { name: "Admin User", email: "admin@kalnet.com", password: hashedPassword, role: Role.ADMIN },
  });

  const teacher1 = await prisma.user.create({
    data: { name: "Priya Sharma", email: "priya@kalnet.com", password: hashedPassword, role: Role.TEACHER },
  });

  const teacher2 = await prisma.user.create({
    data: { name: "Rahul Mehta", email: "rahul@kalnet.com", password: hashedPassword, role: Role.TEACHER },
  });

  const students = await Promise.all([
    prisma.user.create({ data: { name: "Arjun Kapoor", email: "arjun@kalnet.com", password: hashedPassword, role: Role.STUDENT } }),
    prisma.user.create({ data: { name: "Sneha Patel", email: "sneha@kalnet.com", password: hashedPassword, role: Role.STUDENT } }),
    prisma.user.create({ data: { name: "Vikram Singh", email: "vikram@kalnet.com", password: hashedPassword, role: Role.STUDENT } }),
    prisma.user.create({ data: { name: "Ananya Roy", email: "ananya@kalnet.com", password: hashedPassword, role: Role.STUDENT } }),
    prisma.user.create({ data: { name: "Karan Joshi", email: "karan@kalnet.com", password: hashedPassword, role: Role.STUDENT } }),
  ]);

  const mathClass = await prisma.class.create({
    data: { name: "Mathematics 101", subject: "Mathematics", description: "Algebra and calculus", teacherId: teacher1.id, createdBy: admin.id },
  });

  const scienceClass = await prisma.class.create({
    data: { name: "Physics 201", subject: "Physics", description: "Newtonian mechanics", teacherId: teacher2.id, createdBy: admin.id },
  });

  const englishClass = await prisma.class.create({
    data: { name: "English Literature", subject: "English", description: "Classic literature", teacherId: teacher1.id, createdBy: admin.id },
  });

  await prisma.studentClass.createMany({
    data: [
      ...students.map(s => ({ studentId: s.id, classId: mathClass.id })),
      ...students.slice(0, 3).map(s => ({ studentId: s.id, classId: scienceClass.id })),
      ...students.slice(2).map(s => ({ studentId: s.id, classId: englishClass.id })),
    ],
  });

  const today = new Date();
  const attendanceRecords = [];

  for (let daysAgo = 30; daysAgo >= 1; daysAgo--) {
    const date = new Date(today);
    date.setDate(today.getDate() - daysAgo);
    date.setHours(0, 0, 0, 0);
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    for (const student of students) {
      const random = Math.random();
      let status: AttendanceStatus;
      if (student.id === students[0].id) {
        status = random > 0.1 ? AttendanceStatus.PRESENT : AttendanceStatus.ABSENT;
      } else if (student.id === students[2].id) {
        status = random > 0.4 ? AttendanceStatus.PRESENT : AttendanceStatus.ABSENT;
      } else {
        status = random > 0.2 ? AttendanceStatus.PRESENT : AttendanceStatus.ABSENT;
      }
      attendanceRecords.push({ studentId: student.id, classId: mathClass.id, date, status, markedBy: teacher1.id });
    }
  }

  await prisma.attendance.createMany({ data: attendanceRecords });

  console.log("✅ Seed complete!");
  console.log("\n📋 Demo Credentials:");
  console.log("  Admin:   admin@kalnet.com / password123");
  console.log("  Teacher: priya@kalnet.com / password123");
  console.log("  Student: arjun@kalnet.com / password123");
}

main().catch(console.error).finally(() => prisma.$disconnect());
