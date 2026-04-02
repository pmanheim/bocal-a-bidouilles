import Link from "next/link";
import MuteButton from "./MuteButton";

interface TopBarProps {
  goalName: string;
  prizeEmoji: string | null;
  prizeText: string | null;
  successCount: number;
  targetCount: number;
}

export default function TopBar({
  goalName,
  prizeEmoji,
  prizeText,
  successCount,
  targetCount,
}: TopBarProps) {
  return (
    <header className="bg-primary text-white px-5 py-3 flex items-center gap-4">
      <h1 className="text-lg font-extrabold tracking-wide mr-2">
        {goalName}
      </h1>
      {prizeEmoji && (
        <span className="bg-white/20 backdrop-blur px-4 py-1.5 text-sm font-bold rounded-full flex items-center gap-1.5">
          {prizeEmoji} {prizeText}
        </span>
      )}
      <span className="bg-white/25 px-4 py-1.5 text-base font-extrabold rounded-full ml-auto">
        {successCount} / {targetCount}
      </span>
      <MuteButton />
      {/* Settings */}
      <Link
        href="/admin"
        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
        aria-label="Admin settings"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </Link>
    </header>
  );
}
