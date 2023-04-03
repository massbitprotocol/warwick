import { Process, Processor } from "@nestjs/bull";
import { Logger, OnModuleInit } from "@nestjs/common";
import { Job } from "bull";
import { configTasks, DatasourceType, EBlockChain, MONITOR_TASKS_EVENT_QUEUE } from "src/configs/consts";
import { DbListener } from "../listeners/db.listener";
import { plainToClass } from "class-transformer";
import { ApplicationTask, SchedulerTask } from "src/models/scheduler-task.model";
import { ModuleRef } from "@nestjs/core";
import { JobEngineService } from "src/services/job-engine.service";
import { compileConfig } from "src/configs/tasks.config";
import { ConfigService } from "@nestjs/config";
import { Gateway } from "src/entities/gateway.entity";

@Processor(MONITOR_TASKS_EVENT_QUEUE)
export class MonitorTaskConsumer implements OnModuleInit {
  private readonly logger = new Logger(DbListener.name);
  private appTasks: ApplicationTask

  constructor(
    private readonly configService: ConfigService,
    private readonly moduleRef: ModuleRef
  ) { }
  onModuleInit() {
    this.appTasks = this.configService.get<ApplicationTask>(configTasks)
  }

  @Process()
  async processQueue(job: Job) {
    let payload = job.data
    const schedulerTask = plainToClass(SchedulerTask, payload)
    schedulerTask.config = compileConfig(schedulerTask.config, this.appTasks.shareConfigs)
    switch (schedulerTask.config.datasource) {
      case DatasourceType.RunningGateway:
      case DatasourceType.InvestigateGateway:
        schedulerTask.data = (schedulerTask.data as Array<any>).map((item) => plainToClass(Gateway, item))
        break
      case DatasourceType.RunningNode:
      case DatasourceType.InvestigateNode:
        schedulerTask.data = (schedulerTask.data as Array<any>).map((item) => plainToClass(Node, item))
        break
    }
    const engine = await this.moduleRef.create(JobEngineService);
    const blockchain = (schedulerTask.config.blockchains ? schedulerTask.config.blockchains[0] : "") as EBlockChain;
    engine.setData(schedulerTask.name, blockchain, schedulerTask.config)
    engine.logger.debug(`Processing job ${job.id}: taskName=${schedulerTask.name}`);
    try {
      await engine.handleCronJob(schedulerTask.data);
    } catch (e) {
      engine.logger.error(`Job ${job.id} failed: ` + e.stack)
    }
  }
}