"use client";

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
  in_progress: "text-amber-400",
  maintenance: "text-green-400",
  not_started: "text-zinc-500",
  complete: "text-zinc-600",
};

export default function SongsPage() {
  const ds = useDb();
  const queryClient = useQueryClient();

  const { data: songs } = useQuery<Song[]>({
    queryKey: ["songs", "list"],
    queryFn: () => ds.query("SELECT id, name, status FROM songs ORDER BY name ASC"),
  });

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, status }: { id: number; status: SongStatus }) =>
      ds.query("UPDATE songs SET status = ? WHERE id = ?", [status, id]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["songs"] });
    },
  });

  const grouped = STATUS_ORDER.map((status) => ({
    status,
    songs: songs?.filter((s) => s.status === status) ?? [],
  })).filter((g) => g.songs.length > 0);

  return (
    <div className="flex flex-col min-h-screen">
      <Nav />
      <main className="flex-1 p-6 max-w-2xl mx-auto w-full space-y-6">
        <h1 className="text-xl font-semibold">Songs</h1>

        {grouped.map(({ status, songs: group }) => (
          <section key={status}>
            <h2
              className={`mb-2 text-xs font-semibold uppercase tracking-widest ${STATUS_COLORS[status]}`}
            >
              {STATUS_LABELS[status]}
            </h2>
            <div className="space-y-1">
              {group.map((song) => (
                <div
                  key={song.id}
                  className="flex items-center justify-between rounded-lg bg-zinc-900 px-4 py-3"
                >
                  <span className="text-sm font-medium">{song.name}</span>
                  <select
                    value={song.status}
                    onChange={(e) =>
                      updateStatus({ id: song.id, status: e.target.value as SongStatus })
                    }
                    className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-300 border border-zinc-700 focus:outline-none focus:border-amber-500"
                  >
                    {STATUS_ORDER.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </section>
        ))}

        {(!songs || songs.length === 0) && (
          <p className="text-zinc-500 text-sm">No songs found.</p>
        )}
      </main>
    </div>
  );
}
