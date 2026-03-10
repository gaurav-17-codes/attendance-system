"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import AttendanceRing from "@/components/ui/AttendanceRing";

interface ClassReport {
  class: { id: string; name: string; subject?: string };
  stats: { totalDays: number; presentDays: number; absentDays: number; percentage: number } | null;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [reports, setReports] = useState<ClassReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetch("/api/reports")
      .then(r => r.json())
      .then(d => { setReports(d.data ?? []); setLoading(false); });
  }, [user]);

  const overall = reports.length
    ? reports.reduce((sum, r) => sum + (r.stats?.percentage ?? 0), 0) / reports.length
    : 0;

  if (loading) return <div className="p-8 text-gray-400">Loading...</div>;

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Attendance</h1>
        <p className="text-gray-500 text-sm mt-1">Hello, {user?.name}!</p>
      </div>

      {/* Overall card */}
      <div className="bg-blue-600 rounded-xl p-6 mb-8 flex items-center justify-between">
        <div>
          <p className="text-blue-100 text-sm">Overall Attendance</p>
          <p className="text-4xl font-bold text-white mt-1">{overall.toFixed(1)}%</p>
          <p className="text-blue-100 text-sm mt-2">{reports.length} class{reports.length !== 1 ? "es" : ""} enrolled</p>
          {overall < 75 && (
            <div className="mt-3 bg-red-500 bg-opacity-80 rounded-lg px-3 py-2 text-sm text-white">
              ⚠️ Below 75% — please attend more classes
            </div>
          )}
        </div>
        <AttendanceRing percentage={overall} size={100} strokeWidth={10} />
      </div>

      {/* Per-class breakdown */}
      <h2 className="text-base font-semibold text-gray-900 mb-4">Class-wise Attendance</h2>

      {reports.length === 0 ? (
        <div className="card p-12 text-center text-gray-400 text-sm">Not enrolled in any classes yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map(report => {
            const pct = report.stats?.percentage ?? 0;
            return (
              <div key={report.class.id} className="card p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{report.class.name}</h3>
                    {report.class.subject && <p className="text-xs text-gray-400 mt-0.5">{report.class.subject}</p>}
                  </div>
                  <AttendanceRing percentage={pct} size={52} strokeWidth={6} />
                </div>

                {report.stats ? (
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      { label: "Present", value: report.stats.presentDays, color: "text-green-600" },
                      { label: "Absent", value: report.stats.absentDays, color: "text-red-600" },
                      { label: "Total", value: report.stats.totalDays, color: "text-gray-700" },
                    ].map(s => (
                      <div key={s.label} className="bg-gray-50 rounded-lg py-2">
                        <p className={`text-base font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-xs text-gray-400">{s.label}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-2">No attendance recorded yet</p>
                )}

                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${pct >= 85 ? "bg-green-500" : pct >= 75 ? "bg-yellow-500" : "bg-red-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className={`text-xs mt-1 ${pct < 75 ? "text-red-500 font-medium" : "text-gray-400"}`}>
                    {pct < 75 ? "Below minimum (75%)" : "Good standing"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}