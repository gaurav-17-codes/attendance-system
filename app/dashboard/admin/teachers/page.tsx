"use client";
import { useState, useEffect, FormEvent } from "react";

interface Teacher { id: string; name: string; email: string; createdAt: string; }

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");

  const load = () =>
    fetch("/api/teachers").then(r => r.json()).then(d => setTeachers(d.data ?? []));

  useEffect(() => { load(); }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Valid email required";
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
    const res = await fetch("/api/teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      setSuccess("Teacher added!");
      setShowForm(false);
      setForm({ name: "", email: "", password: "" });
      load();
      setTimeout(() => setSuccess(""), 3000);
    } else {
      setErrors({ submit: data.error });
    }
    setSubmitting(false);
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teachers</h1>
          <p className="text-gray-500 text-sm mt-1">Manage faculty accounts</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          + Add Teacher
        </button>
      </div>

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          ✓ {success}
        </div>
      )}

      {showForm && (
        <div className="card p-6 mb-6">
          <h2 className="text-base font-semibold mb-4">Add New Teacher</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { key: "name", label: "Full Name", type: "text", placeholder: "e.g. Priya Sharma" },
              { key: "email", label: "Email", type: "email", placeholder: "teacher@example.com" },
              { key: "password", label: "Password", type: "password", placeholder: "Min 8 chars" },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{f.label} *</label>
                <input
                  type={f.type}
                  className={`input-field ${errors[f.key] ? "border-red-400" : ""}`}
                  placeholder={f.placeholder}
                  value={form[f.key as keyof typeof form]}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                />
                {errors[f.key] && <p className="text-red-500 text-xs mt-1">{errors[f.key]}</p>}
              </div>
            ))}
            {errors.submit && (
              <div className="col-span-3 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {errors.submit}
              </div>
            )}
            <div className="col-span-3 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? "Adding..." : "Add Teacher"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {["Name", "Email", "Joined"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {teachers.map(t => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 text-sm font-medium">
                      {t.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{t.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{t.email}</td>
                <td className="px-4 py-3 text-xs text-gray-400">{new Date(t.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}