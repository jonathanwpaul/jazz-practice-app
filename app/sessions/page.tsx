"use client";

import { useQuery } from "@tanstack/react-query";
import { useDb } from "@/lib/db-provider";
import { Nav } from "@/components/Nav";
import Link from "next/link";

interface SessionRow {
  id: number;
  date: string;
  song_name: string | null;
  task_count: number;
}

export default function SessionsPage() {
  const ds = useDb();

  const { data: sessions } = useQuery<SessionRow[]>({
    queryKey: ["sessions"],
    queryFn: () =>
      ds.query(
        `SELECT s.id, s.date, so.name as song_name,
                COUNT(st.task_id) as task_count
         FROM sessions s
         LEFT JOIN songs so ON so.id = s.song_id
         LEFT JOIN session_tasks st ON st.session_id = s.id
         GROUP BY s.id
         ORDER BY s.date DESC`
      ),
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Nav />
      <main className="flex-1 p-6 max-w-2xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Session history</h1>
          <Link
            href="/session/new"
            className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-teal-400 transition-colors"
          >
            + New
          </Link>
        </div>

        {sessions && sessions.length === 0 && (
          <p className="text-zinc-500 text-sm">No sessions yet.</p>
        )}

        <div className="space-y-2">
          {sessions?.map((s) => (
            <Link
              key={s.id}
              href={`/sessions/view?id=${s.id}`}
              className="flex items-center justify-between rounded-lg bg-zinc-900 px-4 py-3 hover:bg-zinc-800 transition-colors"
            >
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{s.date}</p>
                {s.song_name && (
                  <p className="text-xs text-teal-400">{s.song_name}</p>
                )}
              </div>
              <span className="text-xs text-zinc-500">
                {Number(s.task_count)} task{Number(s.task_count) !== 1 ? "s" : ""}
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
