import { AxiosResponse } from "axios"
import { Expose } from "class-transformer"
import { TaskConfig } from "./share-config.model"
import { Mutex } from "async-mutex"

export class DatasourceContext {
  datasource: any
  responses: Array<AxiosResponse | Error>
  success: boolean
  context = {}

  constructor(datasource: any, responses: AxiosResponse[] = [], success: boolean = true) {
    this.datasource = datasource
    this.responses = responses
    this.success = success
  }
}

export class SchedulerTask {
  @Expose()
  contextId: string

  @Expose()
  name: string

  @Expose()
  cronTime: string

  @Expose()
  config: TaskConfig

  @Expose()
  data: any
}

export class NetWorkConfig {
  @Expose()
  chainId: number | string

  @Expose()
  maxBlockLate: number
}

export class ApplicationTask {
  constructor(
    public readonly shareConfigs: Map<string, TaskConfig>,
    public readonly blockchainConfigs: Map<string, NetWorkConfig>,
    public readonly tasks: SchedulerTask[]
  ) {}
}