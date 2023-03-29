import { Expose } from "class-transformer"
import { EBoolean, EGatewayStatus } from "src/configs/consts"
import { Entity, Column } from "typeorm"
import BaseTable from "./base-table"

@Entity({ name: "mbr_gateways" })
export class Gateway extends BaseTable {
  @Column()
  @Expose({ name: "user_id" })
  userId: string

  @Column()
  @Expose({ toClassOnly: true })
  name: string

  @Column({ nullable: true })
  @Expose({ toClassOnly: true })
  description: string

  @Column()
  @Expose({ toClassOnly: true })
  blockchain: string

  @Column()
  @Expose({ toClassOnly: true })
  network: string

  @Column()
  @Expose()
  zone: string

  @Column()
  @Expose({ toClassOnly: true })
  status: EGatewayStatus

  @Column({ nullable: true })
  @Expose({ name: "operate_status", toClassOnly: true })
  operateStatus: string

  @Column()
  @Expose({ name: "app_key", toClassOnly: true })
  appKey: string

  @Column('smallint', { default: 0 })
  @Expose({ toClassOnly: true })
  deleted?: EBoolean;

  @Column()
  @Expose()
  ip: string

  @Column()
  quotaCommit: number

}