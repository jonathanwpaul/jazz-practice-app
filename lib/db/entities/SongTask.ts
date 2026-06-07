import { EntitySchema } from "typeorm";

export interface SongTask {
  songId: number;
  taskId: number;
  completedAt: string;
}

export const SongTaskSchema = new EntitySchema<SongTask>({
  name: "SongTask",
  tableName: "song_tasks",
  columns: {
    songId: { type: Number, name: "song_id", primary: true, nullable: false },
    taskId: { type: Number, name: "task_id", primary: true, nullable: false },
    completedAt: { type: String, name: "completed_at", nullable: false },
  },
});
