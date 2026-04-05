"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Target, Users, History, PenSquare, BarChart3 } from "lucide-react";

const tabs = [
  { href: "/admin", label: "Goals", icon: Target },
  { href: "/admin/kids", label: "Kids", icon: Users },
  { href: "/admin/history", label: "History", icon: History },
  { href: "/admin/entries", label: "Entries", mobileLabel: "Entries", icon: PenSquare },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar — hidden on mobile */}
      <nav className="hidden md:flex w-56 shrink-0 flex-col gap-1 p-4">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-4 py-3 font-semibold transition-colors"
              style={{
                borderRadius: "var(--radius-button)",
                minHeight: 44,
                backgroundColor: isActive
                  ? "var(--color-primary)"
                  : "transparent",
                color: isActive
                  ? "var(--color-text-on-primary)"
                  : "var(--color-text-secondary)",
              }}
            >
              <Icon size={20} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Mobile bottom nav — hidden on desktop */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden items-stretch border-t bg-surface"
        style={{ height: 60 }}
      >
        {tabs.map(({ href, label, mobileLabel, icon: Icon }) => {
          const isActive =
            href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 text-center transition-colors"
              style={{
                minWidth: 44,
                minHeight: 44,
                color: isActive
                  ? "var(--color-primary)"
                  : "var(--color-text-secondary)",
              }}
            >
              <Icon size={20} />
              <span
                className="text-[10px] font-semibold leading-tight"
                style={{
                  color: isActive
                    ? "var(--color-primary)"
                    : "var(--color-text-secondary)",
                }}
              >
                {mobileLabel || label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
