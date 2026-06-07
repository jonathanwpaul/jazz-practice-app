import type { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration0011749254400000 implements MigrationInterface {
  name = "InitialMigration0011749254400000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        monthly_target INTEGER NOT NULL,
        sort_order INTEGER NOT NULL
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS rates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        value REAL NOT NULL
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category_id INTEGER NOT NULL REFERENCES categories(id),
        rate_id INTEGER REFERENCES rates(id),
        per_song INTEGER NOT NULL DEFAULT 0,
        required INTEGER NOT NULL DEFAULT 0,
        description TEXT
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS songs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'not_started'
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        song_id INTEGER REFERENCES songs(id),
        notes TEXT
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS session_tasks (
        session_id INTEGER NOT NULL REFERENCES sessions(id),
        task_id INTEGER NOT NULL REFERENCES tasks(id),
        PRIMARY KEY (session_id, task_id)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS song_tasks (
        song_id INTEGER NOT NULL REFERENCES songs(id),
        task_id INTEGER NOT NULL REFERENCES tasks(id),
        completed_at TEXT NOT NULL,
        PRIMARY KEY (song_id, task_id)
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS song_tasks`);
    await queryRunner.query(`DROP TABLE IF EXISTS session_tasks`);
    await queryRunner.query(`DROP TABLE IF EXISTS sessions`);
    await queryRunner.query(`DROP TABLE IF EXISTS songs`);
    await queryRunner.query(`DROP TABLE IF EXISTS tasks`);
    await queryRunner.query(`DROP TABLE IF EXISTS rates`);
    await queryRunner.query(`DROP TABLE IF EXISTS categories`);
  }
}
