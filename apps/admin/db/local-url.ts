/** Where `pnpm dev` runs the local Postgres server (db/local.mts). */
export const LOCAL_DATABASE_PORT = 54329;
export const LOCAL_DATABASE_NAME = "admin";
export const LOCAL_DATABASE_URL = `postgres://postgres:postgres@127.0.0.1:${LOCAL_DATABASE_PORT}/${LOCAL_DATABASE_NAME}`;
