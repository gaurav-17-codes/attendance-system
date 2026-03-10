"use client";
import { useState, useEffect } from "react";
import AttendanceRing from "@/components/ui/AttendanceRing";

interface ClassItem { id: string; name: string; subject?: string; }
interface StudentStats {
  student: { id: string; name: string; email: string };
  stats: { totalDays: number; presentDays: number; absentDays: number; percentage: number };
}
interface Report { class: ClassItem; studentStats: StudentStats[]; }

export default function AdminReportsPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [filters, setFilters] = useState({ classId: "", startDate: "", endDate: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/classes").then(r => r.json()).then(d => setClasses(d.data ?? []));
  }, []);

  const generate = async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (filters.classId) p.set("classId", filters.classId);
    if (filters.startDate) p.set("startDate", filters.startDate);
    if (filters.endDate) p.set("endDate", filters.endDate);
    const data = await fetch(`/api/reports?${p}`).then(r => r.json());
    setReports(Array.isArray(data.data) ? data.data : []);
    setLoading(false);
  };

  const exportCSV = async () => {
    if (!filters.classId) { alert("Select a class first"); return; }
    const p = new URLSearchParams({ classId: filters.classId, format: "csv" });
    if (filters.startDate) p.set("startDate", filters.startDate);
    if (filters.endDate) p.set("endDate", filters.endDate);
    const blob = await fetch(`/api/reports?${p}`).then(r => r.blob());
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `attendance-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Attendance Reports</h1>
        <p className="text-gray-500 text-sm mt-1">Generate and export reports</p>
      </div>

      <div className="card p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Class</label>
            <select className="input-field text-sm" value={filters.classId} onChange={e => setFilters({ ...filters, classId: e.target.value })}>
              <option value="">All Classes</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From Date</label>
            <input type="date" className="input-field text-sm" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To Date</label>
            <input type="date" className="input-field text-sm" max={new Date().toISOString().split("T")[0]} value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} />
          </div>
          <div className="flex items-end gap-2">
            <button onClick={generate} disabled={loading} className="btn-primary flex-1 text-sm py-2">
              {loading ? "Loading..." : "Generate"}
            </button>
            <button onClick={exportCSV} className="btn-secondary text-sm py-2 px-3">CSV</button>
          </div>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="card p-12 text-center text-gray-400 text-sm">
          Set filters and click Generate to view reports
        </div>
      ) : (
        <div className="space-y-6">
          {reports.map(report => (
            <div key={report.class.id} className="card overflow-hidden">
              <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">{report.class.name}</h3>
                {report.class.subject && <p className="text-xs text-gray-500">{report.class.subject}</p>}
              </div>
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {["Student", "Attendance", "Present", "Absent", "Total Days"].map(h => (
                      <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
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
                          <AttendanceRing percentage={stats.percentage} size={40} strokeWidth={5} />
                          <span className="text-sm font-semibold">{stats.percentage}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className="badge-present">{stats.presentDays}</span></td>
                      <td className="px-4 py-3"><span className="badge-absent">{stats.absentDays}</span></td>
                      <td className="px-4 py-3 text-sm text-gray-600">{stats.totalDays}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}