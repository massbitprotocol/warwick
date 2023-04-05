import { Injectable } from "@nestjs/common";
import { Gateway } from "src/entities/gateway.entity";
import { In, Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EBoolean, EGatewayStatus, EOperateStatus, INACTIVE_GATEWAY_STATUS, INITABLE_GATEWAY_STATUS, RELOADABLE_GATEWAY_STATUS } from "src/configs/consts";

@Injectable()
export class GatewayRepository extends Repository<Gateway> {
  constructor(
    @InjectRepository(Gateway)
    private readonly repository: Repository<Gateway>) {
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

  async setStatus(gatewayId: string, status: EGatewayStatus, operateStatus: EOperateStatus): Promise<boolean> {
    const result = await this.repository.update(gatewayId, {
      status,
      operateStatus,
      updatedAt: new Date()
    })
    return result.affected > 0
  }
}