import { InjectQueue } from "@nestjs/bull";
import { OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AxiosError, AxiosResponse } from "axios";
import { Queue } from "bull";
import { instanceToPlain, plainToInstance } from "class-transformer";
import { BaseApi } from "src/apis/base.api";
import { ContextLogger } from "src/common/context.logger";
import { configTasks, DatasourceType, EBlockChain, EGatewayStatus, ENodeStatus, EOperateStatus, MONITOR_TASKS_EVENT_QUEUE, ReduceOperator, REQUEST_SCHEME, ValidateRule } from "src/configs/consts";
import { compileConfig } from "src/configs/tasks.config";
import { ReduceMapField, TaskValidation, TaskValidationRule } from "src/models/rule.model";
import { ApplicationTask, SchedulerTask } from "src/models/scheduler-task.model";
import { TaskConfig } from "src/models/share-config.model";
import { GatewayRepository } from "src/repository/gateway.repository";
import { NodeRepository } from "src/repository/node.repository";
import { newContextId } from "src/utils/encrypt";
import { DatasourceContext } from "../models/scheduler-task.model";
import { TemplateService } from "./template.service";
const _ = require("lodash");

export class JobEngineService {
  private allContexts: DatasourceContext[]
  private jobContext = {}
  public config: TaskConfig
  public shareConfigs: Map<string, TaskConfig>
  public name: string
  public blockchain: EBlockChain
  public logger: ContextLogger
  constructor(
    private readonly configService: ConfigService,
    private readonly templateService: TemplateService,
    private readonly gatewayRepository: GatewayRepository,
    private readonly nodeRepository: NodeRepository,
    @InjectQueue(MONITOR_TASKS_EVENT_QUEUE)
    private readonly monitorEventQueue: Queue,
    private readonly baseApi: BaseApi
  ) {
    const appTasks = this.configService.get<ApplicationTask>(configTasks)
    this.shareConfigs = appTasks.shareConfigs
  }

  public setData(name: string, blockchain: EBlockChain, config: TaskConfig) {
    this.name = name
    this.blockchain = blockchain
    this.config = config
    this.logger = new ContextLogger(JobEngineService.name)
    this.logger.contextId = this.name
  }

  async getDatasource(datasource: DatasourceType): Promise<any[]> {
    let datasources = []
    switch (datasource) {
      case DatasourceType.RunningGateway:
        datasources = await this.gatewayRepository.findByStatus(EGatewayStatus.STAKED, EOperateStatus.RUNNING);
        break
      case DatasourceType.InvestigateGateway:
        datasources = await this.gatewayRepository.findByStatus(EGatewayStatus.UNHEALTHY, EOperateStatus.INVESTIGATE);
        break
      case DatasourceType.RunningNode:
        if (!this.blockchain) throw new Error("Blockchain is required")
        datasources = await this.nodeRepository.findByBlockchainAndStatus(this.blockchain, ENodeStatus.STAKED, EOperateStatus.RUNNING);
        break
      case DatasourceType.InvestigateNode:
        if (!this.blockchain) throw new Error("Blockchain is required")
        datasources = await this.nodeRepository.findByBlockchainAndStatus(this.blockchain, ENodeStatus.UNHEALTHY, EOperateStatus.INVESTIGATE);
        break
      default:
        this.logger.warn(`Datasource ${datasource} is not supported!`)
        break
    }
    return datasources;
  }

  async handleCronJob(datasources: any[] = []) {
    if (datasources.length == 0) {
      datasources = await this.getDatasource(this.config.datasource);
      this.logger.debug(`Found ${datasources.length} datasource(s)!`)
    }
    this.allContexts = datasources.map((datasource) => new DatasourceContext(datasource));
    let ctxsTmp = this.allContexts;
    for (const validate of this.config.validates) {
      ctxsTmp = await this.validateAll(validate, ctxsTmp.filter((ctx) => ctx.success))
    }
  }

