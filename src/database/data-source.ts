// DataSource para la CLI de TypeORM (migraciones). La app usa TypeOrmModule en app.module.ts.
//   npm run migration:generate -- src/database/migrations/Inicial
//   npm run migration:run
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { typeOrmOptions } from './typeorm.config';

export default new DataSource({
  ...typeOrmOptions(process.env),
  synchronize: false,
  entities: [__dirname + '/../**/*.entity.{ts,js}'],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
});
