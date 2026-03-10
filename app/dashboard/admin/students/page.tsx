"use client";
import { useState, useEffect, FormEvent } from "react";

interface Student {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
}
interface ClassItem { id: string; name: string; }

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", classId: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");

  const load = async () => {
    const [s, c] = await Promise.all([
      fetch("/api/students").then(r => r.json()),
      fetch("/api/classes").then(r => r.json()),
    ]);
    setStudents(s.data ?? []);
    setClasses(c.data ?? []);
  };

  useEffect(() => { load(); }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email";
    if (form.password.length < 8) e.password = "Min 8 characters";
    if (!/[A-Z]/.test(form.password)) e.password = "Needs uppercase letter";
    if (!/[0-9]/.test(form.password)) e.password = "Needs a number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    if (res.ok) {
      // If a class was selected, enroll the student
      if (form.classId && data.data?.id) {
        await fetch(`/api/classes/${form.classId}/students`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentIds: [data.data.id] }),
        });
      }
      setSuccess("Student added successfully!");
      setShowForm(false);
      setForm({ name: "", email: "", password: "", classId: "" });
      load();
      setTimeout(() => setSuccess(""), 3000);
    } else {
      setErrors({ submit: data.error });
    }
    setSubmitting(false);
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-500 text-sm mt-1">Manage student accounts</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          + Add Student
        </button>
      </div>

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          ✓ {success}
        </div>
      )}

      {showForm && (
        <div className="card p-6 mb-6">
          <h2 className="text-base font-semibold mb-4">Add New Student</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                className={`input-field ${errors.name ? "border-red-400" : ""}`}
                placeholder="e.g. Arjun Kapoor"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                className={`input-field ${errors.email ? "border-red-400" : ""}`}
                placeholder="student@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <input
                type="password"
                className={`input-field ${errors.password ? "border-red-400" : ""}`}
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Enroll in Class (optional)
              </label>
              <select
                className="input-field"
                value={form.classId}
                onChange={e => setForm({ ...form, classId: e.target.value })}
              >
                <option value="">Select a class</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {errors.submit && (
              <div className="col-span-2 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {errors.submit}
              </div>
            )}

            <div className="col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? "Adding..." : "Add Student"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <span className="text-sm font-medium text-gray-700">{students.length} students total</span>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {["Name", "Email", "Status", "Joined"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {students.map(s => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-xs font-medium">
                      {s.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{s.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{s.email}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${s.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {s.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {new Date(s.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}