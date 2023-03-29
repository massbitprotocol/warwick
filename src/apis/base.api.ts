import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { AxiosConfig } from "src/models/scheduler-task.model";
import { firstValueFrom } from "rxjs";

@Injectable()
export class BaseApi {
  constructor(private readonly httpService: HttpService) { }

  async doHttpRequest(config: AxiosConfig) {
    const res = await firstValueFrom(this.httpService.request({
      method: config.method,
      url: config.url,
      headers: config.headers,
      data: config.body,
      timeout: config.timeout
    }))
    return res;
  }

}