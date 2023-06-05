import { Injectable } from "@nestjs/common";
import { In, Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EBlockChain, EBoolean, ENodeStatus, EOperateStatus, EZONE, INACTIVE_NODE_STATUS, datasourceMonitorDb } from "src/configs/consts";
import { Node } from "src/entities/node.entity";
import { ResourceLog } from "src/entities/resource-log.mentity";
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class NodeRepository {
  constructor(
    @InjectRepository(Node)
    private readonly nodeRepository: Repository<Node>,
    @InjectRepository(ResourceLog, datasourceMonitorDb)
    private readonly rlRepository: Repository<ResourceLog>) {
  }

  async findByBlockchainAndStatus(blockchain: EBlockChain, status: ENodeStatus, operateStatus: EOperateStatus): Promise<Node[]> {
    return this.nodeRepository.find({
      where: {
        blockchain: blockchain,
        deleted: EBoolean.FALSE,
        status,
        operateStatus
      },
      order: {
        updatedAt: "ASC"
      }
    })
  }

  async findAllIn(ids: string[]): Promise<Node[]> {
    return this.nodeRepository.find({
      where: {
        id: In(ids)
      },
      order: {
        updatedAt: "ASC"
      }
    })
  }

  async getAllActiveInZone(zone: string): Promise<Node[]> {
    return this.nodeRepository.find({
      where: {
        deleted: EBoolean.FALSE,
        status: Not(In(INACTIVE_NODE_STATUS)),
        zone: zone as EZONE
      },
      order: {
        updatedAt: "ASC"
      }
    })
  }

  async getById(id: string): Promise<Node> {
    return this.nodeRepository.findOne({
      where: {
        id: id,
      },
    })
  }

  async setStatus(
    nodeId: string, 
    status: ENodeStatus, 
    operateStatus: EOperateStatus,
    reasonCode: string,
    reason: string,
    jobId: string): Promise<boolean> {
    const old = await this.getById(nodeId);
    if (status == old.status && operateStatus == old.operateStatus) {
      return false
    }
    const result = await this.nodeRepository.update(nodeId, {
      status,
      operateStatus,
      updatedAt: new Date()
    })
    if (result.affected > 0) {
      const rl = new ResourceLog()
      rl.id = uuidv4()
      rl.resourceId = nodeId
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