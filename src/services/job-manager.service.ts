import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SchedulerRegistry } from "@nestjs/schedule";
import { CronJob } from "cron";
import { BaseApi } from "src/apis/base.api";
import { configTasks, DatasourceType, EBlockChain, EGatewayStatus, ReduceOperator, REQUEST_SCHEME, ValidateRule } from "src/configs/consts";
import { ReduceMapField, SchedulerTask, TaskConfig, TaskValidation, TaskValidationRule } from "src/models/scheduler-task.model";
import { GatewayRepository } from "src/repository/gateway.repository";
import { NodeRepository } from "src/repository/node.repository";
import { DatasourceContext } from "../models/scheduler-task.model";
import { TemplateService } from "./template.service";
const _ = require("lodash");

@Injectable()
export class JobManagerService implements OnModuleInit {
    private readonly logger = new Logger(JobManagerService.name);
    private taskConfigs: SchedulerTask[]
    constructor(
        private readonly configService: ConfigService,
        private readonly templateService: TemplateService,
        private readonly schedulerRegistry: SchedulerRegistry,
        private readonly gatewayRepository: GatewayRepository,
        private readonly nodeRepository: NodeRepository,
        private readonly baseApi: BaseApi
    ) { }

    onModuleInit() {
        this.taskConfigs = this.configService.get<SchedulerTask[]>(configTasks)
        this.taskConfigs.forEach((taskConfig) => {
            this.logger.log("Create cron job " + taskConfig.name)
            const engine = new JobEngine(
                this.logger,
                taskConfig.config,
                this.templateService,
                this.gatewayRepository,
                this.nodeRepository,
                this.baseApi)
            const cronJob = new CronJob(
                taskConfig.cronTime,
                () => {
                    this.logger.debug(`Running job ${taskConfig.name}`)
                    engine.handleCronJob()
                },
                null,
                true,
                "UTC",
                taskConfig.config,
                true
            )
            this.schedulerRegistry.addCronJob(
                taskConfig.name,
                cronJob
            )
        })
    }

}

export class JobEngine {
    private allContexts: DatasourceContext[]
    private jobContext = {}
    constructor(
        private readonly logger: Logger,
        private readonly config: TaskConfig,
        private readonly templateService: TemplateService,
        private readonly gatewayRepository: GatewayRepository,
        private readonly nodeRepository: NodeRepository,
        private readonly baseApi: BaseApi
    ) { }

    async getDatasource(config: TaskConfig) {
        let datasources = []
        switch (config.datasource) {
            case DatasourceType.StakedGateway:
                datasources = await this.gatewayRepository.getAllStaked();
                break
            case DatasourceType.StakedNode:
                datasources = await this.nodeRepository.getAllStakedOfBlockchains(config.blockchains);
                break
            default:
                this.logger.warn(`Datasource ${config.datasource} is not supported!`)
                break
        }
        return datasources;
    }

    async handleCronJob(datasources: any[] = []) {
        if (datasources.length == 0) {
            datasources = await this.getDatasource(this.config);
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
                case ValidateRule.Axios:
                    for (let i = 0; i < this.config.axios.attemptNumber; i++) {
                        const res = await this.baseApi.doHttpRequest({
                            ...this.config.axios,
                            url: this.templateService.bindTemplate(this.config.axios.url, {
                                scheme: REQUEST_SCHEME,
                                ...context.datasource
                            }),
                            headers: Object.keys(this.config.axios.headers || {}).reduce((acc, header) => {
                                acc[header] = this.templateService.bindTemplate(this.config.axios.headers[header], {
                                    ...context.datasource
                                })
                                return acc
                            }, {})
                        })
                        context.responses.push(res);
                    }
                    break
                case ValidateRule.AxiosSuccess:
                    const successNumber = context.responses.filter((res) => [200, 201].includes(res.status)).length
                    if (((successNumber / context.responses.length) * 100) < validationRule.successPercent) {
                        context.success = false
                    }
                    break
                case ValidateRule.MapResponseField:
                    Object.keys(validationRule.mapFields).forEach((mapField) => {
                        const rule = validationRule.mapFields[mapField] as ReduceMapField
                        let val = _.get(context.responses[0].data, rule.field)
                        switch(rule.operator) {
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
                    this.logger.debug(`Change status of datasource ${this.config.datasource}, id=${context.datasource.id} to ${EGatewayStatus.INVESTIGATE}`)
                    switch (this.config.datasource) {
                        case DatasourceType.StakedGateway:
                            await this.gatewayRepository.setStatus(context.datasource.id, EGatewayStatus.INVESTIGATE)
                            break
                        case DatasourceType.StakedNode:
                            await this.nodeRepository.setStatus(context.datasource.id, EGatewayStatus.INVESTIGATE)
                            break
                    }
                    break
            }
        } catch (err) {
            this.logger.error(`${JSON.stringify(context.datasource)} ${err.message} ${err.stack}`)
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
            for (const rule of taskValidation.each.rules) {
                const ctxs = contexts.filter((context) => context.success)
                if (ctxs.length == 0) {
                    break
                }
                await Promise.all(ctxs.map(async (context) => {
                    await this.validateEach(taskValidation.each, rule, context);
                }))
            }
        }
        if (taskValidation.allFail) {
            for (const rule of taskValidation.allFail.rules) {
                const ctxs = contexts.filter((context) => !context.success)
                if (ctxs.length == 0) {
                    break
                }
                await Promise.all(ctxs.map(async (context) => {
                    await this.validateEach(taskValidation.allFail, rule, context);
                }))
            }
        }
        if (taskValidation.allSuccess) {
            for (const rule of taskValidation.allSuccess.rules) {
                const ctxs = contexts.filter((context) => context.success)
                switch (rule) {
                    case ValidateRule.Reduce:
                        Object.keys(taskValidation.allSuccess.mapShareFields).forEach((targetField) => {
                            const rule = taskValidation.allSuccess.mapShareFields[targetField]
                            this.reduce(targetField, rule, ctxs)
                        })
                        this.logger.debug(JSON.stringify(this.jobContext))
                        break
                    default:
                        if (ctxs.length == 0) {
                            break
                        }
                        await Promise.all(ctxs.map(async (context) => {
                            await this.validateEach(taskValidation.allSuccess, rule, context);
                        }))
                        break
                }
            }
        }

        return contexts.filter((ctx) => ctx.success);
    }
}