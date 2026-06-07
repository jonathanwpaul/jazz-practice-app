import { EntitySchema } from "typeorm";

export type SongStatus = "not_started" | "active" | "maintenance";

export interface Song {
  id: number;
  name: string;
  status: SongStatus;
}

export const SongSchema = new EntitySchema<Song>({
  name: "Song",
  tableName: "songs",
  columns: {
    id: { type: Number, primary: true, generated: true },
    name: { type: String, nullable: false },
    status: { type: String, nullable: false, default: "not_started" },
  },
});
