
import * as dotenv from 'dotenv';
import { NamingStrategy } from 'src/common/naming.strategy';
import { DataSource } from 'typeorm';

dotenv.config({
  path: `./config/.env.local`,
});

export const connectionSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_MONITOR_HOST,
  port: parseInt(process.env.DB_MONITOR_PORT, 10),
  username: process.env.DB_MONITOR_USERNAME,
  password: process.env.DB_MONITOR_PASSWORD,
  database: process.env.DB_MONITOR_DATABASE,
  entities: [`${__dirname}/**/*.mentity{.ts,.js}`],
  namingStrategy: new NamingStrategy(),
  migrationsTableName: '__migrations',
  migrations: ['./migrations/**/*.ts'],
  synchronize: false,
});
