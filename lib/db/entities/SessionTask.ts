import { EntitySchema } from "typeorm";

export interface SessionTask {
  sessionId: number;
  taskId: number;
}

export const SessionTaskSchema = new EntitySchema<SessionTask>({
  name: "SessionTask",
  tableName: "session_tasks",
  columns: {
    sessionId: { type: Number, name: "session_id", primary: true, nullable: false },
    taskId: { type: Number, name: "task_id", primary: true, nullable: false },
  },
});
