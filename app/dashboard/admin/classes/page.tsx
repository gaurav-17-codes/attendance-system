"use client";
import { useState, useEffect, FormEvent } from "react";

interface Teacher { id: string; name: string; }
interface ClassItem { id: string; name: string; subject?: string; teacher: Teacher; _count: { enrollments: number }; createdAt: string; }

export default function AdminClassesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", subject: "", teacherId: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");

  const load = async () => {
    const [c, t] = await Promise.all([fetch("/api/classes").then(r => r.json()), fetch("/api/teachers").then(r => r.json())]);
    setClasses(c.data ?? []);
    setTeachers(t.data ?? []);
  };

  useEffect(() => { load(); }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Class name is required";
    if (!form.teacherId) e.teacherId = "Please select a teacher";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const res = await fetch("/api/classes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    if (res.ok) { setSuccess("Class created!"); setShowForm(false); setForm({ name: "", subject: "", teacherId: "" }); load(); setTimeout(() => setSuccess(""), 3000); }
    else setErrors({ submit: data.error });
    setSubmitting(false);
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">+ New Class</button>
      </div>

      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">✓ {success}</div>}

      {showForm && (
        <div className="card p-6 mb-6">
          <h2 className="text-base font-semibold mb-4">Create New Class</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class Name *</label>
              <input className={`input-field ${errors.name ? "border-red-400" : ""}`} placeholder="e.g. Mathematics 101" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input className="input-field" placeholder="e.g. Mathematics" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teacher *</label>
              <select className={`input-field ${errors.teacherId ? "border-red-400" : ""}`} value={form.teacherId} onChange={e => setForm({ ...form, teacherId: e.target.value })}>
                <option value="">Select teacher</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              {errors.teacherId && <p className="text-red-500 text-xs mt-1">{errors.teacherId}</p>}
            </div>
            {errors.submit && <div className="col-span-3 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{errors.submit}</div>}
            <div className="col-span-3 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary">{submitting ? "Creating..." : "Create Class"}</button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {["Class", "Teacher", "Students", "Created"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {classes.map(cls => (
              <tr key={cls.id} className="hover:bg-gray-50">
                <td className="px-4 py-3"><p className="text-sm font-medium">{cls.name}</p>{cls.subject && <p className="text-xs text-gray-400">{cls.subject}</p>}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{cls.teacher?.name}</td>
                <td className="px-4 py-3"><span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{cls._count?.enrollments ?? 0} students</span></td>
                <td className="px-4 py-3 text-xs text-gray-400">{new Date(cls.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}