import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  turbopack: {
    resolveAlias: {
      "expo-sqlite": "./lib/empty-module.js",
      "mysql": "./lib/empty-module.js",
      "mysql2": "./lib/empty-module.js",
      "mongodb": "./lib/empty-module.js",
      "oracledb": "./lib/empty-module.js",
      "mssql": "./lib/empty-module.js",
      "tedious": "./lib/empty-module.js",
      "pg": "./lib/empty-module.js",
      "pg-native": "./lib/empty-module.js",
      "react-native": "./lib/empty-module.js",
      "react-native-sqlite-storage": "./lib/empty-module.js",
      "better-sqlite3": "./lib/empty-module.js",
      "sqlite3": "./lib/empty-module.js",
      "nativescript": "./lib/empty-module.js",
      "@sap/hana-client": "./lib/empty-module.js",
      "hdb-pool": "./lib/empty-module.js",
      "@google-cloud/spanner": "./lib/empty-module.js",
      "typeorm-aurora-data-api-driver": "./lib/empty-module.js",
    },
  },
  webpack: (config) => {
    const webpack = require("webpack");
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "expo-sqlite": false,
      "mysql": false,
      "mysql2": false,
      "mongodb": false,
      "oracledb": false,
      "mssql": false,
      "tedious": false,
      "pg": false,
      "pg-native": false,
      "react-native": false,
      "react-native-sqlite-storage": false,
      "better-sqlite3": false,
      "sqlite3": false,
      "nativescript": false,
      "@sap/hana-client": false,
      "hdb-pool": false,
      "@google-cloud/spanner": false,
      "typeorm-aurora-data-api-driver": false,
    };
    config.plugins = [
      ...config.plugins,
      new webpack.NormalModuleReplacementPlugin(
        /^node:/,
        require.resolve("./lib/empty-module.js")
      ),
    ];
    return config;
  },
};

export default nextConfig;
