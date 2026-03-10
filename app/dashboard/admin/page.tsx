"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import StatsCard from "@/components/ui/StatsCard";
import Link from "next/link";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ students: 0, teachers: 0, classes: 0 });

  useEffect(() => {
    Promise.all([fetch("/api/students"), fetch("/api/teachers"), fetch("/api/classes")])
      .then((res) => Promise.all(res.map((r) => r.json())))
      .then(([s, t, c]) => setStats({ students: s.data?.length ?? 0, teachers: t.data?.length ?? 0, classes: c.data?.length ?? 0 }));
  }, []);

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name?.split(" ")[0]}! 👋</h1>
        <p className="text-gray-500 mt-1">{new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatsCard title="Total Students" value={stats.students} subtitle="Active enrollments" color="blue" />
        <StatsCard title="Teachers" value={stats.teachers} subtitle="Active faculty" color="purple" />
        <StatsCard title="Classes" value={stats.classes} subtitle="Active courses" color="green" />
      </div>

      <div className="card p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Manage Classes", href: "/dashboard/admin/classes", color: "bg-blue-50 text-blue-700 hover:bg-blue-100" },
            { label: "Add Student", href: "/dashboard/admin/students", color: "bg-green-50 text-green-700 hover:bg-green-100" },
            { label: "Add Teacher", href: "/dashboard/admin/teachers", color: "bg-purple-50 text-purple-700 hover:bg-purple-100" },
            { label: "View Reports", href: "/dashboard/admin/reports", color: "bg-orange-50 text-orange-700 hover:bg-orange-100" },
          ].map((a) => (
            <Link key={a.href} href={a.href} className={`p-3 rounded-lg text-sm font-medium text-center transition-colors ${a.color}`}>
              {a.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}