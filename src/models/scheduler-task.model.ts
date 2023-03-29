import { AxiosResponse } from "axios"
import { Expose } from "class-transformer"
import { EBlockChain, ReduceOperator, ValidateRule } from "src/configs/consts"

export class ReduceMapField {
  @Expose()
  operator: ReduceOperator

  @Expose()
  field: string
}

export class TaskValidationRule {
  @Expose()
  rules: ValidateRule[]

  @Expose()
  mapFields: Map<string, ReduceMapField>

  @Expose()
  mapShareFields: Map<string, ReduceMapField>

  @Expose()
  successPercent: number

  @Expose()
  maxBlockLate: number
}

export class TaskValidation {
  @Expose()
  each: TaskValidationRule

  @Expose()
  allSuccess: TaskValidationRule

  @Expose()
  allFail: TaskValidationRule
}

export class AxiosConfig {
  @Expose()
  timeout: number

  @Expose()
  url: string

  @Expose()
  method: string

  @Expose()
  attemptNumber: number

  @Expose()
  headers: any

  @Expose()
  body: any
}

export class TaskConfig {
  @Expose()
  datasource: string

  @Expose()
  blockchains: EBlockChain[]

  @Expose()
  axios: AxiosConfig

  @Expose()
  validates: TaskValidation[]
}

export class DatasourceContext {
  datasource: any
  responses: AxiosResponse[]
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
  name: string

  @Expose()
  cronTime: string

  @Expose()
  config: TaskConfig
}