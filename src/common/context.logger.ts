import { Logger } from "@nestjs/common";

export class ContextLogger extends Logger {
  public context: string
  public contextId: string

  constructor(context: string) {
    super(context)
    this.context = context
  }

  public static withContextId(logger: ContextLogger, contextId: string): ContextLogger {
    const result = new ContextLogger(logger.context)
    result.contextId = contextId
    return result
  }

  getPrefix() {
    return this.contextId ? `<${this.contextId}> ` : ""
  }

  error(message: any, ...optionalParams: [...any, string?, string?]) {
    super.error(this.getPrefix() + message, ...optionalParams)
  }

  log(message: any, ...optionalParams: [...any, string?]) {
    super.log(this.getPrefix() + message, ...optionalParams)
  }

  warn(message: any, ...optionalParams: [...any, string?]) {
    super.warn(this.getPrefix() + message, ...optionalParams)
  }

  debug(message: any, ...optionalParams: [...any, string?]) {
    super.debug(this.getPrefix() + message, ...optionalParams)
  }
}