  async validateEach(
    validationRule: TaskValidationRule,
    rule: ValidateRule,
    context: DatasourceContext): Promise<DatasourceContext> {
    try {
      switch (rule) {
        case ValidateRule.Http:
          for (let i = 0; i < this.config.http.attemptNumber; i++) {
            // TODO: handle fail request with status != 2xx
            const res = await this.baseApi.doHttpRequest({
              ...this.config.http,
              url: this.templateService.bindTemplate(this.config.http.url, {
                scheme: REQUEST_SCHEME,
                ...context.datasource
              }),
              headers: Object.keys(this.config.http.headers || {}).reduce((acc, header) => {
                acc[header] = this.templateService.bindTemplate(this.config.http.headers[header], {
                  ...context.datasource
                })
                return acc
              }, {})
            })
            context.responses.push(res);
          }
          break
        case ValidateRule.HttpSuccess:
          const successNumber = context.responses.filter((res) => res.constructor.name !== AxiosError.name).length
          if (((successNumber / context.responses.length) * 100) < validationRule.successPercent) {
            context.success = false
          }
          break
        case ValidateRule.MapResponseField:
          Object.keys(validationRule.mapFields).forEach((mapField) => {
            const rule = validationRule.mapFields[mapField] as ReduceMapField
            let val = _.get((context.responses[0] as AxiosResponse).data, rule.field)
            switch (rule.operator) {
              case ReduceOperator.ParseHex:
                val = parseInt(val, 16)
                break
            }
            context.context[mapField] = val;
          })
          break
        case ValidateRule.CheckBlockLate:
          if ((context.context["blockNumber"] - this.jobContext["maxBlock"]) > validationRule.maxBlockLate) {
            this.logger.debug(`Block of node ${context.datasource.id} was late: ${context.context["blockNumber"]} < ${this.jobContext["maxBlock"]}`)
            context.success = false
          }
          break
        case ValidateRule.ChangeStatusInvestigate:
          this.logger.log(`Change status of datasource ${this.config.datasource}, id=${context.datasource.id} to ${EOperateStatus.INVESTIGATE}`)
          switch (this.config.datasource) {
            case DatasourceType.RunningGateway:
            case DatasourceType.InvestigateGateway:
              await this.gatewayRepository.setStatus(context.datasource.id, EGatewayStatus.UNHEALTHY, EOperateStatus.INVESTIGATE)
              break
            case DatasourceType.RunningNode:
            case DatasourceType.InvestigateNode:
              await this.nodeRepository.setStatus(context.datasource.id, ENodeStatus.UNHEALTHY, EOperateStatus.INVESTIGATE)
              break
            default: throw new Error(`Not support datasource ${this.config.datasource} on rule ${ValidateRule.ChangeStatusInvestigate}`)
          }
          break
        case ValidateRule.ChangeStatusReported:
          this.logger.log(`Change status of datasource ${this.config.datasource}, id=${context.datasource.id} to ${EOperateStatus.REPORTED}`)
          switch (this.config.datasource) {
            case DatasourceType.RunningGateway:
            case DatasourceType.InvestigateGateway:
              await this.gatewayRepository.setStatus(context.datasource.id, EGatewayStatus.UNHEALTHY, EOperateStatus.REPORTED)
              break
            case DatasourceType.RunningNode:
            case DatasourceType.InvestigateNode:
              await this.nodeRepository.setStatus(context.datasource.id, ENodeStatus.UNHEALTHY, EOperateStatus.REPORTED)
              break
            default: throw new Error(`Not support datasource ${this.config.datasource} on rule ${ValidateRule.ChangeStatusReported}`)
          }
          break
        case ValidateRule.ChangeStatusRunning:
          this.logger.log(`Change status of datasource ${this.config.datasource}, id=${context.datasource.id} to ${EOperateStatus.RUNNING}`)
          switch (this.config.datasource) {
            case DatasourceType.RunningGateway:
            case DatasourceType.InvestigateGateway:
              await this.gatewayRepository.setStatus(context.datasource.id, EGatewayStatus.STAKED, EOperateStatus.RUNNING)
              break
            case DatasourceType.RunningNode:
            case DatasourceType.InvestigateNode:
              await this.nodeRepository.setStatus(context.datasource.id, ENodeStatus.STAKED, EOperateStatus.RUNNING)
              break
            default: throw new Error(`Not support datasource ${this.config.datasource} on rule ${ValidateRule.ChangeStatusRunning}`)
          }
          break
      }
    } catch (err) {
      this.logger.error(err)
      context.success = false
    }
    return context;
  }

