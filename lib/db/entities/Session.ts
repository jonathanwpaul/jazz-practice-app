import { EntitySchema } from "typeorm";

export interface Session {
  id: number;
  date: string;
  songId: number | null;
  notes: string | null;
}

export const SessionSchema = new EntitySchema<Session>({
  name: "Session",
  tableName: "sessions",
  columns: {
    id: { type: Number, primary: true, generated: true },
    date: { type: String, nullable: false },
    songId: { type: Number, name: "song_id", nullable: true },
    notes: { type: String, nullable: true },
  },
});
