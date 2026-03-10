import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password too short"),
});

export const createUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z
    .string()
    .min(8, "Must be 8+ characters")
    .regex(/[A-Z]/, "Needs uppercase letter")
    .regex(/[0-9]/, "Needs a number"),
  role: z.enum(["ADMIN", "TEACHER", "STUDENT"]),
});

export const createClassSchema = z.object({
  name: z.string().min(2).max(100),
  subject: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  teacherId: z.string().cuid("Invalid teacher ID"),
});

export const markAttendanceSchema = z.object({
  classId: z.string().cuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format"),
  records: z.array(z.object({
    studentId: z.string().cuid(),
    status: z.enum(["PRESENT", "ABSENT", "LATE"]),
    notes: z.string().max(200).optional(),
  })).min(1),
});