"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";

const adminNav = [
  { label: "Overview", href: "/dashboard/admin" },
  { label: "Classes", href: "/dashboard/admin/classes" },
  { label: "Students", href: "/dashboard/admin/students" },
  { label: "Teachers", href: "/dashboard/admin/teachers" },
  { label: "Reports", href: "/dashboard/admin/reports" },
];

const teacherNav = [
  { label: "My Classes", href: "/dashboard/teacher" },
  { label: "Mark Attendance", href: "/dashboard/teacher/mark" },
  { label: "Reports", href: "/dashboard/teacher/reports" },
];

const studentNav = [
  { label: "My Attendance", href: "/dashboard/student" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems =
    user?.role === "ADMIN"
      ? adminNav
      : user?.role === "TEACHER"
      ? teacherNav
      : studentNav;

  const roleColors: Record<string, string> = {
    ADMIN: "bg-purple-100 text-purple-700",
    TEACHER: "bg-blue-100 text-blue-700",
    STUDENT: "bg-green-100 text-green-700",
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col min-h-screen">
      {/* Brand */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">KALNET</p>
            <p className="text-xs text-gray-400">Attendance System</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium text-sm">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${roleColors[user?.role ?? "STUDENT"]}`}>
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={logout}
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 w-full transition-colors"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}