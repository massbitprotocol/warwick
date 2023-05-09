import { InjectQueue } from "@nestjs/bull";
import { ConfigService } from "@nestjs/config";
import { AxiosError, AxiosResponse } from "axios";
import { Queue } from "bull";
import { instanceToPlain, plainToInstance } from "class-transformer";
import { BaseApi } from "src/apis/base.api";
import { ContextLogger } from "src/common/context.logger";
import { configTasks, DatasourceType, EBlockChain, EGatewayStatus, ENodeStatus, EOperateStatus, MONITOR_TASKS_EVENT_QUEUE, ReduceOperator, REQUEST_SCHEME, ValidateRule } from "src/configs/consts";
import { ReduceMapField, TaskValidation, TaskValidationRule } from "src/models/rule.model";
import { ApplicationTask, NetWorkConfig, SchedulerTask } from "src/models/scheduler-task.model";
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
  private config: TaskConfig
  private shareConfigs: Map<string, TaskConfig>
  private blockchainConfigs: Map<string, NetWorkConfig>
  private name: string
  private blockchain: EBlockChain
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
    this.blockchainConfigs = appTasks.blockchainConfigs
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
      let blocknet = context.datasource?.blockchain + "-" + context.datasource?.network;
      switch (rule) {
        case ValidateRule.Http:
          // get http config from name
          const http = this.config.http.find((i) => i.name == validationRule.http);
          if (!http) throw new Error(`not found http rule ${validationRule.http}`)
          for (let i = 0; i < http.attemptNumber; i++) {
            // TODO: handle fail request with status != 2xx
            const res = await this.baseApi.doHttpRequest({
              ...http,
              url: this.templateService.bindTemplate(http.url, {
                scheme: REQUEST_SCHEME,
                ...context.datasource
              }),
              headers: Object.keys(http.headers || {}).reduce((acc, header) => {
                acc[header] = this.templateService.bindTemplate(http.headers[header], context.datasource)
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
          validationRule.mapFields.forEach((rule: ReduceMapField) => {
            let val = _.get((context.responses[rule.from || 0] as AxiosResponse).data, rule.field)
            switch (rule.operator) {
              case ReduceOperator.ParseHex:
                val = parseInt(val, 16)
                break
            }
            let fieldName = this.templateService.bindTemplate(rule.name, {
              ...context.datasource
            })
            context.context[fieldName] = val;
          })
          break
        case ValidateRule.CheckChainId:
          let chainId = this.blockchainConfigs.get(blocknet)?.chainId
          if (context.context["chainId"] != chainId) {
            this.logger.warn(`Chain id of node ${context.datasource.id} is not ${chainId} (${context.context["chainId"]} instead)`)
            context.success = false
          }
          break
        case ValidateRule.CheckBlockLate:
          if (this.blockchainConfigs.has(blocknet)) {
            let blockchainConfig = this.blockchainConfigs.get(blocknet)
            let maxBlockField = this.templateService.bindTemplate("maxBlock-{{blockchain}}-{{network}}", context.datasource),
            blockNumberField = this.templateService.bindTemplate("blockNumber-{{blockchain}}-{{network}}", context.datasource)
            let blockLate = this.jobContext[maxBlockField] - context.context[blockNumberField]
            if (blockLate > blockchainConfig.maxBlockLate) {
              this.logger.warn(`Block of node ${context.datasource.id} was late ${blockLate} block(s): ${context.context[blockNumberField]} < ${this.jobContext[maxBlockField]}`)
              context.success = false
            }
          } else {
            this.logger.warn(`[${context.datasource.id}] Blockchain ${blocknet} is not supported`);
            context.success = false
          }
          break
        case ValidateRule.ChangeStatusInvestigate:
          if (!context.datasource.ignore) {
            this.logger.log(`Change status of datasource ${this.config.datasource}, id=${context.datasource.id} to ${EOperateStatus.INVESTIGATE}`)
            switch (this.config.datasource) {
              case DatasourceType.RunningGateway:
              case DatasourceType.InvestigateGateway:
                await this.gatewayRepository.setStatus(context.datasource.id, EGatewayStatus.UNHEALTHY, EOperateStatus.INVESTIGATE, this.templateService.bindTemplate(validationRule.reason, context), this.name)
                break
              case DatasourceType.RunningNode:
              case DatasourceType.InvestigateNode:
                await this.nodeRepository.setStatus(context.datasource.id, ENodeStatus.UNHEALTHY, EOperateStatus.INVESTIGATE, this.templateService.bindTemplate(validationRule.reason, context), this.name)
                break
              default: throw new Error(`Not support datasource ${this.config.datasource} on rule ${ValidateRule.ChangeStatusInvestigate}`)
            }
          }
          break
        case ValidateRule.ChangeStatusReported:
          if (!context.datasource.ignore) {
            this.logger.log(`Change status of datasource ${this.config.datasource}, id=${context.datasource.id} to ${EOperateStatus.REPORTED}`)
            switch (this.config.datasource) {
              case DatasourceType.RunningGateway:
              case DatasourceType.InvestigateGateway:
                await this.gatewayRepository.setStatus(context.datasource.id, EGatewayStatus.UNHEALTHY, EOperateStatus.REPORTED, this.templateService.bindTemplate(validationRule.reason, context), this.name)
                break
              case DatasourceType.RunningNode:
              case DatasourceType.InvestigateNode:
                await this.nodeRepository.setStatus(context.datasource.id, ENodeStatus.UNHEALTHY, EOperateStatus.REPORTED, this.templateService.bindTemplate(validationRule.reason, context), this.name)
                break
              default: throw new Error(`Not support datasource ${this.config.datasource} on rule ${ValidateRule.ChangeStatusReported}`)
            }
          }
          break
        case ValidateRule.ChangeStatusRunning:
          if (!context.datasource.ignore) {
            this.logger.log(`Change status of datasource ${this.config.datasource}, id=${context.datasource.id} to ${EOperateStatus.RUNNING}`)
            switch (this.config.datasource) {
              case DatasourceType.RunningGateway:
              case DatasourceType.InvestigateGateway:
                await this.gatewayRepository.setStatus(context.datasource.id, EGatewayStatus.STAKED, EOperateStatus.RUNNING, this.templateService.bindTemplate(validationRule.reason, context), this.name)
                break
              case DatasourceType.RunningNode:
              case DatasourceType.InvestigateNode:
                await this.nodeRepository.setStatus(context.datasource.id, ENodeStatus.STAKED, EOperateStatus.RUNNING, this.templateService.bindTemplate(validationRule.reason, context), this.name)
                break
              default: throw new Error(`Not support datasource ${this.config.datasource} on rule ${ValidateRule.ChangeStatusRunning}`)
            }
          }
          break
      }
    } catch (err) {
      this.logger.error(err)
      context.success = false
    }
    return context;
  }

  async reduce(rule: ReduceMapField, contexts: DatasourceContext[]) {
    switch (rule.operator) {
      case ReduceOperator.Max:
        contexts.forEach((context) => {
          let targetFieldName = this.templateService.bindTemplate(rule.name, context.datasource),
          fieldName = this.templateService.bindTemplate(rule.field, context.datasource)
          let max = targetFieldName in this.jobContext ? this.jobContext[targetFieldName] : 0;
          let val = _.get(context.context, fieldName) != undefined ? _.get(context.context, fieldName) : 0
          if (val > max) {
            max = val;
          }
          this.jobContext[targetFieldName] = max;
        })
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
    newTaskConfig.blockchains = this.blockchain ? [this.blockchain] : []
    newTaskConfig.datasource = this.config.datasource;
    const newSchedulerTask = new SchedulerTask()
    const contextId = newContextId()
    newSchedulerTask.contextId = contextId
    newSchedulerTask.name = newTaskConfig.name + "-" + contextId
    newSchedulerTask.data = contexts.map((ctx) => ctx.datasource)
    newSchedulerTask.config = newTaskConfig;
    const job = await this.monitorEventQueue.add(instanceToPlain(newSchedulerTask), {
      removeOnComplete: true,
      removeOnFail: true,
      attempts: 1,
      delay: newSchedulerTask.config.timer * 1000
    })
    this.logger.log(`Schedule job ${job.id} running after ${newSchedulerTask.config.timer} second(s)`)
  }

  async removeFromScheduler(ctxs: DatasourceContext[]) {
    const delayedJobs = await this.monitorEventQueue.getJobs(["delayed"]);
    let targetDatasourceTypes = []
    switch(this.config.datasource) {
      case DatasourceType.InvestigateGateway:
      case DatasourceType.RunningGateway:
        targetDatasourceTypes = [DatasourceType.InvestigateGateway, DatasourceType.RunningGateway]
        break
      case DatasourceType.InvestigateNode:
      case DatasourceType.RunningNode:
        targetDatasourceTypes = [DatasourceType.InvestigateNode, DatasourceType.RunningNode]
        break
    }
    const excludeIds = ctxs.map((ctx) => ctx.datasource.id)
    const promises = delayedJobs.map((delayjob) => ({
      job: delayjob,
      taskDetail: plainToInstance(SchedulerTask, delayjob.data)
    }))
    .filter(({taskDetail}) => targetDatasourceTypes.includes(taskDetail.config.datasource) && (taskDetail.config.blockchains[0] || "") == this.blockchain)
    .map(async({job, taskDetail}) => {
      const data = taskDetail.data;
      const filterData = (data as Array<any>).filter((i) => !excludeIds.includes(i.id))
      if (filterData.length == 0) {
        this.logger.log(`Deleting job ${job.id} (${taskDetail.name})`)
        await job.remove()
      } else if (filterData.length != data.length) {
        taskDetail.data = filterData;
        this.logger.log(`Update datasource for job ${job.id} (${taskDetail.name})`)
        await job.update(instanceToPlain(taskDetail))
      }
    })
    await Promise.all(promises)
  }

  async scheduleIfNotExist(ctxs: DatasourceContext[], validationRule: TaskValidationRule) {
    const delayedJobs = await this.monitorEventQueue.getJobs(["delayed"]);
    const tasks = delayedJobs.map((delayjob) => plainToInstance(SchedulerTask, delayjob.data))
    const taskMap = tasks.filter((task) => task.config.name == validationRule.schedule.name).reduce((acc, val) => {
      (val.data as Array<any>).forEach((i) => {
        acc.set(val.config.name + "-" + i.id, true)
      })
      return acc
    }, new Map<string, boolean>())
    const missingContexts = ctxs.filter((context) => !taskMap.has(validationRule.schedule.name + "-" + context.datasource.id))
    if (missingContexts.length > 0) {
      this.logger.log(`Creating task ${validationRule.schedule.name} for ${missingContexts.length} datasource(s)`)
      await this.schedule(missingContexts, validationRule)
    }
  }

  async processingRules(contexts: DatasourceContext[], validationRule: TaskValidationRule, success: boolean) {
    for (const rule of validationRule.rules) {
      const ctxs = contexts.filter((context) => context.success == success)
      switch (rule) {
        case ValidateRule.Reduce:
          validationRule.mapShareFields.forEach((rule: ReduceMapField) => {
            this.reduce(rule, ctxs)
          })
          this.logger.debug(JSON.stringify(this.jobContext))
          break
        case ValidateRule.Schedule:
          if (ctxs.length == 0) break
          await this.schedule(ctxs, validationRule)
          break
        case ValidateRule.ScheduleIfNotExist:
          if (ctxs.length == 0) break
          await this.scheduleIfNotExist(ctxs, validationRule);
          break
        case ValidateRule.RemoveFromScheduler:
          if (ctxs.length == 0) break
          await this.removeFromScheduler(ctxs);
          break
        default:
          if (ctxs.length == 0) break
          await Promise.all(ctxs.map(async (context) => {
            await this.validateEach(validationRule, rule, context);
          }))
          break
      }
    }
  }
}