"use client";

import { useQuery } from "@tanstack/react-query";
import { useDb } from "@/lib/db-provider";
import { Nav } from "@/components/Nav";

interface Task {
  id: number;
  name: string;
  category_id: number;
  category_name: string;
  rate_name: string | null;
  per_song: number;
  required: number;
}

interface Category {
  id: number;
  name: string;
}

export default function TasksPage() {
  const ds = useDb();

  const { data: tasks } = useQuery<Task[]>({
    queryKey: ["tasks", "full"],
    queryFn: () =>
      ds.query(
        `SELECT t.id, t.name, t.category_id, c.name as category_name,
                r.name as rate_name, t.per_song, t.required
         FROM tasks t
         JOIN categories c ON c.id = t.category_id
         LEFT JOIN rates r ON r.id = t.rate_id
         ORDER BY c.sort_order ASC, t.id ASC`
      ),
  });

  const categories: Category[] = tasks
    ? Array.from(
        new Map(
          tasks.map((t) => [t.category_id, { id: t.category_id, name: t.category_name }])
        ).values()
      )
    : [];

  return (
    <div className="flex flex-col min-h-screen">
      <Nav />
      <main className="flex-1 p-6 max-w-2xl mx-auto w-full space-y-6">
        <h1 className="text-xl font-semibold">Tasks</h1>

        {categories.map((cat) => (
          <section key={cat.id}>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-amber-500">
              {cat.name}
            </h2>
            <div className="rounded-lg bg-zinc-900 divide-y divide-zinc-800">
              {tasks
                ?.filter((t) => t.category_id === cat.id)
                .map((t) => (
                  <div key={t.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium truncate">{t.name}</span>
                      {t.required === 1 && (
                        <span className="shrink-0 rounded bg-amber-500/20 px-1.5 py-0.5 text-xs font-semibold text-amber-400">
                          required
                        </span>
                      )}
                    </div>
                    <span className="shrink-0 ml-4 text-xs text-zinc-500">
                      {t.per_song === 1 ? "Per song" : (t.rate_name ?? "—")}
                    </span>
                  </div>
                ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
