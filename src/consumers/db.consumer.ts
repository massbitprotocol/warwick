import { OnQueueFailed, Process, Processor } from "@nestjs/bull";
import { Logger } from "@nestjs/common";
import { Job } from "bull";
import { DB_EVENT_QUEUE } from "src/configs/consts";
import { GatewayRepository } from "src/repository/gateway.repository";
import { DbListener } from "../listeners/db.listener";
import { plainToClass, ClassConstructor } from "class-transformer";
import { DbEvent } from "src/models/event.model";
import { isAnyFieldChanged } from "src/utils/diff";

@Processor(DB_EVENT_QUEUE)
export class DbConsumer {
  private readonly logger = new Logger(DbListener.name);

  constructor(private readonly gatewayRepository: GatewayRepository) {
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed: ` + error.stack)
  }

  @Process()
  async processQueue(job: Job) {
    let payload = job.data
    this.logger.debug(`Processing job ${job.id}: event=${payload.eventName}, id=${payload.new?.id || payload.old?.id}, action=${payload.action}`);
    if (!this.isObjectChanged(payload)) {
      this.logger.debug("No changes")
      return
    }
    switch (payload.eventName) {
      case "node-change":

        break
      case "gateway-change":

        break
    }
  }

  isObjectChanged({ eventName, new: _new, old }): boolean {
    switch (eventName) {
      case "node-change":
        return isAnyFieldChanged(["status", "ip"], _new, old)
      case "gateway-change":
        return isAnyFieldChanged(["status", "ip"], _new, old)
      default:
        this.logger.debug(`event ${eventName} is not supported`)
        return false
    }
  }

  castPayloadWithClass<T>(cls: ClassConstructor<T>, payload: any): DbEvent<T> {
    return new DbEvent(
      payload.eventName,
      payload.action,
      plainToClass(cls, payload.new),
      plainToClass(cls, payload.old),
    )
  }
}