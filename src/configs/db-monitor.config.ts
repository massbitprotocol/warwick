import { registerAs } from '@nestjs/config';
import { NamingStrategy } from 'src/common/naming.strategy';
import { configDbMonitor } from './consts';

export default registerAs(configDbMonitor, () => ({
  type: 'postgres',
  host: process.env.DB_MONITOR_HOST,
  port: parseInt(process.env.DB_MONITOR_PORT, 10),
  username: process.env.DB_MONITOR_USERNAME,
  password: process.env.DB_MONITOR_PASSWORD,
  database: process.env.DB_MONITOR_DATABASE,
  timezone: 'Z',
  logging: process.env.DB_MONITOR_LOGGING === 'true',
  autoLoadEntities: true,
  keepConnectionAlive: true,
  entities: [`${__dirname}/**/*.mentity{.ts,.js}`],
  namingStrategy: new NamingStrategy(),
  synchronize: false
}));
