export type Role = "ADMIN" | "TEACHER" | "STUDENT";
export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  percentage: number;
}