import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AdminSidebar from "./components/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Top bar */}
      <header
        className="flex items-center px-6 bg-primary text-text-on-primary shrink-0"
        style={{ minHeight: 56 }}
      >
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold"
          style={{ minHeight: 44, minWidth: 44 }}
        >
          <ArrowLeft size={20} />
          <span className="hidden sm:inline">Back to Dashboard</span>
        </Link>
        <h1 className="flex-1 text-center text-lg font-bold">
          Parent Settings
        </h1>
        {/* Spacer to balance the back link */}
        <div className="w-44 hidden sm:block" />
      </header>

      {/* Body: sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto p-4 pb-20 md:p-6 md:pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}
