import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ModuleRef } from "@nestjs/core";
import { SchedulerRegistry } from "@nestjs/schedule";
import { CronJob } from "cron";
import { configTasks } from "src/configs/consts";
import { ApplicationTask } from "src/models/scheduler-task.model";
import { JobEngineService } from "./job-engine.service";
const _ = require("lodash");

@Injectable()
export class JobManagerService implements OnModuleInit {
  private readonly logger = new Logger(JobManagerService.name);
  private appTasks: ApplicationTask
  constructor(
    private readonly configService: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly moduleRef: ModuleRef
  ) { }

  onModuleInit() {
    this.appTasks = this.configService.get<ApplicationTask>(configTasks)
    this.appTasks.tasks.forEach((task) => {
      (task.config.blockchains || [""]).forEach(async(blockchain) => {
        const taskName = [task.name, blockchain].filter((str) => str).join("-")
        this.logger.log("Create cron job " + taskName);
        const engine = await this.moduleRef.create(JobEngineService);
        engine.setData(taskName, blockchain, task.config)
        const cronJob = new CronJob(
          task.cronTime,
          async () => {
            engine.logger.debug(`Running`)
            try {
              await engine.handleCronJob()
            } catch (err) {
              engine.logger.error(err + err.stack)
            }
          },
          null,
          true,
          "UTC",
          task.config,
          true
        )
        this.schedulerRegistry.addCronJob(
          taskName,
          cronJob
        )
      })
    })
  }

}
