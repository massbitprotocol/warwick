import { Expose } from "class-transformer"
import { ReduceOperator, ValidateRule } from "src/configs/consts"
import { TaskConfig } from "./share-config.model"

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