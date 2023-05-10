import { Column, Entity } from "typeorm";
import BaseTable from "./base-table";

@Entity({ name: "resource_logs" })
export class ResourceLog extends BaseTable {
  @Column('varchar')
  resourceType: string

  @Column('varchar')
  resourceId: string

  @Column('varchar')
  oldStatus: string

  @Column('varchar')
  newStatus: string

  @Column('varchar')
  oldOperateStatus: string

  @Column('varchar')
  newOperateStatus: string

  @Column('varchar')
  reason: string

  @Column('varchar')
  jobId: string
}