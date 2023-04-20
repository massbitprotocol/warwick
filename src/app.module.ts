import * as dotenv from 'dotenv';

dotenv.config({
  path: `./config/.env${process.env.NODE_ENV ? `.${process.env.NODE_ENV}` : ''}`,
});
console.log("Running for env " + process.env.NODE_ENV)
import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Gateway } from './entities/gateway.entity';
import { GatewayRepository } from './repository/gateway.repository';
import { FileService } from './services/file.service';
import { TemplateService } from './services/template.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { configDb, configRedis, MONITOR_TASKS_EVENT_QUEUE } from './configs/consts';
import configurations from './configs';
import { NodeRepository } from './repository/node.repository';
import { Node } from './entities/node.entity';
import { BullModule, BullRootModuleOptions } from '@nestjs/bull';
import { MonitorTaskConsumer } from './consumers/monitor.consumer';
import { BaseApi } from './apis/base.api';
import { AuthModule } from './auth/auth.module';
import { LoggerMiddleware } from './middlewares/logger.middleware';
import { AllExceptionsFilter } from './filters/exception.filter';
import { APP_FILTER } from '@nestjs/core';
import { HttpModule } from '@nestjs/axios';
import { JobManagerService } from './services/job-manager.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [`./config/.env${process.env.NODE_ENV ? `.${process.env.NODE_ENV}` : ''}`],
      load: configurations,
      isGlobal: true
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useFactory: async (configService: ConfigService) => {
        const config = configService.get<TypeOrmModuleOptions>(configDb);
        if (!config) {
          throw new Error('Cannot start app without database config');
        }
        return config;
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Gateway, Node]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const config = configService.get<BullRootModuleOptions>(configRedis);
        if (!config) {
          throw new Error('Cannot start app without database config');
        }
        return config;
      },
      inject: [ConfigService]
    }),
    BullModule.registerQueue({
      name: MONITOR_TASKS_EVENT_QUEUE,
    }),
    AuthModule,
    HttpModule,
  ],
  providers: [
    TemplateService,
    FileService,
    GatewayRepository,
    NodeRepository,
    MonitorTaskConsumer,
    BaseApi,
    JobManagerService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}