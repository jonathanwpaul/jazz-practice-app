"use client";

import { useQuery } from "@tanstack/react-query";
import { useDb } from "@/lib/db-provider";
import { Nav } from "@/components/Nav";
import Link from "next/link";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function monthBounds(): { start: string; end: string } {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const last = new Date(y, d.getMonth() + 1, 0).getDate();
  return { start: `${y}-${m}-01`, end: `${y}-${m}-${String(last).padStart(2, "0")}` };
}

function monthPace(): number {
  const d = new Date();
  return d.getDate() / new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

interface CategoryProgress {
  id: number;
  name: string;
  monthly_target: number;
  session_count: number;
}

interface MaintenanceSong {
  id: number;
  name: string;
}

export default function DashboardPage() {
  const ds = useDb();
  const { start, end } = monthBounds();
  const pace = monthPace();

  const { data: progress } = useQuery<CategoryProgress[]>({
    queryKey: ["dashboard", "month", start],
    queryFn: async () => {
      const counts: { category_id: number; cnt: number }[] = await ds.query(
        `SELECT t.category_id, COUNT(DISTINCT s.id) as cnt
         FROM sessions s
         JOIN session_tasks st ON st.session_id = s.id
         JOIN tasks t ON t.id = st.task_id
         WHERE s.date >= ? AND s.date <= ?
         GROUP BY t.category_id`,
        [start, end]
      );
      const countMap = Object.fromEntries(counts.map((r) => [r.category_id, Number(r.cnt)]));
      const cats: { id: number; name: string; monthly_target: number }[] = await ds.query(
        "SELECT id, name, monthly_target FROM categories ORDER BY sort_order ASC"
      );
      return cats.map((c) => ({
        ...c,
        session_count: countMap[c.id] ?? 0,
      }));
    },
  });

  const { data: maintenance } = useQuery<MaintenanceSong[]>({
    queryKey: ["songs", "maintenance"],
    queryFn: () => ds.query("SELECT id, name FROM songs WHERE status = 'maintenance'"),
  });

  const pick =
    maintenance && maintenance.length > 0
      ? maintenance[Math.floor(Math.random() * maintenance.length)]
      : null;

  return (
    <div className="flex flex-col min-h-screen">
      <Nav />
      <main className="flex-1 p-6 max-w-2xl mx-auto w-full space-y-8">

        {/* Quick action */}
        <Link
          href="/session/new"
          className="block w-full rounded-xl bg-teal-500 px-6 py-4 text-center text-lg font-semibold text-zinc-950 hover:bg-teal-400 transition-colors"
        >
          + Log today&apos;s session
        </Link>

        {/* Maintenance pick */}
        {pick && (
          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Maintenance pick
            </h2>
            <p className="text-base font-medium text-teal-400">{pick.name}</p>
          </section>
        )}

        {/* Monthly progress */}
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">
            This month — {start.slice(0, 7)}
          </h2>
          <div className="space-y-2">
            {progress?.map((cat) => {
              const paceTarget = Math.floor(cat.monthly_target * pace);
              const delta = cat.session_count - paceTarget;
              const ahead = delta >= 0;
              const pct = Math.min(
                100,
                Math.round((cat.session_count / cat.monthly_target) * 100)
              );
              return (
                <div key={cat.id} className="rounded-lg bg-zinc-900 p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{cat.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-400">
                        {cat.session_count} / {cat.monthly_target}
                      </span>
                      <span
                        className={`font-mono font-semibold ${
                          ahead ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {ahead ? "+" : ""}{delta} vs pace
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-zinc-800">
                    <div
                      className="h-1.5 rounded-full bg-teal-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </main>
    </div>
  );
}
