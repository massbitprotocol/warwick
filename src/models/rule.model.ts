import { Expose } from "class-transformer"
import { ReduceOperator, ValidateRule } from "src/configs/consts"
import { TaskConfig } from "./share-config.model"

export class ReduceMapField {
    @Expose()
    name: string

    @Expose()
    from: number

    @Expose()
    operator: ReduceOperator

    @Expose()
    field: string
}

export class TaskValidationRule {
    @Expose()
    rules: ValidateRule[]

    @Expose()
    reason: string

    @Expose()
    reasonCode: string

    @Expose()
    http: string

    @Expose()
    mapFields: ReduceMapField[]

    @Expose()
    mapShareFields: ReduceMapField[]

    @Expose()
    successPercent: number

    @Expose()
    schedule: TaskConfig
}

export class TaskValidation {
    @Expose()
    each: TaskValidationRule

    @Expose()
    allSuccess: TaskValidationRule

    @Expose()
    allFail: TaskValidationRule
}

export class HttpConfig {
    @Expose()
    name: string

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