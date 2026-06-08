"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useDb } from "@/lib/db-provider";
import { Nav } from "@/components/Nav";
import Link from "next/link";

interface SessionDetail {
  id: number;
  date: string;
  song_name: string | null;
  notes: string | null;
}

interface SessionTask {
  task_id: number;
  task_name: string;
  category_id: number;
  category_name: string;
  required: number;
}

interface Category {
  id: number;
  name: string;
}

function SessionView() {
  const params = useSearchParams();
  const id = params.get("id");
  const ds = useDb();

  const { data: session, isLoading } = useQuery<SessionDetail | null>({
    queryKey: ["session", id],
    enabled: !!id,
    queryFn: async () => {
      const rows: SessionDetail[] = await ds.query(
        `SELECT s.id, s.date, s.notes, so.name as song_name
         FROM sessions s
         LEFT JOIN songs so ON so.id = s.song_id
         WHERE s.id = ?`,
        [Number(id)]
      );
      return rows[0] ?? null;
    },
  });

  const { data: tasks } = useQuery<SessionTask[]>({
    queryKey: ["session", id, "tasks"],
    enabled: !!id,
    queryFn: () =>
      ds.query(
        `SELECT t.id as task_id, t.name as task_name,
                c.id as category_id, c.name as category_name, t.required
         FROM session_tasks st
         JOIN tasks t ON t.id = st.task_id
         JOIN categories c ON c.id = t.category_id
         WHERE st.session_id = ?
         ORDER BY c.sort_order ASC, t.id ASC`,
        [Number(id)]
      ),
  });

  const categories: Category[] = tasks
    ? Array.from(
        new Map(tasks.map((t) => [t.category_id, { id: t.category_id, name: t.category_name }])).values()
      )
    : [];

  if (!id) {
    return (
      <main className="flex-1 p-6 max-w-2xl mx-auto w-full space-y-4">
        <p className="text-zinc-400">No session specified.</p>
        <Link href="/sessions" className="text-sm text-teal-400 hover:text-teal-300">← Back to history</Link>
      </main>
    );
  }

  if (isLoading) {
    return <main className="flex-1 p-6 max-w-2xl mx-auto w-full"><p className="text-zinc-400">Loading…</p></main>;
  }

  if (!session) {
    return (
      <main className="flex-1 p-6 max-w-2xl mx-auto w-full space-y-4">
        <p className="text-zinc-400">Session not found.</p>
        <Link href="/sessions" className="text-sm text-teal-400 hover:text-teal-300">← Back to history</Link>
      </main>
    );
  }

  return (
    <main className="flex-1 p-6 max-w-2xl mx-auto w-full space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/sessions" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
          ← History
        </Link>
        <h1 className="text-xl font-semibold">{session.date}</h1>
        {session.song_name && (
          <span className="text-sm text-teal-400">{session.song_name}</span>
        )}
      </div>

      {session.notes && (
        <section>
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-widest text-zinc-500">Notes</h2>
          <p className="text-sm text-zinc-300 whitespace-pre-wrap">{session.notes}</p>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Tasks — {tasks?.length ?? 0} done
        </h2>
        {categories.length === 0 && (
          <p className="text-sm text-zinc-600">No tasks logged.</p>
        )}
        {categories.map((cat) => (
          <div key={cat.id} className="mb-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-teal-500">{cat.name}</p>
            <div className="rounded-lg bg-zinc-900 divide-y divide-zinc-800">
              {tasks
                ?.filter((t) => t.category_id === cat.id)
                .map((t) => (
                  <div key={t.task_id} className="flex items-center gap-2 px-4 py-3">
                    <span className="text-teal-500 text-xs">✓</span>
                    <span className="text-sm">{t.task_name}</span>
                    {t.required === 1 && (
                      <span className="ml-auto shrink-0 rounded bg-teal-500/20 px-1.5 py-0.5 text-xs font-semibold text-teal-400">
                        required
                      </span>
                    )}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}

export default function SessionViewPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Nav />
      <Suspense fallback={<main className="flex-1 p-6 max-w-2xl mx-auto w-full"><p className="text-zinc-400">Loading…</p></main>}>
        <SessionView />
      </Suspense>
    </div>
  );
}
