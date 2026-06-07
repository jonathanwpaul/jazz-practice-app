import { DataSource } from "typeorm";
import { CategorySchema } from "./entities/Category";
import { RateSchema } from "./entities/Rate";
import { TaskSchema } from "./entities/Task";
import { SongSchema } from "./entities/Song";
import { SessionSchema } from "./entities/Session";
import { SessionTaskSchema } from "./entities/SessionTask";
import { SongTaskSchema } from "./entities/SongTask";
import { InitialMigration0011749254400000 } from "./migrations/001_initial";

export function createDataSource(sqliteConnection: unknown): DataSource {
  return new DataSource({
    type: "capacitor",
    driver: sqliteConnection,
    database: "jazz_practice",
    entities: [
      CategorySchema,
      RateSchema,
      TaskSchema,
      SongSchema,
      SessionSchema,
      SessionTaskSchema,
      SongTaskSchema,
    ],
    migrations: [InitialMigration0011749254400000],
    synchronize: false,
    migrationsRun: true,
    logging: process.env.NODE_ENV === "development",
  });
}
