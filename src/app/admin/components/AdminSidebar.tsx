"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Target, Users, History, PenSquare } from "lucide-react";

const tabs = [
  { href: "/admin", label: "Goals", icon: Target },
  { href: "/admin/kids", label: "Kids", icon: Users },
  { href: "/admin/history", label: "History", icon: History },
  { href: "/admin/entries", label: "Edit Entries", icon: PenSquare },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <nav className="w-56 shrink-0 flex flex-col gap-1 p-4">
      {tabs.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

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
  );
}
