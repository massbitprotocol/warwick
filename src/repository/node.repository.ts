import { Injectable } from "@nestjs/common";
import { In, Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EBlockChain, EBoolean, EGatewayStatus, ENodeStatus, EOperateStatus, EZONE, INACTIVE_NODE_STATUS } from "src/configs/consts";
import { Node } from "src/entities/node.entity";

@Injectable()
export class NodeRepository {
  constructor(
    @InjectRepository(Node)
    private readonly nodeRepository: Repository<Node>) {
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

  async setStatus(nodeId: string, status: ENodeStatus, operateStatus: EOperateStatus): Promise<boolean> {
    const result = await this.nodeRepository.update(nodeId, {
      status,
      operateStatus,
      updatedAt: new Date()
    })
    return result.affected > 0
  }
}