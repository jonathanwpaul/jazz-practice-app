"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDb } from "@/lib/db-provider";
import { Nav } from "@/components/Nav";

type SongStatus = "not_started" | "in_progress" | "maintenance" | "complete";

interface Song {
  id: number;
  name: string;
  status: SongStatus;
}

const STATUS_ORDER: SongStatus[] = ["in_progress", "maintenance", "not_started", "complete"];

const STATUS_LABELS: Record<SongStatus, string> = {
  in_progress: "In progress",
  maintenance: "Maintenance",
  not_started: "Not started",
  complete: "Complete",
};

const STATUS_COLORS: Record<SongStatus, string> = {
  in_progress: "text-teal-400",
  maintenance: "text-green-400",
  not_started: "text-zinc-500",
  complete: "text-zinc-600",
};

export default function SongsPage() {
  const ds = useDb();
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");
  const [newStatus, setNewStatus] = useState<SongStatus>("not_started");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const { data: songs } = useQuery<Song[]>({
    queryKey: ["songs", "list"],
    queryFn: () => ds.query("SELECT id, name, status FROM songs ORDER BY name ASC"),
  });

  const { mutate: addSong } = useMutation({
    mutationFn: ({ name, status }: { name: string; status: SongStatus }) =>
      ds.query("INSERT INTO songs (name, status) VALUES (?, ?)", [name, status]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["songs"] });
      setNewName("");
      setNewStatus("not_started");
    },
  });

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, status }: { id: number; status: SongStatus }) =>
      ds.query("UPDATE songs SET status = ? WHERE id = ?", [status, id]),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["songs"] }),
  });

  const { mutate: updateName } = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      ds.query("UPDATE songs SET name = ? WHERE id = ?", [name, id]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["songs"] });
      setEditingId(null);
    },
  });

  const { mutate: deleteSong } = useMutation({
    mutationFn: async (id: number) => {
      await ds.query("UPDATE sessions SET song_id = NULL WHERE song_id = ?", [id]);
      await ds.query("DELETE FROM song_tasks WHERE song_id = ?", [id]);
      await ds.query("DELETE FROM songs WHERE id = ?", [id]);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["songs"] }),
  });

  const grouped = STATUS_ORDER.map((status) => ({
    status,
    songs: songs?.filter((s) => s.status === status) ?? [],
  })).filter((g) => g.songs.length > 0);

  function commitEdit(song: Song) {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== song.name) updateName({ id: song.id, name: trimmed });
    else setEditingId(null);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Nav />
      <main className="flex-1 p-6 max-w-2xl mx-auto w-full space-y-6">
        <h1 className="text-xl font-semibold">Songs</h1>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const trimmed = newName.trim();
            if (trimmed) addSong({ name: trimmed, status: newStatus });
          }}
          className="flex gap-2"
        >
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New song name…"
            className="flex-1 rounded-lg bg-zinc-900 px-4 py-2 text-sm text-zinc-100 border border-zinc-800 focus:outline-none focus:border-teal-500 placeholder:text-zinc-600"
          />
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as SongStatus)}
            className="rounded-lg bg-zinc-900 px-3 py-2 text-sm text-zinc-300 border border-zinc-800 focus:outline-none focus:border-teal-500"
          >
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={!newName.trim()}
            className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-teal-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </form>

        {grouped.map(({ status, songs: group }) => (
          <section key={status}>
            <h2 className={`mb-2 text-xs font-semibold uppercase tracking-widest ${STATUS_COLORS[status]}`}>
              {STATUS_LABELS[status]}
            </h2>
            <div className="space-y-1">
              {group.map((song) => (
                <div
                  key={song.id}
                  className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-3"
                >
                  {editingId === song.id ? (
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => commitEdit(song)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitEdit(song);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="flex-1 rounded bg-zinc-800 px-2 py-1 text-sm text-zinc-100 border border-teal-500 focus:outline-none"
                    />
                  ) : (
                    <button
                      onClick={() => { setEditingId(song.id); setEditName(song.name); }}
                      className="flex-1 text-left text-sm font-medium hover:text-teal-400 transition-colors"
                    >
                      {song.name}
                    </button>
                  )}
                  <select
                    value={song.status}
                    onChange={(e) => updateStatus({ id: song.id, status: e.target.value as SongStatus })}
                    className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-300 border border-zinc-700 focus:outline-none focus:border-teal-500"
                  >
                    {STATUS_ORDER.map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => { if (confirm(`Delete "${song.name}"?`)) deleteSong(song.id); }}
                    className="text-zinc-600 hover:text-red-400 transition-colors text-xl leading-none"
                    aria-label="Delete"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}

        {(!songs || songs.length === 0) && (
          <p className="text-zinc-500 text-sm">No songs yet.</p>
        )}
      </main>
    </div>
  );
}
