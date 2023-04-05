import { Expose } from "class-transformer"
import { DatasourceType, EBlockChain } from "src/configs/consts"
import { HttpConfig, TaskValidation } from "./rule.model"

export class TaskConfig {
    @Expose()
    name: string

    @Expose()
    useConfig: string[]

    @Expose()
    timer: number

    @Expose()
    datasource: DatasourceType

    @Expose()
    withDatasource: DatasourceType

    @Expose()
    blockchains: EBlockChain[]

    @Expose()
    http: HttpConfig

    @Expose()
    validates: TaskValidation[]
}