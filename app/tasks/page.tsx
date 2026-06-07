"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDb } from "@/lib/db-provider";
import { Nav } from "@/components/Nav";

interface Task {
  id: number;
  name: string;
  category_id: number;
  category_name: string;
  rate_id: number | null;
  rate_name: string | null;
  per_song: number;
  required: number;
  description: string | null;
}

interface Category {
  id: number;
  name: string;
}

interface Rate {
  id: number;
  name: string;
}

interface TaskForm {
  name: string;
  category_id: string;
  rate_id: string;
  per_song: boolean;
  required: boolean;
  description: string;
}

const EMPTY_FORM: TaskForm = {
  name: "",
  category_id: "",
  rate_id: "",
  per_song: false,
  required: false,
  description: "",
};

function TaskFormFields({
  form,
  onChange,
  categories,
  rates,
}: {
  form: TaskForm;
  onChange: (f: TaskForm) => void;
  categories: Category[] | undefined;
  rates: Rate[] | undefined;
}) {
  return (
    <div className="space-y-3 p-4 bg-zinc-800 rounded-lg">
      <input
        value={form.name}
        onChange={(e) => onChange({ ...form, name: e.target.value })}
        placeholder="Task name"
        className="w-full rounded bg-zinc-900 px-3 py-2 text-sm text-zinc-100 border border-zinc-700 focus:outline-none focus:border-teal-500 placeholder:text-zinc-600"
      />
      <div className="flex gap-2">
        <select
          value={form.category_id}
          onChange={(e) => onChange({ ...form, category_id: e.target.value })}
          className="flex-1 rounded bg-zinc-900 px-3 py-2 text-sm text-zinc-300 border border-zinc-700 focus:outline-none focus:border-teal-500"
        >
          <option value="">Category…</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={form.rate_id}
          onChange={(e) => onChange({ ...form, rate_id: e.target.value })}
          className="flex-1 rounded bg-zinc-900 px-3 py-2 text-sm text-zinc-300 border border-zinc-700 focus:outline-none focus:border-teal-500"
        >
          <option value="">Rate…</option>
          {rates?.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
          <input
            type="checkbox"
            checked={form.per_song}
            onChange={(e) => onChange({ ...form, per_song: e.target.checked })}
            className="accent-teal-500"
          />
          Per song
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
          <input
            type="checkbox"
            checked={form.required}
            onChange={(e) => onChange({ ...form, required: e.target.checked })}
            className="accent-teal-500"
          />
          Required
        </label>
      </div>
      <textarea
        value={form.description}
        onChange={(e) => onChange({ ...form, description: e.target.value })}
        rows={2}
        placeholder="Description (optional)"
        className="w-full rounded bg-zinc-900 px-3 py-2 text-sm text-zinc-100 border border-zinc-700 focus:outline-none focus:border-teal-500 resize-none placeholder:text-zinc-600"
      />
    </div>
  );
}

export default function TasksPage() {
  const ds = useDb();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<TaskForm>(EMPTY_FORM);
  const [addForm, setAddForm] = useState<TaskForm>(EMPTY_FORM);
  const [showAdd, setShowAdd] = useState(false);

  const { data: tasks } = useQuery<Task[]>({
    queryKey: ["tasks", "full"],
    queryFn: () =>
      ds.query(
        `SELECT t.id, t.name, t.category_id, c.name as category_name,
                t.rate_id, r.name as rate_name, t.per_song, t.required, t.description
         FROM tasks t
         JOIN categories c ON c.id = t.category_id
         LEFT JOIN rates r ON r.id = t.rate_id
         ORDER BY c.sort_order ASC, t.id ASC`
      ),
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => ds.query("SELECT id, name FROM categories ORDER BY sort_order ASC"),
  });

  const { data: rates } = useQuery<Rate[]>({
    queryKey: ["rates"],
    queryFn: () => ds.query("SELECT id, name FROM rates ORDER BY id ASC"),
  });

  const { mutate: addTask } = useMutation({
    mutationFn: (f: TaskForm) =>
      ds.query(
        "INSERT INTO tasks (name, category_id, rate_id, per_song, required, description) VALUES (?, ?, ?, ?, ?, ?)",
        [f.name, Number(f.category_id), f.rate_id ? Number(f.rate_id) : null, f.per_song ? 1 : 0, f.required ? 1 : 0, f.description || null]
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setAddForm(EMPTY_FORM);
      setShowAdd(false);
    },
  });

  const { mutate: updateTask } = useMutation({
    mutationFn: ({ id, f }: { id: number; f: TaskForm }) =>
      ds.query(
        "UPDATE tasks SET name=?, category_id=?, rate_id=?, per_song=?, required=?, description=? WHERE id=?",
        [f.name, Number(f.category_id), f.rate_id ? Number(f.rate_id) : null, f.per_song ? 1 : 0, f.required ? 1 : 0, f.description || null, id]
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setEditingId(null);
    },
  });

  const { mutate: deleteTask } = useMutation({
    mutationFn: async (id: number) => {
      await ds.query("DELETE FROM session_tasks WHERE task_id = ?", [id]);
      await ds.query("DELETE FROM song_tasks WHERE task_id = ?", [id]);
      await ds.query("DELETE FROM tasks WHERE id = ?", [id]);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const groupedCategories: Category[] = tasks
    ? Array.from(
        new Map(tasks.map((t) => [t.category_id, { id: t.category_id, name: t.category_name }])).values()
      )
    : [];

  return (
    <div className="flex flex-col min-h-screen">
      <Nav />
      <main className="flex-1 p-6 max-w-2xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Tasks</h1>
          <button
            onClick={() => { setShowAdd((v) => !v); setAddForm(EMPTY_FORM); }}
            className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-teal-400 transition-colors"
          >
            + Add task
          </button>
        </div>

        {showAdd && (
          <div className="space-y-2">
            <TaskFormFields form={addForm} onChange={setAddForm} categories={categories} rates={rates} />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowAdd(false); setAddForm(EMPTY_FORM); }}
                className="rounded px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                onClick={() => { if (addForm.name.trim() && addForm.category_id) addTask(addForm); }}
                disabled={!addForm.name.trim() || !addForm.category_id}
                className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-teal-400 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        )}

        {groupedCategories.map((cat) => (
          <section key={cat.id}>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-teal-500">
              {cat.name}
            </h2>
            <div className="rounded-lg bg-zinc-900 divide-y divide-zinc-800">
              {tasks
                ?.filter((t) => t.category_id === cat.id)
                .map((t) => (
                  <div key={t.id}>
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-medium truncate">{t.name}</span>
                        {t.required === 1 && (
                          <span className="shrink-0 rounded bg-teal-500/20 px-1.5 py-0.5 text-xs font-semibold text-teal-400">
                            required
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-4">
                        <span className="text-xs text-zinc-500">
                          {t.per_song === 1 ? "Per song" : (t.rate_name ?? "—")}
                        </span>
                        <button
                          onClick={() => {
                            if (editingId === t.id) {
                              setEditingId(null);
                            } else {
                              setEditingId(t.id);
                              setEditForm({
                                name: t.name,
                                category_id: String(t.category_id),
                                rate_id: t.rate_id ? String(t.rate_id) : "",
                                per_song: t.per_song === 1,
                                required: t.required === 1,
                                description: t.description ?? "",
                              });
                            }
                          }}
                          className="text-xs text-zinc-500 hover:text-teal-400 transition-colors"
                        >
                          {editingId === t.id ? "close" : "edit"}
                        </button>
                        <button
                          onClick={() => { if (confirm(`Delete "${t.name}"?`)) deleteTask(t.id); }}
                          className="text-zinc-600 hover:text-red-400 transition-colors text-xl leading-none"
                          aria-label="Delete"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    {editingId === t.id && (
                      <div className="px-4 pb-4 space-y-2">
                        <TaskFormFields form={editForm} onChange={setEditForm} categories={categories} rates={rates} />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setEditingId(null)}
                            className="rounded px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-200"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => { if (editForm.name.trim() && editForm.category_id) updateTask({ id: t.id, f: editForm }); }}
                            disabled={!editForm.name.trim() || !editForm.category_id}
                            className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-teal-400 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
