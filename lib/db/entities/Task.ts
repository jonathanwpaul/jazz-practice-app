import { EntitySchema } from "typeorm";

export interface Task {
  id: number;
  name: string;
  categoryId: number;
  rateId: number | null;
  perSong: boolean;
  required: boolean;
  description: string | null;
}

export const TaskSchema = new EntitySchema<Task>({
  name: "Task",
  tableName: "tasks",
  columns: {
    id: { type: Number, primary: true, generated: true },
    name: { type: String, nullable: false },
    categoryId: { type: Number, name: "category_id", nullable: false },
    rateId: { type: Number, name: "rate_id", nullable: true },
    perSong: { type: Boolean, name: "per_song", nullable: false, default: false },
    required: { type: Boolean, nullable: false, default: false },
    description: { type: String, nullable: true },
  },
});
