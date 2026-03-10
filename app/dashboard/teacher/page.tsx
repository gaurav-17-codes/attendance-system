"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";

interface ClassItem { id: string; name: string; subject?: string; _count: { enrollments: number }; }

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/classes").then(r => r.json()).then(d => { setClasses(d.data ?? []); setLoading(false); });
  }, []);

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name?.split(" ")[0]}!</h1>
        <p className="text-gray-500 mt-1">{new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      <div className="bg-blue-600 rounded-xl p-5 mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold">Mark Today&apos;s Attendance</h2>
          <p className="text-blue-100 text-sm mt-0.5">Select a class below or click Mark Now</p>
        </div>
        <Link href="/dashboard/teacher/mark" className="bg-white text-blue-600 hover:bg-blue-50 font-medium text-sm px-4 py-2 rounded-lg transition-colors">
          Mark Now →
        </Link>
      </div>

      <h2 className="text-base font-semibold text-gray-900 mb-4">My Classes</h2>

      {loading ? (
        <div className="text-center py-8 text-gray-400">Loading...</div>
      ) : classes.length === 0 ? (
        <div className="card p-12 text-center text-gray-400 text-sm">No classes assigned yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map(cls => (
            <div key={cls.id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  {cls._count?.enrollments ?? 0} students
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 text-sm">{cls.name}</h3>
              {cls.subject && <p className="text-xs text-gray-400 mt-0.5">{cls.subject}</p>}
              <div className="mt-4 pt-3 border-t border-gray-100 flex gap-2">
                <Link href={`/dashboard/teacher/mark?classId=${cls.id}&date=${today}`} className="flex-1 text-center text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 py-1.5 rounded transition-colors">
                  Mark Today
                </Link>
                <Link href={`/dashboard/teacher/reports?classId=${cls.id}`} className="flex-1 text-center text-xs font-medium bg-gray-50 text-gray-700 hover:bg-gray-100 py-1.5 rounded transition-colors">
                  View Report
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}