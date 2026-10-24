import { createConnection } from 'mysql2/promise';
import { DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from './snake-naming.strategy';

type Env = Record<string, string | undefined>;

export function typeOrmOptions(env: Env): DataSourceOptions {
  return {
    type: 'mysql',
    host: env.DB_HOST ?? '127.0.0.1',
    port: Number(env.DB_PORT ?? 3306),
    username: env.DB_USER ?? 'root',
    password: env.DB_PASSWORD ?? '',
    database: env.DB_NAME ?? 'sst_prevencion',
    charset: 'utf8mb4',
    timezone: 'Z',
    namingStrategy: new SnakeNamingStrategy(),
    synchronize: env.DB_SYNC === 'true',
  };
}

/** En local crea la base de datos si aún no existe (TypeORM no lo hace). */
export async function ensureDatabase(env: Env) {
  const o = typeOrmOptions(env) as {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
  };
  const conn = await createConnection({
    host: o.host,
    port: o.port,
    user: o.username,
    password: o.password,
  });
  try {
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${o.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
  } finally {
    await conn.end();
  }
}
