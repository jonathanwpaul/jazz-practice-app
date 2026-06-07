"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { DataSource } from "typeorm";
import { Capacitor } from "@capacitor/core";
import { CapacitorSQLite, SQLiteConnection } from "@capacitor-community/sqlite";

const DbContext = createContext<DataSource | null>(null);

async function initWebStore(sqlite: SQLiteConnection) {
  if (typeof window === "undefined") return;
  const { defineCustomElements } = await import("jeep-sqlite/loader");
  await defineCustomElements(window);
  if (!document.querySelector("jeep-sqlite")) {
    const el = document.createElement("jeep-sqlite");
    document.body.appendChild(el);
  }
  await customElements.whenDefined("jeep-sqlite");
  await sqlite.initWebStore();
}

export function DbProvider({ children }: { children: React.ReactNode }) {
  const [dataSource, setDataSource] = useState<DataSource | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ds: DataSource | undefined;

    async function init() {
      const sqlite = new SQLiteConnection(CapacitorSQLite);
      if (Capacitor.getPlatform() === "web") {
        await initWebStore(sqlite);
      }
      const [{ createDataSource }, { seed }] = await Promise.all([
        import("./db/data-source"),
        import("./db/seed"),
      ]);
      ds = createDataSource(sqlite);
      await ds.initialize();
      await seed(ds);
      setDataSource(ds);
    }

    init().catch((err) => {
      console.error("DB init failed:", err);
      setError(String(err));
    });

    return () => {
      ds?.destroy().catch(console.error);
    };
  }, []);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8 text-red-600">
        <p>Database error: {error}</p>
      </div>
    );
  }

  if (!dataSource) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-400">Loading…</p>
      </div>
    );
  }

  return <DbContext.Provider value={dataSource}>{children}</DbContext.Provider>;
}

export function useDb(): DataSource {
  const ds = useContext(DbContext);
  if (!ds) throw new Error("useDb must be used within DbProvider");
  return ds;
}
