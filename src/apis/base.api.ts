import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { firstValueFrom } from "rxjs";
import { AxiosResponse } from "axios";
import { HttpConfig } from "src/models/rule.model";
import { ContextLogger } from "src/common/context.logger";

@Injectable()
export class BaseApi {
  private logger = new ContextLogger(BaseApi.name)
  constructor(private readonly httpService: HttpService) { }

  async doHttpRequest(config: HttpConfig): Promise<AxiosResponse | Error> {
    const res = await new Promise<AxiosResponse | Error>((resolve, reject) => firstValueFrom(this.httpService.request({
      method: config.method,
      url: config.url,
      headers: config.headers,
      data: config.body,
      timeout: config.timeout
    })).then(resolve).catch((err) => {
      this.logger.error(`${config.method} | ${config.url} | ${JSON.stringify(config.body)} | ${err}`)
      resolve(err)
    }))
    return res;
  }

}