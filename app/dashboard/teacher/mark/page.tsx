"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { AttendanceStatus } from "@/types";

interface Student { id: string; name: string; email: string; }
interface StudentAttendance {
  student: Student;
  attendance: { id: string; status: AttendanceStatus; notes?: string } | null;
}
interface ClassItem { id: string; name: string; subject?: string; }

// ── Inner component (uses useSearchParams) ────────────────
function MarkAttendanceContent() {
  const searchParams = useSearchParams();

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState(
    searchParams.get("classId") ?? ""
  );
  const [selectedDate, setSelectedDate] = useState(
    searchParams.get("date") ?? new Date().toISOString().split("T")[0]
  );
  const [studentAttendances, setStudentAttendances] = useState<StudentAttendance[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Load classes on mount
  useEffect(() => {
    fetch("/api/classes")
      .then(r => r.json())
      .then(d => setClasses(d.data ?? []));
  }, []);

  // Load students + existing attendance when class or date changes
  const fetchAttendance = useCallback(async () => {
    if (!selectedClassId || !selectedDate) return;
    setIsLoading(true);

    const res = await fetch(
      `/api/attendance?classId=${selectedClassId}&date=${selectedDate}`
    );
    const data = await res.json();

    if (res.ok && data.data) {
      setStudentAttendances(data.data);

      // Pre-fill: use existing status if already marked, else default PRESENT
      const map: Record<string, AttendanceStatus> = {};
      data.data.forEach((sa: StudentAttendance) => {
        map[sa.student.id] = sa.attendance?.status ?? "PRESENT";
      });
      setAttendanceMap(map);
    }
    setIsLoading(false);
  }, [selectedClassId, selectedDate]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // Toggle one student's status
  const toggleStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap(prev => ({ ...prev, [studentId]: status }));
  };

  // Mark all students the same status
  const markAll = (status: AttendanceStatus) => {
    const map: Record<string, AttendanceStatus> = {};
    studentAttendances.forEach(sa => { map[sa.student.id] = status; });
    setAttendanceMap(map);
  };

  // Submit attendance
  const handleSubmit = async () => {
    if (!selectedClassId || studentAttendances.length === 0) return;
    setIsSubmitting(true);
    setMessage(null);

    const records = studentAttendances.map(sa => ({
      studentId: sa.student.id,
      status: attendanceMap[sa.student.id] ?? "PRESENT",
    }));

    const res = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        classId: selectedClassId,
        date: selectedDate,
        records,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      setMessage({ type: "success", text: `✓ Attendance saved for ${records.length} students` });
    } else {
      setMessage({ type: "error", text: data.error ?? "Failed to save" });
    }
    setIsSubmitting(false);
  };

  const isFutureDate = new Date(selectedDate) > new Date();
  const presentCount = Object.values(attendanceMap).filter(s => s === "PRESENT").length;
  const absentCount = Object.values(attendanceMap).filter(s => s === "ABSENT").length;
  const lateCount = Object.values(attendanceMap).filter(s => s === "LATE").length;

  const statusButtons: { status: AttendanceStatus; label: string; active: string; inactive: string }[] = [
    {
      status: "PRESENT",
      label: "Present",
      active: "bg-green-500 text-white ring-2 ring-green-400",
      inactive: "bg-green-100 text-green-700 hover:bg-green-200",
    },
    {
      status: "ABSENT",
      label: "Absent",
      active: "bg-red-500 text-white ring-2 ring-red-400",
      inactive: "bg-red-100 text-red-700 hover:bg-red-200",
    },
    {
      status: "LATE",
      label: "Late",
      active: "bg-yellow-500 text-white ring-2 ring-yellow-400",
      inactive: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200",
    },
  ];

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mark Attendance</h1>
        <p className="text-gray-500 text-sm mt-1">
          Record attendance for your class
        </p>
      </div>

      {/* Class + Date Selector */}
      <div className="card p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Class
            </label>
            <select
              className="input-field"
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
            >
              <option value="">Choose a class</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.subject ? ` — ${c.subject}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              className="input-field"
              value={selectedDate}
              max={new Date().toISOString().split("T")[0]}
              onChange={e => setSelectedDate(e.target.value)}
            />
            {isFutureDate && (
              <p className="text-red-500 text-xs mt-1">
                Cannot mark attendance for future dates
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Student List */}
      {!selectedClassId ? (
        <div className="card p-12 text-center text-gray-400 text-sm">
          👆 Select a class above to start marking attendance
        </div>
      ) : isLoading ? (
        <div className="card p-8 text-center text-gray-400">
          Loading students...
        </div>
      ) : studentAttendances.length === 0 ? (
        <div className="card p-12 text-center text-gray-400 text-sm">
          No students enrolled in this class yet
        </div>
      ) : (
        <div className="card overflow-hidden">

          {/* Bulk actions + live count */}
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Bulk:</span>
              <button
                onClick={() => markAll("PRESENT")}
                className="text-xs px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium"
              >
                All Present
              </button>
              <button
                onClick={() => markAll("ABSENT")}
                className="text-xs px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium"
              >
                All Absent
              </button>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-green-600 font-medium">✓ {presentCount} present</span>
              <span className="text-red-600 font-medium">✗ {absentCount} absent</span>
              {lateCount > 0 && (
                <span className="text-yellow-600 font-medium">⏰ {lateCount} late</span>
              )}
            </div>
          </div>

          {/* Each student row */}
          <div className="divide-y divide-gray-100">
            {studentAttendances.map(({ student }) => {
              const current = attendanceMap[student.id];
              return (
                <div
                  key={student.id}
                  className="flex items-center justify-between px-5 py-3 hover:bg-gray-50"
                >
                  {/* Student info */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold text-sm">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {student.name}
                      </p>
                      <p className="text-xs text-gray-400">{student.email}</p>
                    </div>
                  </div>

                  {/* Status toggle buttons */}
                  <div className="flex items-center gap-2">
                    {statusButtons.map(btn => (
                      <button
                        key={btn.status}
                        onClick={() => toggleStatus(student.id, btn.status)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                          current === btn.status ? btn.active : btn.inactive
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer with Save */}
          <div className="px-5 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            {message ? (
              <span className={`text-sm font-medium ${
                message.type === "success" ? "text-green-600" : "text-red-600"
              }`}>
                {message.text}
              </span>
            ) : (
              <span className="text-sm text-gray-500">
                {studentAttendances.length} students in this class
              </span>
            )}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || isFutureDate || !selectedClassId}
              className="btn-primary px-6"
            >
              {isSubmitting ? "Saving..." : "Save Attendance"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Outer component wraps with Suspense ───────────────────
// Required by Next.js 14 whenever useSearchParams() is used
export default function MarkAttendancePage() {
  return (
    <Suspense fallback={
      <div className="p-8 flex items-center gap-2 text-gray-500">
        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading...
      </div>
    }>
      <MarkAttendanceContent />
    </Suspense>
  );
}