"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDb } from "@/lib/db-provider";
import { Nav } from "@/components/Nav";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function playBubblePop() {
  if (typeof window === "undefined") return;
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(900, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch {}
}

interface Song { id: number; name: string; }
interface Task { id: number; name: string; category_id: number; category_name: string; }
interface Category { id: number; name: string; }

export default function NewSessionPage() {
  const ds = useDb();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [date, setDate] = useState(today());
  const [songId, setSongId] = useState<string>("");
  const [checkedTasks, setCheckedTasks] = useState<Set<number>>(new Set());
  const [animatingTasks, setAnimatingTasks] = useState<Set<number>>(new Set());
  const [doneTasks, setDoneTasks] = useState<Set<number>>(new Set());
  const [notes, setNotes] = useState("");

  const { data: songs } = useQuery<Song[]>({
    queryKey: ["songs", "all"],
    queryFn: () => ds.query("SELECT id, name FROM songs ORDER BY name ASC"),
  });

  const { data: tasks } = useQuery<Task[]>({
    queryKey: ["tasks", "with-categories"],
    queryFn: () =>
      ds.query(
        `SELECT t.id, t.name, t.category_id, c.name as category_name
         FROM tasks t
         JOIN categories c ON c.id = t.category_id
         ORDER BY c.sort_order ASC, t.id ASC`
      ),
  });

  const categories: Category[] = tasks
    ? Array.from(
        new Map(tasks.map((t) => [t.category_id, { id: t.category_id, name: t.category_name }])).values()
      )
    : [];

  function checkTask(id: number) {
    setCheckedTasks((prev) => { const s = new Set(prev); s.add(id); return s; });
    setAnimatingTasks((prev) => { const s = new Set(prev); s.add(id); return s; });
  }

  function uncheckTask(id: number) {
    setCheckedTasks((prev) => { const s = new Set(prev); s.delete(id); return s; });
    setDoneTasks((prev) => { const s = new Set(prev); s.delete(id); return s; });
  }

  function handleAnimationEnd(id: number) {
    playBubblePop();
    setAnimatingTasks((prev) => { const s = new Set(prev); s.delete(id); return s; });
    setDoneTasks((prev) => { const s = new Set(prev); s.add(id); return s; });
  }

  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      const result: { id: number }[] = await ds.query(
        "INSERT INTO sessions (date, song_id, notes) VALUES (?, ?, ?) RETURNING id",
        [date, songId ? Number(songId) : null, notes || null]
      );
      const sessionId = result[0].id;
      for (const taskId of checkedTasks) {
        await ds.query("INSERT INTO session_tasks (session_id, task_id) VALUES (?, ?)", [sessionId, taskId]);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      router.push("/sessions");
    },
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Nav />
      <main className="flex-1 p-6 max-w-2xl mx-auto w-full space-y-6">
        <h1 className="text-xl font-semibold">Log session</h1>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm text-zinc-100 border border-zinc-800 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Song (optional)</label>
            <select
              value={songId}
              onChange={(e) => setSongId(e.target.value)}
              className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm text-zinc-100 border border-zinc-800 focus:outline-none focus:border-teal-500"
            >
              <option value="">— none —</option>
              {songs?.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Tasks</span>
            {categories.map((cat) => {
              const catTasks = tasks?.filter((t) => t.category_id === cat.id) ?? [];
              const doneCatTasks = catTasks.filter((t) => doneTasks.has(t.id));

              return (
                <div key={cat.id} className="rounded-lg bg-zinc-900 p-4 space-y-1">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-teal-500">{cat.name}</p>

                  {catTasks.map((t) => {
                    const isDone = doneTasks.has(t.id);
                    const isAnimating = animatingTasks.has(t.id);
                    return (
                      <div
                        key={t.id}
                        style={{
                          maxHeight: isDone ? 0 : "120px",
                          opacity: isDone ? 0 : 1,
                          overflow: "hidden",
                          transition: "max-height 250ms ease, opacity 200ms ease",
                          pointerEvents: isDone ? "none" : "auto",
                        }}
                      >
                        <label className="flex items-center gap-3 cursor-pointer group py-0.5">
                          <input
                            type="checkbox"
                            checked={checkedTasks.has(t.id)}
                            onChange={() => {
                              if (!checkedTasks.has(t.id) && !isAnimating) checkTask(t.id);
                            }}
                            className="h-4 w-4 shrink-0 rounded border-zinc-700 bg-zinc-800 accent-teal-500"
                          />
                          <span className="relative text-sm text-zinc-300 group-hover:text-zinc-100 transition-colors">
                            {t.name}
                            {isAnimating && (
                              <span
                                style={{
                                  position: "absolute",
                                  left: 0,
                                  top: "50%",
                                  height: "1.5px",
                                  width: "100%",
                                  background: "#2dd4bf",
                                  transformOrigin: "left",
                                  animation: "strikethrough-sweep 300ms ease forwards",
                                }}
                                onAnimationEnd={() => handleAnimationEnd(t.id)}
                              />
                            )}
                          </span>
                        </label>
                      </div>
                    );
                  })}

                  {doneCatTasks.length > 0 && (
                    <div className="pt-2 border-t border-zinc-800 space-y-1">
                      <p className="text-xs text-zinc-600 pb-0.5">Done — tap to uncheck</p>
                      {doneCatTasks.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => uncheckTask(t.id)}
                          className="flex items-center gap-2 w-full text-left group"
                        >
                          <span className="h-4 w-4 shrink-0 rounded border border-teal-800 flex items-center justify-center text-teal-500 text-xs">✓</span>
                          <span className="text-sm text-zinc-600 line-through group-hover:text-zinc-400 transition-colors">{t.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Anything worth remembering…"
              className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm text-zinc-100 border border-zinc-800 focus:outline-none focus:border-teal-500 resize-none placeholder:text-zinc-600"
            />
          </div>
        </div>

        <button
          onClick={() => save()}
          disabled={isPending}
          className="w-full rounded-xl bg-teal-500 px-6 py-4 text-center text-lg font-semibold text-zinc-950 hover:bg-teal-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Saving…" : "Save session"}
        </button>
      </main>
    </div>
  );
}
