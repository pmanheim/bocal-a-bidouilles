import Link from "next/link";

export default function AdminPage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-8">
      <div
        className="bg-surface p-8 text-center max-w-md"
        style={{ borderRadius: "var(--radius-card)" }}
      >
        <h1 className="text-2xl font-bold mb-2">Admin</h1>
        <p className="text-text-secondary mb-6">
          Goal management, child profiles, and entry corrections will be built
          in upcoming phases.
        </p>
        <Link
          href="/"
          className="inline-block bg-primary text-text-on-primary px-6 py-3 font-semibold"
          style={{ borderRadius: "var(--radius-button)" }}
        >
          ← Back to Dashboard
        </Link>
      </div>
    </main>
  );
}
