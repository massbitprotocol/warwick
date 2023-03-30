import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { HttpConfig } from "src/models/scheduler-task.model";
import { firstValueFrom } from "rxjs";
import { AxiosResponse } from "axios";

@Injectable()
export class BaseApi {
  constructor(private readonly httpService: HttpService) { }

  async doHttpRequest(config: HttpConfig): Promise<AxiosResponse | Error> {
    const res = await new Promise<AxiosResponse | Error>((resolve, reject) => firstValueFrom(this.httpService.request({
      method: config.method,
      url: config.url,
      headers: config.headers,
      data: config.body,
      timeout: config.timeout
    })).then(resolve).catch(resolve))
    return res;
  }

}