  async reduce(targetField: string, rule: ReduceMapField, contexts: DatasourceContext[]) {
    switch (rule.operator) {
      case ReduceOperator.Max:
        let max = 0;
        contexts.forEach((context) => {
          let val = _.get(context.context, rule.field)
          if (val > max) {
            max = val;
          }
        })
        this.jobContext[targetField] = max;
        break
    }
  }

  async validateAll(
    taskValidation: TaskValidation,
    contexts: DatasourceContext[]): Promise<DatasourceContext[]> {
    if (taskValidation.each) {
      await this.processingRules(contexts, taskValidation.each, true)
    }
    if (taskValidation.allFail) {
      await this.processingRules(contexts, taskValidation.allFail, false)
    }
    if (taskValidation.allSuccess) {
      await this.processingRules(contexts, taskValidation.allSuccess, true)
    }

    return contexts.filter((ctx) => ctx.success);
  }

  async schedule(contexts: DatasourceContext[], validationRule: TaskValidationRule) {
    const newTaskConfig = plainToInstance(TaskConfig, instanceToPlain(validationRule.schedule))
    if (this.blockchain) {
      newTaskConfig.blockchains = [this.blockchain]
    }
    newTaskConfig.datasource = this.config.datasource;
    const newSchedulerTask = new SchedulerTask()
    const contextId = newContextId()
    newSchedulerTask.contextId = contextId
    newSchedulerTask.name = newTaskConfig.name + "-" + contextId
    newSchedulerTask.data = contexts.map((ctx) => ctx.datasource)
    newSchedulerTask.config = newTaskConfig
    this.logger.log(`Schedule a job after ${newSchedulerTask.config.timer} second(s)`)
    await this.monitorEventQueue.add(instanceToPlain(newSchedulerTask), {
      removeOnComplete: true,
      removeOnFail: true,
      attempts: 1,
      delay: newSchedulerTask.config.timer * 1000
    })
  }

  async processingRules(contexts: DatasourceContext[], validationRule: TaskValidationRule, success: boolean) {
    for (const rule of validationRule.rules) {
      const ctxs = contexts.filter((context) => context.success == success)
      switch (rule) {
        case ValidateRule.Reduce:
          Object.keys(validationRule.mapShareFields).forEach((targetField) => {
            const rule = validationRule.mapShareFields[targetField]
            this.reduce(targetField, rule, ctxs)
          })
          this.logger.debug(JSON.stringify(this.jobContext))
          break
        case ValidateRule.Schedule:
          if (ctxs.length == 0) {
            break
          }
          await this.schedule(ctxs, validationRule)
          break
        case ValidateRule.ScheduleIfNotExist:
          const delayedJobs = await this.monitorEventQueue.getJobs(["delayed"]);
          const tasks = delayedJobs.map((delayjob) => plainToInstance(SchedulerTask, delayjob.data))
          const taskMap = tasks.filter((task) => task.config.name == validationRule.schedule.name).reduce((acc, val) => {
            (val.data as Array<any>).forEach((i) => {
              acc.set(val.config.name + "-" + i.id, true)
            })
            return acc
          }, new Map<string, boolean>())
          const missingContexts = contexts.filter((context) => !taskMap.has(validationRule.schedule.name + "-" + context.datasource.id))
          if (missingContexts.length > 0) {
            this.logger.log(`Creating task ${validationRule.schedule.name} for ${missingContexts.length} datasource(s)`)
            await this.schedule(missingContexts, validationRule)
          }
          break
        default:
          if (ctxs.length == 0) {
            break
          }
          await Promise.all(ctxs.map(async (context) => {
            await this.validateEach(validationRule, rule, context);
          }))
          break
      }
    }
  }
}