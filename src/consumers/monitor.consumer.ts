import { Process, Processor } from "@nestjs/bull";
import { Logger, OnModuleInit } from "@nestjs/common";
import { Job } from "bull";
import { configTasks, DatasourceType, EBlockChain, MONITOR_TASKS_EVENT_QUEUE } from "src/configs/consts";
import { plainToClass } from "class-transformer";
import { ApplicationTask, SchedulerTask } from "src/models/scheduler-task.model";
import { ModuleRef } from "@nestjs/core";
import { JobEngineService } from "src/services/job-engine.service";
import { compileConfig } from "src/configs/tasks.config";
import { ConfigService } from "@nestjs/config";
import { Gateway } from "src/entities/gateway.entity";
import { GatewayRepository } from "src/repository/gateway.repository";
import { NodeRepository } from "src/repository/node.repository";
import { Node } from "src/entities/node.entity";

@Processor(MONITOR_TASKS_EVENT_QUEUE)
export class MonitorTaskConsumer implements OnModuleInit {
  private readonly logger = new Logger(MonitorTaskConsumer.name);
  private appTasks: ApplicationTask

  constructor(
    private readonly gatewayRepository: GatewayRepository,
    private readonly nodeRepository: NodeRepository,
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
    const engine = await this.moduleRef.create(JobEngineService);
    const blockchain = (schedulerTask.config.blockchains ? schedulerTask.config.blockchains[0] : "") as EBlockChain;
    engine.setData(schedulerTask.name, blockchain, schedulerTask.config)
    engine.logger.debug(`Processing job ${job.id}: taskName=${schedulerTask.name}`);
    switch (schedulerTask.config.datasource) {
      case DatasourceType.RunningGateway:
      case DatasourceType.InvestigateGateway:
        const gateways = (schedulerTask.data as Array<any>).map((item) => plainToClass(Gateway, item))
        schedulerTask.data = await this.gatewayRepository.findAllIn(gateways.map((gw) => gw.id))
        break
      case DatasourceType.RunningNode:
      case DatasourceType.InvestigateNode:
        const nodes = (schedulerTask.data as Array<any>).map((item) => plainToClass(Node, item))
        schedulerTask.data = await this.nodeRepository.findAllIn(nodes.map((node) => node.id))
        break
      default:
        schedulerTask.data = []
        break
    }
    if (schedulerTask.config.withDatasource) {
      const additionalDatasources = await engine.getDatasource(schedulerTask.config.withDatasource);
      additionalDatasources.forEach((datasource) => {
        datasource.ignore = true
      })
      this.logger.debug(`Running with ${additionalDatasources.length} datasource(s)!`)
      schedulerTask.data = [...schedulerTask.data, ...additionalDatasources]
    }
    try {
      await engine.handleCronJob(schedulerTask.data);
    } catch (e) {
      engine.logger.error(`Job ${job.id} failed: ` + e.stack)
    }
  }
}