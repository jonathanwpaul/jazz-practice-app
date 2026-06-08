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
  monthly_target: number;
  sort_order: number;
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

  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editTaskForm, setEditTaskForm] = useState<TaskForm>(EMPTY_FORM);
  const [addTaskForm, setAddTaskForm] = useState<TaskForm>(EMPTY_FORM);
  const [showAddTask, setShowAddTask] = useState(false);

  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatTarget, setEditCatTarget] = useState("");
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatTarget, setNewCatTarget] = useState("");

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
    queryFn: () =>
      ds.query("SELECT id, name, monthly_target, sort_order FROM categories ORDER BY sort_order ASC"),
  });

  const { data: rates } = useQuery<Rate[]>({
    queryKey: ["rates"],
    queryFn: () => ds.query("SELECT id, name FROM rates ORDER BY id ASC"),
  });

  // ── Category mutations ──────────────────────────────────────────────────────

  const { mutate: addCategory } = useMutation({
    mutationFn: ({ name, monthly_target }: { name: string; monthly_target: number }) => {
      const maxOrder = categories ? Math.max(0, ...categories.map((c) => c.sort_order)) : 0;
      return ds.query(
        "INSERT INTO categories (name, monthly_target, sort_order) VALUES (?, ?, ?)",
        [name, monthly_target, maxOrder + 1]
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setNewCatName("");
      setNewCatTarget("");
      setShowAddCat(false);
    },
  });

  const { mutate: updateCategory } = useMutation({
    mutationFn: ({ id, name, monthly_target }: { id: number; name: string; monthly_target: number }) =>
      ds.query("UPDATE categories SET name = ?, monthly_target = ? WHERE id = ?", [name, monthly_target, id]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setEditingCatId(null);
    },
  });

  const { mutate: deleteCategory } = useMutation({
    mutationFn: async (id: number) => {
      await ds.query(
        "DELETE FROM session_tasks WHERE task_id IN (SELECT id FROM tasks WHERE category_id = ?)",
        [id]
      );
      await ds.query(
        "DELETE FROM song_tasks WHERE task_id IN (SELECT id FROM tasks WHERE category_id = ?)",
        [id]
      );
      await ds.query("DELETE FROM tasks WHERE category_id = ?", [id]);
      await ds.query("DELETE FROM categories WHERE id = ?", [id]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  // ── Task mutations ──────────────────────────────────────────────────────────

  const { mutate: addTask } = useMutation({
    mutationFn: (f: TaskForm) =>
      ds.query(
        "INSERT INTO tasks (name, category_id, rate_id, per_song, required, description) VALUES (?, ?, ?, ?, ?, ?)",
        [f.name, Number(f.category_id), f.rate_id ? Number(f.rate_id) : null, f.per_song ? 1 : 0, f.required ? 1 : 0, f.description || null]
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setAddTaskForm(EMPTY_FORM);
      setShowAddTask(false);
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
      setEditingTaskId(null);
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

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function startEditCat(cat: Category) {
    setEditingCatId(cat.id);
    setEditCatName(cat.name);
    setEditCatTarget(String(cat.monthly_target));
  }

  function confirmDeleteCategory(cat: Category) {
    const taskCount = tasks?.filter((t) => t.category_id === cat.id).length ?? 0;
    const warning =
      taskCount > 0
        ? `Delete category "${cat.name}"?\n\nThis will also permanently delete all ${taskCount} task${taskCount !== 1 ? "s" : ""} within it.`
        : `Delete category "${cat.name}"?`;
    if (confirm(warning)) deleteCategory(cat.id);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Nav />
      <main className="flex-1 p-6 max-w-2xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-semibold">Tasks</h1>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowAddCat((v) => !v); setNewCatName(""); setNewCatTarget(""); }}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-300 hover:border-teal-500 hover:text-teal-400 transition-colors"
            >
              + Category
            </button>
            <button
              onClick={() => { setShowAddTask((v) => !v); setAddTaskForm(EMPTY_FORM); }}
              className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-teal-400 transition-colors"
            >
              + Task
            </button>
          </div>
        </div>

        {showAddCat && (
          <div className="rounded-lg bg-zinc-900 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">New category</p>
            <input
              autoFocus
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Category name"
              className="w-full rounded bg-zinc-800 px-3 py-2 text-sm text-zinc-100 border border-zinc-700 focus:outline-none focus:border-teal-500 placeholder:text-zinc-600"
            />
            <div className="flex items-center gap-3">
              <label className="text-xs text-zinc-500 shrink-0">Monthly target</label>
              <input
                type="number"
                min={1}
                value={newCatTarget}
                onChange={(e) => setNewCatTarget(e.target.value)}
                placeholder="e.g. 12"
                className="w-24 rounded bg-zinc-800 px-3 py-2 text-sm text-zinc-100 border border-zinc-700 focus:outline-none focus:border-teal-500 placeholder:text-zinc-600"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowAddCat(false)}
                className="rounded px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const name = newCatName.trim();
                  const target = parseInt(newCatTarget, 10);
                  if (name && target > 0) addCategory({ name, monthly_target: target });
                }}
                disabled={!newCatName.trim() || !parseInt(newCatTarget, 10)}
                className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-teal-400 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        )}

        {showAddTask && (
          <div className="space-y-2">
            <TaskFormFields form={addTaskForm} onChange={setAddTaskForm} categories={categories} rates={rates} />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowAddTask(false); setAddTaskForm(EMPTY_FORM); }}
                className="rounded px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                onClick={() => { if (addTaskForm.name.trim() && addTaskForm.category_id) addTask(addTaskForm); }}
                disabled={!addTaskForm.name.trim() || !addTaskForm.category_id}
                className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-teal-400 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        )}

        {categories?.map((cat) => (
          <section key={cat.id}>
            <div className="mb-2 flex items-center justify-between gap-2">
              {editingCatId === cat.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    autoFocus
                    value={editCatName}
                    onChange={(e) => setEditCatName(e.target.value)}
                    onKeyDown={(e) => e.key === "Escape" && setEditingCatId(null)}
                    className="flex-1 rounded bg-zinc-800 px-2 py-1 text-sm text-zinc-100 border border-teal-500 focus:outline-none"
                  />
                  <input
                    type="number"
                    min={1}
                    value={editCatTarget}
                    onChange={(e) => setEditCatTarget(e.target.value)}
                    className="w-16 rounded bg-zinc-800 px-2 py-1 text-sm text-zinc-100 border border-zinc-700 focus:outline-none focus:border-teal-500"
                    title="Monthly target"
                  />
                  <button
                    onClick={() => {
                      const name = editCatName.trim();
                      const target = parseInt(editCatTarget, 10);
                      if (name && target > 0) updateCategory({ id: cat.id, name, monthly_target: target });
                    }}
                    className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
                  >
                    save
                  </button>
                  <button
                    onClick={() => setEditingCatId(null)}
                    className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    cancel
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-teal-500">
                    {cat.name}
                    <span className="ml-2 normal-case font-normal text-zinc-600">
                      target {cat.monthly_target}/mo
                    </span>
                  </h2>
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => startEditCat(cat)}
                      className="text-xs text-zinc-600 hover:text-teal-400 transition-colors"
                    >
                      edit
                    </button>
                    <button
                      onClick={() => confirmDeleteCategory(cat)}
                      className="text-zinc-600 hover:text-red-400 transition-colors text-xl leading-none"
                      aria-label="Delete category"
                    >
                      ×
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="rounded-lg bg-zinc-900 divide-y divide-zinc-800">
              {tasks?.filter((t) => t.category_id === cat.id).length === 0 && (
                <p className="px-4 py-3 text-sm text-zinc-600">No tasks yet.</p>
              )}
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
                            if (editingTaskId === t.id) {
                              setEditingTaskId(null);
                            } else {
                              setEditingTaskId(t.id);
                              setEditTaskForm({
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
                          {editingTaskId === t.id ? "close" : "edit"}
                        </button>
                        <button
                          onClick={() => { if (confirm(`Delete "${t.name}"?`)) deleteTask(t.id); }}
                          className="text-zinc-600 hover:text-red-400 transition-colors text-xl leading-none"
                          aria-label="Delete task"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    {editingTaskId === t.id && (
                      <div className="px-4 pb-4 space-y-2">
                        <TaskFormFields form={editTaskForm} onChange={setEditTaskForm} categories={categories} rates={rates} />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setEditingTaskId(null)}
                            className="rounded px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-200"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => { if (editTaskForm.name.trim() && editTaskForm.category_id) updateTask({ id: t.id, f: editTaskForm }); }}
                            disabled={!editTaskForm.name.trim() || !editTaskForm.category_id}
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
