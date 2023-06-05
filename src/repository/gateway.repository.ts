import { Injectable } from "@nestjs/common";
import { Gateway } from "src/entities/gateway.entity";
import { In, Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EBoolean, EGatewayStatus, EOperateStatus, INACTIVE_GATEWAY_STATUS, INITABLE_GATEWAY_STATUS, RELOADABLE_GATEWAY_STATUS, datasourceMonitorDb } from "src/configs/consts";
import { ResourceLog } from "src/entities/resource-log.mentity";
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class GatewayRepository extends Repository<Gateway> {
  constructor(
    @InjectRepository(Gateway)
    private readonly repository: Repository<Gateway>,
    @InjectRepository(ResourceLog, datasourceMonitorDb)
    private readonly rlRepository: Repository<ResourceLog>) {
      super(repository.target, repository.manager, repository.queryRunner);
  }

  async getAll(): Promise<Gateway[]> {
    return this.repository.find({
      order: {
        updatedAt: "ASC"
      }
    })
  }

  async findByStatus(status: EGatewayStatus, operateStatus: EOperateStatus): Promise<Gateway[]> {
    return this.repository.find({
      where: {
        deleted: EBoolean.FALSE,
        status: status,
        operateStatus: operateStatus
      },
      order: {
        updatedAt: "ASC"
      }
    })
  }

  async getAllInitable(userId: string): Promise<Gateway[]> {
    return this.repository.find({
      where: {
        userId,
        deleted: EBoolean.FALSE,
        status: In(INITABLE_GATEWAY_STATUS)
      },
      order: {
        updatedAt: "ASC"
      }
    })
  }

  async findAllIn(ids: string[]): Promise<Gateway[]> {
    return this.repository.find({
      where: {
        id: In(ids)
      },
      order: {
        updatedAt: "ASC"
      }
    })
  }

  async getById(id: string): Promise<Gateway> {
    return this.repository.findOne({
      where: {
        id: id
      },
    })
  }

  async setStatus(
    gatewayId: string, 
    status: EGatewayStatus, 
    operateStatus: EOperateStatus,
    reasonCode: string,
    reason: string,
    jobId: string): Promise<boolean> {
    const old = await this.getById(gatewayId);
    if (status == old.status && operateStatus == old.operateStatus) {
      return false
    }
    const result = await this.repository.update(gatewayId, {
      status,
      operateStatus,
      updatedAt: new Date()
    })
    if (result.affected > 0) {
      const rl = new ResourceLog()
      rl.id = uuidv4()
      rl.resourceId = gatewayId
      rl.resourceType = "gateway"
      rl.oldStatus = old.status
      rl.oldOperateStatus = old.operateStatus
      rl.newStatus = status
      rl.newOperateStatus = operateStatus
      rl.reasonCode = reasonCode
      rl.reason = reason
      rl.jobId = jobId
      await this.rlRepository.insert(rl)
      return true
    }
    return false
  }
}