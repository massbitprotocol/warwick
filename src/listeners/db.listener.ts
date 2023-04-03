import { InjectQueue } from "@nestjs/bull/dist/decorators";
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config"
import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { Queue } from "bull";
import createSubscriber, { Subscriber } from "pg-listen"
import { configDb, MONITOR_TASKS_EVENT_QUEUE } from "src/configs/consts";

@Injectable()
export class DbListener implements OnModuleDestroy, OnModuleInit {
  private subscriber: Subscriber;
  private readonly logger = new Logger(DbListener.name);
  constructor(
    private readonly configService: ConfigService,
    @InjectQueue(MONITOR_TASKS_EVENT_QUEUE)
    private readonly dbEventQueue: Queue) {
  }

  onModuleInit() {
    const config: any = this.configService.get<TypeOrmModuleOptions>(configDb);
    this.subscriber = createSubscriber({
      connectionString: `postgres://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`
    })
    const channels = ["node-change", "gateway-change"]
    channels.forEach((channel) => {
      this.subscriber.listenTo(channel)
      this.subscriber.notifications.on(channel, (payload) => this.addQueue(channel, payload))
    })
    this.subscriber.connect().then(() => {
      this.logger.log("Connect Postgresql Subscriber success!")
    })
  }

  async addQueue(eventName: string, payload: any) {
    await this.dbEventQueue.add({
      ...payload,
      eventName: eventName
    }, {
      removeOnComplete: true,
      removeOnFail: true,
      attempts: 1,
    })
  }

  async onModuleDestroy() {
    this.logger.log("Closing subscriber...")
    await this.subscriber.close()
  }
}