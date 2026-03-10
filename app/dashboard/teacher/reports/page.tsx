"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import AttendanceRing from "@/components/ui/AttendanceRing";
import { Suspense } from "react";

interface ClassItem { id: string; name: string; }
interface StudentStats {
  student: { id: string; name: string; email: string };
  stats: { totalDays: number; presentDays: number; absentDays: number; percentage: number };
}

function TeacherReportsContent() {
  const searchParams = useSearchParams();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState(searchParams.get("classId") ?? "");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [report, setReport] = useState<{ class: ClassItem; studentStats: StudentStats[] } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/classes").then(r => r.json()).then(d => setClasses(d.data ?? []));
  }, []);

  const generate = async () => {
    if (!selectedClassId) return;
    setLoading(true);
    const p = new URLSearchParams({ classId: selectedClassId });
    if (startDate) p.set("startDate", startDate);
    if (endDate) p.set("endDate", endDate);
    const data = await fetch(`/api/reports?${p}`).then(r => r.json());
    const reports = Array.isArray(data.data) ? data.data : [];
    setReport(reports[0] ?? null);
    setLoading(false);
  };

  const exportCSV = async () => {
    if (!selectedClassId) return;
    const p = new URLSearchParams({ classId: selectedClassId, format: "csv" });
    if (startDate) p.set("startDate", startDate);
    if (endDate) p.set("endDate", endDate);
    const blob = await fetch(`/api/reports?${p}`).then(r => r.blob());
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `report-${selectedClassId}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Class Reports</h1>
        <p className="text-gray-500 text-sm mt-1">View student attendance statistics</p>
      </div>

      <div className="card p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Class</label>
            <select className="input-field text-sm" value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}>
              <option value="">Select class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
            <input type="date" className="input-field text-sm" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
            <input type="date" className="input-field text-sm" max={new Date().toISOString().split("T")[0]} value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <div className="flex items-end gap-2">
            <button onClick={generate} disabled={loading || !selectedClassId} className="btn-primary flex-1 text-sm py-2">
              {loading ? "Loading..." : "Generate"}
            </button>
            <button onClick={exportCSV} disabled={!selectedClassId} className="btn-secondary text-sm py-2 px-3">CSV</button>
          </div>
        </div>
      </div>

      {report && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">{report.class.name}</h3>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Student", "Attendance %", "Present", "Absent", "Total", "Status"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {report.studentStats.map(({ student, stats }) => (
                <tr key={student.id} className={`hover:bg-gray-50 ${stats.percentage < 75 ? "bg-red-50" : ""}`}>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{student.name}</p>
                    <p className="text-xs text-gray-400">{student.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <AttendanceRing percentage={stats.percentage} size={36} strokeWidth={4} />
                      <span className="text-sm font-semibold">{stats.percentage}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="badge-present">{stats.presentDays}</span></td>
                  <td className="px-4 py-3"><span className="badge-absent">{stats.absentDays}</span></td>
                  <td className="px-4 py-3 text-sm text-gray-600">{stats.totalDays}</td>
                  <td className="px-4 py-3">
                    <span className={stats.percentage >= 85 ? "badge-present" : stats.percentage >= 75 ? "badge-late" : "badge-absent"}>
                      {stats.percentage >= 85 ? "Good" : stats.percentage >= 75 ? "Warning" : "Critical"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function TeacherReportsPage() {
  return <Suspense fallback={<div className="p-8 text-gray-400">Loading...</div>}><TeacherReportsContent /></Suspense>;
}