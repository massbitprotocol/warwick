import { Expose } from "class-transformer";
import { EBlockChain, EBoolean, EGatewayStatus, ENetWork, ENodeStatus, EOperateStatus, EZONE } from "src/configs/consts";
import { Entity, Column, Index } from "typeorm";
import BaseTable from "./base-table";

@Entity({ name: "mbr_nodes" })
export class Node extends BaseTable {
  @Column('uuid')
  @Index()
  @Expose({ name: "user_id" })
  userId!: string;

  @Column('varchar')
  name?: string;

  @Column('varchar', { nullable: true })
  description?: string;

  @Column('varchar')
  @Expose({ name: "datasource" })
  dataSource?: string;

  @Column('varchar', { nullable: true })
  @Expose({ name: "datasource_ws" })
  dataSourceWs?: string;

  @Column('varchar')
  @Expose()
  blockchain?: EBlockChain;

  @Column('varchar')
  @Expose()
  network?: ENetWork;

  @Column('float8', { nullable: true })
  apr?: number;

  @Column('varchar')
  @Expose()
  zone?: EZONE;

  @Column('varchar')
  @Index()
  status?: ENodeStatus;

  @Column('varchar', { nullable: true, default: 'waiting' })
  @Index()
  operateStatus?: EOperateStatus;

  @Column('varchar')
  @Expose({ name: "app_key" })
  appKey?: string;

  // geo: Geo;
  // user: User;
  // reports: MbrReports[];
  uptime: number;

  @Column('smallint', { default: 0 })
  deleted?: EBoolean;

  @Column('bigint')
  quotaCommit: number;

  @Column('varchar')
  @Expose()
  ip: string;

  warning?: string;

  ignore: boolean
}
