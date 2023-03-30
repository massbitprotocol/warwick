import { Injectable } from "@nestjs/common";
import { Gateway } from "src/entities/gateway.entity";
import { In, Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EBlockChain, EBoolean, EGatewayStatus, ENodeStatus, EZONE, INACTIVE_NODE_STATUS } from "src/configs/consts";
import { Node } from "src/entities/node.entity";

@Injectable()
export class NodeRepository {
  constructor(
    @InjectRepository(Node)
    private readonly nodeRepository: Repository<Node>) {
  }

  async getAllStakedOfBlockchain(blockchain: EBlockChain): Promise<Node[]> {
    return this.nodeRepository.find({
      where: {
        blockchain: blockchain,
        deleted: EBoolean.FALSE,
        status: EGatewayStatus.STAKED
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

  async setStatus(nodeId: string, status: EGatewayStatus): Promise<boolean> {
    const result = await this.nodeRepository.update(nodeId, {
      status,
      updatedAt: new Date()
    })
    return result.affected > 0
  }
}