"use client";

import { useState } from "react";

type View = "jar" | "calendar";

interface DashboardContentProps {
  calendar: React.ReactNode;
  sidebar: React.ReactNode;
}

/**
 * Responsive layout wrapper for the dashboard.
 * - Wide screens (md+): side-by-side calendar + sidebar (landscape layout)
 * - Narrow screens (<md): tab toggle between Jar and Calendar views
 */
export default function DashboardContent({
  calendar,
  sidebar,
}: DashboardContentProps) {
  const [activeView, setActiveView] = useState<View>("jar");

  return (
    <div
      className="flex-1 flex flex-col md:flex-row gap-4 md:gap-6 p-4 md:p-5"
      style={{ backgroundColor: "#FAE5D8" }}
    >
      {/* Tab switcher — narrow screens only */}
      <div className="flex md:hidden bg-white rounded-full p-1 gap-1">
        <button
          onClick={() => setActiveView("jar")}
          className="flex-1 py-2 rounded-full text-sm font-bold transition-colors"
          style={{
            backgroundColor:
              activeView === "jar" ? "var(--color-primary)" : "transparent",
            color:
              activeView === "jar"
                ? "var(--color-text-on-primary)"
                : "var(--color-text-secondary)",
            minHeight: 36,
          }}
        >
          Jar
        </button>
        <button
          onClick={() => setActiveView("calendar")}
          className="flex-1 py-2 rounded-full text-sm font-bold transition-colors"
          style={{
            backgroundColor:
              activeView === "calendar" ? "var(--color-primary)" : "transparent",
            color:
              activeView === "calendar"
                ? "var(--color-text-on-primary)"
                : "var(--color-text-secondary)",
            minHeight: 36,
          }}
        >
          Calendar
        </button>
      </div>

      {/* Calendar — always visible on wide, toggled on narrow */}
      <div
        className={`flex-[2] min-w-0 ${
          activeView === "calendar" ? "block" : "hidden"
        } md:block`}
      >
        {calendar}
      </div>

      {/* Sidebar (jar + clock + avatars) — always visible on wide, toggled on narrow */}
      <aside
        className={`flex-[1] flex flex-col items-center gap-3 ${
          activeView === "jar" ? "flex" : "hidden"
        } md:flex`}
      >
        {sidebar}
      </aside>
    </div>
  );
}
